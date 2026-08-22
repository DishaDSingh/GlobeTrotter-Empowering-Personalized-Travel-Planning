import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.utils.rate_limit import auth_rate_limiter

TEST_ENGINE = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=TEST_ENGINE)


@pytest.fixture(autouse=True)
def _fresh_database():
    Base.metadata.create_all(bind=TEST_ENGINE)
    auth_rate_limiter.hits.clear()
    yield
    Base.metadata.drop_all(bind=TEST_ENGINE)


def _override_get_db():
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = _override_get_db


@pytest.fixture
def client():
    return TestClient(app)


def register_user(client, email="alice@example.com", password="password123", name="Alice"):
    resp = client.post("/auth/register", json={"name": name, "email": email, "password": password})
    assert resp.status_code == 201, resp.text
    return resp.json()


def auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def create_destination(city="Paris", country="France", country_code="FR", **overrides):
    from app.models import Destination

    db = TestSessionLocal()
    try:
        dest = Destination(
            city=city,
            country=country,
            country_code=country_code,
            latitude=overrides.get("latitude", 48.8566),
            longitude=overrides.get("longitude", 2.3522),
            estimated_daily_cost=overrides.get("estimated_daily_cost", 100.0),
            popularity_score=overrides.get("popularity_score", 80.0),
            currency=overrides.get("currency", "EUR"),
        )
        db.add(dest)
        db.commit()
        db.refresh(dest)
        return dest.id
    finally:
        db.close()


def create_activity(destination_id, name="Eiffel Tower", category="Attraction", price=25.0):
    from app.models import Activity, ActivityCategory

    db = TestSessionLocal()
    try:
        activity = Activity(
            destination_id=destination_id,
            name=name,
            category=ActivityCategory(category),
            latitude=48.8584,
            longitude=2.2945,
            price=price,
            duration_minutes=120,
        )
        db.add(activity)
        db.commit()
        db.refresh(activity)
        return activity.id
    finally:
        db.close()
