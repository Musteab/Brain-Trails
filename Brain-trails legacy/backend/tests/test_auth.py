def test_register_and_login_flow(client):
    payload = {"username": "ana", "email": "ana@example.com", "password": "SecurePass9"}
    res = client.post("/api/auth/register", json=payload)
    assert res.status_code == 201

    login = client.post("/api/auth/login", json={"username": "ana", "password": "SecurePass9"})
    assert login.status_code == 200
    data = login.get_json()
    assert "access_token" in data and data["user"]["username"] == "ana"


def test_profile_requires_token(client):
    res = client.get("/api/auth/me")
    assert res.status_code == 401


def test_refresh_token_flow(client):
    payload = {"username": "bob", "email": "bob@example.com", "password": "SecurePass9"}
    client.post("/api/auth/register", json=payload)
    login = client.post("/api/auth/login", json={"username": "bob", "password": "SecurePass9"})
    refresh_token = login.get_json()["refresh_token"]

    res = client.post(
        "/api/auth/refresh",
        headers={"Authorization": f"Bearer {refresh_token}"},
    )
    assert res.status_code == 200
    data = res.get_json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["user"]["username"] == "bob"


def test_refresh_token_invalid(client):
    res = client.post(
        "/api/auth/refresh",
        headers={"Authorization": "Bearer invalidtoken"},
    )
    assert res.status_code in (401, 422)


def test_register_rejects_short_password(client):
    payload = {"username": "tiny", "email": "tiny@example.com", "password": "short"}
    res = client.post("/api/auth/register", json=payload)
    assert res.status_code == 400
    assert "Password" in res.get_json()["error"]


def test_login_missing_credentials(client):
    res = client.post("/api/auth/login", json={"username": "", "password": ""})
    assert res.status_code == 400
