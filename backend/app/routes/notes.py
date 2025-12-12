"""Notes API routes."""
from flask import Blueprint, jsonify, request, make_response
from flask_jwt_extended import get_jwt_identity, jwt_required
from datetime import date

from ..extensions import db
from ..models import Note, NoteTag, NoteTagLink, Quiz, Question, QuizSourceLink
from ..models.gamification import NoteReview, NoteLink
from ..services.note_utils import extract_plaintext, note_to_prompt_text, extract_blocks_by_ids
from ..services.gamification import GamificationService, award_xp_for_note_created
from ..ai.quiz import generate_quiz_items, generate_quiz_v2, QuizDifficulty, QuestionType

notes_bp = Blueprint("notes", __name__, url_prefix="/api/notes")


def json_response(data=None, error=None, status=200):
    """Standardized JSON response format."""
    if error:
        resp = make_response(jsonify({"ok": False, "error": error}), status)
    else:
        resp = make_response(jsonify({"ok": True, "data": data}), status)
    return resp


@notes_bp.route("", methods=["GET"])
@jwt_required()
def list_notes():
    """
    List all notes for the current user.
    Supports ?search=... query parameter for full-text search.
    """
    user_id = int(get_jwt_identity())
    search = request.args.get("search", "").strip()
    
    query = Note.query.filter_by(user_id=user_id)
    
    if search:
        # Simple ILIKE search on title and plaintext_cache
        search_pattern = f"%{search}%"
        query = query.filter(
            db.or_(
                Note.title.ilike(search_pattern),
                Note.plaintext_cache.ilike(search_pattern),
            )
        )
    
    notes = query.order_by(Note.updated_at.desc()).all()
    return json_response([note.to_list_dict() for note in notes])


@notes_bp.route("", methods=["POST"])
@jwt_required()
def create_note():
    """Create a new note."""
    user_id = int(get_jwt_identity())
    payload = request.get_json() or {}
    
    title = (payload.get("title") or "Untitled").strip()
    content = payload.get("content", {"type": "doc", "content": []})
    tag_ids = payload.get("tag_ids", [])
    
    # Extract plaintext for search
    plaintext = extract_plaintext(content)
    
    note = Note(
        user_id=user_id,
        title=title,
        content=content,
        plaintext_cache=plaintext,
    )
    db.session.add(note)
    db.session.flush()
    
    # Add tags if provided
    if tag_ids:
        tags = NoteTag.query.filter(
            NoteTag.id.in_(tag_ids),
            NoteTag.user_id == user_id
        ).all()
        note.tags = tags
    
    db.session.commit()
    
    # Award XP for creating a note
    xp_result = award_xp_for_note_created(user_id, note.id)
    
    response_data = note.to_dict(include_content=True)
    response_data["xp_awarded"] = xp_result
    
    return json_response(response_data), 201


@notes_bp.route("/<int:note_id>", methods=["GET"])
@jwt_required()
def get_note(note_id: int):
    """Get a single note with full content."""
    user_id = int(get_jwt_identity())
    note = Note.query.filter_by(id=note_id, user_id=user_id).first()
    
    if not note:
        return json_response(error={"code": "NOT_FOUND", "message": "Note not found"}, status=404)
    
    return json_response(note.to_dict(include_content=True))


@notes_bp.route("/<int:note_id>", methods=["PATCH"])
@jwt_required()
def update_note(note_id: int):
    """
    Update a note with optimistic concurrency control.
    Client must send current version to prevent conflicts.
    """
    user_id = int(get_jwt_identity())
    note = Note.query.filter_by(id=note_id, user_id=user_id).first()
    
    if not note:
        return json_response(error={"code": "NOT_FOUND", "message": "Note not found"}, status=404)
    
    payload = request.get_json() or {}
    client_version = payload.get("version")
    
    # Optimistic concurrency check
    if client_version is not None and client_version != note.version:
        return json_response(
            error={
                "code": "VERSION_CONFLICT",
                "message": "Note was modified by another session",
                "details": {"server_version": note.version, "client_version": client_version}
            },
            status=409
        )
    
    # Update fields
    if "title" in payload:
        note.title = (payload["title"] or "Untitled").strip()
    
    if "content" in payload:
        note.content = payload["content"]
        note.plaintext_cache = extract_plaintext(payload["content"])
    
    if "tag_ids" in payload:
        tags = NoteTag.query.filter(
            NoteTag.id.in_(payload["tag_ids"]),
            NoteTag.user_id == user_id
        ).all()
        note.tags = tags
    
    # Increment version
    note.version += 1
    db.session.commit()
    
    return json_response(note.to_dict(include_content=True))


@notes_bp.route("/<int:note_id>", methods=["DELETE"])
@jwt_required()
def delete_note(note_id: int):
    """Delete a note."""
    user_id = int(get_jwt_identity())
    note = Note.query.filter_by(id=note_id, user_id=user_id).first()
    
    if not note:
        return json_response(error={"code": "NOT_FOUND", "message": "Note not found"}, status=404)
    
    db.session.delete(note)
    db.session.commit()
    
    return json_response({"message": "Note deleted"})


@notes_bp.route("/<int:note_id>/generate-quiz", methods=["POST"])
@jwt_required()
def generate_quiz_from_note(note_id: int):
    """
    Generate a quiz from note content.
    
    Body:
    {
        "num_questions": 10,
        "difficulty": "easy" | "medium" | "hard",
        "question_types": ["mcq", "true_false", "short_answer"],
        "include_explanations": true,
        "scope": "full" | "selection",
        "selection": {"blockIds": ["..."]},
        "title": "Quiz on <note title>",
        "time_limit": 120,
        "focus_topics": ["topic1", "topic2"]
    }
    """
    user_id = int(get_jwt_identity())
    note = Note.query.filter_by(id=note_id, user_id=user_id).first()
    
    if not note:
        return json_response(error={"code": "NOT_FOUND", "message": "Note not found"}, status=404)
    
    payload = request.get_json() or {}
    num_questions = min(int(payload.get("num_questions", 5)), 20)  # Cap at 20
    difficulty_str = payload.get("difficulty", "medium").lower()
    scope = payload.get("scope", "full")
    selection = payload.get("selection", {})
    title = (payload.get("title") or f"Quiz on {note.title}").strip()
    time_limit = int(payload.get("time_limit", 120))
    include_explanations = payload.get("include_explanations", True)
    focus_topics = payload.get("focus_topics", [])
    
    # Parse question types
    question_types_str = payload.get("question_types", ["mcq"])
    question_types = []
    for qt_str in question_types_str:
        try:
            question_types.append(QuestionType(qt_str))
        except ValueError:
            pass
    if not question_types:
        question_types = [QuestionType.MCQ]
    
    # Parse difficulty
    try:
        difficulty = QuizDifficulty(difficulty_str)
    except ValueError:
        difficulty = QuizDifficulty.MEDIUM
    
    # Extract text based on scope
    if scope == "selection" and selection.get("blockIds"):
        text = extract_blocks_by_ids(note.content, selection["blockIds"])
    else:
        text = note_to_prompt_text(note.content)
    
    if not text or len(text) < 50:
        return json_response(
            error={"code": "INSUFFICIENT_CONTENT", "message": "Note content is too short to generate quiz"},
            status=400
        )
    
    # Generate questions using v2 API
    questions_data = generate_quiz_v2(
        text=text,
        question_count=num_questions,
        difficulty=difficulty,
        question_types=question_types,
        include_explanations=include_explanations,
        focus_topics=focus_topics if focus_topics else None,
    )
    
    if not questions_data:
        return json_response(
            error={"code": "GENERATION_FAILED", "message": "Unable to generate quiz questions"},
            status=500
        )
    
    # Create quiz
    quiz = Quiz(user_id=user_id, title=title, time_limit=time_limit)
    db.session.add(quiz)
    db.session.flush()
    
    # Add questions
    for q in questions_data:
        question = Question(
            quiz_id=quiz.id,
            question_text=q["question"],
            correct_answer=q["correct_answer"],
            options=q["options"],
            explanation=q.get("explanation"),
        )
        db.session.add(question)
    
    # Create source link
    source_link = QuizSourceLink(
        quiz_id=quiz.id,
        source_type="note",
        source_id=note.id,
        source_meta={
            "difficulty": difficulty.value,
            "question_types": [qt.value for qt in question_types],
            "scope": scope,
            "selection": selection if scope == "selection" else None,
            "num_questions": num_questions,
            "include_explanations": include_explanations,
        }
    )
    db.session.add(source_link)
    db.session.commit()
    
    return json_response({
        "quiz": quiz.to_dict(include_questions=True),
        "source_link": {
            "id": source_link.id,
            "source_type": source_link.source_type,
            "source_id": source_link.source_id,
        },
    }), 201


# --- Tags API ---

@notes_bp.route("/tags", methods=["GET"])
@jwt_required()
def list_tags():
    """List all tags for the current user."""
    user_id = int(get_jwt_identity())
    tags = NoteTag.query.filter_by(user_id=user_id).order_by(NoteTag.name).all()
    return json_response([tag.to_dict() for tag in tags])


@notes_bp.route("/tags", methods=["POST"])
@jwt_required()
def create_tag():
    """Create a new tag."""
    user_id = int(get_jwt_identity())
    payload = request.get_json() or {}
    
    name = (payload.get("name") or "").strip()
    if not name:
        return json_response(error={"code": "INVALID_INPUT", "message": "Tag name is required"}, status=400)
    
    color = payload.get("color", "#5f8d4e")
    
    # Check for duplicate
    existing = NoteTag.query.filter_by(user_id=user_id, name=name).first()
    if existing:
        return json_response(error={"code": "DUPLICATE", "message": "Tag already exists"}, status=409)
    
    tag = NoteTag(user_id=user_id, name=name, color=color)
    db.session.add(tag)
    db.session.commit()
    
    return json_response(tag.to_dict()), 201


@notes_bp.route("/tags/<int:tag_id>", methods=["DELETE"])
@jwt_required()
def delete_tag(tag_id: int):
    """Delete a tag."""
    user_id = int(get_jwt_identity())
    tag = NoteTag.query.filter_by(id=tag_id, user_id=user_id).first()
    
    if not tag:
        return json_response(error={"code": "NOT_FOUND", "message": "Tag not found"}, status=404)
    
    db.session.delete(tag)
    db.session.commit()
    
    return json_response({"message": "Tag deleted"})


# --- Note-Quiz Links ---

@notes_bp.route("/<int:note_id>/quizzes", methods=["GET"])
@jwt_required()
def get_note_quizzes(note_id: int):
    """Get all quizzes generated from a specific note."""
    user_id = int(get_jwt_identity())
    note = Note.query.filter_by(id=note_id, user_id=user_id).first()
    
    if not note:
        return json_response(error={"code": "NOT_FOUND", "message": "Note not found"}, status=404)
    
    links = QuizSourceLink.query.filter_by(source_type="note", source_id=note_id).all()
    quiz_ids = [link.quiz_id for link in links]
    quizzes = Quiz.query.filter(Quiz.id.in_(quiz_ids), Quiz.user_id == user_id).all()
    
    return json_response([quiz.to_dict() for quiz in quizzes])


# --- Note Review (Spaced Repetition) ---

@notes_bp.route("/<int:note_id>/mark-reviewed", methods=["POST"])
@jwt_required()
def mark_note_reviewed(note_id: int):
    """
    Mark a note as reviewed for spaced repetition tracking.
    Awards XP and schedules next review date.
    """
    user_id = int(get_jwt_identity())
    note = Note.query.filter_by(id=note_id, user_id=user_id).first()
    
    if not note:
        return json_response(error={"code": "NOT_FOUND", "message": "Note not found"}, status=404)
    
    result = GamificationService.mark_note_reviewed(user_id, note_id)
    return json_response(result)


@notes_bp.route("/due-for-review", methods=["GET"])
@jwt_required()
def get_notes_due_for_review():
    """Get all notes that are due for review based on spaced repetition."""
    user_id = int(get_jwt_identity())
    
    notes_due = GamificationService.get_notes_due_for_review(user_id)
    return json_response({"notes": notes_due})


@notes_bp.route("/unreviewed", methods=["GET"])
@jwt_required()
def get_unreviewed_notes():
    """Get notes that have never been reviewed."""
    user_id = int(get_jwt_identity())
    
    # Get all note IDs that have been reviewed
    reviewed_note_ids = db.session.query(NoteReview.note_id).filter_by(user_id=user_id).all()
    reviewed_ids = [r[0] for r in reviewed_note_ids]
    
    # Get notes that haven't been reviewed
    unreviewed = Note.query.filter(
        Note.user_id == user_id,
        ~Note.id.in_(reviewed_ids) if reviewed_ids else True
    ).order_by(Note.created_at.desc()).limit(20).all()
    
    return json_response({"notes": [n.to_list_dict() for n in unreviewed]})


@notes_bp.route("/random", methods=["GET"])
@jwt_required()
def get_random_note():
    """Get a random note for review - helps resurface forgotten material."""
    user_id = int(get_jwt_identity())
    
    from sqlalchemy.sql.expression import func
    note = Note.query.filter_by(user_id=user_id).order_by(func.random()).first()
    
    if not note:
        return json_response(error={"code": "NO_NOTES", "message": "No notes found"}, status=404)
    
    # Get review info if it exists
    review = NoteReview.query.filter_by(user_id=user_id, note_id=note.id).first()
    
    return json_response({
        "note": note.to_dict(include_content=True),
        "review_info": review.to_dict() if review else None,
    })


# --- Note Linking (Wiki-style) ---

@notes_bp.route("/<int:note_id>/links", methods=["GET"])
@jwt_required()
def get_note_links(note_id: int):
    """Get all notes linked to/from this note."""
    user_id = int(get_jwt_identity())
    note = Note.query.filter_by(id=note_id, user_id=user_id).first()
    
    if not note:
        return json_response(error={"code": "NOT_FOUND", "message": "Note not found"}, status=404)
    
    # Get outgoing links (notes this note links to)
    outgoing = NoteLink.query.filter_by(source_note_id=note_id).all()
    outgoing_notes = []
    for link in outgoing:
        target = Note.query.filter_by(id=link.target_note_id, user_id=user_id).first()
        if target:
            outgoing_notes.append({
                "link_id": link.id,
                "link_type": link.link_type,
                "note": target.to_list_dict(),
            })
    
    # Get incoming links (notes that link to this note - backlinks)
    incoming = NoteLink.query.filter_by(target_note_id=note_id).all()
    incoming_notes = []
    for link in incoming:
        source = Note.query.filter_by(id=link.source_note_id, user_id=user_id).first()
        if source:
            incoming_notes.append({
                "link_id": link.id,
                "link_type": link.link_type,
                "note": source.to_list_dict(),
            })
    
    return json_response({
        "outgoing": outgoing_notes,
        "incoming": incoming_notes,  # backlinks
    })


@notes_bp.route("/<int:note_id>/links", methods=["POST"])
@jwt_required()
def create_note_link(note_id: int):
    """
    Create a link from this note to another note.
    
    Body:
    {
        "target_note_id": 123,
        "link_type": "reference" | "parent" | "related"
    }
    """
    user_id = int(get_jwt_identity())
    
    source_note = Note.query.filter_by(id=note_id, user_id=user_id).first()
    if not source_note:
        return json_response(error={"code": "NOT_FOUND", "message": "Source note not found"}, status=404)
    
    payload = request.get_json() or {}
    target_note_id = payload.get("target_note_id")
    link_type = payload.get("link_type", "reference")
    
    if not target_note_id:
        return json_response(error={"code": "INVALID_INPUT", "message": "target_note_id is required"}, status=400)
    
    if target_note_id == note_id:
        return json_response(error={"code": "INVALID_INPUT", "message": "Cannot link note to itself"}, status=400)
    
    target_note = Note.query.filter_by(id=target_note_id, user_id=user_id).first()
    if not target_note:
        return json_response(error={"code": "NOT_FOUND", "message": "Target note not found"}, status=404)
    
    # Check for existing link
    existing = NoteLink.query.filter_by(source_note_id=note_id, target_note_id=target_note_id).first()
    if existing:
        return json_response(error={"code": "DUPLICATE", "message": "Link already exists"}, status=409)
    
    link = NoteLink(
        source_note_id=note_id,
        target_note_id=target_note_id,
        link_type=link_type,
    )
    db.session.add(link)
    db.session.commit()
    
    return json_response({
        "link": link.to_dict(),
        "target_note": target_note.to_list_dict(),
    }), 201


@notes_bp.route("/<int:note_id>/links/<int:link_id>", methods=["DELETE"])
@jwt_required()
def delete_note_link(note_id: int, link_id: int):
    """Delete a note link."""
    user_id = int(get_jwt_identity())
    
    # Verify ownership
    source_note = Note.query.filter_by(id=note_id, user_id=user_id).first()
    if not source_note:
        return json_response(error={"code": "NOT_FOUND", "message": "Note not found"}, status=404)
    
    link = NoteLink.query.filter_by(id=link_id, source_note_id=note_id).first()
    if not link:
        return json_response(error={"code": "NOT_FOUND", "message": "Link not found"}, status=404)
    
    db.session.delete(link)
    db.session.commit()
    
    return json_response({"message": "Link deleted"})


@notes_bp.route("/search-for-link", methods=["GET"])
@jwt_required()
def search_notes_for_linking():
    """
    Search notes by title for linking purposes.
    Used by the wiki-link autocomplete in the editor.
    """
    user_id = int(get_jwt_identity())
    query = request.args.get("q", "").strip()
    exclude_id = request.args.get("exclude", type=int)
    
    if not query or len(query) < 2:
        return json_response({"notes": []})
    
    notes_query = Note.query.filter(
        Note.user_id == user_id,
        Note.title.ilike(f"%{query}%")
    )
    
    if exclude_id:
        notes_query = notes_query.filter(Note.id != exclude_id)
    
    notes = notes_query.limit(10).all()
    
    return json_response({
        "notes": [{"id": n.id, "title": n.title} for n in notes]
    })


# --- Advanced Search ---

@notes_bp.route("/search", methods=["POST"])
@jwt_required()
def advanced_search():
    """
    Advanced search with filters.
    
    Body:
    {
        "query": "search text",
        "tag_ids": [1, 2, 3],
        "created_after": "2024-01-01",
        "created_before": "2024-12-31",
        "updated_after": "2024-01-01",
        "has_quiz": true/false,
        "sort_by": "updated_at" | "created_at" | "title",
        "sort_order": "asc" | "desc",
        "limit": 50
    }
    """
    user_id = int(get_jwt_identity())
    payload = request.get_json() or {}
    
    query_text = payload.get("query", "").strip()
    tag_ids = payload.get("tag_ids", [])
    created_after = payload.get("created_after")
    created_before = payload.get("created_before")
    updated_after = payload.get("updated_after")
    has_quiz = payload.get("has_quiz")
    sort_by = payload.get("sort_by", "updated_at")
    sort_order = payload.get("sort_order", "desc")
    limit = min(payload.get("limit", 50), 100)
    
    # Build query
    notes_query = Note.query.filter(Note.user_id == user_id)
    
    # Text search
    if query_text:
        search_pattern = f"%{query_text}%"
        notes_query = notes_query.filter(
            db.or_(
                Note.title.ilike(search_pattern),
                Note.plaintext_cache.ilike(search_pattern),
            )
        )
    
    # Tag filter
    if tag_ids:
        notes_query = notes_query.join(Note.tags).filter(NoteTag.id.in_(tag_ids))
    
    # Date filters
    from datetime import datetime as dt
    if created_after:
        try:
            notes_query = notes_query.filter(Note.created_at >= dt.fromisoformat(created_after))
        except ValueError:
            pass
    
    if created_before:
        try:
            notes_query = notes_query.filter(Note.created_at <= dt.fromisoformat(created_before))
        except ValueError:
            pass
    
    if updated_after:
        try:
            notes_query = notes_query.filter(Note.updated_at >= dt.fromisoformat(updated_after))
        except ValueError:
            pass
    
    # Has quiz filter
    if has_quiz is not None:
        quiz_note_ids = db.session.query(QuizSourceLink.source_id).filter(
            QuizSourceLink.source_type == "note"
        ).distinct()
        if has_quiz:
            notes_query = notes_query.filter(Note.id.in_(quiz_note_ids))
        else:
            notes_query = notes_query.filter(~Note.id.in_(quiz_note_ids))
    
    # Sorting
    sort_column = {
        "updated_at": Note.updated_at,
        "created_at": Note.created_at,
        "title": Note.title,
    }.get(sort_by, Note.updated_at)
    
    if sort_order == "asc":
        notes_query = notes_query.order_by(sort_column.asc())
    else:
        notes_query = notes_query.order_by(sort_column.desc())
    
    notes = notes_query.limit(limit).all()
    
    return json_response({
        "notes": [n.to_list_dict() for n in notes],
        "count": len(notes),
    })
