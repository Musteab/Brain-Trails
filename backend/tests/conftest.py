import pytest

from app import create_app
from app.extensions import db


@pytest.fixture
def app():
    app = create_app("testing")
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def auth_headers(client):
    payload = {"username": "tester", "email": "tester@example.com", "password": "Password123"}
    client.post("/api/auth/register", json=payload)
    login_res = client.post("/api/auth/login", json={"username": "tester", "password": "Password123"})
    token = login_res.get_json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
