from typing import Optional

from sqlalchemy import Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

from .base import gen_uuid, utcnow
from sqlalchemy import DateTime


class Destination(Base):
    __tablename__ = "destinations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    city: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    country: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    country_code: Mapped[str] = mapped_column(String(5), nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    population: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    popularity_score: Mapped[float] = mapped_column(Float, default=50.0, nullable=False)
    estimated_daily_cost: Mapped[float] = mapped_column(Float, default=100.0, nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="USD", nullable=False)
    created_at: Mapped[str] = mapped_column(DateTime(timezone=False), default=utcnow, nullable=False)

    activities = relationship("Activity", back_populates="destination", cascade="all, delete-orphan")
