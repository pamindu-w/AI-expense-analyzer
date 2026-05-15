from datetime import datetime
from pydantic import BaseModel, ConfigDict


class ExpenseCreate(BaseModel):
    title: str
    amount: float
    category: str


class ExpenseOut(BaseModel):
    id: int
    title: str
    amount: float
    category: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
