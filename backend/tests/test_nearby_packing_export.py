from .conftest import auth_headers, create_activity, create_destination, register_user


def test_nearby_destinations_ranked_by_real_distance(client):
    agra = create_destination(city="Agra", country="India", country_code="IN",
                               latitude=27.1767, longitude=78.0081, currency="INR")
    create_destination(city="Delhi", country="India", country_code="IN",
                        latitude=28.7041, longitude=77.1025, currency="INR")
    create_destination(city="Sydney", country="Australia", country_code="AU",
                        latitude=-33.8688, longitude=151.2093, currency="AUD")

    resp = client.get(f"/destinations/{agra}/nearby-destinations")
    assert resp.status_code == 200
    data = resp.json()
    cities = [d["destination"]["city"] for d in data]
    assert cities[0] == "Delhi"  # ~200km away
    assert cities[-1] == "Sydney"  # ~10,000km away
    assert data[0]["distance_km"] < data[-1]["distance_km"]


def test_nearby_destinations_excludes_self(client):
    agra = create_destination(city="Agra")
    resp = client.get(f"/destinations/{agra}/nearby-destinations")
    assert resp.status_code == 200
    assert all(d["destination"]["city"] != "Agra" for d in resp.json())


def test_packing_list_reflects_season_and_activities(client):
    user = register_user(client)
    token = user["access_token"]
    dest_id = create_destination(city="Goa", latitude=15.3, currency="INR")
    trip = client.post(
        "/trips",
        json={"name": "Goa Trip", "start_date": "2026-01-10", "end_date": "2026-01-15"},
        headers=auth_headers(token),
    ).json()
    stop = client.post(f"/trips/{trip['id']}/stops", json={"destination_id": dest_id}, headers=auth_headers(token)).json()
    act_id = create_activity(dest_id, name="Baga Beach Water Sports", category="Adventure")
    client.post(
        f"/trips/{trip['id']}/activities",
        json={"trip_stop_id": stop["id"], "activity_id": act_id, "date": "2026-01-11"},
        headers=auth_headers(token),
    )

    resp = client.get(f"/trips/{trip['id']}/packing-list", headers=auth_headers(token))
    assert resp.status_code == 200
    data = resp.json()
    assert data["season_label"] in ("Summer", "Winter", "Spring", "Autumn")
    all_items = [item for items in data["categories"].values() for item in items]
    assert any("hiking" in item.lower() or "daypack" in item.lower() for item in all_items)


def test_packing_list_requires_ownership(client):
    owner = register_user(client, email="owner@example.com")
    trip = client.post("/trips", json={"name": "Private"}, headers=auth_headers(owner["access_token"])).json()
    intruder = register_user(client, email="intruder@example.com", name="Intruder")
    resp = client.get(f"/trips/{trip['id']}/packing-list", headers=auth_headers(intruder["access_token"]))
    assert resp.status_code == 403


def test_export_ics_returns_valid_calendar(client):
    user = register_user(client)
    token = user["access_token"]
    dest_id = create_destination(city="Paris")
    trip = client.post(
        "/trips", json={"name": "Paris Trip", "start_date": "2026-05-01", "end_date": "2026-05-03"},
        headers=auth_headers(token),
    ).json()
    stop = client.post(f"/trips/{trip['id']}/stops", json={"destination_id": dest_id}, headers=auth_headers(token)).json()
    act_id = create_activity(dest_id, name="Eiffel Tower Visit")
    client.post(
        f"/trips/{trip['id']}/activities",
        json={"trip_stop_id": stop["id"], "activity_id": act_id, "date": "2026-05-01", "start_time": "10:00"},
        headers=auth_headers(token),
    )

    resp = client.get(f"/trips/{trip['id']}/export.ics", headers=auth_headers(token))
    assert resp.status_code == 200
    assert resp.headers["content-type"].startswith("text/calendar")
    assert "attachment" in resp.headers["content-disposition"]
    body = resp.text
    assert body.startswith("BEGIN:VCALENDAR")
    assert body.strip().endswith("END:VCALENDAR")
    assert "SUMMARY:Eiffel Tower Visit" in body
    assert "DTSTART:20260501T100000" in body
