from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import extract, func

from app.database import get_db
from app.models.expense import Expense
from app.models.user import User

from app.schemas.expense_schema import ExpenseCreate
from app.dependencies import get_current_user

router = APIRouter()


# CREATE EXPENSE
@router.post("/")
def create_expense(
    expense: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    new_expense = Expense(
        title=expense.title,
        amount=expense.amount,
        category=expense.category,
        user_id=current_user.id,
    )

    db.add(new_expense)

    db.commit()

    db.refresh(new_expense)

    return new_expense


# GET ALL USER EXPENSES
@router.get("/")
def get_expenses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    expenses = db.query(Expense).filter(
        Expense.user_id == current_user.id
    ).all()

    return expenses


# DELETE EXPENSE
@router.delete("/{expense_id}")
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    expense = db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.user_id == current_user.id,
    ).first()

    if not expense:
        raise HTTPException(
            status_code=404,
            detail="Expense not found",
        )

    db.delete(expense)

    db.commit()

    return {
        "message": "Expense deleted successfully"
    }


# MONTHLY SUMMARY
@router.get("/monthly-summary")
def get_monthly_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    results = (
        db.query(
            extract(
                "year",
                Expense.created_at
            ).label("year"),

            extract(
                "month",
                Expense.created_at
            ).label("month"),

            func.sum(
                Expense.amount
            ).label("total"),
        )

        .filter(
            Expense.user_id == current_user.id
        )

        .group_by(
            extract(
                "year",
                Expense.created_at
            ),

            extract(
                "month",
                Expense.created_at
            ),
        )

        .order_by(
            extract(
                "year",
                Expense.created_at
            ),

            extract(
                "month",
                Expense.created_at
            ),
        )

        .all()
    )

    summary = []

    for row in results:
        summary.append({
            "year": int(row.year),
            "month": int(row.month),
            "total": float(row.total),
        })

    return summary