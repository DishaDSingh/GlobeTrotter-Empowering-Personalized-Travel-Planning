from .conftest import auth_headers, register_user


def test_register_creates_user_and_returns_token(client):
    data = register_user(client)
    assert data["user"]["email"] == "alice@example.com"
    assert data["access_token"]


def test_register_duplicate_email_rejected(client):
    register_user(client)
    resp = client.post("/auth/register", json={"name": "Bob", "email": "alice@example.com", "password": "password123"})
    assert resp.status_code == 409


def test_login_success(client):
    register_user(client)
    resp = client.post("/auth/login", json={"email": "alice@example.com", "password": "password123"})
    assert resp.status_code == 200
    assert resp.json()["access_token"]


def test_login_wrong_password_rejected(client):
    register_user(client)
    resp = client.post("/auth/login", json={"email": "alice@example.com", "password": "wrong-password"})
    assert resp.status_code == 401


def test_me_requires_token(client):
    resp = client.get("/auth/me")
    assert resp.status_code == 401


def test_me_returns_current_user(client):
    data = register_user(client)
    resp = client.get("/auth/me", headers=auth_headers(data["access_token"]))
    assert resp.status_code == 200
    assert resp.json()["email"] == "alice@example.com"


def test_forgot_and_reset_password(client):
    register_user(client)
    forgot = client.post("/auth/forgot-password", json={"email": "alice@example.com"})
    assert forgot.status_code == 200
    token = forgot.json()["dev_reset_token"]

    reset = client.post("/auth/reset-password", json={"token": token, "new_password": "newpassword456"})
    assert reset.status_code == 200

    login = client.post("/auth/login", json={"email": "alice@example.com", "password": "newpassword456"})
    assert login.status_code == 200

    old_login = client.post("/auth/login", json={"email": "alice@example.com", "password": "password123"})
    assert old_login.status_code == 401
