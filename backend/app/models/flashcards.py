from datetime import datetime

from ..extensions import db


class Deck(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    flashcards = db.relationship(
        "Flashcard", back_populates="deck", cascade="all, delete-orphan"
    )
    user = db.relationship("User", back_populates="decks")

    def to_dict(self, include_counts: bool = False) -> dict:
        payload = {
            "id": self.id,
            "name": self.name,
            "created_at": self.created_at.isoformat(),
        }
        if include_counts:
            payload["flashcard_count"] = len(self.flashcards)
        return payload


class Flashcard(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    question = db.Column(db.Text, nullable=False)
    answer = db.Column(db.Text, nullable=False)
    deck_id = db.Column(db.Integer, db.ForeignKey("deck.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    deck = db.relationship("Deck", back_populates="flashcards")
    progress = db.relationship(
        "UserFlashcardProgress",
        back_populates="flashcard",
        cascade="all, delete-orphan",
        uselist=False,
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "question": self.question,
            "answer": self.answer,
            "deck_id": self.deck_id,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class UserFlashcardProgress(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    flashcard_id = db.Column(db.Integer, db.ForeignKey("flashcard.id"), nullable=False)
    next_review = db.Column(db.DateTime, default=datetime.utcnow)
    interval = db.Column(db.Integer, default=1)
    ease_factor = db.Column(db.Float, default=2.5)
    repetitions = db.Column(db.Integer, default=0)
    last_reviewed = db.Column(db.DateTime)

    user = db.relationship("User", backref="flashcard_progress")
    flashcard = db.relationship("Flashcard", back_populates="progress")

    def to_dict(self) -> dict:
        return {
            "flashcard_id": self.flashcard_id,
            "next_review": self.next_review.isoformat() if self.next_review else None,
            "interval": self.interval,
            "ease_factor": self.ease_factor,
            "repetitions": self.repetitions,
            "last_reviewed": self.last_reviewed.isoformat()
            if self.last_reviewed
            else None,
        }
