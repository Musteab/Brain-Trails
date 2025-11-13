from http import HTTPStatus

from flask import Blueprint, jsonify, request
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    get_jwt_identity,
    jwt_required,
)

from ..extensions import db
from ..models import User, UserPreference

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/register", methods=["POST"])
def register():
    payload = request.get_json() or {}
    username = (payload.get("username") or "").strip()
    email = (payload.get("email") or "").strip().lower()
    password = payload.get("password")

    if not username or not email or not password:
        return jsonify({"error": "username, email, and password are required"}), 400
    if len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters"}), 400
    if User.query.filter((User.username == username) | (User.email == email)).first():
        return jsonify({"error": "Username or email already exists"}), 409

    user = User(username=username, email=email, display_name=username)
    user.set_password(password)
    db.session.add(user)
    db.session.flush()
    preference = UserPreference(user_id=user.id)
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


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def current_user():
    user = User.query.get_or_404(int(get_jwt_identity()))
    preferences = (
        UserPreference.query.filter_by(user_id=user.id).first()
        or UserPreference(user_id=user.id)
    )
    return jsonify({"user": user.to_safe_dict(), "preferences": preferences.to_dict()})


@auth_bp.route("/preferences", methods=["PUT"])
@jwt_required()
def update_preferences():
    user_id = int(get_jwt_identity())
    payload = request.get_json() or {}
    prefs = UserPreference.query.filter_by(user_id=user_id).first()
    if not prefs:
        prefs = UserPreference(user_id=user_id)
        db.session.add(prefs)
    prefs.theme = payload.get("theme", prefs.theme)
    prefs.focus_music = payload.get("focus_music", prefs.focus_music)
    prefs.daily_goal_minutes = payload.get(
        "daily_goal_minutes", prefs.daily_goal_minutes
    )
    prefs.notifications_enabled = payload.get(
        "notifications_enabled", prefs.notifications_enabled
    )
    db.session.commit()
    return jsonify({"preferences": prefs.to_dict()})
