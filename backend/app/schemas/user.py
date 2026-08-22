from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserBase(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr


class UserCreate(UserBase):
    password: str = Field(min_length=6, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=6, max_length=128)


class UserOut(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    avatar_url: Optional[str] = None
    language: str
    role: str
    created_at: datetime


class UserUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=120)
    avatar_url: Optional[str] = None
    language: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class UserPreferenceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    travel_style: Optional[str] = None
    interests: list[str] = []
    preferred_currency: str
    default_visibility: str
    notifications_email: bool
    notifications_push: bool


class UserPreferenceUpdate(BaseModel):
    travel_style: Optional[str] = None
    interests: Optional[list[str]] = None
    preferred_currency: Optional[str] = None
    default_visibility: Optional[str] = None
    notifications_email: Optional[bool] = None
    notifications_push: Optional[bool] = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=6, max_length=128)
