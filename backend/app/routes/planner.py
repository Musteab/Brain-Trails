from datetime import datetime

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from ..extensions import db
from ..models import StudySession

planner_bp = Blueprint("planner", __name__, url_prefix="/api/planner")


@planner_bp.route("/sessions", methods=["GET"])
@jwt_required()
def list_sessions():
    user_id = int(get_jwt_identity())
    sessions = (
        StudySession.query.filter_by(user_id=user_id)
        .order_by(StudySession.start_time.desc())
        .all()
    )
    return jsonify([session.to_dict() for session in sessions])


@planner_bp.route("/sessions", methods=["POST"])
@jwt_required()
def create_session():
    user_id = int(get_jwt_identity())
    payload = request.get_json() or {}
    start_time = _parse_datetime(payload.get("start_time"))
    session = StudySession(
        user_id=user_id,
        start_time=start_time or datetime.utcnow(),
        end_time=_parse_datetime(payload.get("end_time")),
        duration=payload.get("duration"),
        focus_score=payload.get("focus_score"),
        session_type=payload.get("session_type", "focus"),
        notes=payload.get("notes"),
    )
    db.session.add(session)
    db.session.commit()
    return jsonify(session.to_dict()), 201


@planner_bp.route("/sessions/<int:session_id>", methods=["PUT"])
@jwt_required()
def update_session(session_id: int):
    user_id = int(get_jwt_identity())
    session = StudySession.query.filter_by(id=session_id, user_id=user_id).first_or_404()
    payload = request.get_json() or {}
    if "start_time" in payload:
        session.start_time = _parse_datetime(payload["start_time"]) or session.start_time
    if "end_time" in payload:
        session.end_time = _parse_datetime(payload["end_time"])
    if "duration" in payload:
        session.duration = payload["duration"]
    if "focus_score" in payload:
        session.focus_score = payload["focus_score"]
    if "notes" in payload:
        session.notes = payload["notes"]
    if "session_type" in payload:
        session.session_type = payload["session_type"]

    # Auto-calc duration when end_time is set
    if session.start_time and session.end_time and not payload.get("duration"):
        delta = session.end_time - session.start_time
        session.duration = int(delta.total_seconds() // 60)

    db.session.commit()
    return jsonify(session.to_dict())


@planner_bp.route("/sessions/<int:session_id>", methods=["DELETE"])
@jwt_required()
def delete_session(session_id: int):
    user_id = int(get_jwt_identity())
    session = StudySession.query.filter_by(id=session_id, user_id=user_id).first_or_404()
    db.session.delete(session)
    db.session.commit()
    return jsonify({"message": "Session deleted"})


def _parse_datetime(value):
    if not value:
        return None
    if isinstance(value, datetime):
        return value
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except Exception:
        return None
