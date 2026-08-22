from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import joinedload, Session

from app.auth import get_current_user
from app.database import get_db
from app.models import (
    Activity,
    BudgetRecord,
    Destination,
    ItineraryActivity,
    Trip,
    TripStop,
    User,
)
from app.schemas.ai import (
    AIBudgetOptimizeRequest,
    AIBudgetOptimizeResponse,
    AIItineraryRequest,
    AIItineraryResponse,
)
from app.services import ai_service

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/generate-itinerary", response_model=AIItineraryResponse)
async def generate_itinerary(payload: AIItineraryRequest, db: Session = Depends(get_db)):
    return await ai_service.generate_itinerary(payload, db)


@router.post("/generate-itinerary/{trip_id}/accept", status_code=status.HTTP_201_CREATED)
def accept_generated_itinerary(
    trip_id: str,
    itinerary: AIItineraryResponse,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Persist a previously-generated (and user-reviewed) AI itinerary.

    The AI never writes to the database directly - the frontend shows a
    preview first, and only calling this endpoint after user confirmation
    turns it into real trip stops / itinerary activities / budget records.
    """
    trip = db.get(Trip, trip_id)
    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found.")
    if trip.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You don't have permission to edit this trip.")

    destination_row = (
        db.query(Destination).filter(Destination.city.ilike(itinerary.destination)).first()
    )
    if not destination_row:
        destination_row = Destination(
            city=itinerary.destination,
            country="Unknown",
            country_code="XX",
            latitude=0.0,
            longitude=0.0,
            description=f"AI-suggested destination: {itinerary.destination}",
            estimated_daily_cost=itinerary.total_estimated_cost / max(itinerary.duration_days, 1),
            currency=itinerary.currency,
        )
        db.add(destination_row)
        db.flush()

    stop = TripStop(
        trip_id=trip.id,
        destination_id=destination_row.id,
        sequence=db.query(TripStop).filter(TripStop.trip_id == trip.id).count(),
    )
    db.add(stop)
    db.flush()

    created_activities = 0
    for day in itinerary.days:
        for idx, act in enumerate(day.activities):
            activity_row = Activity(
                destination_id=destination_row.id,
                name=act.name,
                description=act.notes,
                category=_safe_category(act.category),
                latitude=destination_row.latitude,
                longitude=destination_row.longitude,
                price=act.estimated_cost,
                currency=itinerary.currency,
                duration_minutes=act.duration_minutes,
            )
            db.add(activity_row)
            db.flush()

            db.add(
                ItineraryActivity(
                    trip_id=trip.id,
                    trip_stop_id=stop.id,
                    activity_id=activity_row.id,
                    start_time=act.time,
                    notes=act.notes,
                    custom_cost=act.estimated_cost,
                    sequence=idx,
                )
            )
            created_activities += 1

    db.commit()
    return {"message": "AI itinerary added to trip.", "trip_stop_id": stop.id, "activities_created": created_activities}


def _safe_category(value: str):
    from app.models.enums import ActivityCategory

    try:
        return ActivityCategory(value)
    except ValueError:
        return ActivityCategory.attraction


@router.post("/optimize-budget", response_model=AIBudgetOptimizeResponse)
def optimize_budget(
    payload: AIBudgetOptimizeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trip = db.get(Trip, payload.trip_id)
    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found.")
    if trip.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You don't have permission to view this trip's budget.")

    budget_records = db.query(BudgetRecord).filter(BudgetRecord.trip_id == trip.id).all()
    itinerary_activities = (
        db.query(ItineraryActivity)
        .options(joinedload(ItineraryActivity.activity))
        .filter(ItineraryActivity.trip_id == trip.id)
        .all()
    )
    return ai_service.optimize_budget(trip, budget_records, itinerary_activities)
