from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class DestinationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    city: str
    country: str
    country_code: str
    latitude: float
    longitude: float
    description: Optional[str] = None
    image_url: Optional[str] = None
    population: Optional[int] = None
    popularity_score: float
    estimated_daily_cost: float
    currency: str
    created_at: datetime


class DestinationCreate(BaseModel):
    city: str
    country: str
    country_code: str
    latitude: float
    longitude: float
    description: Optional[str] = None
    image_url: Optional[str] = None
    population: Optional[int] = None
    popularity_score: float = 50.0
    estimated_daily_cost: float = 100.0
    currency: str = "USD"


class WeatherOut(BaseModel):
    temperature_c: Optional[float] = None
    condition: Optional[str] = None
    precipitation_probability: Optional[int] = None
    wind_kph: Optional[float] = None
    available: bool = True
    message: Optional[str] = None
