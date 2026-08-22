from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from .destination import DestinationOut


class SavedDestinationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    destination_id: str
    created_at: datetime
    destination: Optional[DestinationOut] = None


class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    message: str
    type: str
    read: bool
    created_at: datetime


class AdminStats(BaseModel):
    total_users: int
    total_trips: int
    active_users: int
    public_trips: int
    popular_cities: list[dict]
    popular_activities: list[dict]
    user_growth: list[dict]
    trips_created: list[dict]


class RecommendationOut(BaseModel):
    destination: DestinationOut
    score: float
    reasons: list[str]


class SeasonalRecommendationsOut(BaseModel):
    season: str
    month: str
    destinations: list[RecommendationOut]
