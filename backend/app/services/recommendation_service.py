"""Destination recommendation scoring.

Kept as a simple, explainable weighted scoring function so it can later be
swapped for an ML/AI-based recommender without changing the calling API
(see get_recommendations below - it always returns (destination, score, reasons)).
"""

import calendar
from datetime import date

from app.models import Destination, Trip, UserPreference

CATEGORY_KEYWORDS = {
    "adventure": ["adventure", "nature", "outdoor"],
    "culture": ["culture", "museum", "religious", "history"],
    "relaxation": ["nature", "food", "shopping"],
    "balanced": [],
}

# Curated "best months to visit" per seeded city, based on real seasonal
# travel guidance (dry season / mild temperatures / avoiding monsoon or
# extreme heat). Months are 1-indexed. Any destination not listed here falls
# back to a latitude-based hemisphere heuristic in _fallback_best_months, so
# newly imported destinations still get a reasonable answer.
SEASONAL_WINDOWS: dict[str, dict] = {
    "Paris": {"months": [4, 5, 6, 9, 10], "why": "mild spring and autumn weather with fewer crowds"},
    "London": {"months": [5, 6, 7, 8, 9], "why": "the warmest and driest months of the year"},
    "Dubai": {"months": [11, 12, 1, 2, 3], "why": "cool, dry desert winter temperatures"},
    "Tokyo": {"months": [3, 4, 5, 10, 11], "why": "cherry blossoms in spring or fall foliage"},
    "Mumbai": {"months": [11, 12, 1, 2], "why": "cool and dry weather right after monsoon season"},
    "Delhi": {"months": [10, 11, 2, 3], "why": "pleasant temperatures that avoid the summer heat and monsoon"},
    "Goa": {"months": [11, 12, 1, 2], "why": "the dry season with ideal beach weather"},
    "Jaipur": {"months": [10, 11, 12, 1, 2], "why": "cool, comfortable weather for sightseeing"},
    "Singapore": {"months": [2, 3, 4], "why": "the driest stretch in an otherwise humid, equatorial climate"},
    "New York": {"months": [4, 5, 6, 9, 10], "why": "mild spring and fall temperatures"},

    # Europe
    "Rome": {"months": [4, 5, 6, 9, 10], "why": "mild weather before and after the peak summer crowds"},
    "Barcelona": {"months": [5, 6, 9, 10], "why": "warm, sunny days without peak-summer heat"},
    "Amsterdam": {"months": [4, 5, 6, 9], "why": "mild spring or early autumn with fewer rainy days"},
    "Berlin": {"months": [5, 6, 7, 8, 9], "why": "the warmest and driest months of the year"},
    "Prague": {"months": [4, 5, 9, 10], "why": "mild spring and autumn weather with fewer tourists"},
    "Vienna": {"months": [4, 5, 9, 10], "why": "comfortable spring and autumn temperatures"},
    "Istanbul": {"months": [4, 5, 9, 10], "why": "mild temperatures, avoiding summer heat and winter rain"},
    "Athens": {"months": [4, 5, 9, 10], "why": "warm but not scorching, ideal for exploring ancient sites"},
    "Venice": {"months": [4, 5, 9, 10], "why": "mild weather without peak-summer crowds and flooding risk"},
    "Florence": {"months": [4, 5, 9, 10], "why": "comfortable temperatures for walking the city"},
    "Santorini": {"months": [5, 6, 9, 10], "why": "warm, sunny weather without the peak-August crowds"},
    "Reykjavik": {"months": [6, 7, 8], "why": "long daylight hours and mild summer temperatures"},

    # Asia
    "Bangkok": {"months": [11, 12, 1, 2], "why": "the cool, dry season with the least humidity"},
    "Kyoto": {"months": [3, 4, 10, 11], "why": "cherry blossoms in spring or vivid autumn foliage"},
    "Seoul": {"months": [3, 4, 5, 9, 10], "why": "cherry blossoms in spring or crisp, clear autumn air"},
    "Hong Kong": {"months": [10, 11, 12], "why": "cool and dry after the summer typhoon season"},
    "Shanghai": {"months": [3, 4, 10, 11], "why": "mild spring and autumn weather"},
    "Beijing": {"months": [4, 5, 9, 10], "why": "mild temperatures away from winter cold and summer haze"},
    "Kuala Lumpur": {"months": [6, 7, 8], "why": "a relatively drier stretch between the region's two monsoons"},
    "Hanoi": {"months": [10, 11, 3, 4], "why": "mild, dry weather outside the hot summer and damp winter"},
    "Ubud": {"months": [4, 5, 6, 9], "why": "the dry season with lower humidity and fewer crowds"},
    "Kathmandu": {"months": [3, 4, 10, 11], "why": "clear mountain views before or after the monsoon"},
    "Colombo": {"months": [1, 2, 3], "why": "the driest months on Sri Lanka's west coast"},
    "Malé": {"months": [1, 2, 3, 4], "why": "the dry season with calm seas ideal for diving"},

    # Middle East
    "Abu Dhabi": {"months": [11, 12, 1, 2, 3], "why": "cool, dry desert winter temperatures"},
    "Doha": {"months": [11, 12, 1, 2], "why": "mild temperatures, avoiding the intense summer heat"},
    "Muscat": {"months": [11, 12, 1, 2, 3], "why": "cooler, comfortable temperatures for exploring"},
    "Amman": {"months": [4, 5, 9, 10], "why": "mild spring and autumn weather"},

    # Africa
    "Cape Town": {"months": [11, 12, 1, 2, 3], "why": "the warm, dry Southern Hemisphere summer"},
    "Marrakech": {"months": [3, 4, 10, 11], "why": "mild temperatures before the summer heat sets in"},
    "Cairo": {"months": [10, 11, 12, 2, 3], "why": "cooler, comfortable desert temperatures"},
    "Zanzibar City": {"months": [6, 7, 8, 9], "why": "the dry season with lower humidity"},
    "Nairobi": {"months": [1, 2, 7, 8, 9], "why": "the driest months, ideal for spotting wildlife"},

    # Americas
    "Rio de Janeiro": {"months": [9, 10, 11], "why": "pleasant temperatures between the hot summer and cooler winter"},
    "Buenos Aires": {"months": [3, 4, 10, 11], "why": "mild autumn or spring weather"},
    "Cusco": {"months": [5, 6, 7, 8, 9], "why": "the dry season, best for Machu Picchu and Andean trekking"},
    "Mexico City": {"months": [3, 4, 10, 11], "why": "mild, dry weather outside the summer rains"},
    "Toronto": {"months": [5, 6, 9, 10], "why": "warm but not humid, with colorful fall foliage in October"},
    "San Francisco": {"months": [9, 10], "why": "the city's actual warm season, after the summer fog clears"},
    "Los Angeles": {"months": [3, 4, 5, 10, 11], "why": "mild, sunny weather without peak-summer crowds"},
    "Miami": {"months": [12, 1, 2, 3], "why": "warm and dry, outside of hurricane season"},
    "Vancouver": {"months": [6, 7, 8, 9], "why": "the driest, sunniest months of the year"},
    "Havana": {"months": [12, 1, 2, 3], "why": "dry season with comfortable temperatures, outside hurricane season"},

    # Oceania
    "Sydney": {"months": [3, 4, 9, 10, 11], "why": "mild autumn or spring weather"},
    "Melbourne": {"months": [3, 4, 10, 11], "why": "mild autumn or spring temperatures"},
    "Auckland": {"months": [12, 1, 2, 3], "why": "the warm Southern Hemisphere summer"},
    "Queenstown": {"months": [12, 1, 2], "why": "summer weather ideal for hiking and outdoor adventure"},

    # India (expanded)
    "Agra": {"months": [10, 11, 12, 1, 2], "why": "cool, comfortable weather to visit the Taj Mahal"},
    "Varanasi": {"months": [10, 11, 12, 1, 2], "why": "pleasant temperatures along the Ganges"},
    "Udaipur": {"months": [10, 11, 2, 3], "why": "comfortable temperatures for sightseeing"},
    "Kochi": {"months": [11, 12, 1, 2], "why": "cool, dry weather after the monsoon"},
    "Amritsar": {"months": [10, 11, 2, 3], "why": "comfortable temperatures that avoid summer heat"},
    "Bengaluru": {"months": [10, 11, 12, 1, 2], "why": "the coolest, most pleasant stretch of a mild year-round climate"},
    "Chennai": {"months": [12, 1, 2], "why": "cooler, less humid weather away from the summer heat"},
    "Kolkata": {"months": [11, 12, 1, 2], "why": "cool, dry winter weather"},
    "Shimla": {"months": [3, 4, 5, 10, 11], "why": "mild hill-station weather in spring and autumn"},
    "Rishikesh": {"months": [3, 4, 9, 10, 11], "why": "pleasant weather for rafting and trekking, outside monsoon"},
    "Ahmedabad": {"months": [11, 12, 1, 2], "why": "cooler, comfortable temperatures away from extreme summer heat"},
}

SEASON_NAMES_NORTH = {12: "Winter", 1: "Winter", 2: "Winter", 3: "Spring", 4: "Spring", 5: "Spring",
                       6: "Summer", 7: "Summer", 8: "Summer", 9: "Autumn", 10: "Autumn", 11: "Autumn"}
SEASON_NAMES_SOUTH = {12: "Summer", 1: "Summer", 2: "Summer", 3: "Autumn", 4: "Autumn", 5: "Autumn",
                       6: "Winter", 7: "Winter", 8: "Winter", 9: "Spring", 10: "Spring", 11: "Spring"}


def current_season_label(latitude: float, when: date | None = None) -> str:
    when = when or date.today()
    table = SEASON_NAMES_SOUTH if latitude < 0 else SEASON_NAMES_NORTH
    return table[when.month]


def _fallback_best_months(destination: Destination) -> list[int]:
    """Hemisphere-based shoulder-season guess for destinations without curated data."""
    if abs(destination.latitude) <= 15:
        # Tropical: default to a generic dry-season window (Nov-Apr).
        return [11, 12, 1, 2, 3, 4]
    if destination.latitude < 0:
        return [3, 4, 10, 11]  # Southern hemisphere shoulder seasons
    return [4, 5, 9, 10]  # Northern hemisphere shoulder seasons


def _preference_match(destination: Destination, preferences: UserPreference | None) -> float:
    if not preferences:
        return 0.6
    score = 0.5
    interests = [i.lower() for i in (preferences.interests or [])]
    text = f"{destination.city} {destination.country} {destination.description or ''}".lower()
    for interest in interests:
        if interest in text:
            score += 0.15
    style_keywords = CATEGORY_KEYWORDS.get((preferences.travel_style or "").lower(), [])
    for kw in style_keywords:
        if kw in text:
            score += 0.1
    return min(score, 1.0)


def _budget_match(destination: Destination, target_daily_budget: float | None) -> float:
    if not target_daily_budget or target_daily_budget <= 0:
        return 0.6
    ratio = destination.estimated_daily_cost / target_daily_budget
    if ratio <= 1.0:
        return 1.0
    if ratio <= 1.5:
        return 0.6
    if ratio <= 2.0:
        return 0.3
    return 0.1


def _popularity_score(destination: Destination) -> float:
    return min(destination.popularity_score / 100.0, 1.0)


def _best_months(destination: Destination) -> list[int]:
    entry = SEASONAL_WINDOWS.get(destination.city)
    if entry:
        return entry["months"]
    return _fallback_best_months(destination)


def _season_match(destination: Destination, when: date | None) -> float:
    when = when or date.today()
    month = when.month
    best = _best_months(destination)
    if month in best:
        return 0.95
    # Partial credit for being adjacent to a good month (shoulder of the shoulder season)
    adjacent = {(m % 12) + 1 for m in best} | {(m - 2) % 12 + 1 for m in best}
    if month in adjacent:
        return 0.6
    return 0.3


def season_reason(destination: Destination, when: date | None = None) -> str | None:
    when = when or date.today()
    if when.month not in _best_months(destination):
        return None
    entry = SEASONAL_WINDOWS.get(destination.city)
    why = entry["why"] if entry else "favorable weather this time of year"
    return f"Great time to visit {destination.city} - {why}."


def score_destination(
    destination: Destination,
    preferences: UserPreference | None,
    target_daily_budget: float | None = None,
    when: date | None = None,
) -> tuple[float, list[str]]:
    preference_match = _preference_match(destination, preferences)
    budget_match = _budget_match(destination, target_daily_budget)
    popularity = _popularity_score(destination)
    season_match = _season_match(destination, when)

    score = (
        preference_match * 0.35
        + budget_match * 0.25
        + popularity * 0.20
        + season_match * 0.20
    ) * 100

    reasons = []
    if preference_match > 0.7:
        reasons.append("Matches your travel interests")
    if budget_match > 0.7:
        reasons.append("Fits comfortably within your budget")
    if popularity > 0.7:
        reasons.append("Popular with other travelers")
    if season_match >= 0.9:
        reasons.append(f"Ideal to visit in {calendar.month_name[(when or date.today()).month]}")
    elif season_match > 0.5:
        reasons.append("Good time of year to visit")
    if not reasons:
        reasons.append("Worth exploring")

    return round(score, 1), reasons


def get_recommendations(
    destinations: list[Destination],
    preferences: UserPreference | None,
    past_trips: list[Trip] | None = None,
    limit: int = 8,
) -> list[tuple[Destination, float, list[str]]]:
    target_daily_budget = None
    if past_trips:
        durations_costs = []
        for t in past_trips:
            if t.start_date and t.end_date and t.budget_total:
                days = max((t.end_date - t.start_date).days + 1, 1)
                durations_costs.append(t.budget_total / days)
        if durations_costs:
            target_daily_budget = sum(durations_costs) / len(durations_costs)

    scored = [
        (dest, *score_destination(dest, preferences, target_daily_budget))
        for dest in destinations
    ]
    scored.sort(key=lambda x: x[1], reverse=True)
    return scored[:limit]


def get_seasonal_recommendations(
    destinations: list[Destination],
    when: date | None = None,
    limit: int = 8,
) -> tuple[str, list[tuple[Destination, float, list[str]]]]:
    """Rank destinations purely by how well the current month fits their best
    travel season, tie-broken by popularity. Returns (season_label, scored)
    where season_label describes the northern-hemisphere season for display
    (e.g. "Winter") - individual destinations may be in the opposite
    hemisphere, which is reflected in their own reasons/scores instead.
    """
    when = when or date.today()
    season_label = current_season_label(latitude=1, when=when)  # northern-hemisphere framing for the section title

    scored: list[tuple[Destination, float, list[str]]] = []
    for dest in destinations:
        season_match = _season_match(dest, when)
        popularity = _popularity_score(dest)
        score = round((season_match * 0.75 + popularity * 0.25) * 100, 1)
        reason = season_reason(dest, when)
        reasons = [reason] if reason else [f"Pleasant weather expected in {calendar.month_name[when.month]}"]
        scored.append((dest, score, reasons))

    scored.sort(key=lambda x: x[1], reverse=True)
    return season_label, scored[:limit]
