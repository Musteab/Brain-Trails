from datetime import datetime, timedelta
from typing import List

from sqlalchemy import func

from ..extensions import db
from ..models import (
    Deck,
    Flashcard,
    Note,
    Quiz,
    StudySession,
    UserFlashcardProgress,
    UserQuizResult,
)


def user_overview(user_id: int) -> dict:
    total_flashcards = (
        db.session.query(func.count(Flashcard.id))
        .join(Deck)
        .filter(Deck.user_id == user_id)
        .scalar()
    )
    due_flashcards = (
        db.session.query(func.count(UserFlashcardProgress.id))
        .filter(
            UserFlashcardProgress.user_id == user_id,
            UserFlashcardProgress.next_review <= datetime.utcnow(),
        )
        .scalar()
    )
    total_notes = Note.query.filter_by(user_id=user_id).count()
    total_quizzes = Quiz.query.filter_by(user_id=user_id).count()
    quizzes_completed = UserQuizResult.query.filter_by(user_id=user_id).count()
    minutes_studied = (
        db.session.query(func.coalesce(func.sum(StudySession.duration), 0))
        .filter(StudySession.user_id == user_id)
        .scalar()
    )
    recent_sessions = (
        StudySession.query.filter_by(user_id=user_id)
        .order_by(StudySession.start_time.desc())
        .limit(5)
        .all()
    )

    return {
        "flashcards_created": total_flashcards,
        "flashcards_due": due_flashcards,
        "notes_created": total_notes,
        "quizzes_created": total_quizzes,
        "quizzes_completed": quizzes_completed,
        "minutes_studied": minutes_studied or 0,
        "recent_sessions": [session.to_dict() for session in recent_sessions],
    }


def study_session_stats(user_id: int) -> dict:
    sessions = StudySession.query.filter_by(user_id=user_id).all()
    total_sessions = len(sessions)
    total_minutes = sum(filter(None, (session.duration for session in sessions)))
    average_focus = _average_focus_score(sessions)

    week_ago = datetime.utcnow() - timedelta(days=7)
    weekly_sessions = [
        session for session in sessions if session.start_time and session.start_time >= week_ago
    ]

    return {
        "total_sessions": total_sessions,
        "total_minutes": total_minutes,
        "average_focus": average_focus,
        "weekly_sessions": len(weekly_sessions),
    }


def _average_focus_score(sessions: List[StudySession]) -> float:
    scores = [session.focus_score for session in sessions if session.focus_score]
    if not scores:
        return 0
    return round(sum(scores) / len(scores), 2)
