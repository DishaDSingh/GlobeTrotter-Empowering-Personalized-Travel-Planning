"""Rule-based packing list generator.

Presented to the user as suggestions derived from the trip's season and the
actual activity categories in its itinerary - not a weather forecast (we
have no reliable forecast that far out) and not a definitive checklist.
"""

from dataclasses import dataclass
from datetime import date

from app.models import ActivityCategory
from app.services.recommendation_service import current_season_label

BASE_ITEMS = [
    "Passport / government ID",
    "Travel insurance documents",
    "Phone + charger",
    "Universal power adapter",
    "Bank cards & some local cash",
    "Reusable water bottle",
    "Basic first-aid kit & any prescription medication",
]

SEASON_ITEMS = {
    "Summer": ["Lightweight, breathable clothing", "Sunscreen", "Sunglasses", "Hat or cap", "Swimwear"],
    "Winter": ["Insulated jacket", "Thermal base layers", "Gloves & warm hat", "Moisturizer (dry air/heat)"],
    "Spring": ["Light rain jacket", "Layered clothing", "Compact umbrella"],
    "Autumn": ["Light rain jacket", "Layered clothing", "Compact umbrella"],
}

CATEGORY_ITEMS: dict[ActivityCategory, list[str]] = {
    ActivityCategory.adventure: ["Sturdy walking/hiking shoes", "Daypack", "Insect repellent"],
    ActivityCategory.nature: ["Sturdy walking shoes", "Insect repellent", "Reusable bag for trailside trash"],
    ActivityCategory.nightlife: ["A going-out outfit", "Portable phone charger for late nights"],
    ActivityCategory.religious: ["Modest clothing (covered shoulders/knees)", "A light scarf or shawl"],
    ActivityCategory.shopping: ["A packable extra bag for purchases"],
    ActivityCategory.food: ["Antacids (adventurous eating insurance)"],
    ActivityCategory.museum: ["Comfortable walking shoes for long gallery days"],
    ActivityCategory.culture: ["Comfortable walking shoes"],
}


@dataclass
class PackingList:
    season_label: str
    categories: dict[str, list[str]]
    notes: str


def generate_packing_list(
    destination_latitudes: list[float],
    start_date: date | None,
    activity_categories: set[ActivityCategory],
    duration_days: int,
    multi_city: bool,
) -> PackingList:
    avg_lat = sum(destination_latitudes) / len(destination_latitudes) if destination_latitudes else 20.0
    season = current_season_label(avg_lat, start_date)

    clothing = list(SEASON_ITEMS.get(season, []))
    activity_specific: list[str] = []
    for category in activity_categories:
        for item in CATEGORY_ITEMS.get(category, []):
            if item not in activity_specific:
                activity_specific.append(item)

    extras: list[str] = []
    if duration_days > 10:
        extras.append("Laundry detergent sheets / a small travel laundry bag")
    if multi_city:
        extras.append("Packing cubes to keep repacking fast between cities")
        extras.append("A slim day bag for city-to-city travel days")

    categories = {
        "Documents & essentials": BASE_ITEMS,
        "Clothing for the season": clothing or ["Comfortable, versatile everyday clothing"],
        "For your planned activities": activity_specific or ["Nothing category-specific yet - add activities to your itinerary for tailored suggestions"],
        "Extras for this trip": extras or ["Nothing extra needed beyond the basics"],
    }

    notes = (
        f"Based on {season.lower()} conditions at your destination(s) and the activities in your itinerary. "
        "This isn't a weather forecast - check conditions closer to your trip and adjust."
    )

    return PackingList(season_label=season, categories=categories, notes=notes)
