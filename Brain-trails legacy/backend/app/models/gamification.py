"""Gamification models for XP, levels, streaks, pets, and rewards."""
from datetime import datetime, timezone, timedelta
from enum import Enum

from ..extensions import db


class ActivityType(str, Enum):
    """Types of study activities that earn XP."""
    NOTE_CREATED = "note_created"
    NOTE_EDITED = "note_edited"
    NOTE_REVIEWED = "note_reviewed"
    FLASHCARD_REVIEWED = "flashcard_reviewed"
    FLASHCARD_CORRECT = "flashcard_correct"
    QUIZ_COMPLETED = "quiz_completed"
    QUIZ_PERFECT = "quiz_perfect"
    SESSION_COMPLETED = "session_completed"
    DAILY_GOAL_MET = "daily_goal_met"
    STREAK_MILESTONE = "streak_milestone"
    CHALLENGE_COMPLETED = "challenge_completed"
    BOSS_DEFEATED = "boss_defeated"


class RewardType(str, Enum):
    """Types of unlockable rewards."""
    THEME = "theme"
    PET = "pet"
    PET_ACCESSORY = "pet_accessory"
    BADGE = "badge"
    TITLE = "title"
    ROOM = "room"
    FEATURE = "feature"  # Unlock study tools


class PetMood(str, Enum):
    """Pet mood states based on study habits."""
    ECSTATIC = "ecstatic"
    HAPPY = "happy"
    CONTENT = "content"
    NEUTRAL = "neutral"
    SLEEPY = "sleepy"
    SAD = "sad"
    HUNGRY = "hungry"


# XP requirements per level (exponential scaling)
XP_PER_LEVEL = [
    0,      # Level 1
    100,    # Level 2
    250,    # Level 3
    500,    # Level 4
    850,    # Level 5
    1300,   # Level 6
    1900,   # Level 7
    2600,   # Level 8
    3500,   # Level 9
    4600,   # Level 10
    5900,   # Level 11
    7400,   # Level 12
    9100,   # Level 13
    11100,  # Level 14
    13500,  # Level 15+
]

# XP rewards for activities
XP_REWARDS = {
    ActivityType.NOTE_CREATED: 15,
    ActivityType.NOTE_EDITED: 5,
    ActivityType.NOTE_REVIEWED: 10,
    ActivityType.FLASHCARD_REVIEWED: 2,
    ActivityType.FLASHCARD_CORRECT: 5,
    ActivityType.QUIZ_COMPLETED: 25,
    ActivityType.QUIZ_PERFECT: 50,
    ActivityType.SESSION_COMPLETED: 20,
    ActivityType.DAILY_GOAL_MET: 30,
    ActivityType.STREAK_MILESTONE: 100,
    ActivityType.CHALLENGE_COMPLETED: 75,
    ActivityType.BOSS_DEFEATED: 200,
}


class UserGamification(db.Model):
    """Main gamification state for a user."""
    
    __tablename__ = "user_gamification"
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id", ondelete="CASCADE"), 
                        nullable=False, unique=True, index=True)
    
    # XP and Level
    xp = db.Column(db.Integer, nullable=False, default=0)
    level = db.Column(db.Integer, nullable=False, default=1)
    lifetime_xp = db.Column(db.Integer, nullable=False, default=0)
    
    # Streaks
    current_streak = db.Column(db.Integer, nullable=False, default=0)
    best_streak = db.Column(db.Integer, nullable=False, default=0)
    last_study_date = db.Column(db.Date, nullable=True)
    
    # Daily progress
    daily_xp_today = db.Column(db.Integer, nullable=False, default=0)
    daily_minutes_today = db.Column(db.Integer, nullable=False, default=0)
    daily_goal_minutes = db.Column(db.Integer, nullable=False, default=25)
    daily_goal_met_today = db.Column(db.Boolean, nullable=False, default=False)
    
    # Weekly/Monthly challenges (optional)
    active_challenge_id = db.Column(db.String(64), nullable=True)
    challenge_progress = db.Column(db.JSON, nullable=False, default=dict)
    
    # Boss battles (optional monthly feature)
    current_boss_id = db.Column(db.String(64), nullable=True)
    boss_health = db.Column(db.Integer, nullable=True)
    boss_max_health = db.Column(db.Integer, nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    user = db.relationship("User", backref=db.backref("gamification", uselist=False, 
                                                       cascade="all, delete-orphan"))
    
    def to_dict(self) -> dict:
        """Convert to API response dictionary."""
        return {
            "xp": self.xp,
            "level": self.level,
            "lifetime_xp": self.lifetime_xp,
            "xp_to_next_level": self.xp_to_next_level,
            "xp_progress_percent": self.xp_progress_percent,
            "current_streak": self.current_streak,
            "best_streak": self.best_streak,
            "last_study_date": self.last_study_date.isoformat() if self.last_study_date else None,
            "daily_xp_today": self.daily_xp_today,
            "daily_minutes_today": self.daily_minutes_today,
            "daily_goal_minutes": self.daily_goal_minutes,
            "daily_goal_met_today": self.daily_goal_met_today,
            "active_challenge_id": self.active_challenge_id,
            "challenge_progress": self.challenge_progress,
            "current_boss_id": self.current_boss_id,
            "boss_health": self.boss_health,
            "boss_max_health": self.boss_max_health,
        }
    
    @property
    def xp_for_current_level(self) -> int:
        """XP required to reach current level."""
        if self.level <= 1:
            return 0
        if self.level > len(XP_PER_LEVEL):
            # Beyond defined levels: linear scaling
            return XP_PER_LEVEL[-1] + (self.level - len(XP_PER_LEVEL)) * 2500
        return XP_PER_LEVEL[self.level - 1]
    
    @property
    def xp_for_next_level(self) -> int:
        """Total XP required to reach next level."""
        if self.level >= len(XP_PER_LEVEL):
            return XP_PER_LEVEL[-1] + (self.level - len(XP_PER_LEVEL) + 1) * 2500
        return XP_PER_LEVEL[self.level]
    
    @property
    def xp_to_next_level(self) -> int:
        """XP still needed to level up."""
        return max(0, self.xp_for_next_level - self.lifetime_xp)
    
    @property
    def xp_progress_percent(self) -> float:
        """Progress to next level as percentage (0-100)."""
        current = self.xp_for_current_level
        next_lvl = self.xp_for_next_level
        if next_lvl <= current:
            return 100.0
        progress = self.lifetime_xp - current
        needed = next_lvl - current
        return min(100.0, max(0.0, (progress / needed) * 100))


class UserReward(db.Model):
    """Unlocked rewards for a user."""
    
    __tablename__ = "user_rewards"
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id", ondelete="CASCADE"),
                        nullable=False, index=True)
    reward_id = db.Column(db.String(64), nullable=False)  # e.g., "theme_forest", "badge_streak_7"
    reward_type = db.Column(db.String(32), nullable=False)  # RewardType value
    reward_data = db.Column(db.JSON, nullable=False, default=dict)  # Additional metadata
    unlocked_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    user = db.relationship("User", backref=db.backref("rewards", cascade="all, delete-orphan",
                                                       lazy="dynamic"))
    
    __table_args__ = (
        db.UniqueConstraint("user_id", "reward_id", name="uq_user_reward"),
    )
    
    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "reward_id": self.reward_id,
            "reward_type": self.reward_type,
            "reward_data": self.reward_data,
            "unlocked_at": self.unlocked_at.isoformat() if self.unlocked_at else None,
        }


class UserPet(db.Model):
    """User's study companion pet."""
    
    __tablename__ = "user_pets"
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id", ondelete="CASCADE"),
                        nullable=False, index=True)
    
    # Pet identity
    pet_id = db.Column(db.String(32), nullable=False)  # e.g., "fox", "owl", "cat"
    name = db.Column(db.String(32), nullable=False, default="Buddy")
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    
    # Pet state
    mood = db.Column(db.String(16), nullable=False, default=PetMood.NEUTRAL.value)
    happiness = db.Column(db.Integer, nullable=False, default=50)  # 0-100
    energy = db.Column(db.Integer, nullable=False, default=50)  # 0-100
    
    # Pet progression
    xp = db.Column(db.Integer, nullable=False, default=0)
    level = db.Column(db.Integer, nullable=False, default=1)
    
    # Care timestamps
    last_fed = db.Column(db.DateTime, nullable=True)
    last_played = db.Column(db.DateTime, nullable=True)
    last_interaction = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Accessories (unlocked through rewards)
    accessories = db.Column(db.JSON, nullable=False, default=list)
    active_accessory = db.Column(db.String(64), nullable=True)
    
    # Timestamps
    adopted_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    user = db.relationship("User", backref=db.backref("pets", cascade="all, delete-orphan",
                                                       lazy="dynamic"))
    
    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "pet_id": self.pet_id,
            "name": self.name,
            "is_active": self.is_active,
            "mood": self.mood,
            "happiness": self.happiness,
            "energy": self.energy,
            "xp": self.xp,
            "level": self.level,
            "last_fed": self.last_fed.isoformat() if self.last_fed else None,
            "last_played": self.last_played.isoformat() if self.last_played else None,
            "last_interaction": self.last_interaction.isoformat() if self.last_interaction else None,
            "accessories": self.accessories,
            "active_accessory": self.active_accessory,
            "adopted_at": self.adopted_at.isoformat() if self.adopted_at else None,
        }
    
    def update_mood(self) -> None:
        """Update pet mood based on happiness and energy."""
        if self.happiness >= 90 and self.energy >= 70:
            self.mood = PetMood.ECSTATIC.value
        elif self.happiness >= 70:
            self.mood = PetMood.HAPPY.value
        elif self.happiness >= 50:
            self.mood = PetMood.CONTENT.value
        elif self.energy < 30:
            self.mood = PetMood.SLEEPY.value
        elif self.happiness < 30:
            self.mood = PetMood.SAD.value
        else:
            self.mood = PetMood.NEUTRAL.value
        
        # Check if hungry (not fed in 24 hours)
        if self.last_fed:
            hours_since_fed = (datetime.now(timezone.utc) - self.last_fed).total_seconds() / 3600
            if hours_since_fed > 24:
                self.mood = PetMood.HUNGRY.value


class StudyActivity(db.Model):
    """Track individual study activities for analytics and XP."""
    
    __tablename__ = "study_activities"
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id", ondelete="CASCADE"),
                        nullable=False, index=True)
    
    # Activity details
    activity_type = db.Column(db.String(32), nullable=False)  # ActivityType value
    xp_earned = db.Column(db.Integer, nullable=False, default=0)
    
    # Optional context
    note_id = db.Column(db.Integer, db.ForeignKey("notes.id", ondelete="SET NULL"), nullable=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey("quiz.id", ondelete="SET NULL"), nullable=True)
    deck_id = db.Column(db.Integer, db.ForeignKey("deck.id", ondelete="SET NULL"), nullable=True)
    session_id = db.Column(db.Integer, db.ForeignKey("study_session.id", ondelete="SET NULL"), nullable=True)
    
    # Duration tracking
    duration_minutes = db.Column(db.Integer, nullable=True)
    
    # Extra data
    activity_metadata = db.Column(db.JSON, nullable=False, default=dict)
    
    # Timestamp
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    
    # Relationships
    user = db.relationship("User", backref=db.backref("activities", cascade="all, delete-orphan",
                                                       lazy="dynamic"))
    
    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "activity_type": self.activity_type,
            "xp_earned": self.xp_earned,
            "note_id": self.note_id,
            "quiz_id": self.quiz_id,
            "deck_id": self.deck_id,
            "session_id": self.session_id,
            "duration_minutes": self.duration_minutes,
            "metadata": self.activity_metadata,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class NoteReview(db.Model):
    """Track note reviews for spaced repetition."""
    
    __tablename__ = "note_reviews"
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id", ondelete="CASCADE"),
                        nullable=False, index=True)
    note_id = db.Column(db.Integer, db.ForeignKey("notes.id", ondelete="CASCADE"),
                        nullable=False, index=True)
    
    reviewed_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    next_review_date = db.Column(db.Date, nullable=True)  # For spaced repetition
    review_count = db.Column(db.Integer, nullable=False, default=1)
    
    # Relationships
    user = db.relationship("User", backref=db.backref("note_reviews", cascade="all, delete-orphan",
                                                       lazy="dynamic"))
    note = db.relationship("Note", backref=db.backref("reviews", cascade="all, delete-orphan",
                                                       lazy="dynamic"))
    
    __table_args__ = (
        db.UniqueConstraint("user_id", "note_id", name="uq_user_note_review"),
    )
    
    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "note_id": self.note_id,
            "reviewed_at": self.reviewed_at.isoformat() if self.reviewed_at else None,
            "next_review_date": self.next_review_date.isoformat() if self.next_review_date else None,
            "review_count": self.review_count,
        }


class NoteLink(db.Model):
    """Wiki-style links between notes."""
    
    __tablename__ = "note_links"
    
    id = db.Column(db.Integer, primary_key=True)
    source_note_id = db.Column(db.Integer, db.ForeignKey("notes.id", ondelete="CASCADE"),
                               nullable=False, index=True)
    target_note_id = db.Column(db.Integer, db.ForeignKey("notes.id", ondelete="CASCADE"),
                               nullable=False, index=True)
    link_type = db.Column(db.String(32), nullable=False, default="reference")  # reference, parent, related
    
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    source_note = db.relationship("Note", foreign_keys=[source_note_id],
                                   backref=db.backref("outgoing_links", cascade="all, delete-orphan",
                                                      lazy="dynamic"))
    target_note = db.relationship("Note", foreign_keys=[target_note_id],
                                   backref=db.backref("incoming_links", cascade="all, delete-orphan",
                                                      lazy="dynamic"))
    
    __table_args__ = (
        db.UniqueConstraint("source_note_id", "target_note_id", name="uq_note_link"),
    )
    
    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "source_note_id": self.source_note_id,
            "target_note_id": self.target_note_id,
            "link_type": self.link_type,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


# Predefined rewards that can be unlocked
AVAILABLE_REWARDS = {
    # Themes unlocked by level
    "theme_forest": {"type": RewardType.ROOM, "level_required": 1, "name": "Forest Retreat"},
    "theme_cabin": {"type": RewardType.ROOM, "level_required": 3, "name": "Cozy Cabin"},
    "theme_space": {"type": RewardType.ROOM, "level_required": 5, "name": "Space Station"},
    "theme_underwater": {"type": RewardType.ROOM, "level_required": 8, "name": "Underwater Lab"},
    "theme_cyber": {"type": RewardType.ROOM, "level_required": 10, "name": "Cyber Neon"},
    
    # Badges for streaks
    "badge_streak_3": {"type": RewardType.BADGE, "name": "3-Day Streak", "description": "Study 3 days in a row"},
    "badge_streak_7": {"type": RewardType.BADGE, "name": "Week Warrior", "description": "7-day study streak"},
    "badge_streak_30": {"type": RewardType.BADGE, "name": "Monthly Master", "description": "30-day study streak"},
    
    # Badges for milestones
    "badge_notes_10": {"type": RewardType.BADGE, "name": "Note Taker", "description": "Create 10 notes"},
    "badge_notes_50": {"type": RewardType.BADGE, "name": "Knowledge Keeper", "description": "Create 50 notes"},
    "badge_quizzes_10": {"type": RewardType.BADGE, "name": "Quiz Whiz", "description": "Complete 10 quizzes"},
    "badge_perfect_5": {"type": RewardType.BADGE, "name": "Perfectionist", "description": "5 perfect quiz scores"},
    
    # Pets unlocked by level
    "pet_fox": {"type": RewardType.PET, "level_required": 1, "name": "Study Fox"},
    "pet_owl": {"type": RewardType.PET, "level_required": 4, "name": "Wise Owl"},
    "pet_cat": {"type": RewardType.PET, "level_required": 6, "name": "Curious Cat"},
    "pet_dragon": {"type": RewardType.PET, "level_required": 10, "name": "Baby Dragon"},
    
    # Pet accessories
    "accessory_glasses": {"type": RewardType.PET_ACCESSORY, "level_required": 2, "name": "Reading Glasses"},
    "accessory_hat": {"type": RewardType.PET_ACCESSORY, "level_required": 4, "name": "Scholar Hat"},
    "accessory_scarf": {"type": RewardType.PET_ACCESSORY, "level_required": 7, "name": "Cozy Scarf"},
    
    # Titles
    "title_apprentice": {"type": RewardType.TITLE, "level_required": 1, "name": "Apprentice"},
    "title_scholar": {"type": RewardType.TITLE, "level_required": 5, "name": "Scholar"},
    "title_master": {"type": RewardType.TITLE, "level_required": 10, "name": "Master"},
    "title_sage": {"type": RewardType.TITLE, "level_required": 15, "name": "Sage"},
}


# Monthly boss challenges (optional feature)
BOSS_CHALLENGES = {
    "boss_procrastination": {
        "name": "The Procrastination Dragon",
        "health": 1000,
        "description": "Defeat by studying consistently for a month",
        "xp_per_hit": 10,  # XP required to deal 1 damage
    },
    "boss_distraction": {
        "name": "The Distraction Demon",
        "health": 750,
        "description": "Complete focused study sessions without breaks",
        "xp_per_hit": 15,
    },
}
