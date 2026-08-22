from pydantic import BaseModel

from .destination import DestinationOut


class NearbyDestinationOut(BaseModel):
    destination: DestinationOut
    distance_km: float


class NearbyPlaceOut(BaseModel):
    name: str
    place_type: str
    latitude: float
    longitude: float
    distance_km: float
    address: str | None = None
    website: str | None = None


class NearbyPlacesResponse(BaseModel):
    available: bool
    places: list[NearbyPlaceOut]
    message: str | None = None
