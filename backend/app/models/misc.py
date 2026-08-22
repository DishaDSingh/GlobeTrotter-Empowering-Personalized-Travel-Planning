from typing import Optional

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

from .base import gen_uuid, utcnow
from .enums import CollaboratorRole


class SavedDestination(Base):
    __tablename__ = "saved_destinations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    destination_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("destinations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    created_at: Mapped[str] = mapped_column(DateTime(timezone=False), default=utcnow, nullable=False)

    user = relationship("User", back_populates="saved_destinations")
    destination = relationship("Destination")


class TripCollaborator(Base):
    __tablename__ = "trip_collaborators"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    trip_id: Mapped[str] = mapped_column(String(36), ForeignKey("trips.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role: Mapped[CollaboratorRole] = mapped_column(
        Enum(CollaboratorRole, native_enum=False, length=20), default=CollaboratorRole.viewer, nullable=False
    )
    created_at: Mapped[str] = mapped_column(DateTime(timezone=False), default=utcnow, nullable=False)

    trip = relationship("Trip", back_populates="collaborators")
    user = relationship("User")


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[str] = mapped_column(String(50), default="info", nullable=False)
    read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[str] = mapped_column(DateTime(timezone=False), default=utcnow, nullable=False)

    user = relationship("User", back_populates="notifications")


class UserPreference(Base):
    __tablename__ = "user_preferences"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True
    )
    travel_style: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    interests: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    preferred_currency: Mapped[str] = mapped_column(String(10), default="USD", nullable=False)
    default_visibility: Mapped[str] = mapped_column(String(20), default="private", nullable=False)
    notifications_email: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    notifications_push: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[str] = mapped_column(DateTime(timezone=False), default=utcnow, nullable=False)
    updated_at: Mapped[str] = mapped_column(DateTime(timezone=False), default=utcnow, onupdate=utcnow, nullable=False)

    user = relationship("User", back_populates="preferences")
