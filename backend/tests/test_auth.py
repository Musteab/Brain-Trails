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
