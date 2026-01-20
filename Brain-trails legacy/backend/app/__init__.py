import os
from typing import List, Optional

from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

from config import get_config
from .extensions import db, jwt, migrate
from .routes import register_blueprints

load_dotenv()


def _parse_origins(origins: str) -> List[str]:
    return [origin.strip() for origin in origins.split(",") if origin.strip()]


def create_app(config_name: Optional[str] = None) -> Flask:
    """Application factory used by Flask CLI and tests."""
    config_name = config_name or os.getenv("FLASK_ENV", "development")
    app = Flask(__name__)
    app.config.from_object(get_config(config_name))
    app.config.setdefault("JSON_SORT_KEYS", False)

    CORS(
        app,
        supports_credentials=True,
        resources={r"/api/*": {"origins": _parse_origins(app.config["CORS_ORIGINS"])}},
        expose_headers=["Authorization"],
    )

    register_extensions(app)
    register_blueprints(app)
    register_error_handlers(app)

    @app.shell_context_processor
    def shell_context():
        from . import models

        context = {"db": db}
        for name in getattr(models, "__all__", []):
            context[name] = getattr(models, name)
        return context

    return app


def register_extensions(app: Flask) -> None:
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)


def register_error_handlers(app: Flask) -> None:
    @app.errorhandler(404)
    def not_found(_: Exception):
        return jsonify({"error": "Not found"}), 404

    @app.errorhandler(400)
    def bad_request(error: Exception):
        return jsonify({"error": str(error)}), 400

    @app.errorhandler(Exception)
    def internal_error(error: Exception):
        app.logger.exception(error)
        return jsonify({"error": "Unexpected server error"}), 500
