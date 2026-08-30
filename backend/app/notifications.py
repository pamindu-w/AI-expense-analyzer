"""
In-app notification generation.

Alerts users when a budgeted category crosses spend thresholds for the current
month and when an active recurring expense is coming due.
"""
from datetime import datetime, timedelta

from app.budget_service import compute_budget_progress

BUDGET_WARNING_PCT = 70
BUDGET_CRITICAL_PCT = 90
RECURRING_DUE_DAYS = 3


def compute_budget_level(percentage: float):
    """
    Return the highest alert level reached for a category budget:
    'over' (>=100%), 'critical' (>=90%), 'warning' (>=70%), or None.
    """
    if percentage >= 100:
        return "over"
    if percentage >= BUDGET_CRITICAL_PCT:
        return "critical"
    if percentage >= BUDGET_WARNING_PCT:
        return "warning"
    return None


def _fmt_currency(amount: float) -> str:
    return f"Rs {amount:,.2f}"


async def _existing_signatures(db, user_id: int) -> set:
    rows = await db.query_raw(
        '''
        SELECT signature
        FROM "Notification"
        WHERE user_id = $1
        ''',
        user_id,
    )
    return {row["signature"] for row in rows}


async def _insert_notification(
    db,
    user_id: int,
    notification_type: str,
    title: str,
    message: str,
    signature: str,
    category: str | None = None,
    month: str | None = None,
    amount: float | None = None,
):
    await db.query_raw(
        '''
        INSERT INTO "Notification"
        (user_id, type, title, message, category, month, amount, signature, read, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false, NOW())
        ''',
        user_id,
        notification_type,
        title,
        message,
        category,
        month,
        amount,
        signature,
    )


async def check_and_create(db, user_id: int) -> int:
    """
    Evaluate the user's current budgets and recurring expenses and insert any
    new notifications. Each notification is idempotent via a unique signature
    (per user), so repeated calls never duplicate.

    Returns the number of new notifications created.
    """
    created = 0
    existing = await _existing_signatures(db, user_id)

    progress = await compute_budget_progress(db, user_id)

    for item in progress:
        category = item["category"]
        month = item["month"]
        percentage = item["percentage"]
        level = compute_budget_level(percentage)

        if not level:
            continue

        signature = f"budget_{level}:{category.lower()}:{month}"
        if signature in existing:
            continue

        spent = item["spent"]
        limit = item["limit"]

        if level == "warning":
            title = "Budget approaching limit"
            message = (
                f"{category} is at {percentage:.1f}% of its monthly budget "
                f"({_fmt_currency(spent)} of {_fmt_currency(limit)})."
            )
        elif level == "critical":
            title = "Budget nearly exhausted"
            message = (
                f"{category} has used {percentage:.1f}% of its budget "
                f"({_fmt_currency(spent)} of {_fmt_currency(limit)})."
            )
        else:
            title = "Budget exceeded"
            message = (
                f"{category} is over budget: {_fmt_currency(spent)} spent "
                f"against a {_fmt_currency(limit)} limit."
            )

        await _insert_notification(
            db,
            user_id,
            f"budget_{level}",
            title,
            message,
            signature,
            category=category,
            month=month,
            amount=spent,
        )
        existing.add(signature)
        created += 1

    recurring = await db.query_raw(
        '''
        SELECT *
        FROM "RecurringExpense"
        WHERE user_id = $1
          AND active = true
          AND deleted_at IS NULL
        ''',
        user_id,
    )

    today = datetime.utcnow().date()
    horizon = today + timedelta(days=RECURRING_DUE_DAYS)

    for item in recurring:
        next_run = item["next_run"]
        if isinstance(next_run, str):
            next_run = datetime.fromisoformat(next_run)

        next_date = next_run.date()
        if next_date > horizon:
            continue

        days_away = (next_date - today).days
        signature = f"recurring_due:{item['id']}:{next_date.isoformat()}"
        if signature in existing:
            continue

        if days_away <= 0:
            due_label = "due today"
        elif days_away == 1:
            due_label = "due in 1 day"
        else:
            due_label = f"due in {days_away} days"

        title = "Subscription payment upcoming"
        message = (
            f"{item['title']} ({_fmt_currency(item['amount'])}) is {due_label} "
            f"({next_date.strftime('%b %d, %Y')})."
        )

        await _insert_notification(
            db,
            user_id,
            "recurring_due",
            title,
            message,
            signature,
            category=item["category"],
            amount=item["amount"],
        )
        existing.add(signature)
        created += 1

    return created