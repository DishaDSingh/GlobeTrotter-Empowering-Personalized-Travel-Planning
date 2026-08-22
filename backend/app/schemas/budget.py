from datetime import date as date_type, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.models.enums import BudgetCategory


class BudgetRecordCreate(BaseModel):
    category: BudgetCategory
    amount: float
    currency: str = "USD"
    description: Optional[str] = None
    date: Optional[date_type] = None


class BudgetRecordUpdate(BaseModel):
    category: Optional[BudgetCategory] = None
    amount: Optional[float] = None
    currency: Optional[str] = None
    description: Optional[str] = None
    date: Optional[date_type] = None


class BudgetRecordOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    trip_id: str
    category: BudgetCategory
    amount: float
    currency: str
    description: Optional[str] = None
    date: Optional[date_type] = None
    created_at: datetime


class BudgetByCategory(BaseModel):
    category: str
    amount: float


class BudgetSummary(BaseModel):
    total_budget: float
    spent: float
    remaining: float
    average_daily_cost: float
    percent_used: float
    by_category: list[BudgetByCategory]
    over_budget_by: float = 0.0
    records: list[BudgetRecordOut] = []
