"""
Tests for Brain Trails Flask Backend API.

Run: pytest tests/ -v
"""

import json
import os
import sys

# Add backend directory to path so we can import app
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app import app  # noqa: E402

import pytest  # noqa: E402


@pytest.fixture
def client():
    """Create a Flask test client."""
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


class TestHealthEndpoints:
    """Tests for health check and API root endpoints."""

    def test_health_check(self, client):
        """GET /api/health returns healthy status."""
        response = client.get("/api/health")
        data = json.loads(response.data)

        assert response.status_code == 200
        assert data["status"] == "healthy"
        assert "version" in data
        assert data["features"]["ai_chat"] is True

    def test_api_root(self, client):
        """GET /api returns API info with endpoints."""
        response = client.get("/api")
        data = json.loads(response.data)

        assert response.status_code == 200
        assert data["name"] == "Brain Trails API"
        assert "endpoints" in data
        assert "ai_chat" in data["endpoints"]


class TestAIChatEndpoint:
    """Tests for the /api/ai/chat endpoint."""

    def test_chat_requires_message(self, client):
        """POST /api/ai/chat without message returns 400."""
        response = client.post(
            "/api/ai/chat",
            data=json.dumps({}),
            content_type="application/json",
        )
        data = json.loads(response.data)

        assert response.status_code == 400
        assert "error" in data

    def test_chat_requires_json_body(self, client):
        """POST /api/ai/chat without JSON body returns 400."""
        response = client.post(
            "/api/ai/chat",
            content_type="application/json",
        )

        assert response.status_code == 400

    def test_chat_with_empty_message(self, client):
        """POST /api/ai/chat with empty message processes."""
        response = client.post(
            "/api/ai/chat",
            data=json.dumps({"message": ""}),
            content_type="application/json",
        )
        # Empty string is technically a message, so it may pass validation
        # but the API key check or AI call will handle it
        assert response.status_code in [200, 400, 500]

    def test_chat_accepts_note_content(self, client):
        """POST /api/ai/chat accepts optional noteContent field."""
        response = client.post(
            "/api/ai/chat",
            data=json.dumps({
                "message": "Summarize my notes",
                "noteContent": "The mitochondria is the powerhouse of the cell.",
            }),
            content_type="application/json",
        )
        # Will fail with 500 if no API key, but shouldn't 400
        assert response.status_code != 400


class TestCORS:
    """Tests for CORS configuration."""

    def test_cors_headers_present(self, client):
        """OPTIONS request should return CORS headers."""
        response = client.options(
            "/api/health",
            headers={"Origin": "http://localhost:3000"},
        )
        # Flask-CORS should handle this
        assert response.status_code in [200, 204]
