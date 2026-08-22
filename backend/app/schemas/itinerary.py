from datetime import date as date_type
from typing import Optional

from pydantic import BaseModel, ConfigDict

from .activity import ActivityOut


class ItineraryActivityCreate(BaseModel):
    trip_stop_id: str
    activity_id: str
    date: Optional[date_type] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    notes: Optional[str] = None
    custom_cost: Optional[float] = None


class ItineraryActivityUpdate(BaseModel):
    trip_stop_id: Optional[str] = None
    date: Optional[date_type] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    notes: Optional[str] = None
    custom_cost: Optional[float] = None
    sequence: Optional[int] = None


class ItineraryActivityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    trip_id: str
    trip_stop_id: str
    activity_id: str
    date: Optional[date_type] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    notes: Optional[str] = None
    custom_cost: Optional[float] = None
    sequence: int
    activity: Optional[ActivityOut] = None


class ItineraryReorderItem(BaseModel):
    id: str
    sequence: int
    date: Optional[date_type] = None
    trip_stop_id: Optional[str] = None
    start_time: Optional[str] = None


class ItineraryReorderRequest(BaseModel):
    items: list[ItineraryReorderItem]


class CalendarDay(BaseModel):
    date: date_type
    items: list[ItineraryActivityOut]
    total_cost: float
