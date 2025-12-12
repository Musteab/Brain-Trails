from flask import Flask

from .analytics import bp as analytics_bp
from .auth import auth_bp
from .brainrot import brainrot_bp
from .dashboard import dashboard_bp
from .flashcards import flashcards_bp
from .gamification import bp as gamification_bp
from .notes import notes_bp
from .planner import planner_bp
from .profile import profile_bp
from .quizzes import quizzes_bp
from .settings import settings_bp
from .stats import stats_bp


def register_blueprints(app: Flask) -> None:
    for blueprint in (
        auth_bp,
        brainrot_bp,
        dashboard_bp,
        flashcards_bp,
        notes_bp,
        profile_bp,
        quizzes_bp,
        planner_bp,
        settings_bp,
        stats_bp,
        gamification_bp,
        analytics_bp,
    ):
        app.register_blueprint(blueprint)
