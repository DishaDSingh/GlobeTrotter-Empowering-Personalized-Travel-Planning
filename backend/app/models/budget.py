from datetime import date
from typing import Optional

from sqlalchemy import Date, DateTime, Enum, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

from .base import gen_uuid, utcnow
from .enums import BudgetCategory


class BudgetRecord(Base):
    __tablename__ = "budget_records"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    trip_id: Mapped[str] = mapped_column(String(36), ForeignKey("trips.id", ondelete="CASCADE"), nullable=False, index=True)
    category: Mapped[BudgetCategory] = mapped_column(
        Enum(BudgetCategory, native_enum=False, length=30), nullable=False, index=True
    )
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="USD", nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    created_at: Mapped[str] = mapped_column(DateTime(timezone=False), default=utcnow, nullable=False)

    trip = relationship("Trip", back_populates="budget_records")
