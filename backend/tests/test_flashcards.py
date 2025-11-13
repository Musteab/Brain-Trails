def test_deck_and_flashcard_lifecycle(client, auth_headers):
    deck = client.post("/api/decks", json={"name": "Bio"}, headers=auth_headers)
    assert deck.status_code == 201
    deck_id = deck.get_json()["id"]

    flashcard = client.post(
        f"/api/decks/{deck_id}/flashcards",
        json={"question": "What is DNA?", "answer": "Genetic material"},
        headers=auth_headers,
    )
    assert flashcard.status_code == 201
    card_id = flashcard.get_json()["id"]

    listing = client.get(f"/api/decks/{deck_id}/flashcards", headers=auth_headers)
    assert listing.status_code == 200
    assert len(listing.get_json()) == 1

    review = client.post(
        f"/api/flashcards/{card_id}/review", json={"quality": 4}, headers=auth_headers
    )
    assert review.status_code == 200
