from .flashcards import Deck, Deck as FlashcardDeck, Flashcard, UserFlashcardProgress
from .gamification import (
    ActivityType,
    AVAILABLE_REWARDS,
    BOSS_CHALLENGES,
    NoteLink,
    NoteReview,
    PetMood,
    RewardType,
    StudyActivity,
    UserGamification,
    UserPet,
    UserReward,
    XP_PER_LEVEL,
    XP_REWARDS,
)
from .notes import Note, NoteTag, NoteTagLink, QuizSourceLink
from .planner import StudySession
from .profile import (
    Achievement,
    ActivityLog,
    BrainrotFavorite,
    DEFAULT_ACHIEVEMENTS,
    UserAchievement,
    UserPreferences,
    UserProfile,
)
from .quizzes import Question, Quiz, UserQuizResult, UserQuizResult as QuizAttempt
from .user import User, UserPreference

__all__ = [
    # User
    "User",
    "UserPreference",
    # Flashcards
    "Deck",
    "FlashcardDeck",
    "Flashcard",
    "UserFlashcardProgress",
    # Quizzes
    "Quiz",
    "Question",
    "UserQuizResult",
    "QuizAttempt",
    # Planner
    "StudySession",
    # Notes
    "Note",
    "NoteTag",
    "NoteTagLink",
    "QuizSourceLink",
    # Gamification
    "UserGamification",
    "UserReward",
    "UserPet",
    "StudyActivity",
    "NoteReview",
    "NoteLink",
    "ActivityType",
    "RewardType",
    "PetMood",
    "XP_PER_LEVEL",
    "XP_REWARDS",
    "AVAILABLE_REWARDS",
    "BOSS_CHALLENGES",
    # Profile & Achievements
    "UserProfile",
    "UserPreferences",
    "Achievement",
    "UserAchievement",
    "ActivityLog",
    "BrainrotFavorite",
    "DEFAULT_ACHIEVEMENTS",
]
