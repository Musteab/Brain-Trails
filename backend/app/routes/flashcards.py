from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from ..extensions import db
from ..models import Deck, Flashcard
from ..services.spaced_repetition import review_flashcard

flashcards_bp = Blueprint("flashcards", __name__, url_prefix="/api")


@flashcards_bp.route("/decks", methods=["GET"])
@jwt_required()
def list_decks():
    user_id = int(get_jwt_identity())
    decks = Deck.query.filter_by(user_id=user_id).order_by(Deck.created_at.desc()).all()
    return jsonify([deck.to_dict(include_counts=True) for deck in decks])


@flashcards_bp.route("/decks", methods=["POST"])
@jwt_required()
def create_deck():
    user_id = int(get_jwt_identity())
    payload = request.get_json() or {}
    name = (payload.get("name") or "").strip()
    if not name:
        return jsonify({"error": "Deck name is required"}), 400
    deck = Deck(name=name, user_id=user_id)
    db.session.add(deck)
    db.session.commit()
    return jsonify(deck.to_dict(include_counts=True)), 201


@flashcards_bp.route("/decks/<int:deck_id>", methods=["PUT"])
@jwt_required()
def rename_deck(deck_id: int):
    user_id = int(get_jwt_identity())
    deck = Deck.query.filter_by(id=deck_id, user_id=user_id).first_or_404()
    payload = request.get_json() or {}
    name = (payload.get("name") or "").strip()
    if not name:
        return jsonify({"error": "Deck name is required"}), 400
    deck.name = name
    db.session.commit()
    return jsonify(deck.to_dict(include_counts=True))


@flashcards_bp.route("/decks/<int:deck_id>", methods=["DELETE"])
@jwt_required()
def delete_deck(deck_id: int):
    user_id = int(get_jwt_identity())
    deck = Deck.query.filter_by(id=deck_id, user_id=user_id).first_or_404()
    db.session.delete(deck)
    db.session.commit()
    return jsonify({"message": "Deck deleted"})


@flashcards_bp.route("/decks/<int:deck_id>/flashcards", methods=["GET"])
@jwt_required()
def list_flashcards(deck_id: int):
    user_id = int(get_jwt_identity())
    Deck.query.filter_by(id=deck_id, user_id=user_id).first_or_404()
    flashcards = (
        Flashcard.query.filter_by(deck_id=deck_id)
        .order_by(Flashcard.created_at.desc())
        .all()
    )
    return jsonify([card.to_dict() for card in flashcards])


@flashcards_bp.route("/decks/<int:deck_id>/flashcards", methods=["POST"])
@jwt_required()
def create_flashcard(deck_id: int):
    user_id = int(get_jwt_identity())
    Deck.query.filter_by(id=deck_id, user_id=user_id).first_or_404()
    payload = request.get_json() or {}
    question = (payload.get("question") or "").strip()
    answer = (payload.get("answer") or "").strip()
    if not question or not answer:
        return jsonify({"error": "question and answer are required"}), 400
    flashcard = Flashcard(question=question, answer=answer, deck_id=deck_id)
    db.session.add(flashcard)
    db.session.commit()
    return jsonify(flashcard.to_dict()), 201


@flashcards_bp.route("/flashcards/<int:flashcard_id>", methods=["PUT"])
@jwt_required()
def update_flashcard_endpoint(flashcard_id: int):
    user_id = int(get_jwt_identity())
    flashcard = (
        Flashcard.query.join(Deck)
        .filter(Flashcard.id == flashcard_id, Deck.user_id == user_id)
        .first_or_404()
    )
    payload = request.get_json() or {}
    flashcard.question = payload.get("question", flashcard.question)
    flashcard.answer = payload.get("answer", flashcard.answer)
    db.session.commit()
    return jsonify(flashcard.to_dict())


@flashcards_bp.route("/flashcards/<int:flashcard_id>", methods=["DELETE"])
@jwt_required()
def delete_flashcard(flashcard_id: int):
    user_id = int(get_jwt_identity())
    flashcard = (
        Flashcard.query.join(Deck)
        .filter(Flashcard.id == flashcard_id, Deck.user_id == user_id)
        .first_or_404()
    )
    db.session.delete(flashcard)
    db.session.commit()
    return jsonify({"message": "Flashcard deleted"})


@flashcards_bp.route("/flashcards/<int:flashcard_id>/review", methods=["POST"])
@jwt_required()
def review(flashcard_id: int):
    user_id = int(get_jwt_identity())
    flashcard = (
        Flashcard.query.join(Deck)
        .filter(Flashcard.id == flashcard_id, Deck.user_id == user_id)
        .first_or_404()
    )
    payload = request.get_json() or {}
    quality = int(payload.get("quality", 3))
    progress = review_flashcard(user_id, flashcard, quality)
    return jsonify(progress.to_dict())
