from datetime import date

from app.services.recommendation_service import _season_match, current_season_label, get_seasonal_recommendations
from .conftest import create_destination


def test_seasonal_endpoint_returns_scored_destinations(client):
    create_destination(city="Paris", country="France", country_code="FR", latitude=48.8566, longitude=2.3522)
    create_destination(city="Goa", country="India", country_code="IN", latitude=15.2993, longitude=74.1240)

    resp = client.get("/destinations/seasonal")
    assert resp.status_code == 200
    body = resp.json()
    assert body["season"] in {"Winter", "Spring", "Summer", "Autumn"}
    assert len(body["destinations"]) == 2
    for entry in body["destinations"]:
        assert entry["reasons"]
        assert 0 <= entry["score"] <= 100


def test_season_match_higher_in_curated_best_month():
    from app.models import Destination

    goa = Destination(city="Goa", country="India", country_code="IN", latitude=15.3, longitude=74.1,
                       estimated_daily_cost=45, currency="INR")
    december_score = _season_match(goa, date(2026, 12, 15))
    june_score = _season_match(goa, date(2026, 6, 15))
    assert december_score > june_score


def test_current_season_label_flips_by_hemisphere():
    assert current_season_label(latitude=48.0, when=date(2026, 1, 15)) == "Winter"
    assert current_season_label(latitude=-33.0, when=date(2026, 1, 15)) == "Summer"


def test_get_seasonal_recommendations_sorted_descending():
    from app.models import Destination

    dests = [
        Destination(city="Goa", country="India", country_code="IN", latitude=15.3, longitude=74.1, estimated_daily_cost=45, currency="INR", popularity_score=88),
        Destination(city="London", country="United Kingdom", country_code="GB", latitude=51.5, longitude=-0.1, estimated_daily_cost=150, currency="GBP", popularity_score=94),
    ]
    _, scored = get_seasonal_recommendations(dests, when=date(2026, 12, 15))
    scores = [s for _, s, _ in scored]
    assert scores == sorted(scores, reverse=True)
