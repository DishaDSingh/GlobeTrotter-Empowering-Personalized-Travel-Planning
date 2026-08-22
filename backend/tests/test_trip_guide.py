from .conftest import create_activity, create_destination


def test_single_city_trip_guide_for_short_stay(client):
    dest_id = create_destination(city="Paris", country="France", country_code="FR", currency="EUR")
    create_activity(dest_id, name="Eiffel Tower", category="Attraction", price=25)

    resp = client.get(f"/destinations/{dest_id}/trip-guide", params={"total_days": 3})
    assert resp.status_code == 200
    data = resp.json()
    assert data["primary_destination"] == "Paris"
    assert data["total_days"] == 3
    assert len(data["legs"]) == 1
    assert data["legs"][0]["days"] == 3
    assert data["grand_total"] > 0


def test_multi_city_trip_guide_splits_days_across_same_country(client):
    rome = create_destination(city="Rome", country="Italy", country_code="IT", currency="EUR",
                               estimated_daily_cost=130, popularity_score=97)
    create_destination(city="Florence", country="Italy", country_code="IT", currency="EUR",
                        estimated_daily_cost=130, popularity_score=89)
    create_destination(city="Venice", country="Italy", country_code="IT", currency="EUR",
                        estimated_daily_cost=160, popularity_score=92)
    # A destination in a different country should never be pulled into the route.
    create_destination(city="Tokyo", country="Japan", country_code="JP", currency="JPY",
                        estimated_daily_cost=13000, popularity_score=95)

    resp = client.get(f"/destinations/{rome}/trip-guide", params={"total_days": 30})
    assert resp.status_code == 200
    data = resp.json()

    assert data["primary_destination"] == "Rome"
    cities_in_route = {leg["destination"]["city"] for leg in data["legs"]}
    assert cities_in_route == {"Rome", "Florence", "Venice"}
    assert "Tokyo" not in cities_in_route

    assert sum(leg["days"] for leg in data["legs"]) == 30
    assert len(data["hops"]) == len(data["legs"]) - 1
    for hop in data["hops"]:
        assert hop["estimated_cost"] > 0

    expected_total = round(
        data["accommodation_total"] + data["food_total"] + data["local_transport_total"]
        + data["activities_total"] + data["inter_city_transport_total"],
        2,
    )
    assert data["grand_total"] == expected_total


def test_trip_guide_uses_real_activity_prices_when_available(client):
    dest_id = create_destination(city="Goa", country="India", country_code="IN", currency="INR",
                                  estimated_daily_cost=3000)
    create_activity(dest_id, name="Baga Beach Water Sports", category="Adventure", price=2000)
    create_activity(dest_id, name="Sunset Cruise", category="Nature", price=600)

    resp = client.get(f"/destinations/{dest_id}/trip-guide", params={"total_days": 4})
    assert resp.status_code == 200
    leg = resp.json()["legs"][0]
    assert leg["top_activities"]
    assert leg["activities_cost"] == sum(a["price"] for a in leg["top_activities"])


def test_trip_guide_requires_valid_destination(client):
    resp = client.get("/destinations/does-not-exist/trip-guide", params={"total_days": 5})
    assert resp.status_code == 404


def test_trip_guide_rejects_invalid_duration(client):
    dest_id = create_destination()
    resp = client.get(f"/destinations/{dest_id}/trip-guide", params={"total_days": 0})
    assert resp.status_code == 422
