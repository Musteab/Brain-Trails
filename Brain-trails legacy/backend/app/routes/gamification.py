"""Gamification API routes."""
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from ..extensions import db
from ..services.gamification import (
    GamificationService,
    award_xp_for_note_created,
    award_xp_for_quiz_completed,
    award_xp_for_flashcard_review,
    award_xp_for_session_completed,
)
from ..models.gamification import (
    ActivityType,
    UserGamification,
    UserReward,
    UserPet,
    StudyActivity,
)

bp = Blueprint("gamification", __name__, url_prefix="/api/gamification")


def json_response(data: dict, status: int = 200):
    """Helper to create JSON responses."""
    from flask import make_response, jsonify
    response = make_response(jsonify(data), status)
    response.headers["Content-Type"] = "application/json"
    return response


@bp.route("/stats", methods=["GET"])
@jwt_required()
def get_stats():
    """Get all gamification stats for the current user."""
    user_id = get_jwt_identity()
    stats = GamificationService.get_user_stats(user_id)
    return json_response(stats)


@bp.route("/award-xp", methods=["POST"])
@jwt_required()
def award_xp():
    """
    Award XP to the current user for an activity.
    
    Request body:
    {
        "activity_type": "note_created|quiz_completed|flashcard_reviewed|...",
        "note_id": optional,
        "quiz_id": optional,
        "deck_id": optional,
        "session_id": optional,
        "duration_minutes": optional,
        "score": optional (for quizzes),
        "correct": optional (for flashcards),
        "multiplier": optional (default 1.0)
    }
    """
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    
    activity_type_str = data.get("activity_type")
    if not activity_type_str:
        return json_response({"error": "activity_type is required"}, 400)
    
    try:
        activity_type = ActivityType(activity_type_str)
    except ValueError:
        return json_response({"error": f"Invalid activity_type: {activity_type_str}"}, 400)
    
    # Use convenience functions for common activities
    if activity_type == ActivityType.NOTE_CREATED and data.get("note_id"):
        result = award_xp_for_note_created(user_id, data["note_id"])
    elif activity_type in [ActivityType.QUIZ_COMPLETED, ActivityType.QUIZ_PERFECT] and data.get("quiz_id"):
        result = award_xp_for_quiz_completed(
            user_id,
            data["quiz_id"],
            data.get("score", 0),
            data.get("duration_minutes", 0),
        )
    elif activity_type in [ActivityType.FLASHCARD_REVIEWED, ActivityType.FLASHCARD_CORRECT] and data.get("deck_id"):
        result = award_xp_for_flashcard_review(
            user_id,
            data["deck_id"],
            data.get("correct", False),
            data.get("duration_minutes"),
        )
    elif activity_type == ActivityType.SESSION_COMPLETED and data.get("session_id"):
        result = award_xp_for_session_completed(
            user_id,
            data["session_id"],
            data.get("duration_minutes", 0),
        )
    else:
        # Generic XP award
        result = GamificationService.award_xp(
            user_id=user_id,
            activity_type=activity_type,
            multiplier=data.get("multiplier", 1.0),
            note_id=data.get("note_id"),
            quiz_id=data.get("quiz_id"),
            deck_id=data.get("deck_id"),
            session_id=data.get("session_id"),
            duration_minutes=data.get("duration_minutes"),
            extra_metadata=data.get("metadata"),
        )
    
    return json_response(result)


@bp.route("/activity-history", methods=["GET"])
@jwt_required()
def get_activity_history():
    """Get recent activity history for the current user."""
    user_id = get_jwt_identity()
    limit = request.args.get("limit", 50, type=int)
    
    # Optional filter by activity types
    types_param = request.args.get("types")
    activity_types = None
    if types_param:
        try:
            activity_types = [ActivityType(t.strip()) for t in types_param.split(",")]
        except ValueError:
            pass
    
    history = GamificationService.get_activity_history(user_id, limit, activity_types)
    return json_response({"activities": history})


@bp.route("/rewards", methods=["GET"])
@jwt_required()
def get_rewards():
    """Get all unlocked rewards for the current user."""
    user_id = get_jwt_identity()
    rewards = UserReward.query.filter_by(user_id=user_id).all()
    return json_response({"rewards": [r.to_dict() for r in rewards]})


@bp.route("/pet", methods=["GET"])
@jwt_required()
def get_pet():
    """Get the current user's active pet."""
    user_id = get_jwt_identity()
    pet = UserPet.query.filter_by(user_id=user_id, is_active=True).first()
    
    if not pet:
        return json_response({"error": "No active pet found"}, 404)
    
    return json_response({"pet": pet.to_dict()})


@bp.route("/pet/feed", methods=["POST"])
@jwt_required()
def feed_pet():
    """Feed the current user's active pet."""
    user_id = get_jwt_identity()
    result = GamificationService.feed_pet(user_id)
    
    if "error" in result:
        return json_response(result, 404)
    
    return json_response(result)


@bp.route("/pet/play", methods=["POST"])
@jwt_required()
def play_with_pet():
    """Play with the current user's active pet."""
    user_id = get_jwt_identity()
    result = GamificationService.play_with_pet(user_id)
    
    if "error" in result:
        return json_response(result, 404)
    
    return json_response(result)


@bp.route("/pet/rename", methods=["POST"])
@jwt_required()
def rename_pet():
    """Rename the current user's active pet."""
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    
    new_name = data.get("name", "").strip()
    if not new_name or len(new_name) > 32:
        return json_response({"error": "Name must be 1-32 characters"}, 400)
    
    pet = UserPet.query.filter_by(user_id=user_id, is_active=True).first()
    if not pet:
        return json_response({"error": "No active pet found"}, 404)
    
    pet.name = new_name
    db.session.commit()
    
    return json_response({"pet": pet.to_dict()})


@bp.route("/pet/accessory", methods=["POST"])
@jwt_required()
def set_pet_accessory():
    """Set or remove the active accessory for the pet."""
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    
    accessory_id = data.get("accessory_id")  # None to remove
    
    pet = UserPet.query.filter_by(user_id=user_id, is_active=True).first()
    if not pet:
        return json_response({"error": "No active pet found"}, 404)
    
    # Verify user has this accessory unlocked
    if accessory_id:
        reward = UserReward.query.filter_by(
            user_id=user_id,
            reward_id=accessory_id,
        ).first()
        if not reward:
            return json_response({"error": "Accessory not unlocked"}, 403)
    
    pet.active_accessory = accessory_id
    db.session.commit()
    
    return json_response({"pet": pet.to_dict()})


@bp.route("/pets", methods=["GET"])
@jwt_required()
def get_all_pets():
    """Get all pets owned by the current user."""
    user_id = get_jwt_identity()
    pets = UserPet.query.filter_by(user_id=user_id).all()
    return json_response({"pets": [p.to_dict() for p in pets]})


@bp.route("/pets/<int:pet_id>/activate", methods=["POST"])
@jwt_required()
def activate_pet(pet_id: int):
    """Set a pet as the active pet."""
    user_id = get_jwt_identity()
    
    pet = UserPet.query.filter_by(id=pet_id, user_id=user_id).first()
    if not pet:
        return json_response({"error": "Pet not found"}, 404)
    
    # Deactivate current pet
    UserPet.query.filter_by(user_id=user_id, is_active=True).update({"is_active": False})
    
    # Activate new pet
    pet.is_active = True
    db.session.commit()
    
    return json_response({"pet": pet.to_dict()})


@bp.route("/boss/start", methods=["POST"])
@jwt_required()
def start_boss():
    """Start a boss challenge."""
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    
    boss_id = data.get("boss_id")
    if not boss_id:
        return json_response({"error": "boss_id is required"}, 400)
    
    result = GamificationService.start_boss_challenge(user_id, boss_id)
    
    if "error" in result:
        return json_response(result, 400)
    
    return json_response(result)


@bp.route("/boss", methods=["GET"])
@jwt_required()
def get_boss_status():
    """Get current boss challenge status."""
    user_id = get_jwt_identity()
    
    gamification = GamificationService.get_or_create_user_gamification(user_id)
    
    if not gamification.current_boss_id:
        return json_response({"boss": None})
    
    from ..models.gamification import BOSS_CHALLENGES
    boss_data = BOSS_CHALLENGES.get(gamification.current_boss_id, {})
    
    return json_response({
        "boss": {
            "id": gamification.current_boss_id,
            "name": boss_data.get("name", "Unknown"),
            "description": boss_data.get("description", ""),
            "health": gamification.boss_health,
            "max_health": gamification.boss_max_health,
            "health_percent": (gamification.boss_health / gamification.boss_max_health * 100) if gamification.boss_max_health else 0,
        }
    })


@bp.route("/leaderboard", methods=["GET"])
@jwt_required()
def get_leaderboard():
    """Get the XP leaderboard (top users)."""
    limit = request.args.get("limit", 10, type=int)
    
    # Get top users by lifetime XP
    top_users = db.session.query(
        UserGamification.user_id,
        UserGamification.lifetime_xp,
        UserGamification.level,
        UserGamification.current_streak,
    ).order_by(
        UserGamification.lifetime_xp.desc()
    ).limit(limit).all()
    
    # Get user info
    from ..models import User
    leaderboard = []
    for i, entry in enumerate(top_users):
        user = User.query.get(entry.user_id)
        if user:
            leaderboard.append({
                "rank": i + 1,
                "user_id": entry.user_id,
                "username": user.username,
                "display_name": user.display_name or user.username,
                "lifetime_xp": entry.lifetime_xp,
                "level": entry.level,
                "current_streak": entry.current_streak,
            })
    
    return json_response({"leaderboard": leaderboard})


@bp.route("/daily-goal", methods=["PUT"])
@jwt_required()
def update_daily_goal():
    """Update the user's daily study goal."""
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    
    minutes = data.get("minutes")
    if not minutes or not isinstance(minutes, int) or minutes < 5 or minutes > 480:
        return json_response({"error": "minutes must be between 5 and 480"}, 400)
    
    gamification = GamificationService.get_or_create_user_gamification(user_id)
    gamification.daily_goal_minutes = minutes
    db.session.commit()
    
    return json_response({"daily_goal_minutes": gamification.daily_goal_minutes})
