"""Nearby destinations (geographic proximity between our own seeded cities)
and nearby places (hotels/restaurants/cafes) around a destination.

Nearby *destinations* is pure math over data we already trust (our own
Destination rows), so it's exact.

Nearby *places* (hotels/restaurants/cafes) is a different kind of claim -
specific real-world businesses change constantly, and we have no curated,
verified source for them. Rather than hand-write named businesses from
memory (which risks naming places that don't exist, have closed, or have
wrong details), we query OpenStreetMap's live Overpass API for real,
community-mapped places near the destination's coordinates - the same
free, key-free data source already used for the map tiles. Results are
real places that are actually tagged there, not curated "best of" picks.
"""

from dataclasses import dataclass

import httpx

from app.models import Destination
from app.utils.geo import haversine_km

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

_PLACE_TAGS = {
    "hotel": '["tourism"="hotel"]',
    "restaurant": '["amenity"="restaurant"]',
    "cafe": '["amenity"="cafe"]',
}


@dataclass
class NearbyPlace:
    name: str
    place_type: str
    latitude: float
    longitude: float
    distance_km: float
    address: str | None
    website: str | None


def get_nearby_destinations(
    all_destinations: list[Destination], origin: Destination, limit: int = 6
) -> list[tuple[Destination, float]]:
    scored = [
        (d, haversine_km(origin.latitude, origin.longitude, d.latitude, d.longitude))
        for d in all_destinations
        if d.id != origin.id
    ]
    scored.sort(key=lambda pair: pair[1])
    return scored[:limit]


def _build_address(tags: dict) -> str | None:
    parts = [
        tags.get("addr:housenumber"),
        tags.get("addr:street"),
        tags.get("addr:city"),
    ]
    joined = " ".join(p for p in parts if p)
    return joined or None


async def get_nearby_places(
    latitude: float, longitude: float, place_type: str, radius_km: float = 5.0, limit: int = 12
) -> tuple[list[NearbyPlace], bool]:
    """Returns (places, available). available=False means the live lookup
    failed (network/timeout) - the caller should show a friendly message,
    not an empty-results state, in that case."""
    tag_filter = _PLACE_TAGS.get(place_type)
    if not tag_filter:
        return [], True

    radius_m = int(radius_km * 1000)
    query = f"""
    [out:json][timeout:20];
    (
      node{tag_filter}(around:{radius_m},{latitude},{longitude});
      way{tag_filter}(around:{radius_m},{latitude},{longitude});
    );
    out center {limit * 4};
    """

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.post(
                OVERPASS_URL,
                data={"data": query},
                headers={"User-Agent": "GlobeTrotter/1.0 (travel planning app)"},
            )
            resp.raise_for_status()
            data = resp.json()
    except (httpx.HTTPError, httpx.TimeoutException, ValueError):
        return [], False

    seen_names: set[str] = set()
    places: list[NearbyPlace] = []
    for el in data.get("elements", []):
        tags = el.get("tags", {})
        name = tags.get("name")
        if not name or name.lower() in seen_names:
            continue

        lat = el.get("lat") or (el.get("center") or {}).get("lat")
        lon = el.get("lon") or (el.get("center") or {}).get("lon")
        if lat is None or lon is None:
            continue

        seen_names.add(name.lower())
        places.append(
            NearbyPlace(
                name=name,
                place_type=place_type,
                latitude=lat,
                longitude=lon,
                distance_km=round(haversine_km(latitude, longitude, lat, lon), 2),
                address=_build_address(tags),
                website=tags.get("website") or tags.get("contact:website"),
            )
        )

    places.sort(key=lambda p: p.distance_km)
    return places[:limit], True
