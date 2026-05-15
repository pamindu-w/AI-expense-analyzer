from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.expense import Expense
from app.schemas.expense_schema import ExpenseCreate

router = APIRouter()

@router.post("/")
def create_expense(expense: ExpenseCreate, db: Session = Depends(get_db)):

    new_expense = Expense(
        title=expense.title,
        amount=expense.amount,
        category=expense.category
    )

    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)

    return new_expense


@router.get("/")
def get_expenses(db: Session = Depends(get_db)):
    return db.query(Expense).all()