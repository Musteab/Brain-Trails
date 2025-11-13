def test_quiz_generation_and_submission(client, auth_headers, monkeypatch):
    stub_questions = [
        {
            "question": "What is 2+2?",
            "correct_answer": "4",
            "options": ["3", "4", "5", "6"],
        }
    ]
    monkeypatch.setattr(
        "app.routes.quizzes.generate_quiz_items",
        lambda notes, num_questions=5: stub_questions,
    )

    created = client.post(
        "/api/quizzes/generate",
        json={"title": "Math", "notes": "Basic addition", "num_questions": 1},
        headers=auth_headers,
    )
    assert created.status_code == 201
    quiz_id = created.get_json()["quiz"]["id"]

    listing = client.get("/api/quizzes", headers=auth_headers)
    assert listing.status_code == 200
    assert len(listing.get_json()) == 1

    questions = client.get(f"/api/quizzes/{quiz_id}/questions", headers=auth_headers)
    assert questions.status_code == 200

    attempt = client.post(
        f"/api/quizzes/{quiz_id}/attempts",
        json={"answers": [{"question_id": questions.get_json()["questions"][0]["id"], "answer": "4"}]},
        headers=auth_headers,
    )
    assert attempt.status_code == 200
    assert attempt.get_json()["score"] == 100.0
