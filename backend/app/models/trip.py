from datetime import date
from typing import Optional

from sqlalchemy import Date, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

from .base import TimestampMixin, gen_uuid
from .enums import TripStatus, TripVisibility


class Trip(Base, TimestampMixin):
    __tablename__ = "trips"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    cover_image: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    visibility: Mapped[TripVisibility] = mapped_column(
        Enum(TripVisibility, native_enum=False, length=20), default=TripVisibility.private, nullable=False
    )
    status: Mapped[TripStatus] = mapped_column(
        Enum(TripStatus, native_enum=False, length=20), default=TripStatus.draft, nullable=False
    )
    share_id: Mapped[Optional[str]] = mapped_column(String(36), unique=True, nullable=True, index=True)
    budget_total: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="USD", nullable=False)

    owner = relationship("User", back_populates="trips")
    stops = relationship(
        "TripStop", back_populates="trip", cascade="all, delete-orphan", order_by="TripStop.sequence"
    )
    itinerary_activities = relationship(
        "ItineraryActivity", back_populates="trip", cascade="all, delete-orphan"
    )
    budget_records = relationship("BudgetRecord", back_populates="trip", cascade="all, delete-orphan")
    collaborators = relationship("TripCollaborator", back_populates="trip", cascade="all, delete-orphan")


class TripStop(Base):
    __tablename__ = "trip_stops"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    trip_id: Mapped[str] = mapped_column(String(36), ForeignKey("trips.id", ondelete="CASCADE"), nullable=False, index=True)
    destination_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("destinations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    arrival_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    departure_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    sequence: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    planned_budget: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    trip = relationship("Trip", back_populates="stops")
    destination = relationship("Destination")
