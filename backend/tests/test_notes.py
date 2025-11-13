def test_note_crud_and_summary(client, auth_headers, monkeypatch):
    created = client.post(
        "/api/notes",
        json={"title": "Chapter 1", "content": "Cells are the building blocks."},
        headers=auth_headers,
    )
    assert created.status_code == 201
    note_id = created.get_json()["id"]

    listing = client.get("/api/notes", headers=auth_headers)
    assert listing.status_code == 200
    assert len(listing.get_json()) == 1

    monkeypatch.setattr("app.routes.notes.generate_summary", lambda text: "Short summary")
    summary = client.post(f"/api/notes/{note_id}/summaries", headers=auth_headers)
    assert summary.status_code == 200
    assert summary.get_json()["summary"] == "Short summary"
