import os
from datetime import timedelta
from typing import Optional, Type


class BaseConfig:
    """Shared Flask configuration."""

    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret")
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL", "sqlite:///brain_trails.db"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", SECRET_KEY)
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=12)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000")
    SUMMARY_MODEL_NAME = os.getenv(
        "SUMMARY_MODEL_NAME", "sshleifer/distilbart-cnn-12-6"
    )
    QUESTION_MODEL_NAME = os.getenv(
        "QUESTION_MODEL_NAME", "valhalla/t5-base-e2e-qg"
    )
    AI_MAX_INPUT_CHARS = int(os.getenv("AI_MAX_INPUT_CHARS", 4000))


class DevelopmentConfig(BaseConfig):
    DEBUG = True


class TestingConfig(BaseConfig):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    WTF_CSRF_ENABLED = False
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=5)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(minutes=15)
    AI_MAX_INPUT_CHARS = 2000


class ProductionConfig(BaseConfig):
    DEBUG = False


CONFIG_MAP = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
}


def get_config(config_name: Optional[str] = None) -> Type[BaseConfig]:
    """Return the correct config class for the provided name."""
    if not config_name:
        return DevelopmentConfig
    return CONFIG_MAP.get(config_name.lower(), DevelopmentConfig)
