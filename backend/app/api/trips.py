import uuid
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from app.auth import get_current_user
from app.database import get_db
from app.models import (
    Activity,
    BudgetRecord,
    CollaboratorRole,
    Destination,
    ItineraryActivity,
    Trip,
    TripCollaborator,
    TripStatus,
    TripStop,
    TripVisibility,
    User,
)
from app.schemas.budget import BudgetRecordCreate, BudgetRecordOut, BudgetRecordUpdate, BudgetSummary
from app.schemas.itinerary import (
    CalendarDay,
    ItineraryActivityCreate,
    ItineraryActivityOut,
    ItineraryActivityUpdate,
    ItineraryReorderRequest,
)
from app.schemas.trip import (
    StopsReorderRequest,
    TripCreate,
    TripDetailOut,
    TripListItem,
    TripOut,
    TripStopCreate,
    TripStopOut,
    TripStopUpdate,
    TripUpdate,
)
from app.services import budget_service

router = APIRouter(prefix="/trips", tags=["trips"])


def _get_trip_or_404(db: Session, trip_id: str) -> Trip:
    trip = db.get(Trip, trip_id)
    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found.")
    return trip


def _collaborator_role(db: Session, trip_id: str, user_id: str) -> Optional[CollaboratorRole]:
    collab = (
        db.query(TripCollaborator)
        .filter(TripCollaborator.trip_id == trip_id, TripCollaborator.user_id == user_id)
        .first()
    )
    return collab.role if collab else None


def _ensure_can_view(db: Session, trip: Trip, user: User) -> None:
    if trip.user_id == user.id:
        return
    if trip.visibility == TripVisibility.public:
        return
    if _collaborator_role(db, trip.id, user.id) is not None:
        return
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You don't have access to this trip.")


def _ensure_can_edit(db: Session, trip: Trip, user: User) -> None:
    if trip.user_id == user.id:
        return
    if _collaborator_role(db, trip.id, user.id) == CollaboratorRole.editor:
        return
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You don't have permission to edit this trip.")


def _trip_metrics(db: Session, trip: Trip) -> dict:
    destination_count = db.query(TripStop).filter(TripStop.trip_id == trip.id).count()
    spent = sum(r.amount for r in db.query(BudgetRecord).filter(BudgetRecord.trip_id == trip.id).all())
    return {"destination_count": destination_count, "spent": spent, "remaining": (trip.budget_total or 0) - spent}


# ---------------------------------------------------------------------------
# Trip CRUD
# ---------------------------------------------------------------------------


@router.get("", response_model=list[TripListItem])
def list_trips(
    filter: str = Query("all", pattern="^(all|upcoming|past|draft|public|private)$"),
    search: Optional[str] = None,
    sort: str = Query("recent", pattern="^(recent|name|start_date)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Trip).filter(Trip.user_id == current_user.id)

    today = date.today()
    if filter == "upcoming":
        query = query.filter(Trip.end_date >= today)
    elif filter == "past":
        query = query.filter(Trip.end_date < today)
    elif filter == "draft":
        query = query.filter(Trip.status == TripStatus.draft)
    elif filter == "public":
        query = query.filter(Trip.visibility == TripVisibility.public)
    elif filter == "private":
        query = query.filter(Trip.visibility == TripVisibility.private)

    if search:
        query = query.filter(Trip.name.ilike(f"%{search}%"))

    if sort == "name":
        query = query.order_by(Trip.name.asc())
    elif sort == "start_date":
        query = query.order_by(Trip.start_date.asc())
    else:
        query = query.order_by(Trip.updated_at.desc())

    trips = query.all()
    items = []
    for trip in trips:
        metrics = _trip_metrics(db, trip)
        items.append(
            TripListItem(**TripOut.model_validate(trip).model_dump(), destination_count=metrics["destination_count"], spent=metrics["spent"])
        )
    return items


@router.post("", response_model=TripOut, status_code=status.HTTP_201_CREATED)
def create_trip(payload: TripCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    trip = Trip(user_id=current_user.id, **payload.model_dump())
    db.add(trip)
    db.commit()
    db.refresh(trip)
    return TripOut.model_validate(trip)


@router.get("/{trip_id}", response_model=TripDetailOut)
def get_trip(trip_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    trip = _get_trip_or_404(db, trip_id)
    _ensure_can_view(db, trip, current_user)
    stops = (
        db.query(TripStop)
        .options(joinedload(TripStop.destination))
        .filter(TripStop.trip_id == trip.id)
        .order_by(TripStop.sequence)
        .all()
    )
    metrics = _trip_metrics(db, trip)
    return TripDetailOut(
        **TripOut.model_validate(trip).model_dump(),
        stops=[TripStopOut.model_validate(s) for s in stops],
        destination_count=metrics["destination_count"],
        spent=metrics["spent"],
        remaining=metrics["remaining"],
    )


@router.put("/{trip_id}", response_model=TripOut)
def update_trip(
    trip_id: str, payload: TripUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    trip = _get_trip_or_404(db, trip_id)
    _ensure_can_edit(db, trip, current_user)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(trip, field, value)
    db.commit()
    db.refresh(trip)
    return TripOut.model_validate(trip)


@router.delete("/{trip_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_trip(trip_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    trip = _get_trip_or_404(db, trip_id)
    if trip.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the trip owner can delete this trip.")
    db.delete(trip)
    db.commit()
    return None


@router.post("/{trip_id}/duplicate", response_model=TripOut, status_code=status.HTTP_201_CREATED)
def duplicate_trip(trip_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    trip = _get_trip_or_404(db, trip_id)
    _ensure_can_view(db, trip, current_user)

    new_trip = Trip(
        user_id=current_user.id,
        name=f"{trip.name} (Copy)",
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


# ---------------------------------------------------------------------------
# Trip stops
# ---------------------------------------------------------------------------


@router.get("/{trip_id}/stops", response_model=list[TripStopOut])
def list_stops(trip_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    trip = _get_trip_or_404(db, trip_id)
    _ensure_can_view(db, trip, current_user)
    stops = (
        db.query(TripStop)
        .options(joinedload(TripStop.destination))
        .filter(TripStop.trip_id == trip_id)
        .order_by(TripStop.sequence)
        .all()
    )
    return [TripStopOut.model_validate(s) for s in stops]


@router.post("/{trip_id}/stops", response_model=TripStopOut, status_code=status.HTTP_201_CREATED)
def add_stop(
    trip_id: str, payload: TripStopCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    trip = _get_trip_or_404(db, trip_id)
    _ensure_can_edit(db, trip, current_user)

    destination = db.get(Destination, payload.destination_id)
    if not destination:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Destination not found.")

    max_seq = db.query(TripStop).filter(TripStop.trip_id == trip_id).count()
    stop = TripStop(trip_id=trip_id, sequence=max_seq, **payload.model_dump())
    db.add(stop)
    db.commit()
    db.refresh(stop)
    return TripStopOut.model_validate(stop)


@router.put("/{trip_id}/stops/reorder", response_model=list[TripStopOut])
def reorder_stops(
    trip_id: str,
    payload: StopsReorderRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trip = _get_trip_or_404(db, trip_id)
    _ensure_can_edit(db, trip, current_user)

    stops_by_id = {s.id: s for s in db.query(TripStop).filter(TripStop.trip_id == trip_id).all()}
    for item in payload.stops:
        if item.id in stops_by_id:
            stops_by_id[item.id].sequence = item.sequence
    db.commit()

    stops = (
        db.query(TripStop)
        .options(joinedload(TripStop.destination))
        .filter(TripStop.trip_id == trip_id)
        .order_by(TripStop.sequence)
        .all()
    )
    return [TripStopOut.model_validate(s) for s in stops]


@router.put("/{trip_id}/stops/{stop_id}", response_model=TripStopOut)
def update_stop(
    trip_id: str,
    stop_id: str,
    payload: TripStopUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trip = _get_trip_or_404(db, trip_id)
    _ensure_can_edit(db, trip, current_user)
    stop = db.query(TripStop).filter(TripStop.id == stop_id, TripStop.trip_id == trip_id).first()
    if not stop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Stop not found.")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(stop, field, value)
    db.commit()
    db.refresh(stop)
    return TripStopOut.model_validate(stop)


@router.delete("/{trip_id}/stops/{stop_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_stop(
    trip_id: str, stop_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    trip = _get_trip_or_404(db, trip_id)
    _ensure_can_edit(db, trip, current_user)
    stop = db.query(TripStop).filter(TripStop.id == stop_id, TripStop.trip_id == trip_id).first()
    if stop:
        db.delete(stop)
        db.commit()
    return None


# ---------------------------------------------------------------------------
# Itinerary activities
# ---------------------------------------------------------------------------


@router.get("/{trip_id}/activities", response_model=list[ItineraryActivityOut])
def list_itinerary_activities(
    trip_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    trip = _get_trip_or_404(db, trip_id)
    _ensure_can_view(db, trip, current_user)
    items = (
        db.query(ItineraryActivity)
        .options(joinedload(ItineraryActivity.activity))
        .filter(ItineraryActivity.trip_id == trip_id)
        .order_by(ItineraryActivity.date, ItineraryActivity.sequence)
        .all()
    )
    return [ItineraryActivityOut.model_validate(i) for i in items]


@router.post("/{trip_id}/activities", response_model=ItineraryActivityOut, status_code=status.HTTP_201_CREATED)
def add_itinerary_activity(
    trip_id: str,
    payload: ItineraryActivityCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trip = _get_trip_or_404(db, trip_id)
    _ensure_can_edit(db, trip, current_user)

    stop = db.query(TripStop).filter(TripStop.id == payload.trip_stop_id, TripStop.trip_id == trip_id).first()
    if not stop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip stop not found.")
    activity = db.get(Activity, payload.activity_id)
    if not activity:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activity not found.")

    max_seq = (
        db.query(ItineraryActivity)
        .filter(ItineraryActivity.trip_id == trip_id, ItineraryActivity.trip_stop_id == payload.trip_stop_id)
        .count()
    )
    item = ItineraryActivity(trip_id=trip_id, sequence=max_seq, **payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return ItineraryActivityOut.model_validate(item)


@router.put("/{trip_id}/activities/reorder", response_model=list[ItineraryActivityOut])
def reorder_itinerary_activities(
    trip_id: str,
    payload: ItineraryReorderRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trip = _get_trip_or_404(db, trip_id)
    _ensure_can_edit(db, trip, current_user)

    items_by_id = {i.id: i for i in db.query(ItineraryActivity).filter(ItineraryActivity.trip_id == trip_id).all()}
    for entry in payload.items:
        item = items_by_id.get(entry.id)
        if not item:
            continue
        item.sequence = entry.sequence
        if entry.date is not None:
            item.date = entry.date
        if entry.trip_stop_id is not None:
            item.trip_stop_id = entry.trip_stop_id
        if entry.start_time is not None:
            item.start_time = entry.start_time
    db.commit()

    items = (
        db.query(ItineraryActivity)
        .options(joinedload(ItineraryActivity.activity))
        .filter(ItineraryActivity.trip_id == trip_id)
        .order_by(ItineraryActivity.date, ItineraryActivity.sequence)
        .all()
    )
    return [ItineraryActivityOut.model_validate(i) for i in items]


@router.put("/{trip_id}/activities/{activity_id}", response_model=ItineraryActivityOut)
def update_itinerary_activity(
    trip_id: str,
    activity_id: str,
    payload: ItineraryActivityUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trip = _get_trip_or_404(db, trip_id)
    _ensure_can_edit(db, trip, current_user)
    item = (
        db.query(ItineraryActivity)
        .filter(ItineraryActivity.id == activity_id, ItineraryActivity.trip_id == trip_id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Itinerary activity not found.")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)
    return ItineraryActivityOut.model_validate(item)


@router.post("/{trip_id}/activities/{activity_id}/duplicate", response_model=ItineraryActivityOut, status_code=201)
def duplicate_itinerary_activity(
    trip_id: str, activity_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    trip = _get_trip_or_404(db, trip_id)
    _ensure_can_edit(db, trip, current_user)
    item = (
        db.query(ItineraryActivity)
        .filter(ItineraryActivity.id == activity_id, ItineraryActivity.trip_id == trip_id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Itinerary activity not found.")

    max_seq = (
        db.query(ItineraryActivity)
        .filter(ItineraryActivity.trip_id == trip_id, ItineraryActivity.trip_stop_id == item.trip_stop_id)
        .count()
    )
    clone = ItineraryActivity(
        trip_id=trip_id,
        trip_stop_id=item.trip_stop_id,
        activity_id=item.activity_id,
        date=item.date,
        start_time=item.start_time,
        end_time=item.end_time,
        notes=item.notes,
        custom_cost=item.custom_cost,
        sequence=max_seq,
    )
    db.add(clone)
    db.commit()
    db.refresh(clone)
    return ItineraryActivityOut.model_validate(clone)


@router.delete("/{trip_id}/activities/{activity_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_itinerary_activity(
    trip_id: str, activity_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    trip = _get_trip_or_404(db, trip_id)
    _ensure_can_edit(db, trip, current_user)
    item = (
        db.query(ItineraryActivity)
        .filter(ItineraryActivity.id == activity_id, ItineraryActivity.trip_id == trip_id)
        .first()
    )
    if item:
        db.delete(item)
        db.commit()
    return None


# ---------------------------------------------------------------------------
# Calendar
# ---------------------------------------------------------------------------


@router.get("/{trip_id}/calendar", response_model=list[CalendarDay])
def get_calendar(trip_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    trip = _get_trip_or_404(db, trip_id)
    _ensure_can_view(db, trip, current_user)

    items = (
        db.query(ItineraryActivity)
        .options(joinedload(ItineraryActivity.activity))
        .filter(ItineraryActivity.trip_id == trip_id, ItineraryActivity.date.isnot(None))
        .order_by(ItineraryActivity.date, ItineraryActivity.start_time)
        .all()
    )

    days: dict[date, list[ItineraryActivity]] = {}
    for item in items:
        days.setdefault(item.date, []).append(item)

    result = []
    for day, day_items in sorted(days.items()):
        total = sum((i.custom_cost if i.custom_cost is not None else (i.activity.price if i.activity else 0)) for i in day_items)
        result.append(
            CalendarDay(
                date=day,
                items=[ItineraryActivityOut.model_validate(i) for i in day_items],
                total_cost=total,
            )
        )
    return result


# ---------------------------------------------------------------------------
# Budget
# ---------------------------------------------------------------------------


@router.get("/{trip_id}/budget", response_model=BudgetSummary)
def get_budget(trip_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    trip = _get_trip_or_404(db, trip_id)
    _ensure_can_view(db, trip, current_user)
    records = db.query(BudgetRecord).filter(BudgetRecord.trip_id == trip_id).order_by(BudgetRecord.date.desc()).all()
    return budget_service.compute_summary(trip, records)


@router.post("/{trip_id}/budget", response_model=BudgetRecordOut, status_code=status.HTTP_201_CREATED)
def add_budget_record(
    trip_id: str,
    payload: BudgetRecordCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trip = _get_trip_or_404(db, trip_id)
    _ensure_can_edit(db, trip, current_user)
    record = BudgetRecord(trip_id=trip_id, **payload.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return BudgetRecordOut.model_validate(record)


@router.put("/{trip_id}/budget/{record_id}", response_model=BudgetRecordOut)
def update_budget_record(
    trip_id: str,
    record_id: str,
    payload: BudgetRecordUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trip = _get_trip_or_404(db, trip_id)
    _ensure_can_edit(db, trip, current_user)
    record = db.query(BudgetRecord).filter(BudgetRecord.id == record_id, BudgetRecord.trip_id == trip_id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget record not found.")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(record, field, value)
    db.commit()
    db.refresh(record)
    return BudgetRecordOut.model_validate(record)


@router.delete("/{trip_id}/budget/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_budget_record(
    trip_id: str, record_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    trip = _get_trip_or_404(db, trip_id)
    _ensure_can_edit(db, trip, current_user)
    record = db.query(BudgetRecord).filter(BudgetRecord.id == record_id, BudgetRecord.trip_id == trip_id).first()
    if record:
        db.delete(record)
        db.commit()
    return None


# ---------------------------------------------------------------------------
# Sharing
# ---------------------------------------------------------------------------


@router.post("/{trip_id}/share", response_model=TripOut)
def share_trip(trip_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    trip = _get_trip_or_404(db, trip_id)
    if trip.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the trip owner can share this trip.")
    if not trip.share_id:
        trip.share_id = str(uuid.uuid4())
    trip.visibility = TripVisibility.public
    db.commit()
    db.refresh(trip)
    return TripOut.model_validate(trip)


@router.delete("/{trip_id}/share", response_model=TripOut)
def unshare_trip(trip_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    trip = _get_trip_or_404(db, trip_id)
    if trip.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the trip owner can modify sharing.")
    trip.visibility = TripVisibility.private
    db.commit()
    db.refresh(trip)
    return TripOut.model_validate(trip)
