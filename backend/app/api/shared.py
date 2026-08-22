from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.auth import get_current_user
from app.database import get_db
from app.models import (
    BudgetRecord,
    ItineraryActivity,
    Trip,
    TripStatus,
    TripStop,
    TripVisibility,
    User,
)
from app.schemas.budget import BudgetRecordOut
from app.schemas.itinerary import ItineraryActivityOut
from app.schemas.trip import TripDetailOut, TripOut, TripStopOut

router = APIRouter(prefix="/shared", tags=["shared"])


def _get_public_trip_or_404(db: Session, share_id: str) -> Trip:
    trip = db.query(Trip).filter(Trip.share_id == share_id, Trip.visibility == TripVisibility.public).first()
    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="This shared trip could not be found.")
    return trip


@router.get("/{share_id}")
def view_shared_trip(share_id: str, db: Session = Depends(get_db)):
    trip = _get_public_trip_or_404(db, share_id)

    stops = (
        db.query(TripStop)
        .options(joinedload(TripStop.destination))
        .filter(TripStop.trip_id == trip.id)
        .order_by(TripStop.sequence)
        .all()
    )
    itinerary = (
        db.query(ItineraryActivity)
        .options(joinedload(ItineraryActivity.activity))
        .filter(ItineraryActivity.trip_id == trip.id)
        .order_by(ItineraryActivity.date, ItineraryActivity.sequence)
        .all()
    )
    budget_records = db.query(BudgetRecord).filter(BudgetRecord.trip_id == trip.id).all()
    spent = sum(r.amount for r in budget_records)

    return {
        "trip": TripOut.model_validate(trip),
        "owner_name": trip.owner.name if trip.owner else "A GlobeTrotter traveler",
        "stops": [TripStopOut.model_validate(s) for s in stops],
        "itinerary": [ItineraryActivityOut.model_validate(i) for i in itinerary],
        "budget_summary": {
            "total_budget": trip.budget_total,
            "spent": spent,
        },
    }


@router.post("/{share_id}/copy", response_model=TripOut, status_code=status.HTTP_201_CREATED)
def copy_shared_trip(share_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    trip = _get_public_trip_or_404(db, share_id)

    new_trip = Trip(
        user_id=current_user.id,
        name=f"{trip.name} (from {trip.owner.name if trip.owner else 'shared trip'})",
        description=trip.description,
        start_date=trip.start_date,
        end_date=trip.end_date,
        cover_image=trip.cover_image,
        visibility=TripVisibility.private,
        status=TripStatus.draft,
        budget_total=trip.budget_total,
        currency=trip.currency,
    )
    db.add(new_trip)
    db.flush()

    stop_id_map: dict[str, str] = {}
    for stop in db.query(TripStop).filter(TripStop.trip_id == trip.id).order_by(TripStop.sequence).all():
        new_stop = TripStop(
            trip_id=new_trip.id,
            destination_id=stop.destination_id,
            arrival_date=stop.arrival_date,
            departure_date=stop.departure_date,
            sequence=stop.sequence,
            notes=stop.notes,
        )
        db.add(new_stop)
        db.flush()
        stop_id_map[stop.id] = new_stop.id

    for ia in db.query(ItineraryActivity).filter(ItineraryActivity.trip_id == trip.id).all():
        if ia.trip_stop_id not in stop_id_map:
            continue
        db.add(
            ItineraryActivity(
                trip_id=new_trip.id,
                trip_stop_id=stop_id_map[ia.trip_stop_id],
                activity_id=ia.activity_id,
                date=ia.date,
                start_time=ia.start_time,
                end_time=ia.end_time,
                notes=ia.notes,
                custom_cost=ia.custom_cost,
                sequence=ia.sequence,
            )
        )

    db.commit()
    db.refresh(new_trip)
    return TripOut.model_validate(new_trip)
