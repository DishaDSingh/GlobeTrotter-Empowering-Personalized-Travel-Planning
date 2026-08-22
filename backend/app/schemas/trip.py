from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import TripStatus, TripVisibility

from .destination import DestinationOut


class TripCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    cover_image: Optional[str] = None
    visibility: TripVisibility = TripVisibility.private
    status: TripStatus = TripStatus.draft
    budget_total: float = 0.0
    currency: str = "USD"


class TripUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    cover_image: Optional[str] = None
    visibility: Optional[TripVisibility] = None
    status: Optional[TripStatus] = None
    budget_total: Optional[float] = None
    currency: Optional[str] = None


class TripStopOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    trip_id: str
    destination_id: str
    arrival_date: Optional[date] = None
    departure_date: Optional[date] = None
    sequence: int
    notes: Optional[str] = None
    planned_budget: Optional[float] = None
    destination: Optional[DestinationOut] = None


class TripStopCreate(BaseModel):
    destination_id: str
    arrival_date: Optional[date] = None
    departure_date: Optional[date] = None
    notes: Optional[str] = None
    planned_budget: Optional[float] = None


class TripStopUpdate(BaseModel):
    arrival_date: Optional[date] = None
    departure_date: Optional[date] = None
    notes: Optional[str] = None
    planned_budget: Optional[float] = None


class StopReorderItem(BaseModel):
    id: str
    sequence: int


class StopsReorderRequest(BaseModel):
    stops: list[StopReorderItem]


class TripOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    name: str
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    cover_image: Optional[str] = None
    visibility: TripVisibility
    status: TripStatus
    share_id: Optional[str] = None
    budget_total: float
    currency: str
    created_at: datetime
    updated_at: datetime


class TripListItem(TripOut):
    destination_count: int = 0
    spent: float = 0.0


class TripDetailOut(TripOut):
    stops: list[TripStopOut] = []
    destination_count: int = 0
    spent: float = 0.0
    remaining: float = 0.0
