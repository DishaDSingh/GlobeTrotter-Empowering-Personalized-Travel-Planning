from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth import get_current_user, hash_password, verify_password
from app.database import get_db
from app.models import Destination, SavedDestination, Trip, TripStop, User, UserPreference
from app.schemas.misc import SavedDestinationOut
from app.schemas.user import (
    ChangePasswordRequest,
    UserOut,
    UserPreferenceOut,
    UserPreferenceUpdate,
    UserUpdate,
)

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return UserOut.model_validate(current_user)


@router.put("/me", response_model=UserOut)
def update_me(payload: UserUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if payload.name is not None:
        current_user.name = payload.name.strip()
    if payload.avatar_url is not None:
        current_user.avatar_url = payload.avatar_url
    if payload.language is not None:
        current_user.language = payload.language
    db.commit()
    db.refresh(current_user)
    return UserOut.model_validate(current_user)


@router.put("/me/password")
def change_password(
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect.")
    current_user.password_hash = hash_password(payload.new_password)
    db.commit()
    return {"message": "Password updated successfully."}


@router.delete("/me")
def delete_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.delete(current_user)
    db.commit()
    return {"message": "Account deleted."}


@router.get("/me/preferences", response_model=UserPreferenceOut)
def get_preferences(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    prefs = db.query(UserPreference).filter(UserPreference.user_id == current_user.id).first()
    if not prefs:
        prefs = UserPreference(user_id=current_user.id)
        db.add(prefs)
        db.commit()
        db.refresh(prefs)
    return UserPreferenceOut.model_validate(prefs)


@router.put("/me/preferences", response_model=UserPreferenceOut)
def update_preferences(
    payload: UserPreferenceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    prefs = db.query(UserPreference).filter(UserPreference.user_id == current_user.id).first()
    if not prefs:
        prefs = UserPreference(user_id=current_user.id)
        db.add(prefs)
        db.flush()

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(prefs, field, value)
    db.commit()
    db.refresh(prefs)
    return UserPreferenceOut.model_validate(prefs)


@router.get("/me/stats")
def get_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    trips = db.query(Trip).filter(Trip.user_id == current_user.id).all()
    trip_ids = [t.id for t in trips]
    countries = set()
    destinations = set()
    if trip_ids:
        stops = (
            db.query(TripStop, Destination)
            .join(Destination, TripStop.destination_id == Destination.id)
            .filter(TripStop.trip_id.in_(trip_ids))
            .all()
        )
        for _, dest in stops:
            countries.add(dest.country)
            destinations.add(dest.id)

    return {
        "trips": len(trips),
        "countries": len(countries),
        "destinations": len(destinations),
    }


@router.get("/me/saved-destinations", response_model=list[SavedDestinationOut])
def list_saved_destinations(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    saved = (
        db.query(SavedDestination)
        .filter(SavedDestination.user_id == current_user.id)
        .order_by(SavedDestination.created_at.desc())
        .all()
    )
    return [SavedDestinationOut.model_validate(s) for s in saved]


@router.post("/me/saved-destinations/{destination_id}", response_model=SavedDestinationOut, status_code=201)
def save_destination(
    destination_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    destination = db.get(Destination, destination_id)
    if not destination:
        raise HTTPException(status_code=404, detail="Destination not found.")

    existing = (
        db.query(SavedDestination)
        .filter(SavedDestination.user_id == current_user.id, SavedDestination.destination_id == destination_id)
        .first()
    )
    if existing:
        return SavedDestinationOut.model_validate(existing)

    saved = SavedDestination(user_id=current_user.id, destination_id=destination_id)
    db.add(saved)
    db.commit()
    db.refresh(saved)
    return SavedDestinationOut.model_validate(saved)


@router.delete("/me/saved-destinations/{destination_id}", status_code=204)
def unsave_destination(
    destination_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    saved = (
        db.query(SavedDestination)
        .filter(SavedDestination.user_id == current_user.id, SavedDestination.destination_id == destination_id)
        .first()
    )
    if saved:
        db.delete(saved)
        db.commit()
    return None
