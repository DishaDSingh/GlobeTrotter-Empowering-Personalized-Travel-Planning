from .conftest import auth_headers, create_destination, register_user


def test_private_trip_not_publicly_visible(client):
    owner = register_user(client)
    trip = client.post("/trips", json={"name": "Secret Trip"}, headers=auth_headers(owner["access_token"])).json()

    resp = client.get(f"/shared/{trip.get('share_id') or 'nonexistent'}")
    assert resp.status_code == 404


def test_share_trip_generates_public_link_and_copy(client):
    owner = register_user(client, email="owner@example.com")
    token = owner["access_token"]
    trip = client.post("/trips", json={"name": "Shared Trip", "budget_total": 200}, headers=auth_headers(token)).json()
    dest_id = create_destination()
    client.post(f"/trips/{trip['id']}/stops", json={"destination_id": dest_id}, headers=auth_headers(token))

    share_resp = client.post(f"/trips/{trip['id']}/share", headers=auth_headers(token))
    assert share_resp.status_code == 200
    share_id = share_resp.json()["share_id"]
    assert share_id

    public_view = client.get(f"/shared/{share_id}")
    assert public_view.status_code == 200
    body = public_view.json()
    assert body["trip"]["name"] == "Shared Trip"
    assert len(body["stops"]) == 1

    copier = register_user(client, email="copier@example.com", name="Copier")
    copy_resp = client.post(f"/shared/{share_id}/copy", headers=auth_headers(copier["access_token"]))
    assert copy_resp.status_code == 201
    copied_trip = copy_resp.json()
    assert copied_trip["visibility"] == "private"

    copier_trips = client.get("/trips", headers=auth_headers(copier["access_token"])).json()
    assert len(copier_trips) == 1
    assert copier_trips[0]["destination_count"] == 1


def test_unshare_makes_trip_private_again(client):
    owner = register_user(client)
    token = owner["access_token"]
    trip = client.post("/trips", json={"name": "Toggle Trip"}, headers=auth_headers(token)).json()

    share_resp = client.post(f"/trips/{trip['id']}/share", headers=auth_headers(token))
    share_id = share_resp.json()["share_id"]
    assert client.get(f"/shared/{share_id}").status_code == 200

    client.delete(f"/trips/{trip['id']}/share", headers=auth_headers(token))
    assert client.get(f"/shared/{share_id}").status_code == 404
