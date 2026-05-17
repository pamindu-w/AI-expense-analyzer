from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from dotenv import load_dotenv
import os
from openai import OpenAI



# Load environment variables (DATABASE_URL) before importing Prisma
# Load .env from the backend folder so DATABASE_URL is available
dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(dotenv_path)

client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY")
)

from prisma import Prisma
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.models.user import User
from app.models.expense import Expense
import logging

app = FastAPI()

# logger for debugging incoming headers
logger = logging.getLogger("uvicorn.error")



# =========================
# CORS
# =========================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
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

SECRET_KEY = "SECRET123"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60*24

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
    month: str

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

    # Use raw SQL to bypass Prisma relation issues
    expenses = await db.query_raw(
        'SELECT * FROM "Expense" WHERE user_id = $1 ORDER BY created_at DESC',
        user.id
    )

    return expenses


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

# @app.get("/expenses/ai-insights")
# async def ai_insights(authorization: str | None = Header(None)):
#     user_email = get_current_user(authorization)

#     user = await db.user.find_unique(where={"email": user_email})
#     if not user:
#         raise HTTPException(status_code=401, detail="User not found")

#     expenses = await db.query_raw(
#         'SELECT title, amount, category FROM "Expense" WHERE user_id = $1',
#         user.id
#     )

#     if not expenses:
#         return {"insights": "No expenses found yet."}

#     expense_text = "\n".join([
#         f"{e['title']} - ${e['amount']} - {e['category']}"
#         for e in expenses
#     ])

#     message = client.messages.create(
#         model="claude-haiku-4-5-20251001",
#         max_tokens=1024,
#         messages=[
#             {
#                 "role": "user",
#                 "content": f"""Analyze these expenses and provide:
# - spending trends
# - biggest categories  
# - unusual spending
# - saving advice

# Keep it short and useful.

# Expenses:
# {expense_text}"""
#             }
#         ]
#     )

#     return {"insights": message.content[0].text}

@app.post("/budgets")
async def create_budget(
    budget: BudgetCreate,
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

    existing_budget = await db.query_raw(
        '''
        SELECT * FROM "Budget"
        WHERE user_id = $1
        AND category = $2
        AND month = $3
        ''',
        user.id,
        budget.category,
        budget.month
    )

    if existing_budget:
        raise HTTPException(
            status_code=400,
            detail="Budget already exists for this category and month"
        )

    result = await db.query_raw(
        '''
        INSERT INTO "Budget"
        (category, "limit", month, user_id, created_at)
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING *
        ''',
        budget.category,
        budget.limit,
        budget.month,
        user.id
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

    return budgets

@app.get("/budgets/progress")
async def get_budget_progress(
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

    budgets = await db.query_raw(
        '''
        SELECT *
        FROM "Budget"
        WHERE user_id = $1
        ''',
        user.id
    )

    progress_data = []

    for budget in budgets:

        month = budget["month"]
        category = budget["category"]

        expenses = await db.query_raw(
            '''
            SELECT *
            FROM "Expense"
            WHERE user_id = $1
            AND category = $2
            AND TO_CHAR(created_at, 'YYYY-MM') = $3
            ''',
            user.id,
            category,
            month
        )

        spent = sum(
            expense["amount"]
            for expense in expenses
        )

        limit_amount = budget["limit"]

        remaining = limit_amount - spent

        percentage = (
            (spent / limit_amount) * 100
            if limit_amount > 0 else 0
        )

        progress_data.append({
            "category": category,
            "month": month,
            "limit": limit_amount,
            "spent": round(spent, 2),
            "remaining": round(remaining, 2),
            "percentage": round(percentage, 1),
        })

    return progress_data

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
        recurring.next_run,
        user.id
    )

    return result[0]

@app.get("/recurring-expenses")
async def get_recurring_expenses(
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
