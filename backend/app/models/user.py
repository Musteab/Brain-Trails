from datetime import datetime

from werkzeug.security import check_password_hash, generate_password_hash

from ..extensions import db


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(512), nullable=False)
    display_name = db.Column(db.String(120), default="")
    bio = db.Column(db.Text, default="")
    theme = db.Column(db.String(32), default="system")
    avatar_url = db.Column(db.String(255), default="")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    decks = db.relationship("Deck", back_populates="user", cascade="all, delete-orphan")
    quiz_results = db.relationship(
        "UserQuizResult", back_populates="user", cascade="all, delete-orphan"
    )
    flashcard_progress = db.relationship(
        "UserFlashcardProgress", backref="user", cascade="all, delete-orphan"
    )
    study_sessions = db.relationship(
        "StudySession", back_populates="user", cascade="all, delete-orphan"
    )
    notes = db.relationship("Note", back_populates="user", cascade="all, delete-orphan")
    preferences = db.relationship(
        "UserPreference", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )

    def set_password(self, password: str) -> None:
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    def to_safe_dict(self) -> dict:
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "display_name": self.display_name or self.username,
            "bio": self.bio or "",
            "theme": self.theme,
            "avatar_url": self.avatar_url or "",
        }


class UserPreference(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    theme = db.Column(db.String(32), default="system")
    focus_music = db.Column(db.String(64), default="lofi")
    daily_goal_minutes = db.Column(db.Integer, default=25)
    notifications_enabled = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    user = db.relationship("User", back_populates="preferences")

    def to_dict(self) -> dict:
        return {
            "theme": self.theme,
            "focus_music": self.focus_music,
            "daily_goal_minutes": self.daily_goal_minutes,
            "notifications_enabled": self.notifications_enabled,
        }
