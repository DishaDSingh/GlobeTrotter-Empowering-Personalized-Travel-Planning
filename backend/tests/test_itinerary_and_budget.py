from .conftest import auth_headers, create_activity, create_destination, register_user


def _setup_trip_with_stop(client, token):
    trip = client.post(
        "/trips", json={"name": "Budget Trip", "budget_total": 500}, headers=auth_headers(token)
    ).json()
    dest_id = create_destination()
    stop = client.post(
        f"/trips/{trip['id']}/stops", json={"destination_id": dest_id}, headers=auth_headers(token)
    ).json()
    return trip, stop, dest_id


def test_add_and_reorder_itinerary_activities(client):
    user = register_user(client)
    token = user["access_token"]
    trip, stop, dest_id = _setup_trip_with_stop(client, token)
    act1 = create_activity(dest_id, name="Museum Visit")
    act2 = create_activity(dest_id, name="City Walk", price=0.0)

    item1 = client.post(
        f"/trips/{trip['id']}/activities",
        json={"trip_stop_id": stop["id"], "activity_id": act1, "start_time": "10:00"},
        headers=auth_headers(token),
    ).json()
    item2 = client.post(
        f"/trips/{trip['id']}/activities",
        json={"trip_stop_id": stop["id"], "activity_id": act2, "start_time": "14:00"},
        headers=auth_headers(token),
    ).json()
    assert item1["sequence"] == 0
    assert item2["sequence"] == 1

    reorder = client.put(
        f"/trips/{trip['id']}/activities/reorder",
        json={"items": [{"id": item2["id"], "sequence": 0}, {"id": item1["id"], "sequence": 1}]},
        headers=auth_headers(token),
    )
    assert reorder.status_code == 200
    assert reorder.json()[0]["id"] == item2["id"]


def test_delete_itinerary_activity(client):
    user = register_user(client)
    token = user["access_token"]
    trip, stop, dest_id = _setup_trip_with_stop(client, token)
    act1 = create_activity(dest_id)
    item = client.post(
        f"/trips/{trip['id']}/activities",
        json={"trip_stop_id": stop["id"], "activity_id": act1},
        headers=auth_headers(token),
    ).json()

    delete_resp = client.delete(f"/trips/{trip['id']}/activities/{item['id']}", headers=auth_headers(token))
    assert delete_resp.status_code == 204

    listing = client.get(f"/trips/{trip['id']}/activities", headers=auth_headers(token))
    assert listing.json() == []


def test_budget_summary_calculation(client):
    user = register_user(client)
    token = user["access_token"]
    trip = client.post(
        "/trips", json={"name": "Budget Trip", "start_date": "2026-01-01", "end_date": "2026-01-05", "budget_total": 1000},
        headers=auth_headers(token),
    ).json()

    client.post(f"/trips/{trip['id']}/budget", json={"category": "Accommodation", "amount": 400}, headers=auth_headers(token))
    client.post(f"/trips/{trip['id']}/budget", json={"category": "Food", "amount": 200}, headers=auth_headers(token))

    summary = client.get(f"/trips/{trip['id']}/budget", headers=auth_headers(token)).json()
    assert summary["total_budget"] == 1000
    assert summary["spent"] == 600
    assert summary["remaining"] == 400
    assert summary["percent_used"] == 60.0
    categories = {c["category"]: c["amount"] for c in summary["by_category"]}
    assert categories["Accommodation"] == 400
    assert categories["Food"] == 200


def test_add_itinerary_activity_with_explicit_date(client):
    # Regression test: the `date` field name previously collided with the
    # `datetime.date` type import in the Pydantic schema, making the field
    # accept only None. See app/schemas/itinerary.py (date_type alias).
    user = register_user(client)
    token = user["access_token"]
    trip, stop, dest_id = _setup_trip_with_stop(client, token)
    act1 = create_activity(dest_id)

    resp = client.post(
        f"/trips/{trip['id']}/activities",
        json={"trip_stop_id": stop["id"], "activity_id": act1, "date": "2026-09-10", "start_time": "09:00"},
        headers=auth_headers(token),
    )
    assert resp.status_code == 201, resp.text
    assert resp.json()["date"] == "2026-09-10"


def test_add_budget_record_with_explicit_date(client):
    user = register_user(client)
    token = user["access_token"]
    trip = client.post("/trips", json={"name": "Dated Budget Trip", "budget_total": 500}, headers=auth_headers(token)).json()

    resp = client.post(
        f"/trips/{trip['id']}/budget",
        json={"category": "Food", "amount": 40, "date": "2026-09-10"},
        headers=auth_headers(token),
    )
    assert resp.status_code == 201, resp.text
    assert resp.json()["date"] == "2026-09-10"


def test_budget_over_spend_flagged(client):
    user = register_user(client)
    token = user["access_token"]
    trip = client.post("/trips", json={"name": "Tight Budget", "budget_total": 100}, headers=auth_headers(token)).json()
    client.post(f"/trips/{trip['id']}/budget", json={"category": "Other", "amount": 150}, headers=auth_headers(token))

    summary = client.get(f"/trips/{trip['id']}/budget", headers=auth_headers(token)).json()
    assert summary["over_budget_by"] == 50
    assert summary["remaining"] == -50
