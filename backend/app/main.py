from fastapi import FastAPI, HTTPException, Header, UploadFile, File
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from dotenv import load_dotenv
import os
import json
import logging

# Load environment variables (DATABASE_URL) before importing Prisma.
# Neon CLI writes the deployed connection string to the project-root
# `.env.local`; keep backend/.env as a local fallback for other settings.
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
project_dir = os.path.abspath(os.path.join(backend_dir, '..'))
load_dotenv(os.path.join(backend_dir, '.env'))
load_dotenv(os.path.join(project_dir, '.env.local'), override=True)

from prisma import Prisma
import asyncio
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.ai_service import ai_available, generate_expense_insights, chat_reply_stream, generate_follow_ups
from app.budget_service import compute_budget_progress
from app.notifications import check_and_create
from app.pdf_service import extract_from_pdf, PdfParseError
from app.email_service import send_email, email_configured
from app.digest_service import get_or_create_weekly_digest

app = FastAPI()

# logger for debugging incoming headers
logger = logging.getLogger("uvicorn.error")

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")


@app.get("/")
async def health_check():
    return {"message": "Backend connected successfully"}



# =========================
# CORS
# =========================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        FRONTEND_URL,
    ],
    allow_credentials=True,
    allow_methods=[
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS",
    ],
    allow_headers=[
        "Authorization",
        "Content-Type",
        "Accept",
        "Origin",
        "User-Agent",
        "DNT",
        "Cache-Control",
        "X-Mx-ReqToken",
        "Keep-Alive",
        "X-Requested-With",
        "If-Modified-Since",
        "X-CSRF-Token",
    ],
)

db = Prisma()

# =========================
# SECURITY
# =========================

SECRET_KEY = os.getenv("SECRET_KEY", "SECRET123")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60*24
RESET_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(
    schemes=["pbkdf2_sha256"],
    deprecated="auto"
)


def hash_password(password: str):
    return pwd_context.hash(password)


def verify_password(
    plain_password: str,
    hashed_password: str,
):
    return pwd_context.verify(
        plain_password,
        hashed_password,
    )


def create_access_token(data: dict):
    to_encode = data.copy()

    expire = datetime.utcnow() + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM,
    )

    return encoded_jwt


# =========================
# STARTUP / SHUTDOWN
# =========================

@app.on_event("startup")
async def startup():
    await db.connect()


@app.on_event("shutdown")
async def shutdown():
    await db.disconnect()


# =========================
# SCHEMAS
# =========================

class ExpenseCreate(BaseModel):
    title: str
    amount: float
    category: str

class BudgetCreate(BaseModel):
    category: str
    limit: float
    month: str  # expected format: "YYYY-MM"


class BudgetUpdate(BaseModel):
    limit: float

class RecurringExpenseCreate(BaseModel):
    title: str
    amount: float
    category: str
    frequency: str
    next_run: datetime


class RecurringExpenseUpdate(BaseModel):
    active: bool


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class ChatMessage(BaseModel):
    message: str


class AccountDelete(BaseModel):
    password: str


class ForgotPassword(BaseModel):
    email: EmailStr


class ResetPassword(BaseModel):
    token: str
    new_password: str


# =========================
# HELPERS
# =========================

def normalize_month(month_value) -> str:
    """
    Normalize a month value to 'YYYY-MM' string format.
    Handles: 'YYYY-MM', 'YYYY-MM-DD', datetime objects, 'YYYY-MM-DDTHH:MM:SS...' etc.
    """
    if isinstance(month_value, datetime):
        return month_value.strftime("%Y-%m")
    if isinstance(month_value, str):
        # Strip to first 7 characters: "YYYY-MM"
        return month_value[:7]
    return str(month_value)[:7]


def current_month() -> str:
    """
    Return the current month as 'YYYY-MM', used as the effective month for
    all recurring monthly budgets.
    """
    return datetime.utcnow().strftime("%Y-%m")


# =========================
# AUTH ROUTES
# =========================

@app.post("/signup")
async def signup(user: UserCreate):

    existing_user = await db.user.find_unique(
        where={
            "email": user.email
        }
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already exists"
        )

    new_user = await db.user.create(
        data={
            "username": user.username,
            "email": user.email,
            "hashed_password": hash_password(
                user.password
            ),
        }
    )

    return {
        "message": "User created successfully"
    }


@app.post("/login")
async def login(user: UserLogin):

    db_user = await db.user.find_unique(
        where={
            "email": user.email
        }
    )

    if not db_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials"
        )

    valid_password = verify_password(
        user.password,
        db_user.hashed_password,
    )

    if not valid_password:
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials"
        )

    token = create_access_token(
        {"sub": db_user.email}
    )

    return {
        "access_token": token,
        "token_type": "bearer",
    }


def decode_access_token(token: str):
    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )
        logger.info(f"Token decoded successfully: {payload}")
        return payload
    except JWTError as e:
        logger.error(f"Token decode failed: {type(e).__name__}: {str(e)}")
        return None


@app.get("/validate")
async def validate_user(authorization: str | None = Header(None, alias="Authorization")):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Missing or invalid Authorization header",
        )

    token = authorization.removeprefix("Bearer ").strip()
    payload = decode_access_token(token)

    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=401,
            detail="Invalid token",
        )

    user = await db.user.find_unique(
        where={"email": payload["sub"]}
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not found",
        )

    return {
        "valid": True,
        "email": user.email,
        "username": user.username,
    }


# =========================
# ACCOUNT & PASSWORD ROUTES
# =========================

@app.post("/account/delete")
async def delete_account(
    payload: AccountDelete,
    authorization: str | None = Header(None, alias="Authorization")
):
    user_email = get_current_user(authorization)

    user = await db.user.find_unique(
        where={"email": user_email}
    )

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    if not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=403, detail="Password is incorrect")

    await db.user.delete(where={"id": user.id})

    return {"success": True}


@app.post("/forgot-password")
async def forgot_password(payload: ForgotPassword):
    generic = {"message": "If that email exists, a reset link has been sent."}

    user = await db.user.find_unique(
        where={"email": payload.email}
    )

    if not user:
        return generic

    token = jwt.encode(
        {
            "sub": payload.email,
            "purpose": "password_reset",
            "exp": datetime.utcnow() + timedelta(
                minutes=RESET_TOKEN_EXPIRE_MINUTES
            ),
        },
        SECRET_KEY,
        algorithm=ALGORITHM,
    )

    reset_link = f"{FRONTEND_URL}/reset-password?token={token}"
    html = (
        "<p>Hi there,</p>"
        f"<p>Use the link below to reset your SpendWise password. It expires "
        f"in {RESET_TOKEN_EXPIRE_MINUTES} minutes.</p>"
        f'<p style="margin:1.4rem 0;">'
        f'<a href="{reset_link}" style="background:#f59e0b;color:#080810;'
        f'padding:0.6rem 1.2rem;border-radius:6px;text-decoration:none;'
        f'font-weight:bold;">Reset password</a></p>'
        f'<p>Or copy this link:<br/><code>{reset_link}</code></p>'
        f"<p>If you didn't request this, you can safely ignore this email.</p>"
    )

    sent = await asyncio.to_thread(
        send_email, payload.email, "SpendWise — Reset your password", html
    )

    if sent:
        return generic

    # Dev fallback: expose the link only when no SMTP is configured.
    if not email_configured():
        return {**generic, "dev_link": reset_link}
    return generic


@app.post("/reset-password")
async def reset_password(payload: ResetPassword):
    try:
        decoded = jwt.decode(
            payload.token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )
    except JWTError:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired reset link",
        )

    if decoded.get("purpose") != "password_reset":
        raise HTTPException(status_code=400, detail="Invalid reset token")

    email = decoded.get("sub")
    if not email:
        raise HTTPException(status_code=400, detail="Invalid reset token")

    user = await db.user.find_unique(
        where={"email": email}
    )

    if not user:
        raise HTTPException(status_code=400, detail="Invalid reset token")

    await db.user.update(
        where={"id": user.id},
        data={"hashed_password": hash_password(payload.new_password)},
    )

    return {"message": "Password updated successfully"}


# =========================
# EXPENSE ROUTES
# =========================

def get_current_user(authorization: str | None = Header(None, alias="Authorization")):
    """Extract and validate user from authorization header"""
    logger.info(f"Authorization header received: {authorization!r}")

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Missing or invalid Authorization header",
        )

    token = authorization.removeprefix("Bearer ").strip()
    payload = decode_access_token(token)

    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=401,
            detail="Invalid token",
        )

    return payload["sub"]


@app.get("/expenses")
async def get_expenses(authorization: str | None = Header(None, alias="Authorization")):
    user_email = get_current_user(authorization)

    user = await db.user.find_unique(
        where={"email": user_email}
    )

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    await process_due_recurring_expenses(user.id)

    expenses = await db.query_raw(
        'SELECT * FROM "Expense" WHERE user_id = $1 ORDER BY created_at DESC',
        user.id
    )

    return expenses


@app.get("/expenses/ai-insights")
async def get_ai_insights(
    authorization: str | None = Header(None, alias="Authorization")
):
    user_email = get_current_user(authorization)

    user = await db.user.find_unique(
        where={"email": user_email}
    )

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    if not ai_available():
        return {
            "insights": {
                "trends": "",
                "topCategories": [],
                "anomalies": "",
                "advice": "AI insights are not configured. Add a GEMINI_API_KEY to enable them.",
                "error": "GEMINI_API_KEY not set",
            }
        }

    await process_due_recurring_expenses(user.id)

    expenses = await db.query_raw(
        'SELECT * FROM "Expense" WHERE user_id = $1 ORDER BY created_at DESC',
        user.id
    )

    budgets = await db.query_raw(
        'SELECT * FROM "Budget" WHERE user_id = $1 ORDER BY created_at DESC',
        user.id
    )

    latest_by_category = {}
    for b in budgets:
        key = b["category"].lower()
        if key not in latest_by_category:
            latest_by_category[key] = b

    month = current_month()
    budget_progress = []
    for budget in latest_by_category.values():
        category = budget["category"]

        category_expenses = await db.query_raw(
            '''
            SELECT *
            FROM "Expense"
            WHERE user_id = $1
            AND LOWER(category) = LOWER($2)
            AND created_at >= to_date($3, 'YYYY-MM')
            AND created_at < (to_date($3, 'YYYY-MM') + interval '1 month')
            ''',
            user.id,
            category,
            month
        )

        spent = sum(e["amount"] for e in category_expenses)
        limit_amount = budget["limit"]
        percentage = (spent / limit_amount) * 100 if limit_amount > 0 else 0

        budget_progress.append({
            "category": category,
            "month": month,
            "limit": limit_amount,
            "spent": round(spent, 2),
            "percentage": round(percentage, 1),
        })

    recurring = await db.query_raw(
        'SELECT * FROM "RecurringExpense" WHERE user_id = $1',
        user.id
    )

    insights = await asyncio.to_thread(
        generate_expense_insights,
        expenses,
        budget_progress,
        recurring,
    )

    return {"insights": insights}


# =========================
# CHAT ROUTES
# =========================

async def load_financial_context(user_id: int):
    """Load expenses, current-month budget progress, and recurring expenses."""
    await process_due_recurring_expenses(user_id)

    expenses = await db.query_raw(
        'SELECT * FROM "Expense" WHERE user_id = $1 ORDER BY created_at DESC',
        user_id
    )

    budgets = await db.query_raw(
        'SELECT * FROM "Budget" WHERE user_id = $1 ORDER BY created_at DESC',
        user_id
    )

    latest_by_category = {}
    for b in budgets:
        key = b["category"].lower()
        if key not in latest_by_category:
            latest_by_category[key] = b

    month = current_month()
    budget_progress = []
    for budget in latest_by_category.values():
        category = budget["category"]

        category_expenses = await db.query_raw(
            '''
            SELECT *
            FROM "Expense"
            WHERE user_id = $1
            AND LOWER(category) = LOWER($2)
            AND created_at >= to_date($3, 'YYYY-MM')
            AND created_at < (to_date($3, 'YYYY-MM') + interval '1 month')
            ''',
            user_id,
            category,
            month
        )

        spent = sum(e["amount"] for e in category_expenses)
        limit_amount = budget["limit"]
        percentage = (spent / limit_amount) * 100 if limit_amount > 0 else 0

        budget_progress.append({
            "category": category,
            "month": month,
            "limit": limit_amount,
            "spent": round(spent, 2),
            "percentage": round(percentage, 1),
        })

    recurring = await db.query_raw(
        'SELECT * FROM "RecurringExpense" WHERE user_id = $1',
        user_id
    )

    return expenses, budget_progress, recurring


def sse_frame(event_type: str, data: dict) -> str:
    return f"event: {event_type}\ndata: {json.dumps(data)}\n\n"


@app.get("/chat/history")
async def get_chat_history(
    authorization: str | None = Header(None, alias="Authorization")
):
    user_email = get_current_user(authorization)

    user = await db.user.find_unique(
        where={"email": user_email}
    )

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    messages = await db.query_raw(
        '''
        SELECT role, content
        FROM "ChatMessage"
        WHERE user_id = $1
        ORDER BY created_at ASC, id ASC
        ''',
        user.id
    )

    return messages[-100:]


@app.delete("/chat/history")
async def clear_chat_history(
    authorization: str | None = Header(None, alias="Authorization")
):
    user_email = get_current_user(authorization)

    user = await db.user.find_unique(
        where={"email": user_email}
    )

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    await db.execute_raw(
        'DELETE FROM "ChatMessage" WHERE user_id = $1',
        user.id
    )

    return {"success": True}


@app.post("/chat/stream")
async def chat_stream(
    chat_message: ChatMessage,
    authorization: str | None = Header(None, alias="Authorization")
):
    user_email = get_current_user(authorization)

    user = await db.user.find_unique(
        where={"email": user_email}
    )

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    message = chat_message.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    async def event_stream():
        # Prior turns only (the current question is passed separately).
        history = await db.query_raw(
            '''
            SELECT role, content
            FROM "ChatMessage"
            WHERE user_id = $1
            ORDER BY created_at ASC, id ASC
            ''',
            user.id
        )
        history = [{"role": m["role"], "content": m["content"]} for m in history[-16:]]

        expenses, budget_progress, recurring = await load_financial_context(user.id)

        # Persist the user's message immediately.
        await db.query_raw(
            '''
            INSERT INTO "ChatMessage" (user_id, role, content, created_at)
            VALUES ($1, $2, $3, NOW())
            ''',
            user.id,
            "user",
            message,
        )

        full_reply = []
        try:
            stream_iter = chat_reply_stream(
                expenses,
                budget_progress,
                recurring,
                history,
                message,
            )

            while True:
                chunk = await asyncio.to_thread(lambda it=stream_iter: next(it, None))
                if chunk is None:
                    break
                full_reply.append(chunk)
                yield sse_frame("chunk", {"text": chunk})

            reply_text = "".join(full_reply).strip()

            if reply_text:
                await db.query_raw(
                    '''
                    INSERT INTO "ChatMessage" (user_id, role, content, created_at)
                    VALUES ($1, $2, $3, NOW())
                    ''',
                    user.id,
                    "assistant",
                    reply_text,
                )

            follow_ups = await asyncio.to_thread(
                generate_follow_ups,
                expenses,
                budget_progress,
                recurring,
                history,
                message,
                reply_text,
            )
            yield sse_frame("done", {"follow_ups": follow_ups})

        except Exception as exc:  # noqa: BLE001 - stream errors surface as SSE
            yield sse_frame(
                "error",
                {"message": f"Sorry, I couldn't answer that right now. Error: {exc}"},
            )

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@app.post("/expenses")
async def create_expense(
    expense: ExpenseCreate,
    authorization: str | None = Header(None, alias="Authorization")
):
    user_email = get_current_user(authorization)

    logger.info(f"/validate Authorization header received: {authorization!r}")

    if expense.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than 0")

    user = await db.user.find_unique(
        where={"email": user_email}
    )

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    # Use raw SQL to bypass Prisma relation issues
    result = await db.query_raw(
        'INSERT INTO "Expense" (title, amount, category, user_id, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *',
        expense.title,
        expense.amount,
        expense.category,
        user.id
    )

    return result[0] if result else {}


@app.delete("/expenses/{expense_id}")
async def delete_expense(
    expense_id: int,
    authorization: str | None = Header(None, alias="Authorization")
):
    """Delete an expense (only if it belongs to the logged-in user)"""
 
    user_email = get_current_user(authorization)
 
    user = await db.user.find_unique(
        where={"email": user_email}
    )
 
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
 
    # Fetch expense via raw SQL
    existing = await db.query_raw(
        'SELECT * FROM "Expense" WHERE id = $1',
        expense_id
    )
 
    if not existing:
        raise HTTPException(status_code=404, detail="Expense not found")
 
    # Verify ownership
    if existing[0]["user_id"] != user.id:
        raise HTTPException(status_code=403, detail="Unauthorized: This expense does not belong to you")
 
    await db.execute_raw(
        'DELETE FROM "Expense" WHERE id = $1',
        expense_id
    )
 
    return {"message": "Expense deleted successfully"}


@app.put("/expenses/{expense_id}")
async def update_expense(
    expense_id: int,
    expense: ExpenseCreate,
    authorization: str | None = Header(None, alias="Authorization")
):
    """Update an expense (only if it belongs to the logged-in user)"""

    user_email = get_current_user(authorization)

    user = await db.user.find_unique(
        where={"email": user_email}
    )

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    # Fetch expense via raw SQL
    existing = await db.query_raw(
        'SELECT * FROM "Expense" WHERE id = $1',
        expense_id
    )

    if not existing:
        raise HTTPException(status_code=404, detail="Expense not found")

    # Verify ownership
    if existing[0]["user_id"] != user.id:
        raise HTTPException(status_code=403, detail="Unauthorized: This expense does not belong to you")

    if expense.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than 0")

    updated = await db.query_raw(
        'UPDATE "Expense" SET title = $1, amount = $2, category = $3 WHERE id = $4 RETURNING *',
        expense.title,
        expense.amount,
        expense.category,
        expense_id
    )

    return updated[0] if updated else {}


@app.post("/parse-pdf")
async def parse_pdf(
    file: UploadFile = File(...),
    authorization: str | None = Header(None, alias="Authorization")
):
    """Parse an uploaded PDF and return an extracted amount + suggested title."""
    user_email = get_current_user(authorization)

    if file.content_type not in ("application/pdf", "application/x-pdf"):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file.content_type or 'unknown'}. Please upload a PDF.",
        )

    data = await file.read()

    try:
        result = extract_from_pdf(data)
    except PdfParseError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001 - unexpected failure
        raise HTTPException(status_code=400, detail=f"Could not process PDF: {exc}") from exc

    return result


# =========================
# BUDGET ROUTES
# =========================

@app.post("/budgets")
async def create_budget(
    budget: BudgetCreate,
    authorization: str | None = Header(None, alias="Authorization")
):
    user_email = get_current_user(authorization)

    user = await db.user.find_unique(
        where={"email": user_email}
    )

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    # Budgets are recurring monthly: a single budget per category that always
    # applies to the current month. Spending is computed live from Expense
    # records, so it refreshes automatically every month.
    target_month = current_month()

    # Check if a budget already exists for this category. If it does, just
    # update its limit so it keeps recurring (no per-month rows pile up).
    existing_budgets = await db.query_raw(
        '''
        SELECT * FROM "Budget"
        WHERE user_id = $1
          AND LOWER(category) = LOWER($2)
        ORDER BY created_at DESC
        ''',
        user.id,
        budget.category,
    )

    if existing_budgets:
        await db.execute_raw(
            '''
            UPDATE "Budget"
            SET month = $1, "limit" = $2
            WHERE id = $3
            ''',
            target_month,
            budget.limit,
            existing_budgets[0]["id"],
        )
        result = await db.query_raw(
            'SELECT * FROM "Budget" WHERE id = $1',
            existing_budgets[0]["id"],
        )
        return result[0]

    # No budget for this category at all → create one.
    result = await db.query_raw(
        '''
        INSERT INTO "Budget" (category, "limit", month, user_id, created_at)
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING *
        ''',
        budget.category,
        budget.limit,
        target_month,
        user.id,
    )

    return result[0]


@app.get("/budgets")
async def get_budgets(
    authorization: str | None = Header(None, alias="Authorization")
):

    user_email = get_current_user(
        authorization
    )

    user = await db.user.find_unique(
        where={"email": user_email}
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    budgets = await db.query_raw(
        '''
        SELECT *
        FROM "Budget"
        WHERE user_id = $1
        ORDER BY created_at DESC
        ''',
        user.id
    )

    # Budgets are recurring monthly per category — return only the latest
    # budget for each category.
    latest_by_category = {}
    for b in budgets:
        key = b["category"].lower()
        if key not in latest_by_category:
            latest_by_category[key] = b

    return list(latest_by_category.values())

@app.get("/budgets/progress")
async def get_budget_progress(
    authorization: str | None = Header(None, alias="Authorization")
):

    user_email = get_current_user(
        authorization
    )

    user = await db.user.find_unique(
        where={"email": user_email}
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    await process_due_recurring_expenses(user.id)

    return await compute_budget_progress(db, user.id)


@app.put("/budgets/{budget_id}")
async def update_budget(
    budget_id: int,
    update: BudgetUpdate,
    authorization: str | None = Header(None, alias="Authorization")
):

    user_email = get_current_user(authorization)

    user = await db.user.find_unique(
        where={"email": user_email}
    )

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    existing = await db.query_raw(
        'SELECT * FROM "Budget" WHERE id = $1',
        budget_id
    )

    if not existing:
        raise HTTPException(status_code=404, detail="Budget not found")

    if existing[0]["user_id"] != user.id:
        raise HTTPException(status_code=403, detail="Unauthorized: This budget does not belong to you")

    if update.limit <= 0:
        raise HTTPException(status_code=400, detail="Limit must be greater than 0")

    await db.execute_raw(
        'UPDATE "Budget" SET "limit" = $1 WHERE id = $2',
        update.limit,
        budget_id
    )

    result = await db.query_raw(
        'SELECT * FROM "Budget" WHERE id = $1',
        budget_id
    )

    return result[0] if result else {}


# =========================
# RECURRING EXPENSE HELPERS
# =========================

def add_months(start_date: datetime, months: int) -> datetime:
    year = start_date.year + (start_date.month - 1 + months) // 12
    month = (start_date.month - 1 + months) % 12 + 1
    day = start_date.day
    try:
        return start_date.replace(year=year, month=month, day=day)
    except ValueError:
        # Handle end-of-month overflow
        next_month_first = datetime(year, month, 1)
        last_day = (next_month_first + timedelta(days=32)).replace(day=1) - timedelta(days=1)
        return last_day


async def process_due_recurring_expenses(user_id: int):
    today = datetime.utcnow().date()
    recurring_items = await db.query_raw(
        '''
        SELECT *
        FROM "RecurringExpense"
        WHERE user_id = $1
          AND active = true
          AND deleted_at IS NULL
          AND next_run <= NOW()
        ''',
        user_id
    )

    for item in recurring_items:
        next_run = item["next_run"]

        # Convert string to datetime if necessary
        if isinstance(next_run, str):
            next_run = datetime.fromisoformat(next_run)

        while next_run.date() <= today:
            await db.query_raw(
                '''
                INSERT INTO "Expense" (title, amount, category, user_id, created_at)
                VALUES ($1, $2, $3, $4, $5::timestamp)
                ''',
                item["title"],
                item["amount"],
                item["category"],
                user_id,
                next_run,
            )

            if item["frequency"].lower() == "monthly":
                next_run = add_months(next_run, 1)
            else:
                next_run = next_run + timedelta(weeks=1)

        await db.execute_raw(
            '''
            UPDATE "RecurringExpense"
            SET next_run = $1::timestamp
            WHERE id = $2
            ''',
            next_run,
            item["id"]
        )


# =========================
# RECURRING EXPENSE ROUTES
# =========================

@app.post("/recurring-expenses")
async def create_recurring_expense(
    recurring: RecurringExpenseCreate,
    authorization: str | None = Header(None)
):

    user_email = get_current_user(
        authorization
    )

    user = await db.user.find_unique(
        where={"email": user_email}
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    if recurring.amount <= 0:
        raise HTTPException(
            status_code=400,
            detail="Amount must be greater than 0"
        )

    next_run_date = recurring.next_run
    today = datetime.utcnow().date()

    # If provided date is in the past, advance to the next period.
    if next_run_date.date() < today:
        if recurring.frequency.lower() == "weekly":
            while next_run_date.date() < today:
                next_run_date = next_run_date + timedelta(weeks=1)
        elif recurring.frequency.lower() == "monthly":
            while next_run_date.date() < today:
                next_run_date = add_months(next_run_date, 1)

    result = await db.query_raw(
        '''
        INSERT INTO "RecurringExpense"
        (
            title,
            amount,
            category,
            frequency,
            next_run,
            active,
            user_id,
            created_at
        )
        VALUES
        (
            $1, $2, $3, $4, $5::timestamp, true, $6, NOW()
        )
        RETURNING *
        ''',

        recurring.title,
        recurring.amount,
        recurring.category,
        recurring.frequency,
        next_run_date,
        user.id
    )

    return result[0]


@app.get("/recurring-expenses")
async def get_recurring_expenses(
    authorization: str | None = Header(None, alias="Authorization")
):

    user_email = get_current_user(
        authorization
    )

    user = await db.user.find_unique(
        where={"email": user_email}
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    recurring = await db.query_raw(
        '''
        SELECT *
        FROM "RecurringExpense"
        WHERE user_id = $1 AND deleted_at IS NULL
        ORDER BY next_run ASC
        ''',
        user.id
    )

    return recurring


@app.get("/recurring-expenses/all")
async def get_all_recurring_expenses(
    authorization: str | None = Header(None, alias="Authorization")
):
    """Get all recurring expenses including deleted ones (for dashboard calculations)"""
    user_email = get_current_user(authorization)

    user = await db.user.find_unique(
        where={"email": user_email}
    )

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    recurring = await db.query_raw(
        '''
        SELECT *
        FROM "RecurringExpense"
        WHERE user_id = $1
        ORDER BY next_run ASC
        ''',
        user.id
    )

    return recurring


@app.put("/recurring-expenses/{recurring_id}")
async def update_recurring_expense(
    recurring_id: int,
    update: RecurringExpenseUpdate,
    authorization: str | None = Header(None, alias="Authorization")
):
    user_email = get_current_user(authorization)

    user = await db.user.find_unique(
        where={"email": user_email}
    )

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    existing = await db.query_raw(
        'SELECT * FROM "RecurringExpense" WHERE id = $1',
        recurring_id
    )

    if not existing:
        raise HTTPException(status_code=404, detail="Recurring expense not found")

    if existing[0]["user_id"] != user.id:
        raise HTTPException(status_code=403, detail="Unauthorized: This recurring expense does not belong to you")

    if update.active:
        await db.execute_raw(
            '''
            UPDATE "RecurringExpense"
            SET active = true,
                deactivated_at = NULL
            WHERE id = $1
            ''',
            recurring_id
        )
    else:
        timestamp = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
        await db.execute_raw(
            '''
            UPDATE "RecurringExpense"
            SET active = false,
                deactivated_at = $1::timestamp
            WHERE id = $2
            ''',
            timestamp,
            recurring_id
        )

    result = await db.query_raw(
        'SELECT * FROM "RecurringExpense" WHERE id = $1',
        recurring_id
    )

    return result[0] if result else {}


@app.delete("/recurring-expenses/{recurring_id}")
async def delete_recurring_expense(
    recurring_id: int,
    authorization: str | None = Header(None, alias="Authorization")
):
    user_email = get_current_user(authorization)

    user = await db.user.find_unique(
        where={"email": user_email}
    )

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    existing = await db.query_raw(
        'SELECT * FROM "RecurringExpense" WHERE id = $1',
        recurring_id
    )

    if not existing:
        raise HTTPException(status_code=404, detail="Recurring expense not found")

    if existing[0]["user_id"] != user.id:
        raise HTTPException(status_code=403, detail="Unauthorized: This recurring expense does not belong to you")

    timestamp = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
    await db.execute_raw(
        '''
        UPDATE "RecurringExpense"
        SET deleted_at = $1::timestamp
        WHERE id = $2
        ''',
        timestamp,
        recurring_id
    )

    return {"message": "Recurring expense deleted successfully"}


# =====================
# NOTIFICATION ROUTES
# =====================

@app.get("/digest")
async def get_digest(
    authorization: str | None = Header(None, alias="Authorization")
):
    user_email = get_current_user(authorization)

    user = await db.user.find_unique(
        where={"email": user_email}
    )

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return await get_or_create_weekly_digest(db, user.id)


@app.get("/notifications")
async def get_notifications(
    authorization: str | None = Header(None, alias="Authorization")
):
    user_email = get_current_user(authorization)

    user = await db.user.find_unique(
        where={"email": user_email}
    )

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    await process_due_recurring_expenses(user.id)
    await check_and_create(db, user.id)

    notifications = await db.query_raw(
        '''
        SELECT *
        FROM "Notification"
        WHERE user_id = $1
        ORDER BY created_at DESC, id DESC
        ''',
        user.id
    )

    unread_count = sum(1 for n in notifications if not n["read"])

    return {
        "notifications": notifications,
        "unread_count": unread_count,
    }


@app.get("/notifications/unread-count")
async def get_unread_notifications_count(
    authorization: str | None = Header(None, alias="Authorization")
):
    user_email = get_current_user(authorization)

    user = await db.user.find_unique(
        where={"email": user_email}
    )

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    await process_due_recurring_expenses(user.id)
    await check_and_create(db, user.id)

    result = await db.query_raw(
        '''
        SELECT COUNT(*)::int AS count
        FROM "Notification"
        WHERE user_id = $1 AND read = false
        ''',
        user.id
    )

    return {"count": result[0]["count"]}


@app.put("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: int,
    authorization: str | None = Header(None, alias="Authorization")
):
    user_email = get_current_user(authorization)

    user = await db.user.find_unique(
        where={"email": user_email}
    )

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    existing = await db.query_raw(
        'SELECT * FROM "Notification" WHERE id = $1',
        notification_id
    )

    if not existing:
        raise HTTPException(status_code=404, detail="Notification not found")

    if existing[0]["user_id"] != user.id:
        raise HTTPException(status_code=403, detail="Unauthorized: This notification does not belong to you")

    await db.execute_raw(
        'UPDATE "Notification" SET "read" = true WHERE id = $1',
        notification_id
    )

    return {"success": True}


@app.put("/notifications/read-all")
async def mark_all_notifications_read(
    authorization: str | None = Header(None, alias="Authorization")
):
    user_email = get_current_user(authorization)

    user = await db.user.find_unique(
        where={"email": user_email}
    )

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    await db.execute_raw(
        'UPDATE "Notification" SET "read" = true WHERE user_id = $1',
        user.id
    )

    return {"success": True}
