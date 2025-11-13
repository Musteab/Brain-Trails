from datetime import datetime

from ..extensions import db


class Quiz(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    title = db.Column(db.String(140), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    time_limit = db.Column(db.Integer, default=60)

    user = db.relationship("User", backref="quizzes")
    questions = db.relationship(
        "Question", back_populates="quiz", cascade="all, delete-orphan"
    )
    results = db.relationship(
        "UserQuizResult", back_populates="quiz", cascade="all, delete-orphan"
    )

    def to_dict(self, include_questions: bool = False) -> dict:
        payload = {
            "id": self.id,
            "title": self.title,
            "time_limit": self.time_limit,
            "created_at": self.created_at.isoformat(),
        }
        if include_questions:
            payload["questions"] = [question.to_dict() for question in self.questions]
        return payload


class Question(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey("quiz.id"), nullable=False)
    question_text = db.Column(db.Text, nullable=False)
    correct_answer = db.Column(db.Text, nullable=False)
    options = db.Column(db.JSON, nullable=False)
    explanation = db.Column(db.Text)

    quiz = db.relationship("Quiz", back_populates="questions")

    def to_dict(self, reveal_answer: bool = False) -> dict:
        payload = {
            "id": self.id,
            "question_text": self.question_text,
            "options": self.options or [],
        }
        if reveal_answer:
            payload["correct_answer"] = self.correct_answer
            payload["explanation"] = self.explanation
        return payload


class UserQuizResult(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    quiz_id = db.Column(db.Integer, db.ForeignKey("quiz.id"), nullable=False)
    score = db.Column(db.Float)
    answers = db.Column(db.JSON)
    completed_at = db.Column(db.DateTime, default=datetime.utcnow)
    duration_seconds = db.Column(db.Integer, default=0)

    user = db.relationship("User", back_populates="quiz_results")
    quiz = db.relationship("Quiz", back_populates="results")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "quiz_id": self.quiz_id,
            "score": self.score,
            "answers": self.answers,
            "completed_at": self.completed_at.isoformat(),
            "duration_seconds": self.duration_seconds,
        }
