from datetime import datetime

from ..extensions import db


class StudySession(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    start_time = db.Column(db.DateTime, default=datetime.utcnow)
    end_time = db.Column(db.DateTime)
    session_type = db.Column(db.String(50), default="focus")
    duration = db.Column(db.Integer)
    focus_score = db.Column(db.Integer)
    notes = db.Column(db.Text)

    user = db.relationship("User", back_populates="study_sessions")

    def to_dict(self) -> dict:
        status = "scheduled"
        now = datetime.utcnow()
        if self.end_time:
            status = "completed"
        elif self.start_time <= now:
            status = "in_progress"
        return {
            "id": self.id,
            "start_time": self.start_time.isoformat() if self.start_time else None,
            "end_time": self.end_time.isoformat() if self.end_time else None,
            "session_type": self.session_type,
            "duration": self.duration,
            "focus_score": self.focus_score,
            "notes": self.notes or "",
            "status": status,
        }
