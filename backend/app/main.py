from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from dotenv import load_dotenv
import os



# Load environment variables (DATABASE_URL) before importing Prisma
# Load .env from the backend folder so DATABASE_URL is available
dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(dotenv_path)

from prisma import Prisma
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.models.user import User
from app.models.expense import Expense

app = FastAPI()



# =========================
# CORS
# =========================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:8000", "http://127.0.0.1:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

db = Prisma()

# =========================
# SECURITY
# =========================

SECRET_KEY = "SECRET123"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

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
        return payload
    except JWTError:
        return None


@app.get("/validate")
async def validate_user(authorization: str | None = Header(None)):
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

def get_current_user(authorization: str | None = Header(None)):
    """Extract and validate user from authorization header"""
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
async def get_expenses(authorization: str | None = Header(None)):
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
    authorization: str | None = Header(None)
):
    user_email = get_current_user(authorization)

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
    authorization: str | None = Header(None)
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
    authorization: str | None = Header(None)
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