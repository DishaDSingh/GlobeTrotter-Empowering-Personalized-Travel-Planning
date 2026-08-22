from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.models.enums import ActivityCategory


class ActivityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    destination_id: str
    name: str
    description: Optional[str] = None
    category: ActivityCategory
    image_url: Optional[str] = None
    latitude: float
    longitude: float
    price: float
    currency: str
    duration_minutes: int
    rating: float
    opening_time: Optional[str] = None
    closing_time: Optional[str] = None
    created_at: datetime


class ActivityCreate(BaseModel):
    destination_id: str
    name: str
    description: Optional[str] = None
    category: ActivityCategory
    image_url: Optional[str] = None
    latitude: float
    longitude: float
    price: float = 0.0
    currency: str = "USD"
    duration_minutes: int = 60
    rating: float = 4.0
    opening_time: Optional[str] = None
    closing_time: Optional[str] = None
