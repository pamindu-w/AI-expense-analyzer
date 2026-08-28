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
