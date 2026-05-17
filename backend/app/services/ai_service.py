from openai import OpenAI
import os
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY")
)


def generate_expense_insights(expenses):

    expense_text = "\n".join([
        f"{e.title} - ${e.amount} - {e.category}"
        for e in expenses
    ])

    prompt = f"""
    Analyze these expenses and give short financial insights.

    Expenses:
    {expense_text}

    Give:
    - spending trends
    - biggest categories
    - unusual spending
    - simple saving advice

    Keep response concise.
    """

    response = client.chat.completions.create(
        model="gpt-4.1-mini",

        messages=[
            {
                "role": "system",
                "content": "You are a financial assistant."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
    )

    return response.choices[0].message.content