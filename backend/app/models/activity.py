from typing import Optional

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

from .base import gen_uuid, utcnow
from .enums import ActivityCategory


class Activity(Base):
    __tablename__ = "activities"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    destination_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("destinations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    category: Mapped[ActivityCategory] = mapped_column(
        Enum(ActivityCategory, native_enum=False, length=30), nullable=False, index=True
    )
    image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    price: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="USD", nullable=False)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=60, nullable=False)
    rating: Mapped[float] = mapped_column(Float, default=4.0, nullable=False)
    opening_time: Mapped[Optional[str]] = mapped_column(String(5), nullable=True)
    closing_time: Mapped[Optional[str]] = mapped_column(String(5), nullable=True)
    created_at: Mapped[str] = mapped_column(DateTime(timezone=False), default=utcnow, nullable=False)

    destination = relationship("Destination", back_populates="activities")
