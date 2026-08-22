"""Multi-city trip guide: given a destination and a total trip length, work
out which nearby cities (in the same country, so currency stays consistent)
are worth combining, how many days to spend in each, and a full cost
breakdown - accommodation, food, local transport, activities, and estimated
inter-city transport between each stop.

Cost split uses a standard travel-budgeting rule of thumb (roughly
40% lodging / 25% food / 15% local transport / 20% activities) applied to
each destination's own estimated_daily_cost, so numbers stay in the trip's
local currency and scale sensibly whether that's INR, JPY, or EUR. Where we
have real seeded activities for a city, the activities line is computed from
their actual prices instead of the flat ratio, so it reflects real, named
things to do rather than a guess.
"""

from dataclasses import dataclass

from app.models import Activity, Destination
from app.utils.geo import haversine_km

# Rough, commonly-cited travel budget split. Kept as named constants so the
# reasoning is visible rather than magic numbers scattered through the code.
ACCOMMODATION_SHARE = 0.40
FOOD_SHARE = 0.25
LOCAL_TRANSPORT_SHARE = 0.15
ACTIVITIES_SHARE = 0.20


def _max_cities_for_duration(total_days: int) -> int:
    if total_days <= 4:
        return 1
    if total_days <= 9:
        return 2
    if total_days <= 15:
        return 3
    if total_days <= 24:
        return 4
    return 6


def _select_route(db_destinations: list[Destination], primary: Destination, max_cities: int) -> list[Destination]:
    others = sorted(
        (d for d in db_destinations if d.id != primary.id),
        key=lambda d: d.popularity_score,
        reverse=True,
    )
    return [primary, *others[: max_cities - 1]]


def _allocate_days(route: list[Destination], total_days: int) -> list[int]:
    """Split total_days across the route, weighted by popularity, with a
    floor of 2 days per stop (1 if there's truly no room) and the remainder
    handed to the most popular stops first so the numbers always sum exactly
    to total_days."""
    n = len(route)
    if n == 1:
        return [total_days]

    floor_days = 2 if total_days >= n * 2 else 1
    remaining = total_days - floor_days * n
    weights = [max(d.popularity_score, 1.0) for d in route]
    total_weight = sum(weights)

    extra = [0] * n
    if remaining > 0 and total_weight > 0:
        raw = [remaining * w / total_weight for w in weights]
        extra = [int(x) for x in raw]
        leftover = remaining - sum(extra)
        # hand any rounding remainder to the most popular stops first
        order = sorted(range(n), key=lambda i: weights[i], reverse=True)
        for i in range(leftover):
            extra[order[i % n]] += 1

    return [floor_days + e for e in extra]


def _inter_city_cost_and_mode(a: Destination, b: Destination) -> tuple[float, str]:
    distance_km = haversine_km(a.latitude, a.longitude, b.latitude, b.longitude)
    # Scale the fare estimate off the destinations' own price level (their
    # estimated_daily_cost) instead of a hardcoded currency table, so this
    # works for any currency without a per-country fare database. Calibrated
    # against real-world regional train/flight fares (e.g. Rome-Venice by
    # rail is roughly EUR 40-70, not several hundred).
    price_level = (a.estimated_daily_cost + b.estimated_daily_cost) / 2
    base_fare = price_level * 0.15
    per_km_rate = price_level * 0.0006
    cost = max(base_fare + per_km_rate * distance_km, price_level * 0.1)
    mode = "Domestic flight" if distance_km > 600 else ("Train or bus" if distance_km > 60 else "Taxi or local transit")
    return round(cost, 2), mode


@dataclass
class CityLegPlan:
    destination: Destination
    days: int
    nights: int
    accommodation_cost: float
    food_cost: float
    local_transport_cost: float
    activities_cost: float
    subtotal: float
    top_activities: list[Activity]


@dataclass
class InterCityHop:
    from_destination: Destination
    to_destination: Destination
    mode: str
    estimated_cost: float


@dataclass
class TripGuide:
    primary: Destination
    total_days: int
    currency: str
    legs: list[CityLegPlan]
    hops: list[InterCityHop]
    accommodation_total: float
    food_total: float
    local_transport_total: float
    activities_total: float
    inter_city_transport_total: float
    grand_total: float


def build_trip_guide(
    all_destinations: list[Destination],
    activities_by_destination: dict[str, list[Activity]],
    primary: Destination,
    total_days: int,
    travelers: int = 1,
) -> TripGuide:
    same_country = [d for d in all_destinations if d.country == primary.country]
    max_cities = min(_max_cities_for_duration(total_days), len(same_country))
    route = _select_route(same_country, primary, max_cities)
    day_allocations = _allocate_days(route, total_days)

    legs: list[CityLegPlan] = []
    for destination, days in zip(route, day_allocations):
        daily = destination.estimated_daily_cost
        accommodation_cost = round(daily * ACCOMMODATION_SHARE * days, 2)
        food_cost = round(daily * FOOD_SHARE * days * travelers, 2)
        local_transport_cost = round(daily * LOCAL_TRANSPORT_SHARE * days * travelers, 2)

        pool = sorted(activities_by_destination.get(destination.id, []), key=lambda a: a.rating, reverse=True)
        picks = pool[: max(1, days // 2)]
        if picks:
            activities_cost = round(sum(a.price for a in picks) * travelers, 2)
        else:
            activities_cost = round(daily * ACTIVITIES_SHARE * days * travelers, 2)

        subtotal = round(accommodation_cost + food_cost + local_transport_cost + activities_cost, 2)
        legs.append(
            CityLegPlan(
                destination=destination,
                days=days,
                nights=max(days - 1, 1) if len(route) == 1 else days,
                accommodation_cost=accommodation_cost,
                food_cost=food_cost,
                local_transport_cost=local_transport_cost,
                activities_cost=activities_cost,
                subtotal=subtotal,
                top_activities=picks,
            )
        )

    hops: list[InterCityHop] = []
    for a, b in zip(route, route[1:]):
        cost, mode = _inter_city_cost_and_mode(a, b)
        hops.append(InterCityHop(from_destination=a, to_destination=b, mode=mode, estimated_cost=cost))

    accommodation_total = round(sum(leg.accommodation_cost for leg in legs), 2)
    food_total = round(sum(leg.food_cost for leg in legs), 2)
    local_transport_total = round(sum(leg.local_transport_cost for leg in legs), 2)
    activities_total = round(sum(leg.activities_cost for leg in legs), 2)
    inter_city_transport_total = round(sum(hop.estimated_cost for hop in hops), 2)
    grand_total = round(
        accommodation_total + food_total + local_transport_total + activities_total + inter_city_transport_total, 2
    )

    return TripGuide(
        primary=primary,
        total_days=total_days,
        currency=primary.currency,
        legs=legs,
        hops=hops,
        accommodation_total=accommodation_total,
        food_total=food_total,
        local_transport_total=local_transport_total,
        activities_total=activities_total,
        inter_city_transport_total=inter_city_transport_total,
        grand_total=grand_total,
    )
