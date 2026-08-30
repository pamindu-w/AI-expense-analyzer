"""
AI weekly digest generation and caching.

Digests are generated once per ISO week and stored per user. A "weekly_digest"
Notification is also created (deduped by signature) so the digest surfaces in
the notification bell too.
"""
import asyncio
import json
from datetime import datetime

from app.ai_service import ai_available, generate_weekly_digest
from app.budget_service import compute_budget_progress


def period_key_for(today: datetime | None = None) -> str:
    today = today or datetime.utcnow()
    iso = today.isocalendar()
    return f"{iso[0]}-W{iso[1]:02d}"


async def get_or_create_weekly_digest(db, user_id: int):
    """Return the user's digest for the current week, generating it if missing."""
    period_key = period_key_for()

    existing = await db.query_raw(
        '''
        SELECT content, created_at
        FROM "Digest"
        WHERE user_id = $1 AND period_key = $2
        ''',
        user_id,
        period_key,
    )

    if existing:
        row = existing[0]
        try:
            content = json.loads(row["content"])
        except (ValueError, TypeError):
            content = {}
        return {
            "digest": content,
            "period_key": period_key,
            "created_at": row["created_at"],
        }

    if not ai_available():
        return {
            "digest": {
                "title": "",
                "trends": "",
                "topCategories": [],
                "advice": (
                    "AI digest is not configured. Add a GEMINI_API_KEY to enable it."
                ),
                "error": "GEMINI_API_KEY not set",
            },
            "period_key": period_key,
            "created_at": None,
        }

    expenses = await db.query_raw(
        '''
        SELECT *
        FROM "Expense"
        WHERE user_id = $1
          AND created_at >= NOW() - interval '7 days'
        ORDER BY created_at DESC
        ''',
        user_id,
    )

    budgets = await compute_budget_progress(db, user_id)
    recurring = await db.query_raw(
        'SELECT * FROM "RecurringExpense" WHERE user_id = $1',
        user_id,
    )

    digest = await asyncio.to_thread(
        generate_weekly_digest,
        expenses,
        budgets,
        recurring,
        period_key,
    )

    await db.query_raw(
        '''
        INSERT INTO "Digest" (user_id, period_key, content, created_at)
        VALUES ($1, $2, $3, NOW())
        ''',
        user_id,
        period_key,
        json.dumps(digest),
    )

    title = (digest.get("title") or "Weekly Digest")[:200]
    trends = (digest.get("trends") or "")[:500]
    await db.execute_raw(
        '''
        INSERT INTO "Notification"
        (user_id, type, title, message, category, month, amount, signature, read, created_at)
        VALUES ($1, $2, $3, $4, NULL, NULL, NULL, $5, false, NOW())
        ON CONFLICT (user_id, signature) DO NOTHING
        ''',
        user_id,
        "weekly_digest",
        title,
        trends,
        f"weekly_digest:{period_key}",
    )

    return {"digest": digest, "period_key": period_key, "created_at": datetime.utcnow()}