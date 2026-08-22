from .conftest import auth_headers, create_activity, create_destination, register_user


def test_generate_itinerary_returns_valid_structured_json(client):
    resp = client.post(
        "/ai/generate-itinerary",
        json={
            "destination": "Paris",
            "duration_days": 3,
            "budget": 900,
            "travelers": 2,
            "style": "Culture",
            "interests": ["Museum", "Food"],
            "currency": "EUR",
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["duration_days"] == 3
    assert len(data["days"]) == 3
    assert data["source"] == "rule_based"
    for day in data["days"]:
        assert day["activities"]
        for activity in day["activities"]:
            assert "time" in activity and "estimated_cost" in activity


def test_generate_itinerary_does_not_repeat_activities_within_a_day(client):
    # Regression test: a flawed category-match condition used to make every
    # "Food" time slot accept literally any activity, and non-food slots kept
    # falling back to the same lone Food-category item - causing the same
    # activity to appear 2-3x on a single day. See app/services/ai_service.py.
    dest_id = create_destination(city="Goa")
    create_activity(dest_id, name="Beach Shack Seafood Dinner", category="Food", price=20)
    create_activity(dest_id, name="Baga Beach Water Sports", category="Adventure", price=30)
    create_activity(dest_id, name="Sunset Cruise", category="Nature", price=15)
    create_activity(dest_id, name="Old Goa Churches Tour", category="Religious", price=0)

    resp = client.post(
        "/ai/generate-itinerary",
        json={"destination": "Goa", "duration_days": 3, "budget": 500, "travelers": 2, "style": "Balanced", "interests": []},
    )
    assert resp.status_code == 200
    data = resp.json()
    for day in data["days"]:
        names = [a["name"] for a in day["activities"]]
        assert len(names) == len(set(names)), f"Day {day['day']} repeats an activity: {names}"


def test_generate_itinerary_rejects_invalid_input(client):
    resp = client.post(
        "/ai/generate-itinerary",
        json={"destination": "Paris", "duration_days": 0, "budget": -5},
    )
    assert resp.status_code == 422


def test_optimize_budget_flags_overspend_and_suggests_savings(client):
    user = register_user(client)
    token = user["access_token"]
    trip = client.post("/trips", json={"name": "Overspend Trip", "budget_total": 100}, headers=auth_headers(token)).json()
    client.post(f"/trips/{trip['id']}/budget", json={"category": "Accommodation", "amount": 200}, headers=auth_headers(token))

    resp = client.post("/ai/optimize-budget", json={"trip_id": trip["id"]}, headers=auth_headers(token))
    assert resp.status_code == 200
    data = resp.json()
    assert data["over_by"] == 100
    assert len(data["suggestions"]) > 0


def test_optimize_budget_requires_ownership(client):
    owner = register_user(client, email="owner@example.com")
    trip = client.post("/trips", json={"name": "Private"}, headers=auth_headers(owner["access_token"])).json()

    intruder = register_user(client, email="intruder@example.com", name="Intruder")
    resp = client.post("/ai/optimize-budget", json={"trip_id": trip["id"]}, headers=auth_headers(intruder["access_token"]))
    assert resp.status_code == 403
