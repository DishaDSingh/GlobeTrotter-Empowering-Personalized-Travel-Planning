from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.auth import get_current_user_optional
from app.database import get_db
from app.models import Destination, Trip, UserPreference
from app.schemas.destination import DestinationOut, WeatherOut
from app.schemas.misc import RecommendationOut, SeasonalRecommendationsOut
from app.services.recommendation_service import get_recommendations, get_seasonal_recommendations
from app.services.weather_service import get_current_weather

router = APIRouter(prefix="/destinations", tags=["destinations"])


@router.get("", response_model=list[DestinationOut])
def list_destinations(
    country: Optional[str] = None,
    max_daily_cost: Optional[float] = None,
    min_popularity: Optional[float] = None,
    sort: str = Query("popularity", pattern="^(popularity|cost|name)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(Destination)
    if country:
        query = query.filter(Destination.country.ilike(f"%{country}%"))
    if max_daily_cost is not None:
        query = query.filter(Destination.estimated_daily_cost <= max_daily_cost)
    if min_popularity is not None:
        query = query.filter(Destination.popularity_score >= min_popularity)

    if sort == "popularity":
        query = query.order_by(Destination.popularity_score.desc())
    elif sort == "cost":
        query = query.order_by(Destination.estimated_daily_cost.asc())
    else:
        query = query.order_by(Destination.city.asc())

    results = query.offset((page - 1) * page_size).limit(page_size).all()
    return [DestinationOut.model_validate(d) for d in results]


@router.get("/search", response_model=list[DestinationOut])
def search_destinations(q: str = Query(min_length=1), limit: int = Query(20, ge=1, le=50), db: Session = Depends(get_db)):
    results = (
        db.query(Destination)
        .filter(or_(Destination.city.ilike(f"%{q}%"), Destination.country.ilike(f"%{q}%")))
        .order_by(Destination.popularity_score.desc())
        .limit(limit)
        .all()
    )
    return [DestinationOut.model_validate(d) for d in results]


@router.get("/recommended", response_model=list[RecommendationOut])
def recommended_destinations(
    limit: int = Query(8, ge=1, le=20),
    current_user=Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    destinations = db.query(Destination).all()
    preferences = None
    past_trips: list[Trip] = []
    if current_user:
        preferences = db.query(UserPreference).filter(UserPreference.user_id == current_user.id).first()
        past_trips = db.query(Trip).filter(Trip.user_id == current_user.id).all()

    scored = get_recommendations(destinations, preferences, past_trips, limit=limit)
    return [
        RecommendationOut(destination=DestinationOut.model_validate(dest), score=score, reasons=reasons)
        for dest, score, reasons in scored
    ]


@router.get("/seasonal", response_model=SeasonalRecommendationsOut)
def seasonal_destinations(limit: int = Query(8, ge=1, le=20), db: Session = Depends(get_db)):
    destinations = db.query(Destination).all()
    season, scored = get_seasonal_recommendations(destinations, limit=limit)
    return SeasonalRecommendationsOut(
        season=season,
        month=date.today().strftime("%B"),
        destinations=[
            RecommendationOut(destination=DestinationOut.model_validate(dest), score=score, reasons=reasons)
            for dest, score, reasons in scored
        ],
    )


@router.get("/{destination_id}", response_model=DestinationOut)
def get_destination(destination_id: str, db: Session = Depends(get_db)):
    destination = db.get(Destination, destination_id)
    if not destination:
        raise HTTPException(status_code=404, detail="Destination not found.")
    return DestinationOut.model_validate(destination)


@router.get("/{destination_id}/weather", response_model=WeatherOut)
async def destination_weather(destination_id: str, db: Session = Depends(get_db)):
    destination = db.get(Destination, destination_id)
    if not destination:
        raise HTTPException(status_code=404, detail="Destination not found.")
    return await get_current_weather(destination.latitude, destination.longitude)
