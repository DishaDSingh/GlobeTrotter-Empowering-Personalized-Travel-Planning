from datetime import date
from typing import Optional

from sqlalchemy import Date, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

from .base import gen_uuid


class ItineraryActivity(Base):
    __tablename__ = "itinerary_activities"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    trip_id: Mapped[str] = mapped_column(String(36), ForeignKey("trips.id", ondelete="CASCADE"), nullable=False, index=True)
    trip_stop_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("trip_stops.id", ondelete="CASCADE"), nullable=False, index=True
    )
    activity_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("activities.id", ondelete="CASCADE"), nullable=False, index=True
    )
    date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    start_time: Mapped[Optional[str]] = mapped_column(String(5), nullable=True)
    end_time: Mapped[Optional[str]] = mapped_column(String(5), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    custom_cost: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    sequence: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    trip = relationship("Trip", back_populates="itinerary_activities")
    trip_stop = relationship("TripStop")
    activity = relationship("Activity")
