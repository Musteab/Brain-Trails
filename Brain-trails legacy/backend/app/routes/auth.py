from http import HTTPStatus

from flask import Blueprint, jsonify, request
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    get_jwt_identity,
    jwt_required,
)

from ..extensions import db
from ..models import User
from ..models.profile import UserPreferences

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/register", methods=["POST"])
def register():
    payload = request.get_json() or {}
    username = (payload.get("username") or "").strip()
    email = (payload.get("email") or "").strip().lower()
    password = payload.get("password")

    if not username or not email or not password:
        return jsonify({"error": "username, email, and password are required"}), 400
    if len(username) < 3 or len(username) > 30:
        return jsonify({"error": "Username must be between 3 and 30 characters"}), 400
    if "@" not in email or "." not in email or len(email) > 120:
        return jsonify({"error": "Invalid email address"}), 400
    if len(password) < 8 or len(password) > 128:
        return jsonify({"error": "Password must be between 8 and 128 characters"}), 400
    if User.query.filter((User.username == username) | (User.email == email)).first():
        return jsonify({"error": "Username or email already exists"}), 409

    user = User(username=username, email=email, display_name=username)
    user.set_password(password)
    db.session.add(user)
    db.session.flush()
    # Create default preferences for new user
    preference = UserPreferences(user_id=user.id)
    db.session.add(preference)
    db.session.commit()

    return jsonify({"message": "Account created. You can now log in."}), HTTPStatus.CREATED


@auth_bp.route("/login", methods=["POST"])
def login():
    payload = request.get_json() or {}
    identifier = (payload.get("username") or payload.get("email") or "").strip()
    password = payload.get("password")
    if not identifier or not password:
        return jsonify({"error": "username/email and password are required"}), 400
    if len(identifier) > 120:
        return jsonify({"error": "Identifier too long"}), 400
    if len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters"}), 400

    user = (
        User.query.filter((User.username == identifier) | (User.email == identifier.lower()))
        .limit(1)
        .first()
    )
    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid credentials"}), 401

    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))

    return (
        jsonify(
            {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "user": user.to_safe_dict(),
            }
        ),
        200,
    )


@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh_token():
    """
    Exchange a valid refresh token for new access & refresh tokens.
    """
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), HTTPStatus.UNAUTHORIZED

    new_access = create_access_token(identity=str(user.id))
    new_refresh = create_refresh_token(identity=str(user.id))

    return (
        jsonify(
            {
                "access_token": new_access,
                "refresh_token": new_refresh,
                "user": user.to_safe_dict(),
            }
        ),
        HTTPStatus.OK,
    )


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def current_user():
    user = User.query.get_or_404(int(get_jwt_identity()))
    preferences = (
        UserPreferences.query.filter_by(user_id=user.id).first()
        or UserPreferences(user_id=user.id)
    )
    return jsonify({"user": user.to_safe_dict(), "preferences": preferences.to_dict()})


@auth_bp.route("/preferences", methods=["PUT"])
@jwt_required()
def update_preferences():
    user_id = int(get_jwt_identity())
    payload = request.get_json() or {}
    prefs = UserPreferences.query.filter_by(user_id=user_id).first()
    if not prefs:
        prefs = UserPreferences(user_id=user_id)
        db.session.add(prefs)
    # Map old fields to new UserPreferences model
    if "theme" in payload:
        prefs.theme_mode = payload["theme"]
    if "daily_goal_minutes" in payload:
        prefs.daily_goal_minutes = payload["daily_goal_minutes"]
    if "notifications_enabled" in payload:
        prefs.notifications_enabled = payload["notifications_enabled"]
    # New fields supported
    if "pomodoro_duration" in payload:
        prefs.pomodoro_duration = payload["pomodoro_duration"]
    if "short_break" in payload:
        prefs.short_break = payload["short_break"]
    if "long_break" in payload:
        prefs.long_break = payload["long_break"]
    if "auto_start_breaks" in payload:
        prefs.auto_start_breaks = payload["auto_start_breaks"]
    if "play_sound_on_complete" in payload:
        prefs.play_sound_on_complete = payload["play_sound_on_complete"]
    if "editor_font_size" in payload:
        prefs.editor_font_size = payload["editor_font_size"]
    if "editor_autosave" in payload:
        prefs.editor_autosave = payload["editor_autosave"]
    if "spell_check" in payload:
        prefs.spell_check = payload["spell_check"]
    if "cards_per_session" in payload:
        prefs.cards_per_session = payload["cards_per_session"]
    if "default_room" in payload:
        prefs.default_room = payload["default_room"]
    db.session.commit()
    return jsonify({"preferences": prefs.to_dict()})
