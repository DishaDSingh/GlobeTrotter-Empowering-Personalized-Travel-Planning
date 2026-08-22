from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth import require_admin
from app.database import get_db
from app.models import Activity, Destination, Trip, TripStop, TripVisibility, User

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/stats")
def get_admin_stats(_: User = Depends(require_admin), db: Session = Depends(get_db)):
    total_users = db.query(User).count()
    total_trips = db.query(Trip).count()
    public_trips = db.query(Trip).filter(Trip.visibility == TripVisibility.public).count()

    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    active_users = db.query(Trip.user_id).filter(Trip.updated_at >= thirty_days_ago).distinct().count()

    popular_cities_rows = (
        db.query(Destination.city, func.count(TripStop.id).label("count"))
        .join(TripStop, TripStop.destination_id == Destination.id)
        .group_by(Destination.city)
        .order_by(func.count(TripStop.id).desc())
        .limit(10)
        .all()
    )
    popular_cities = [{"city": c, "trips": n} for c, n in popular_cities_rows]
    if not popular_cities:
        popular_cities = [
            {"city": d.city, "trips": 0}
            for d in db.query(Destination).order_by(Destination.popularity_score.desc()).limit(5).all()
        ]

    popular_activities_rows = (
        db.query(Activity.name, Activity.rating)
        .order_by(Activity.rating.desc())
        .limit(10)
        .all()
    )
    popular_activities = [{"name": n, "rating": r} for n, r in popular_activities_rows]

    user_growth = _bucketed_counts(db, User.created_at)
    trips_created = _bucketed_counts(db, Trip.created_at)

    return {
        "total_users": total_users,
        "total_trips": total_trips,
        "active_users": active_users,
        "public_trips": public_trips,
        "popular_cities": popular_cities,
        "popular_activities": popular_activities,
        "user_growth": user_growth,
        "trips_created": trips_created,
    }


def _bucketed_counts(db: Session, column) -> list[dict]:
    rows = db.query(column).all()
    buckets: dict[str, int] = {}
    for (value,) in rows:
        if not value:
            continue
        key = value.strftime("%Y-%m")
        buckets[key] = buckets.get(key, 0) + 1
    return [{"month": k, "count": v} for k, v in sorted(buckets.items())]
