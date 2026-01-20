def test_export_alias_requires_auth(client):
    res = client.get("/api/settings/export")
    assert res.status_code == 401


def test_export_alias_with_auth(client, auth_headers):
    res = client.get("/api/settings/export", headers=auth_headers)
    assert res.status_code == 200
    data = res.get_json()
    assert "user" in data
    assert "notes" in data


def test_progress_alias_with_auth(client, auth_headers):
    res = client.delete("/api/settings/progress", headers=auth_headers)
    assert res.status_code == 200
    data = res.get_json()
    assert data["reset_type"] == "all"
    assert "message" in data
