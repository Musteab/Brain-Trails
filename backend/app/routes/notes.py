from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from ..ai.summary import generate_summary
from ..extensions import db
from ..models import Note, Tag

notes_bp = Blueprint("notes", __name__, url_prefix="/api/notes")


@notes_bp.route("", methods=["GET"])
@jwt_required()
def list_notes():
    user_id = int(get_jwt_identity())
    notes = (
        Note.query.filter_by(user_id=user_id).order_by(Note.updated_at.desc()).all()
    )
    return jsonify([note.to_dict() for note in notes])


@notes_bp.route("", methods=["POST"])
@jwt_required()
def create_note():
    user_id = int(get_jwt_identity())
    payload = request.get_json() or {}
    title = (payload.get("title") or "").strip()
    content = (payload.get("content") or "").strip()
    if not title or not content:
        return jsonify({"error": "title and content are required"}), 400
    note = Note(user_id=user_id, title=title, content=content, summary=payload.get("summary"))
    db.session.add(note)
    db.session.flush()
    _sync_tags(note, payload.get("tags", []))
    db.session.commit()
    return jsonify(note.to_dict()), 201


@notes_bp.route("/<int:note_id>", methods=["PUT"])
@jwt_required()
def update_note(note_id: int):
    user_id = int(get_jwt_identity())
    note = Note.query.filter_by(id=note_id, user_id=user_id).first_or_404()
    payload = request.get_json() or {}
    note.title = payload.get("title", note.title)
    note.content = payload.get("content", note.content)
    note.summary = payload.get("summary", note.summary)
    _sync_tags(note, payload.get("tags", None))
    db.session.commit()
    return jsonify(note.to_dict())


@notes_bp.route("/<int:note_id>", methods=["DELETE"])
@jwt_required()
def delete_note(note_id: int):
    user_id = int(get_jwt_identity())
    note = Note.query.filter_by(id=note_id, user_id=user_id).first_or_404()
    db.session.delete(note)
    db.session.commit()
    return jsonify({"message": "Note removed"})


@notes_bp.route("/<int:note_id>/summaries", methods=["POST"])
@jwt_required()
def summarize_note(note_id: int):
    user_id = int(get_jwt_identity())
    note = Note.query.filter_by(id=note_id, user_id=user_id).first_or_404()
    summary = generate_summary(note.content)
    note.summary = summary
    db.session.commit()
    return jsonify({"summary": summary})


@notes_bp.route("/summarize", methods=["POST"])
@jwt_required()
def summarize_raw_text():
    payload = request.get_json() or {}
    content = (payload.get("content") or "").strip()
    if not content:
        return jsonify({"error": "content is required"}), 400
    summary = generate_summary(content)
    return jsonify({"summary": summary})


def _sync_tags(note: Note, tags_payload):
    if tags_payload is None:
        return
    note.tags.clear()
    for tag in tags_payload:
        tag_name = tag
        if isinstance(tag, dict):
            tag_name = tag.get("name")
        if not tag_name:
            continue
        tag = Tag.query.filter_by(name=tag_name).first()
        if not tag:
            tag = Tag(name=tag_name)
            db.session.add(tag)
        note.tags.append(tag)
