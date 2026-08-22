import argparse
import csv
import os
import sys

BACKEND_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend")
sys.path.insert(0, BACKEND_DIR)

from app.database import Base, SessionLocal, engine  # noqa: E402
from app.models import Destination  # noqa: E402

DEFAULT_COLUMNS = {
    "city": "name",
    "country": "country",
    "country_code": "country_code",
    "latitude": "latitude",
    "longitude": "longitude",
    "population": "population",
}


def parse_column_mapping(raw: str | None) -> dict:
    mapping = dict(DEFAULT_COLUMNS)
    if not raw:
        return mapping
    for pair in raw.split(","):
        key, _, source_col = pair.partition("=")
        if key in mapping and source_col:
            mapping[key] = source_col
    return mapping


def validate_row(row: dict, columns: dict) -> dict | None:
    try:
        city = row[columns["city"]].strip()
        country = row[columns["country"]].strip()
        country_code = row[columns["country_code"]].strip().upper()[:5]
        latitude = float(row[columns["latitude"]])
        longitude = float(row[columns["longitude"]])
    except (KeyError, ValueError, AttributeError):
        return None

    if not city or not country or not (-90 <= latitude <= 90) or not (-180 <= longitude <= 180):
        return None

    population = None
    pop_col = columns.get("population")
    if pop_col and row.get(pop_col):
        try:
            population = int(float(row[pop_col]))
        except ValueError:
            population = None

    return {
        "city": city,
        "country": country,
        "country_code": country_code or "XX",
        "latitude": latitude,
        "longitude": longitude,
        "population": population,
    }


def main():
    parser = argparse.ArgumentParser(description="Import cities into the destinations table.")
    parser.add_argument("--file", required=True, help="Path to the source CSV file.")
    parser.add_argument("--columns", help="Custom column mapping, e.g. city=name,country=country")
    parser.add_argument("--limit", type=int, default=0, help="Optional max rows to import (0 = no limit).")
    args = parser.parse_args()

    columns = parse_column_mapping(args.columns)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    imported, skipped, duplicates = 0, 0, 0
    seen_keys = {(d.city.lower(), d.country_code.lower()) for d in db.query(Destination).all()}

    try:
        with open(args.file, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for i, row in enumerate(reader):
                if args.limit and i >= args.limit:
                    break
                clean = validate_row(row, columns)
                if not clean:
                    skipped += 1
                    continue

                key = (clean["city"].lower(), clean["country_code"].lower())
                if key in seen_keys:
                    duplicates += 1
                    continue
                seen_keys.add(key)

                db.add(Destination(
                    city=clean["city"],
                    country=clean["country"],
                    country_code=clean["country_code"],
                    latitude=clean["latitude"],
                    longitude=clean["longitude"],
                    population=clean["population"],
                    popularity_score=50.0,
                    estimated_daily_cost=100.0,
                    currency="USD",
                ))
                imported += 1

                if imported % 500 == 0:
                    db.commit()

        db.commit()
    finally:
        db.close()

    print(f"Imported {imported} destinations. Skipped {skipped} invalid rows, {duplicates} duplicates.")


if __name__ == "__main__":
    main()
