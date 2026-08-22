from typing import Optional

from pydantic import BaseModel, Field


class AIItineraryRequest(BaseModel):
    destination: str = Field(min_length=1, description="Destination city or region, e.g. 'Paris' or 'Europe'")
    duration_days: int = Field(ge=1, le=60)
    budget: float = Field(ge=0)
    travelers: int = Field(ge=1, default=1)
    style: str = Field(default="Balanced", description="e.g. Adventure, Relaxation, Culture, Balanced")
    interests: list[str] = []
    starting_location: Optional[str] = None
    currency: str = "USD"


class AIItineraryDayActivity(BaseModel):
    time: str
    name: str
    category: str
    duration_minutes: int
    estimated_cost: float
    notes: Optional[str] = None


class AIItineraryDay(BaseModel):
    day: int
    city: str
    date_label: Optional[str] = None
    activities: list[AIItineraryDayActivity]
    estimated_day_cost: float


class AIItineraryResponse(BaseModel):
    destination: str
    duration_days: int
    total_estimated_cost: float
    currency: str
    days: list[AIItineraryDay]
    source: str = "rule_based"
    notes: Optional[str] = None


class AIBudgetOptimizeRequest(BaseModel):
    trip_id: str


class AIBudgetSuggestion(BaseModel):
    title: str
    description: str
    estimated_savings: float
    category: str
    target_id: Optional[str] = None
    target_type: Optional[str] = None


class AIBudgetOptimizeResponse(BaseModel):
    total_budget: float
    projected_spend: float
    over_by: float
    suggestions: list[AIBudgetSuggestion]
    source: str = "rule_based"
