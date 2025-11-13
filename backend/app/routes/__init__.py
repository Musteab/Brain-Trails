from flask import Flask

from .auth import auth_bp
from .flashcards import flashcards_bp
from .notes import notes_bp
from .planner import planner_bp
from .quizzes import quizzes_bp
from .stats import stats_bp


def register_blueprints(app: Flask) -> None:
    for blueprint in (
        auth_bp,
        flashcards_bp,
        notes_bp,
        quizzes_bp,
        planner_bp,
        stats_bp,
    ):
        app.register_blueprint(blueprint)
