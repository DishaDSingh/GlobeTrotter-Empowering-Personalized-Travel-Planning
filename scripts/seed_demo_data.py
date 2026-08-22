"""Seed the database with realistic demo data so GlobeTrotter looks populated
immediately after setup: destinations, activities, a demo user, and a couple
of fully-built sample trips (stops + itinerary + budget).

Usage (from the backend venv, with backend/ on PYTHONPATH):
    backend/venv/Scripts/python.exe scripts/seed_demo_data.py

Safe to re-run: it skips creating rows that already exist (matched by
natural keys like city name or user email).
"""

import os
import sys
from datetime import date, timedelta

BACKEND_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend")
sys.path.insert(0, BACKEND_DIR)

from app.auth import hash_password  # noqa: E402
from app.database import Base, SessionLocal, engine  # noqa: E402
from app.models import (  # noqa: E402
    Activity,
    ActivityCategory,
    BudgetCategory,
    BudgetRecord,
    Destination,
    ItineraryActivity,
    Trip,
    TripStatus,
    TripStop,
    TripVisibility,
    User,
    UserPreference,
    UserRole,
)

Base.metadata.create_all(bind=engine)

# City photography uses Lorem Picsum (https://picsum.photos) - a free, key-free
# placeholder photo service seeded deterministically per city so images stay
# stable across runs. Swap for a licensed travel-photo provider in production.
def photo(seed: str) -> str:
    return f"https://picsum.photos/seed/{seed}/900/600"


DESTINATIONS = [
    dict(city="Paris", country="France", country_code="FR", latitude=48.8566, longitude=2.3522,
         description="The City of Light, famed for the Eiffel Tower, world-class art, and café culture.",
         image_url=photo("paris-gt"), population=2148000, popularity_score=96, estimated_daily_cost=140, currency="EUR"),
    dict(city="London", country="United Kingdom", country_code="GB", latitude=51.5072, longitude=-0.1276,
         description="A historic global capital blending royal heritage with cutting-edge culture.",
         image_url=photo("london-gt"), population=8982000, popularity_score=94, estimated_daily_cost=150, currency="GBP"),
    dict(city="Dubai", country="United Arab Emirates", country_code="AE", latitude=25.2048, longitude=55.2708,
         description="A futuristic desert metropolis of record-breaking towers and luxury souks.",
         image_url=photo("dubai-gt"), population=3331000, popularity_score=90, estimated_daily_cost=160, currency="AED"),
    dict(city="Tokyo", country="Japan", country_code="JP", latitude=35.6762, longitude=139.6503,
         description="A dazzling mix of neon-lit skyscrapers, ancient temples, and world-class cuisine.",
         image_url=photo("tokyo-gt"), population=13960000, popularity_score=95, estimated_daily_cost=130, currency="JPY"),
    dict(city="Mumbai", country="India", country_code="IN", latitude=19.0760, longitude=72.8777,
         description="India's vibrant financial capital, home to Bollywood, colonial architecture, and street food.",
         image_url=photo("mumbai-gt"), population=12480000, popularity_score=82, estimated_daily_cost=55, currency="INR"),
    dict(city="Delhi", country="India", country_code="IN", latitude=28.7041, longitude=77.1025,
         description="India's capital, layered with Mughal monuments, bustling bazaars, and modern city life.",
         image_url=photo("delhi-gt"), population=32900000, popularity_score=85, estimated_daily_cost=50, currency="INR"),
    dict(city="Goa", country="India", country_code="IN", latitude=15.2993, longitude=74.1240,
         description="India's beach paradise, known for golden sands, Portuguese heritage, and laid-back nightlife.",
         image_url=photo("goa-gt"), population=1458000, popularity_score=88, estimated_daily_cost=45, currency="INR"),
    dict(city="Jaipur", country="India", country_code="IN", latitude=26.9124, longitude=75.7873,
         description="The Pink City, celebrated for majestic forts, palaces, and vibrant markets.",
         image_url=photo("jaipur-gt"), population=3070000, popularity_score=83, estimated_daily_cost=40, currency="INR"),
    dict(city="Singapore", country="Singapore", country_code="SG", latitude=1.3521, longitude=103.8198,
         description="A gleaming garden city-state famed for hawker food, futuristic gardens, and skyline views.",
         image_url=photo("singapore-gt"), population=5686000, popularity_score=91, estimated_daily_cost=125, currency="SGD"),
    dict(city="New York", country="United States", country_code="US", latitude=40.7128, longitude=-74.0060,
         description="The city that never sleeps - iconic skyline, Broadway lights, and endless neighborhoods to explore.",
         image_url=photo("newyork-gt"), population=8336000, popularity_score=97, estimated_daily_cost=180, currency="USD"),
]

ACTIVITIES = {
    "Paris": [
        ("Eiffel Tower Summit Access", ActivityCategory.attraction, 28.0, 120, 4.8, "09:00", "23:00"),
        ("Louvre Museum Guided Tour", ActivityCategory.museum, 22.0, 180, 4.9, "09:00", "18:00"),
        ("Seine River Dinner Cruise", ActivityCategory.food, 65.0, 120, 4.6, "19:00", "22:00"),
        ("Montmartre & Sacré-Cœur Walk", ActivityCategory.culture, 0.0, 150, 4.7, "08:00", "20:00"),
        ("Le Marais Food Tasting Tour", ActivityCategory.food, 45.0, 150, 4.7, "11:00", "15:00"),
        ("Versailles Palace Day Trip", ActivityCategory.attraction, 35.0, 300, 4.8, "08:00", "18:00"),
    ],
    "London": [
        ("Tower of London & Crown Jewels", ActivityCategory.attraction, 33.0, 150, 4.7, "09:00", "17:30"),
        ("British Museum Highlights Tour", ActivityCategory.museum, 0.0, 120, 4.8, "10:00", "17:00"),
        ("West End Musical Night", ActivityCategory.entertainment, 85.0, 150, 4.8, "19:30", "22:00"),
        ("Borough Market Food Crawl", ActivityCategory.food, 30.0, 120, 4.6, "11:00", "15:00"),
        ("Thames Sunset River Cruise", ActivityCategory.attraction, 25.0, 90, 4.5, "18:00", "20:00"),
        ("Camden Town Nightlife Walk", ActivityCategory.nightlife, 15.0, 180, 4.3, "20:00", "23:59"),
    ],
    "Dubai": [
        ("Burj Khalifa Observation Deck", ActivityCategory.attraction, 40.0, 90, 4.7, "09:00", "23:00"),
        ("Desert Safari & BBQ Dinner", ActivityCategory.adventure, 70.0, 300, 4.8, "15:00", "21:00"),
        ("Dubai Mall & Fountain Show", ActivityCategory.shopping, 0.0, 150, 4.6, "10:00", "23:00"),
        ("Gold & Spice Souk Tour", ActivityCategory.culture, 20.0, 120, 4.5, "10:00", "18:00"),
        ("Burj Al Arab Afternoon Tea", ActivityCategory.food, 120.0, 90, 4.7, "14:00", "17:00"),
        ("Skydive Palm Jumeirah", ActivityCategory.adventure, 400.0, 60, 4.9, "07:00", "12:00"),
    ],
    "Tokyo": [
        ("Senso-ji Temple & Asakusa", ActivityCategory.religious, 0.0, 120, 4.7, "06:00", "20:00"),
        ("Tsukiji Outer Market Food Tour", ActivityCategory.food, 40.0, 150, 4.8, "07:00", "12:00"),
        ("Shibuya & Harajuku Street Walk", ActivityCategory.culture, 0.0, 150, 4.6, "10:00", "21:00"),
        ("teamLab Digital Art Museum", ActivityCategory.entertainment, 30.0, 120, 4.8, "10:00", "19:00"),
        ("Mount Fuji Day Trip", ActivityCategory.nature, 90.0, 480, 4.7, "07:00", "19:00"),
        ("Robot Restaurant Show", ActivityCategory.nightlife, 60.0, 90, 4.2, "19:00", "23:00"),
    ],
    "Mumbai": [
        ("Gateway of India & Colaba Walk", ActivityCategory.attraction, 0.0, 120, 4.5, "07:00", "20:00"),
        ("Elephanta Caves Ferry Tour", ActivityCategory.culture, 15.0, 240, 4.4, "09:00", "16:00"),
        ("Mumbai Street Food Trail", ActivityCategory.food, 12.0, 150, 4.7, "17:00", "21:00"),
        ("Marine Drive Sunset Walk", ActivityCategory.nature, 0.0, 90, 4.6, "17:00", "20:00"),
        ("Bollywood Studio Tour", ActivityCategory.entertainment, 25.0, 180, 4.3, "10:00", "16:00"),
    ],
    "Delhi": [
        ("Red Fort & Chandni Chowk", ActivityCategory.attraction, 8.0, 180, 4.6, "09:00", "18:00"),
        ("India Gate Evening Visit", ActivityCategory.attraction, 0.0, 60, 4.5, "16:00", "21:00"),
        ("Humayun's Tomb Heritage Tour", ActivityCategory.culture, 10.0, 120, 4.6, "08:00", "18:00"),
        ("Old Delhi Food Walk", ActivityCategory.food, 18.0, 150, 4.8, "17:00", "21:00"),
        ("Qutub Minar Complex", ActivityCategory.museum, 6.0, 90, 4.5, "07:00", "17:00"),
    ],
    "Goa": [
        ("Baga Beach Water Sports", ActivityCategory.adventure, 30.0, 150, 4.5, "09:00", "17:00"),
        ("Old Goa Churches Tour", ActivityCategory.religious, 0.0, 120, 4.4, "09:00", "17:00"),
        ("Anjuna Flea Market", ActivityCategory.shopping, 0.0, 120, 4.3, "10:00", "18:00"),
        ("Sunset Cruise on Mandovi River", ActivityCategory.nature, 15.0, 90, 4.5, "17:30", "19:30"),
        ("Beach Shack Seafood Dinner", ActivityCategory.food, 20.0, 90, 4.6, "19:00", "22:00"),
        ("Tito's Lane Nightlife", ActivityCategory.nightlife, 10.0, 180, 4.2, "21:00", "23:59"),
    ],
    "Jaipur": [
        ("Amber Fort Elephant Gate Tour", ActivityCategory.attraction, 12.0, 150, 4.8, "08:00", "17:00"),
        ("Hawa Mahal Photo Stop", ActivityCategory.attraction, 3.0, 45, 4.6, "09:00", "16:00"),
        ("City Palace Heritage Walk", ActivityCategory.culture, 10.0, 120, 4.6, "09:00", "17:00"),
        ("Johari Bazaar Shopping", ActivityCategory.shopping, 0.0, 120, 4.4, "10:00", "20:00"),
        ("Rajasthani Thali Dinner", ActivityCategory.food, 15.0, 90, 4.7, "19:00", "21:30"),
    ],
    "Singapore": [
        ("Gardens by the Bay & Cloud Forest", ActivityCategory.nature, 28.0, 150, 4.8, "09:00", "21:00"),
        ("Marina Bay Sands SkyPark", ActivityCategory.attraction, 26.0, 90, 4.7, "09:30", "22:00"),
        ("Hawker Centre Food Trail", ActivityCategory.food, 15.0, 120, 4.8, "11:00", "14:00"),
        ("Sentosa Island Beach Day", ActivityCategory.entertainment, 20.0, 240, 4.5, "10:00", "19:00"),
        ("Chinatown & Little India Walk", ActivityCategory.culture, 0.0, 150, 4.5, "10:00", "18:00"),
    ],
    "New York": [
        ("Statue of Liberty & Ellis Island", ActivityCategory.attraction, 24.0, 210, 4.7, "08:30", "16:00"),
        ("Top of the Rock Observation Deck", ActivityCategory.attraction, 40.0, 60, 4.7, "08:00", "23:00"),
        ("Broadway Show Night", ActivityCategory.entertainment, 130.0, 150, 4.8, "19:30", "22:30"),
        ("Central Park Bike Tour", ActivityCategory.nature, 35.0, 120, 4.6, "09:00", "18:00"),
        ("MoMA Modern Art Tour", ActivityCategory.museum, 25.0, 120, 4.6, "10:00", "17:00"),
        ("Brooklyn Pizza & Food Crawl", ActivityCategory.food, 55.0, 180, 4.7, "17:00", "21:00"),
    ],
}

DEMO_USERS = [
    dict(name="Asha Kulkarni", email="demo@globetrotter.app", password="Demo1234!", language="en"),
    dict(name="Rohan Mehta", email="rohan@globetrotter.app", password="Demo1234!", language="en"),
    dict(name="Priya Nair", email="priya@globetrotter.app", password="Demo1234!", language="en"),
    dict(name="Globetrotter Admin", email="admin@globetrotter.app", password="Admin1234!", language="en", role=UserRole.admin),
]


def get_or_create_destination(db, data: dict) -> Destination:
    existing = db.query(Destination).filter(Destination.city == data["city"]).first()
    if existing:
        return existing
    dest = Destination(**data)
    db.add(dest)
    db.flush()
    return dest


def get_or_create_activity(db, destination_id: str, name: str, category, price, duration, rating, opening, closing) -> Activity:
    existing = db.query(Activity).filter(Activity.destination_id == destination_id, Activity.name == name).first()
    if existing:
        return existing
    dest = db.get(Destination, destination_id)
    activity = Activity(
        destination_id=destination_id,
        name=name,
        description=f"{name} - a top-rated experience in {dest.city}.",
        category=category,
        image_url=photo(f"{dest.city}-{name}"),
        latitude=dest.latitude,
        longitude=dest.longitude,
        price=price,
        currency=dest.currency,
        duration_minutes=duration,
        rating=rating,
        opening_time=opening,
        closing_time=closing,
    )
    db.add(activity)
    db.flush()
    return activity


def get_or_create_user(db, data: dict) -> User:
    existing = db.query(User).filter(User.email == data["email"]).first()
    if existing:
        return existing
    user = User(
        name=data["name"],
        email=data["email"],
        password_hash=hash_password(data["password"]),
        language=data["language"],
        role=data.get("role", UserRole.user),
    )
    db.add(user)
    db.flush()
    db.add(UserPreference(user_id=user.id, travel_style="Balanced", interests=["Culture", "Food"]))
    return user


def build_sample_trip(db, user: User, dest_map: dict[str, Destination], act_map: dict[str, dict[str, Activity]]):
    existing = db.query(Trip).filter(Trip.user_id == user.id, Trip.name == "Paris & London Getaway").first()
    if existing:
        return

    start = date.today() + timedelta(days=14)
    trip = Trip(
        user_id=user.id,
        name="Paris & London Getaway",
        description="A romantic week hopping between two of Europe's most iconic capitals.",
        start_date=start,
        end_date=start + timedelta(days=6),
        cover_image=photo("paris-london-trip"),
        visibility=TripVisibility.public,
        status=TripStatus.planned,
        budget_total=2200.0,
        currency="EUR",
    )
    import uuid as _uuid
    trip.share_id = str(_uuid.uuid4())
    db.add(trip)
    db.flush()

    paris_stop = TripStop(trip_id=trip.id, destination_id=dest_map["Paris"].id, arrival_date=start,
                           departure_date=start + timedelta(days=3), sequence=0)
    london_stop = TripStop(trip_id=trip.id, destination_id=dest_map["London"].id,
                            arrival_date=start + timedelta(days=3), departure_date=start + timedelta(days=6), sequence=1)
    db.add_all([paris_stop, london_stop])
    db.flush()

    paris_activities = list(act_map["Paris"].values())
    for i, act in enumerate(paris_activities[:4]):
        db.add(ItineraryActivity(
            trip_id=trip.id, trip_stop_id=paris_stop.id, activity_id=act.id,
            date=start + timedelta(days=i % 3), start_time=["09:00", "13:00", "15:30", "19:00"][i % 4],
            sequence=i,
        ))

    london_activities = list(act_map["London"].values())
    for i, act in enumerate(london_activities[:4]):
        db.add(ItineraryActivity(
            trip_id=trip.id, trip_stop_id=london_stop.id, activity_id=act.id,
            date=start + timedelta(days=3 + (i % 3)), start_time=["10:00", "13:00", "16:00", "19:30"][i % 4],
            sequence=i,
        ))

    budget_rows = [
        (BudgetCategory.accommodation, 650.0, "Hotels in Paris & London"),
        (BudgetCategory.transportation, 320.0, "Eurostar + local transit"),
        (BudgetCategory.food, 380.0, "Restaurants and cafes"),
        (BudgetCategory.activities, 410.0, "Tours and attractions"),
        (BudgetCategory.shopping, 90.0, "Souvenirs"),
    ]
    for category, amount, desc in budget_rows:
        db.add(BudgetRecord(trip_id=trip.id, category=category, amount=amount, currency="EUR",
                             description=desc, date=start))

    draft_trip = Trip(
        user_id=user.id,
        name="Golden Triangle: Delhi, Jaipur & Goa",
        description="Classic North India culture followed by beach relaxation in Goa.",
        start_date=start + timedelta(days=40),
        end_date=start + timedelta(days=48),
        cover_image=photo("golden-triangle-trip"),
        visibility=TripVisibility.private,
        status=TripStatus.draft,
        budget_total=60000.0,
        currency="INR",
    )
    db.add(draft_trip)
    db.flush()
    for i, city in enumerate(["Delhi", "Jaipur", "Goa"]):
        db.add(TripStop(trip_id=draft_trip.id, destination_id=dest_map[city].id, sequence=i))


def main():
    db = SessionLocal()
    try:
        dest_map: dict[str, Destination] = {}
        for data in DESTINATIONS:
            dest_map[data["city"]] = get_or_create_destination(db, data)
        db.commit()

        act_map: dict[str, dict[str, Activity]] = {}
        for city, activities in ACTIVITIES.items():
            act_map[city] = {}
            for name, category, price, duration, rating, opening, closing in activities:
                act_map[city][name] = get_or_create_activity(
                    db, dest_map[city].id, name, category, price, duration, rating, opening, closing
                )
        db.commit()

        users = [get_or_create_user(db, u) for u in DEMO_USERS]
        db.commit()

        build_sample_trip(db, users[0], dest_map, act_map)
        db.commit()

        print(f"Seeded {len(dest_map)} destinations, "
              f"{sum(len(v) for v in act_map.values())} activities, "
              f"{len(users)} demo users.")
        print("Demo login: demo@globetrotter.app / Demo1234!")
        print("Admin login: admin@globetrotter.app / Admin1234!")
    finally:
        db.close()


if __name__ == "__main__":
    main()
