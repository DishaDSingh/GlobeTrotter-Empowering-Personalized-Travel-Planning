import argparse
import csv
import os
import sys

BACKEND_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend")
sys.path.insert(0, BACKEND_DIR)

from app.database import Base, SessionLocal, engine  # noqa: E402
from app.models import Activity, ActivityCategory, Destination  # noqa: E402

DEFAULT_COLUMNS = {
    "city": "city",
    "name": "name",
    "category": "category",
    "latitude": "latitude",
    "longitude": "longitude",
    "price": "price",
    "currency": "currency",
    "duration_minutes": "duration_minutes",
    "rating": "rating",
}

CATEGORY_LOOKUP = {c.value.lower(): c for c in ActivityCategory}


def normalize_category(raw: str | None) -> ActivityCategory:
    if not raw:
        return ActivityCategory.attraction
    return CATEGORY_LOOKUP.get(raw.strip().lower(), ActivityCategory.attraction)


def parse_column_mapping(raw: str | None) -> dict:
    mapping = dict(DEFAULT_COLUMNS)
    if not raw:
        return mapping
    for pair in raw.split(","):
        key, _, source_col = pair.partition("=")
        if key in mapping and source_col:
            mapping[key] = source_col
    return mapping


def safe_float(value, default=0.0):
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def main():
    parser = argparse.ArgumentParser(description="Import activities into the activities table.")
    parser.add_argument("--file", required=True, help="Path to the source CSV file.")
    parser.add_argument("--columns", help="Custom column mapping, e.g. name=title,city=town")
    parser.add_argument("--create-missing-cities", action="store_true")
    parser.add_argument("--limit", type=int, default=0)
    args = parser.parse_args()

    columns = parse_column_mapping(args.columns)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    destination_cache: dict[str, Destination] = {
        d.city.lower(): d for d in db.query(Destination).all()
    }
    existing_keys = {
        (a.destination_id, a.name.lower())
        for a in db.query(Activity).all()
    }

    imported, skipped, duplicates = 0, 0, 0

    try:
        with open(args.file, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for i, row in enumerate(reader):
                if args.limit and i >= args.limit:
                    break

                city_raw = (row.get(columns["city"]) or "").strip()
                name = (row.get(columns["name"]) or "").strip()
                if not city_raw or not name:
                    skipped += 1
                    continue

                destination = destination_cache.get(city_raw.lower())
                if not destination:
                    if not args.create_missing_cities:
                        skipped += 1
                        continue
                    destination = Destination(
                        city=city_raw, country="Unknown", country_code="XX",
                        latitude=safe_float(row.get(columns["latitude"])),
                        longitude=safe_float(row.get(columns["longitude"])),
                        popularity_score=40.0, estimated_daily_cost=100.0, currency="USD",
                    )
                    db.add(destination)
                    db.flush()
                    destination_cache[city_raw.lower()] = destination

                key = (destination.id, name.lower())
                if key in existing_keys:
                    duplicates += 1
                    continue
                existing_keys.add(key)

                db.add(Activity(
                    destination_id=destination.id,
                    name=name,
                    category=normalize_category(row.get(columns["category"])),
                    latitude=safe_float(row.get(columns["latitude"]), destination.latitude),
                    longitude=safe_float(row.get(columns["longitude"]), destination.longitude),
                    price=safe_float(row.get(columns["price"]), 0.0),
                    currency=(row.get(columns["currency"]) or destination.currency or "USD").strip() or "USD",
                    duration_minutes=int(safe_float(row.get(columns["duration_minutes"]), 60)),
                    rating=safe_float(row.get(columns["rating"]), 4.0),
                ))
                imported += 1

                if imported % 500 == 0:
                    db.commit()

        db.commit()
    finally:
        db.close()

    print(f"Imported {imported} activities. Skipped {skipped}, {duplicates} duplicates.")


if __name__ == "__main__":
    main()
