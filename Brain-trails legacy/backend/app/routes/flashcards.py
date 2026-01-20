import csv
import io
from flask import Blueprint, jsonify, request, Response
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


# --- Export/Import ---

@flashcards_bp.route("/decks/<int:deck_id>/export", methods=["GET"])
@jwt_required()
def export_deck(deck_id: int):
    """
    Export a deck as JSON or CSV.
    
    Query params:
    - format: "json" (default) or "csv"
    
    JSON format:
    {
        "deck": {"name": "...", "description": "..."},
        "cards": [{"question": "...", "answer": "..."}, ...]
    }
    
    CSV format:
    question,answer
    "What is...", "It is..."
    """
    user_id = int(get_jwt_identity())
    deck = Deck.query.filter_by(id=deck_id, user_id=user_id).first_or_404()
    flashcards = Flashcard.query.filter_by(deck_id=deck_id).all()
    
    export_format = request.args.get("format", "json").lower()
    
    if export_format == "csv":
        # Generate CSV
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["question", "answer"])
        for card in flashcards:
            writer.writerow([card.question, card.answer])
        
        return Response(
            output.getvalue(),
            mimetype="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename={deck.name.replace(' ', '_')}_flashcards.csv"
            }
        )
    else:
        # JSON format
        export_data = {
            "deck": {
                "name": deck.name,
                "description": deck.description,
            },
            "cards": [
                {"question": card.question, "answer": card.answer}
                for card in flashcards
            ],
            "count": len(flashcards),
            "exported_at": None,  # Will be set by client's Date
        }
        return jsonify(export_data)


@flashcards_bp.route("/decks/<int:deck_id>/import", methods=["POST"])
@jwt_required()
def import_cards_to_deck(deck_id: int):
    """
    Import flashcards into an existing deck.
    
    Content-Type: application/json
    {
        "cards": [{"question": "...", "answer": "..."}, ...]
    }
    
    Or Content-Type: multipart/form-data with CSV file
    """
    user_id = int(get_jwt_identity())
    deck = Deck.query.filter_by(id=deck_id, user_id=user_id).first_or_404()
    
    imported_count = 0
    
    if request.content_type and "multipart/form-data" in request.content_type:
        # CSV file upload
        if "file" not in request.files:
            return jsonify({"error": "No file provided"}), 400
        
        file = request.files["file"]
        if not file.filename:
            return jsonify({"error": "No file selected"}), 400
        
        try:
            stream = io.StringIO(file.read().decode("utf-8"))
            reader = csv.DictReader(stream)
            
            for row in reader:
                question = (row.get("question") or "").strip()
                answer = (row.get("answer") or "").strip()
                
                if question and answer:
                    flashcard = Flashcard(question=question, answer=answer, deck_id=deck_id)
                    db.session.add(flashcard)
                    imported_count += 1
            
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": f"Failed to parse CSV: {str(e)}"}), 400
    else:
        # JSON import
        payload = request.get_json() or {}
        cards = payload.get("cards", [])
        
        if not cards:
            return jsonify({"error": "No cards provided"}), 400
        
        for card in cards:
            question = (card.get("question") or "").strip()
            answer = (card.get("answer") or "").strip()
            
            if question and answer:
                flashcard = Flashcard(question=question, answer=answer, deck_id=deck_id)
                db.session.add(flashcard)
                imported_count += 1
        
        db.session.commit()
    
    return jsonify({
        "message": f"Successfully imported {imported_count} cards",
        "imported_count": imported_count,
        "deck": deck.to_dict(include_counts=True),
    }), 201


@flashcards_bp.route("/decks/import", methods=["POST"])
@jwt_required()
def import_deck():
    """
    Import a new deck with flashcards.
    
    JSON body:
    {
        "deck": {"name": "...", "description": "..."},
        "cards": [{"question": "...", "answer": "..."}, ...]
    }
    """
    user_id = int(get_jwt_identity())
    payload = request.get_json() or {}
    
    deck_data = payload.get("deck", {})
    name = (deck_data.get("name") or "Imported Deck").strip()
    description = deck_data.get("description", "")
    cards = payload.get("cards", [])
    
    if not cards:
        return jsonify({"error": "No cards provided"}), 400
    
    # Create deck
    deck = Deck(name=name, description=description, user_id=user_id)
    db.session.add(deck)
    db.session.flush()
    
    # Add cards
    imported_count = 0
    for card in cards:
        question = (card.get("question") or "").strip()
        answer = (card.get("answer") or "").strip()
        
        if question and answer:
            flashcard = Flashcard(question=question, answer=answer, deck_id=deck.id)
            db.session.add(flashcard)
            imported_count += 1
    
    db.session.commit()
    
    return jsonify({
        "message": f"Created deck '{name}' with {imported_count} cards",
        "deck": deck.to_dict(include_counts=True),
        "imported_count": imported_count,
    }), 201
