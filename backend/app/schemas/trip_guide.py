from pydantic import BaseModel

from .activity import ActivityOut
from .destination import DestinationOut


class TripGuideLeg(BaseModel):
    destination: DestinationOut
    days: int
    nights: int
    accommodation_cost: float
    food_cost: float
    local_transport_cost: float
    activities_cost: float
    subtotal: float
    top_activities: list[ActivityOut]


class TripGuideHop(BaseModel):
    from_city: str
    to_city: str
    mode: str
    estimated_cost: float


class TripGuideResponse(BaseModel):
    primary_destination: str
    total_days: int
    travelers: int
    currency: str
    legs: list[TripGuideLeg]
    hops: list[TripGuideHop]
    accommodation_total: float
    food_total: float
    local_transport_total: float
    activities_total: float
    inter_city_transport_total: float
    grand_total: float
    notes: str
