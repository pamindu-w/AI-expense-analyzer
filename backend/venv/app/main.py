from fastapi import FastAPI
from fastapi import Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.database import Base, engine
from app.models.expense import Expense
from app.routes.expense_routes import router as expense_router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

Base.metadata.create_all(bind=engine)

    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)

    return new_expense

app.include_router(
    expense_router,
    prefix="/expenses",
    tags=["Expenses"]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)