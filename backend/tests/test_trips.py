from .conftest import auth_headers, create_destination, register_user


def _create_trip(client, token, name="My Trip", visibility="private"):
    resp = client.post(
        "/trips",
        json={"name": name, "start_date": "2026-09-01", "end_date": "2026-09-05", "visibility": visibility},
        headers=auth_headers(token),
    )
    assert resp.status_code == 201, resp.text
    return resp.json()


def test_create_and_list_trip(client):
    user = register_user(client)
    trip = _create_trip(client, user["access_token"])
    assert trip["name"] == "My Trip"
    assert trip["status"] == "draft"

    listing = client.get("/trips", headers=auth_headers(user["access_token"]))
    assert listing.status_code == 200
    assert len(listing.json()) == 1


def test_trip_ownership_blocks_other_users(client):
    owner = register_user(client, email="owner@example.com")
    trip = _create_trip(client, owner["access_token"])

    intruder = register_user(client, email="intruder@example.com", name="Intruder")

    get_resp = client.get(f"/trips/{trip['id']}", headers=auth_headers(intruder["access_token"]))
    assert get_resp.status_code == 403

    update_resp = client.put(
        f"/trips/{trip['id']}", json={"name": "Hacked"}, headers=auth_headers(intruder["access_token"])
    )
    assert update_resp.status_code == 403

    delete_resp = client.delete(f"/trips/{trip['id']}", headers=auth_headers(intruder["access_token"]))
    assert delete_resp.status_code == 403


def test_update_and_delete_own_trip(client):
    user = register_user(client)
    trip = _create_trip(client, user["access_token"])

    update_resp = client.put(
        f"/trips/{trip['id']}", json={"name": "Updated Name"}, headers=auth_headers(user["access_token"])
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["name"] == "Updated Name"

    delete_resp = client.delete(f"/trips/{trip['id']}", headers=auth_headers(user["access_token"]))
    assert delete_resp.status_code == 204

    get_resp = client.get(f"/trips/{trip['id']}", headers=auth_headers(user["access_token"]))
    assert get_resp.status_code == 404


def test_add_and_reorder_stops(client):
    user = register_user(client)
    token = user["access_token"]
    trip = _create_trip(client, token)

    paris_id = create_destination(city="Paris")
    amsterdam_id = create_destination(city="Amsterdam", country_code="NL")

    stop1 = client.post(
        f"/trips/{trip['id']}/stops", json={"destination_id": paris_id}, headers=auth_headers(token)
    ).json()
    stop2 = client.post(
        f"/trips/{trip['id']}/stops", json={"destination_id": amsterdam_id}, headers=auth_headers(token)
    ).json()
    assert stop1["sequence"] == 0
    assert stop2["sequence"] == 1

    reorder_resp = client.put(
        f"/trips/{trip['id']}/stops/reorder",
        json={"stops": [{"id": stop2["id"], "sequence": 0}, {"id": stop1["id"], "sequence": 1}]},
        headers=auth_headers(token),
    )
    assert reorder_resp.status_code == 200
    reordered = reorder_resp.json()
    assert reordered[0]["id"] == stop2["id"]
    assert reordered[0]["destination"]["city"] == "Amsterdam"


def test_stop_planned_budget_can_be_set_and_cleared(client):
    user = register_user(client)
    token = user["access_token"]
    trip = _create_trip(client, token)
    dest_id = create_destination()

    stop = client.post(
        f"/trips/{trip['id']}/stops", json={"destination_id": dest_id, "planned_budget": 500}, headers=auth_headers(token)
    ).json()
    assert stop["planned_budget"] == 500

    updated = client.put(
        f"/trips/{trip['id']}/stops/{stop['id']}", json={"planned_budget": 300}, headers=auth_headers(token)
    ).json()
    assert updated["planned_budget"] == 300

    cleared = client.put(
        f"/trips/{trip['id']}/stops/{stop['id']}", json={"planned_budget": None}, headers=auth_headers(token)
    ).json()
    assert cleared["planned_budget"] is None


def test_duplicate_trip_copies_stops(client):
    user = register_user(client)
    token = user["access_token"]
    trip = _create_trip(client, token)
    dest_id = create_destination()
    client.post(f"/trips/{trip['id']}/stops", json={"destination_id": dest_id}, headers=auth_headers(token))

    dup_resp = client.post(f"/trips/{trip['id']}/duplicate", headers=auth_headers(token))
    assert dup_resp.status_code == 201
    new_trip_id = dup_resp.json()["id"]
    stops = client.get(f"/trips/{new_trip_id}/stops", headers=auth_headers(token)).json()
    assert len(stops) == 1
