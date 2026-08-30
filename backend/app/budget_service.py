"""
Shared budget-progress computation used by the budgets route, AI insights
and notification generation.
"""
from datetime import datetime


def current_month() -> str:
    """Return the current month as 'YYYY-MM'."""
    return datetime.utcnow().strftime("%Y-%m")


async def compute_budget_progress(db, user_id: int, month: str | None = None):
    """
    Compute current-month spending vs the latest budget limit for every
    category that has a budget.

    Returns a list of dicts: {id, category, month, limit, spent, remaining,
    percentage}.
    """
    month = month or current_month()

    budgets = await db.query_raw(
        '''
        SELECT *
        FROM "Budget"
        WHERE user_id = $1
        ORDER BY created_at DESC
        ''',
        user_id
    )

    # Budgets are recurring monthly per category: keep only the latest row for
    # each category.
    latest_by_category = {}
    for b in budgets:
        key = b["category"].lower()
        if key not in latest_by_category:
            latest_by_category[key] = b

    progress_data = []

    for budget in latest_by_category.values():
        category = budget["category"]

        expenses = await db.query_raw(
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
            "id": budget["id"],
            "category": category,
            "month": month,
            "limit": limit_amount,
            "spent": round(spent, 2),
            "remaining": round(remaining, 2),
            "percentage": round(percentage, 1),
        })

    return progress_data