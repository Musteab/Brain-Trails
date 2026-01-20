from flask import Blueprint, jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required

from ..services.analytics import study_session_stats, user_overview

stats_bp = Blueprint("stats", __name__, url_prefix="/api/stats")


@stats_bp.route("/overview", methods=["GET"])
@jwt_required()
def overview():
    user_id = int(get_jwt_identity())
    return jsonify(user_overview(user_id))


@stats_bp.route("/study", methods=["GET"])
@jwt_required()
def study():
    user_id = int(get_jwt_identity())
    return jsonify(study_session_stats(user_id))
