import json
import os

from google import genai
from google.genai import types

MODEL = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")

_client = None


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        _client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    return _client


def ai_available() -> bool:
    return bool(os.getenv("GEMINI_API_KEY"))


def _fmt_money(value) -> str:
    try:
        return f"Rs {float(value):,.2f}"
    except (TypeError, ValueError):
        return "Rs 0.00"


def _build_chat_prompt(expenses, budgets, recurring, history, user_message):
    """Build (system_instruction, prompt) for the finance chat assistant."""
    lines = ["The user's expenses (title | amount | category | date):"]
    if expenses:
        for e in expenses:
            lines.append(
                f"- {e.get('title', 'Untitled')} | {_fmt_money(e.get('amount'))} | "
                f"{e.get('category', 'Other')} | {e.get('created_at', '')}"
            )
    else:
        lines.append("- (none)")

    lines.append("")
    lines.append("Budget progress (category | month | limit | spent | % used):")
    if budgets:
        for b in budgets:
            lines.append(
                f"- {b.get('category', '')} | {b.get('month', '')} | "
                f"{_fmt_money(b.get('limit'))} | {_fmt_money(b.get('spent'))} | "
                f"{b.get('percentage', 0)}%"
            )
    else:
        lines.append("- (none)")

    lines.append("")
    lines.append("Recurring/subscription expenses (title | amount | frequency):")
    if recurring:
        for r in recurring:
            lines.append(
                f"- {r.get('title', '')} | {_fmt_money(r.get('amount'))} | "
                f"{r.get('frequency', 'monthly')}"
            )
    else:
        lines.append("- (none)")

    history_lines = []
    for turn in (history or [])[-8:]:
        role = turn.get("role", "user")
        content = turn.get("content", "")
        history_lines.append(f"{role}: {content}")

    prompt = f"""
You are a personal finance assistant for an expense-tracking app called SpendWise.
Answer the user's question using ONLY the data below. If the answer is not in the
data, say so honestly and suggest what they could do to find out. Be concise,
friendly, and practical. Use currency amounts exactly as shown. You may use simple
markdown (**bold**, bullet or numbered lists) to make answers easy to skim.

Current user data:
{chr(10).join(lines)}

Conversation so far:
{chr(10).join(history_lines) if history_lines else "(this is the first message)"}

User's question: {user_message}
"""

    system = (
        "You are a concise, accurate personal finance assistant for SpendWise. "
        "Answer strictly from the provided data and never invent figures. "
        "Use simple markdown formatting in your reply."
    )
    return system, prompt


def chat_hint_no_key() -> str:
    return (
        "AI chat is not configured. Add a GEMINI_API_KEY to the "
        "backend .env file to enable it."
    )


def chat_reply_stream(expenses, budgets, recurring, history, user_message):
    """Yield the AI's reply in text chunks (one per model response fragment).

    Falls back to a single plain-string yield if Gemini is unavailable.
    """
    if not ai_available():
        yield chat_hint_no_key()
        return

    system, prompt = _build_chat_prompt(
        expenses, budgets, recurring, history, user_message
    )

    client = _get_client()
    response = client.models.generate_content_stream(
        model=MODEL,
        config=types.GenerateContentConfig(
            system_instruction=system,
            temperature=0.4,
        ),
        contents=prompt,
    )

    for chunk in response:
        text = (chunk.text or "").strip()
        if text:
            yield text


def generate_follow_ups(expenses, budgets, recurring, history, user_message, reply):
    """Suggest 2-3 short follow-up questions based on the last exchange.

    Returns a list of strings; empty list if unavailable or the call fails.
    """
    if not ai_available():
        return []

    system, _ = _build_chat_prompt(
        expenses, budgets, recurring, history, user_message
    )

    prompt = f"""
The user just asked: {user_message}

The assistant replied:
{reply}

Suggest 2-3 short, specific follow-up questions the user could ask next about
their finances. Base them on the conversation and the user's data above.
Return ONLY a JSON array of strings, e.g. ["...", "...", "..."].
"""

    try:
        client = _get_client()
        response = client.models.generate_content(
            model=MODEL,
            config=types.GenerateContentConfig(
                system_instruction=system,
                response_mime_type="application/json",
                temperature=0.5,
            ),
            contents=prompt,
        )
        raw = (response.text or "").strip()
        data = json.loads(raw)
        if isinstance(data, list):
            return [str(q).strip() for q in data if str(q).strip()][:3]
        return []
    except Exception as exc:  # noqa: BLE001 - follow-ups are non-critical
        print(f"Could not generate follow-ups: {exc}")
        return []


def generate_expense_insights(expenses, budgets, recurring):
    """Generate structured financial insights from the user's data.

    Returns a dict with keys: trends, topCategories, anomalies, advice.
    Falls back gracefully if the Gemini call fails.
    """

    # --- Build a compact textual summary of the data -----------------------
    lines = ["The user's expenses (title | amount | category | date):"]
    if expenses:
        for e in expenses:
            lines.append(
                f"- {e.get('title', 'Untitled')} | {_fmt_money(e.get('amount'))} | "
                f"{e.get('category', 'Other')} | {e.get('created_at', '')}"
            )
    else:
        lines.append("- (none)")

    lines.append("")
    lines.append("Budget progress (category | month | limit | spent | % used):")
    if budgets:
        for b in budgets:
            lines.append(
                f"- {b.get('category', '')} | {b.get('month', '')} | "
                f"{_fmt_money(b.get('limit'))} | {_fmt_money(b.get('spent'))} | "
                f"{b.get('percentage', 0)}%"
            )
    else:
        lines.append("- (none)")

    lines.append("")
    lines.append("Active recurring/subscription expenses (title | amount | frequency):")
    active_recurring = [r for r in (recurring or []) if r.get("active", True)]
    if active_recurring:
        for r in active_recurring:
            lines.append(
                f"- {r.get('title', '')} | {_fmt_money(r.get('amount'))} | "
                f"{r.get('frequency', 'monthly')}"
            )
    else:
        lines.append("- (none)")

    prompt = f"""
You are a personal finance assistant for an expense-tracking app.
Analyze the user's data below and give brief, practical, money-saving insights.

Data:
{chr(10).join(lines)}

Return ONLY a JSON object (no markdown) with exactly these keys:
{{
  "trends": "2-3 sentences describing spending trends or patterns",
  "topCategories": ["category1", "category2", "category3"],
  "anomalies": "2-3 sentences about unusual or notable spending",
  "advice": "2-4 concise, actionable money-saving suggestions"
}}
Keep each string concise.
"""

    system = (
        "You are a concise, accurate financial assistant. "
        "Always return valid JSON matching the requested schema."
    )

    try:
        client = _get_client()
        response = client.models.generate_content(
            model=MODEL,
            config=types.GenerateContentConfig(
                system_instruction=system,
                response_mime_type="application/json",
                temperature=0.3,
            ),
            contents=prompt,
        )
        raw = (response.text or "").strip()
        data = json.loads(raw)

        return {
            "trends": str(data.get("trends", "")).strip(),
            "topCategories": [str(c) for c in data.get("topCategories", []) if str(c).strip()][:5],
            "anomalies": str(data.get("anomalies", "")).strip(),
            "advice": str(data.get("advice", "")).strip(),
        }
    except Exception as exc:  # noqa: BLE001 - surface friendly error to the user
        return {
            "trends": "",
            "topCategories": [],
            "anomalies": "",
            "advice": "",
            "error": f"Could not generate insights: {exc}",
        }


def generate_weekly_digest(expenses, budgets, recurring, period_key):
    """Generate a concise summary of the user's last week of spending.

    Returns a dict with keys: title, trends, topCategories, advice.
    Falls back gracefully if the Gemini call fails.
    """
    lines = ["The user's expenses in the last 7 days (title | amount | category | date):"]
    if expenses:
        for e in expenses:
            lines.append(
                f"- {e.get('title', 'Untitled')} | {_fmt_money(e.get('amount'))} | "
                f"{e.get('category', 'Other')} | {e.get('created_at', '')}"
            )
    else:
        lines.append("- (none)")

    lines.append("")
    lines.append("Budget progress (category | month | limit | spent | % used):")
    if budgets:
        for b in budgets:
            lines.append(
                f"- {b.get('category', '')} | {b.get('month', '')} | "
                f"{_fmt_money(b.get('limit'))} | {_fmt_money(b.get('spent'))} | "
                f"{b.get('percentage', 0)}%"
            )
    else:
        lines.append("- (none)")

    lines.append("")
    lines.append("Active recurring/subscription expenses (title | amount | frequency):")
    active_recurring = [r for r in (recurring or []) if r.get("active", True)]
    if active_recurring:
        for r in active_recurring:
            lines.append(
                f"- {r.get('title', '')} | {_fmt_money(r.get('amount'))} | "
                f"{r.get('frequency', 'monthly')}"
            )
    else:
        lines.append("- (none)")

    prompt = f"""
You are a personal finance assistant for an expense-tracking app.
The period reference is the current ISO week: {period_key}.
Write this week's personal finance digest for the user based on their data below.

Data:
{chr(10).join(lines)}

Return ONLY a JSON object (no markdown) with exactly these keys:
{{
  "title": "a short friendly title for this week's digest (under 60 chars)",
  "trends": "2-3 sentences summarizing this week's spending",
  "topCategories": ["category1", "category2", "category3"],
  "advice": "2-3 concise, actionable tips for the coming week"
}}
Keep each string concise.
"""

    system = (
        "You are a concise, accurate financial assistant. "
        "Always return valid JSON matching the requested schema."
    )

    try:
        client = _get_client()
        response = client.models.generate_content(
            model=MODEL,
            config=types.GenerateContentConfig(
                system_instruction=system,
                response_mime_type="application/json",
                temperature=0.3,
            ),
            contents=prompt,
        )
        raw = (response.text or "").strip()
        data = json.loads(raw)

        return {
            "title": str(data.get("title", "Weekly Digest")).strip(),
            "trends": str(data.get("trends", "")).strip(),
            "topCategories": [str(c) for c in data.get("topCategories", []) if str(c).strip()][:5],
            "advice": str(data.get("advice", "")).strip(),
        }
    except Exception as exc:  # noqa: BLE001 - surface friendly error
        return {
            "title": "",
            "trends": "",
            "topCategories": [],
            "advice": "",
            "error": f"Could not generate digest: {exc}",
        }
