from datetime import datetime, timedelta

from ..models import Flashcard, UserFlashcardProgress
from ..extensions import db

MIN_EASE_FACTOR = 1.3


def review_flashcard(user_id: int, flashcard: Flashcard, quality: int) -> UserFlashcardProgress:
    """Update spaced repetition stats for a flashcard review."""
    progress = UserFlashcardProgress.query.filter_by(
        user_id=user_id, flashcard_id=flashcard.id
    ).first()

    if not progress:
        progress = UserFlashcardProgress(
            user_id=user_id,
            flashcard_id=flashcard.id,
        )
        db.session.add(progress)

    progress.last_reviewed = datetime.utcnow()
    quality = max(0, min(5, quality))

    if quality < 3:
        progress.repetitions = 0
        progress.interval = 1
    else:
        progress.repetitions += 1
        progress.ease_factor = max(
            MIN_EASE_FACTOR,
            progress.ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)),
        )
        if progress.repetitions == 1:
            progress.interval = 1
        elif progress.repetitions == 2:
            progress.interval = 6
        else:
            progress.interval = int(progress.interval * progress.ease_factor)

    progress.next_review = progress.last_reviewed + timedelta(days=progress.interval)
    db.session.commit()
    return progress
