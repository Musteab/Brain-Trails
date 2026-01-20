"""Tests for Notes API endpoints."""
import json
import pytest


def test_create_note(client, auth_headers):
    """Test creating a new note."""
    response = client.post(
        "/api/notes",
        headers=auth_headers,
        json={
            "title": "Test Note",
            "content": {
                "type": "doc",
                "content": [
                    {"type": "paragraph", "content": [{"type": "text", "text": "Hello world"}]}
                ],
            },
        },
    )
    assert response.status_code == 201
    data = response.get_json()
    assert data["ok"] is True
    assert data["data"]["title"] == "Test Note"
    assert data["data"]["id"] is not None
    assert data["data"]["version"] == 1


def test_list_notes(client, auth_headers):
    """Test listing notes."""
    # Create a note first
    client.post(
        "/api/notes",
        headers=auth_headers,
        json={"title": "Note 1", "content": {"type": "doc", "content": []}},
    )
    client.post(
        "/api/notes",
        headers=auth_headers,
        json={"title": "Note 2", "content": {"type": "doc", "content": []}},
    )

    response = client.get("/api/notes", headers=auth_headers)
    assert response.status_code == 200
    data = response.get_json()
    assert data["ok"] is True
    assert len(data["data"]) >= 2


def test_update_note(client, auth_headers):
    """Test updating a note with optimistic concurrency."""
    # Create a note
    create_response = client.post(
        "/api/notes",
        headers=auth_headers,
        json={"title": "Original", "content": {"type": "doc", "content": []}},
    )
    note_id = create_response.get_json()["data"]["id"]
    version = create_response.get_json()["data"]["version"]

    # Update with correct version
    update_response = client.patch(
        f"/api/notes/{note_id}",
        headers=auth_headers,
        json={"title": "Updated", "version": version},
    )
    assert update_response.status_code == 200
    data = update_response.get_json()
    assert data["data"]["title"] == "Updated"
    assert data["data"]["version"] == version + 1


def test_update_note_version_conflict(client, auth_headers):
    """Test version conflict detection."""
    # Create a note
    create_response = client.post(
        "/api/notes",
        headers=auth_headers,
        json={"title": "Original", "content": {"type": "doc", "content": []}},
    )
    note_id = create_response.get_json()["data"]["id"]

    # Try to update with wrong version
    update_response = client.patch(
        f"/api/notes/{note_id}",
        headers=auth_headers,
        json={"title": "Updated", "version": 999},
    )
    assert update_response.status_code == 409
    data = update_response.get_json()
    assert data["ok"] is False
    assert data["error"]["code"] == "VERSION_CONFLICT"


def test_delete_note(client, auth_headers):
    """Test deleting a note."""
    # Create a note
    create_response = client.post(
        "/api/notes",
        headers=auth_headers,
        json={"title": "To Delete", "content": {"type": "doc", "content": []}},
    )
    note_id = create_response.get_json()["data"]["id"]

    # Delete it
    delete_response = client.delete(f"/api/notes/{note_id}", headers=auth_headers)
    assert delete_response.status_code == 200

    # Verify it's gone
    get_response = client.get(f"/api/notes/{note_id}", headers=auth_headers)
    assert get_response.status_code == 404


def test_search_notes(client, auth_headers):
    """Test searching notes by content."""
    # Create notes with specific content
    client.post(
        "/api/notes",
        headers=auth_headers,
        json={
            "title": "Python Basics",
            "content": {
                "type": "doc",
                "content": [
                    {"type": "paragraph", "content": [{"type": "text", "text": "Variables and functions in Python"}]}
                ],
            },
        },
    )
    client.post(
        "/api/notes",
        headers=auth_headers,
        json={
            "title": "JavaScript Guide",
            "content": {
                "type": "doc",
                "content": [
                    {"type": "paragraph", "content": [{"type": "text", "text": "JavaScript async await"}]}
                ],
            },
        },
    )

    # Search for Python
    response = client.get("/api/notes?search=Python", headers=auth_headers)
    data = response.get_json()
    assert data["ok"] is True
    assert any("Python" in note["title"] for note in data["data"])


def test_unauthorized_access(client):
    """Test that notes API requires authentication."""
    response = client.get("/api/notes")
    assert response.status_code == 401


def test_generate_quiz_from_note(client, auth_headers):
    """Test generating a quiz from note content."""
    from unittest.mock import patch
    
    # Mock the AI quiz generator
    mock_questions = [
        {
            "question": "What is Python?",
            "correct_answer": "A programming language",
            "options": ["A programming language", "A snake", "A database", "An OS"],
        }
    ]

    # Create a note with substantial content
    create_response = client.post(
        "/api/notes",
        headers=auth_headers,
        json={
            "title": "Python Introduction",
            "content": {
                "type": "doc",
                "content": [
                    {"type": "heading", "attrs": {"level": 1}, "content": [{"type": "text", "text": "Python Basics"}]},
                    {"type": "paragraph", "content": [{"type": "text", "text": "Python is a high-level programming language known for its readability and versatility. It supports multiple programming paradigms."}]},
                ],
            },
        },
    )
    note_id = create_response.get_json()["data"]["id"]

    # Generate quiz with mocked AI
    with patch("app.routes.notes.generate_quiz_v2", return_value=mock_questions):
        quiz_response = client.post(
            f"/api/notes/{note_id}/generate-quiz",
            headers=auth_headers,
            json={
                "num_questions": 5,
                "difficulty": "medium",
                "scope": "full",
            },
        )
    
    assert quiz_response.status_code == 201
    data = quiz_response.get_json()
    assert data["ok"] is True
    assert "quiz" in data["data"]
    assert "source_link" in data["data"]
    assert data["data"]["source_link"]["source_type"] == "note"
    assert data["data"]["source_link"]["source_id"] == note_id


def test_create_note_rejects_invalid_payload(client, auth_headers):
    """Title too long or content not a dict should fail."""
    long_title = "T" * 130
    res = client.post(
        "/api/notes",
        headers=auth_headers,
        json={"title": long_title, "content": {"type": "doc", "content": []}},
    )
    assert res.status_code == 400

    res2 = client.post(
        "/api/notes",
        headers=auth_headers,
        json={"title": "Ok", "content": "not-a-dict"},
    )
    assert res2.status_code == 400


def test_generate_quiz_from_note_too_long(client, auth_headers):
    """Content longer than AI_MAX_INPUT_CHARS should be rejected."""
    long_text = "a" * 5001
    create_response = client.post(
        "/api/notes",
        headers=auth_headers,
        json={
            "title": "Long Note",
            "content": {
                "type": "doc",
                "content": [{"type": "paragraph", "content": [{"type": "text", "text": long_text}]}],
            },
        },
    )
    assert create_response.status_code == 400
