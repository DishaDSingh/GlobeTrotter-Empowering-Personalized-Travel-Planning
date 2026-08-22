from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Activity, ActivityCategory
from app.schemas.activity import ActivityOut

router = APIRouter(prefix="/activities", tags=["activities"])


@router.get("", response_model=list[ActivityOut])
def list_activities(
    destination_id: Optional[str] = None,
    category: Optional[ActivityCategory] = None,
    max_price: Optional[float] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(30, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(Activity)
    if destination_id:
        query = query.filter(Activity.destination_id == destination_id)
    if category:
        query = query.filter(Activity.category == category)
    if max_price is not None:
        query = query.filter(Activity.price <= max_price)

    results = (
        query.order_by(Activity.rating.desc()).offset((page - 1) * page_size).limit(page_size).all()
    )
    return [ActivityOut.model_validate(a) for a in results]


@router.get("/search", response_model=list[ActivityOut])
def search_activities(
    q: str = Query(min_length=1),
    destination_id: Optional[str] = None,
    category: Optional[ActivityCategory] = None,
    limit: int = Query(30, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(Activity).filter(Activity.name.ilike(f"%{q}%"))
    if destination_id:
        query = query.filter(Activity.destination_id == destination_id)
    if category:
        query = query.filter(Activity.category == category)
    results = query.order_by(Activity.rating.desc()).limit(limit).all()
    return [ActivityOut.model_validate(a) for a in results]


@router.get("/{activity_id}", response_model=ActivityOut)
def get_activity(activity_id: str, db: Session = Depends(get_db)):
    activity = db.get(Activity, activity_id)
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found.")
    return ActivityOut.model_validate(activity)
