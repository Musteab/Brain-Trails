"""Analytics API routes."""
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from ..services.analytics import AnalyticsService, user_overview, study_session_stats

bp = Blueprint("analytics", __name__, url_prefix="/api/analytics")


def json_response(data: dict, status: int = 200):
    """Helper to create JSON responses."""
    from flask import make_response, jsonify
    response = make_response(jsonify(data), status)
    response.headers["Content-Type"] = "application/json"
    return response


@bp.route("/overview", methods=["GET"])
@jwt_required()
def get_overview():
    """Get user overview stats (backward compatible)."""
    user_id = get_jwt_identity()
    return json_response(user_overview(user_id))


@bp.route("/sessions", methods=["GET"])
@jwt_required()
def get_session_stats():
    """Get study session stats (backward compatible)."""
    user_id = get_jwt_identity()
    return json_response(study_session_stats(user_id))


@bp.route("/heatmap", methods=["GET"])
@jwt_required()
def get_heatmap():
    """
    Get GitHub-style study activity heatmap.
    
    Query params:
    - days: Number of days to include (default: 365)
    """
    user_id = get_jwt_identity()
    days = request.args.get("days", 365, type=int)
    
    # Cap at 2 years
    days = min(days, 730)
    
    heatmap_data = AnalyticsService.get_study_heatmap(user_id, days)
    return json_response(heatmap_data)


@bp.route("/breakdown", methods=["GET"])
@jwt_required()
def get_breakdown():
    """
    Get time breakdown by tag/topic and activity type.
    
    Query params:
    - days: Number of days to analyze (default: 30)
    """
    user_id = get_jwt_identity()
    days = request.args.get("days", 30, type=int)
    
    breakdown = AnalyticsService.get_time_breakdown(user_id, days)
    return json_response(breakdown)


@bp.route("/quizzes", methods=["GET"])
@jwt_required()
def get_quiz_performance():
    """
    Get quiz performance trends.
    
    Query params:
    - days: Number of days to analyze (default: 30)
    """
    user_id = get_jwt_identity()
    days = request.args.get("days", 30, type=int)
    
    performance = AnalyticsService.get_quiz_performance(user_id, days)
    return json_response(performance)


@bp.route("/flashcards", methods=["GET"])
@jwt_required()
def get_flashcard_stats():
    """Get flashcard mastery statistics."""
    user_id = get_jwt_identity()
    
    stats = AnalyticsService.get_flashcard_stats(user_id)
    return json_response(stats)


@bp.route("/insights", methods=["GET"])
@jwt_required()
def get_insights():
    """Get AI-generated study insights."""
    user_id = get_jwt_identity()
    
    insights = AnalyticsService.get_study_insights(user_id)
    return json_response({"insights": insights})


@bp.route("/weekly-summary", methods=["GET"])
@jwt_required()
def get_weekly_summary():
    """Get summary of the past week's study activity."""
    user_id = get_jwt_identity()
    
    summary = AnalyticsService.get_weekly_summary(user_id)
    return json_response(summary)


@bp.route("/all", methods=["GET"])
@jwt_required()
def get_all_analytics():
    """
    Get all analytics data in one request.
    Useful for dashboard loading.
    """
    user_id = get_jwt_identity()
    
    return json_response({
        "overview": user_overview(user_id),
        "sessions": study_session_stats(user_id),
        "quiz_performance": AnalyticsService.get_quiz_performance(user_id, 30),
        "flashcard_stats": AnalyticsService.get_flashcard_stats(user_id),
        "insights": AnalyticsService.get_study_insights(user_id),
        "weekly_summary": AnalyticsService.get_weekly_summary(user_id),
    })
