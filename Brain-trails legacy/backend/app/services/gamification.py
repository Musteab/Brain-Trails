"""Gamification service for XP, levels, streaks, pets, and rewards."""
from datetime import datetime, timezone, date, timedelta
from typing import Optional, Dict, Any, List, Tuple

from ..extensions import db
from ..models.gamification import (
    UserGamification,
    UserReward,
    UserPet,
    StudyActivity,
    NoteReview,
    ActivityType,
    RewardType,
    PetMood,
    XP_REWARDS,
    AVAILABLE_REWARDS,
)


class GamificationService:
    """Service for managing gamification features."""
    
    @staticmethod
    def get_or_create_user_gamification(user_id: int) -> UserGamification:
        """Get or create gamification state for a user."""
        gamification = UserGamification.query.filter_by(user_id=user_id).first()
        if not gamification:
            gamification = UserGamification(user_id=user_id)
            db.session.add(gamification)
            
            # Give starter rewards
            GamificationService._give_starter_rewards(user_id)
            db.session.commit()
        
        # Check if we need to reset daily stats
        GamificationService._check_daily_reset(gamification)
        
        return gamification
    
    @staticmethod
    def _give_starter_rewards(user_id: int) -> None:
        """Give initial rewards to new users."""
        starter_rewards = ["theme_forest", "pet_fox", "title_apprentice"]
        for reward_id in starter_rewards:
            if reward_id in AVAILABLE_REWARDS:
                reward = UserReward(
                    user_id=user_id,
                    reward_id=reward_id,
                    reward_type=AVAILABLE_REWARDS[reward_id]["type"].value,
                    reward_data=AVAILABLE_REWARDS[reward_id],
                )
                db.session.add(reward)
        
        # Create starter pet
        pet = UserPet(
            user_id=user_id,
            pet_id="fox",
            name="Study Buddy",
            is_active=True,
            happiness=70,
            energy=70,
            mood=PetMood.HAPPY.value,
        )
        db.session.add(pet)
    
    @staticmethod
    def _check_daily_reset(gamification: UserGamification) -> None:
        """Reset daily stats if it's a new day."""
        today = date.today()
        
        if gamification.last_study_date != today:
            # Check if streak should be reset (missed more than 1 day)
            if gamification.last_study_date:
                days_missed = (today - gamification.last_study_date).days
                if days_missed > 1:
                    gamification.current_streak = 0
            
            # Reset daily counters
            gamification.daily_xp_today = 0
            gamification.daily_minutes_today = 0
            gamification.daily_goal_met_today = False
    
    @staticmethod
    def award_xp(
        user_id: int,
        activity_type: ActivityType,
        multiplier: float = 1.0,
        note_id: Optional[int] = None,
        quiz_id: Optional[int] = None,
        deck_id: Optional[int] = None,
        session_id: Optional[int] = None,
        duration_minutes: Optional[int] = None,
        extra_metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Award XP to a user for an activity.
        
        Returns dict with:
        - xp_earned: Amount of XP earned
        - leveled_up: Whether user leveled up
        - new_level: New level if leveled up
        - new_rewards: List of newly unlocked rewards
        - pet_reaction: Pet's reaction to the activity
        """
        gamification = GamificationService.get_or_create_user_gamification(user_id)
        
        # Calculate XP
        base_xp = XP_REWARDS.get(activity_type, 10)
        xp_earned = int(base_xp * multiplier)
        
        # Apply streak bonus (10% per day up to 50%)
        streak_bonus = min(0.5, gamification.current_streak * 0.1)
        xp_earned = int(xp_earned * (1 + streak_bonus))
        
        # Store previous level for comparison
        old_level = gamification.level
        
        # Update XP
        gamification.xp += xp_earned
        gamification.lifetime_xp += xp_earned
        gamification.daily_xp_today += xp_earned
        
        # Check for level up
        leveled_up = False
        new_level = old_level
        while gamification.lifetime_xp >= gamification.xp_for_next_level:
            gamification.level += 1
            leveled_up = True
            new_level = gamification.level
        
        # Update streak
        today = date.today()
        if gamification.last_study_date != today:
            if gamification.last_study_date:
                days_since = (today - gamification.last_study_date).days
                if days_since == 1:
                    gamification.current_streak += 1
                elif days_since > 1:
                    gamification.current_streak = 1
            else:
                gamification.current_streak = 1
            
            gamification.last_study_date = today
            
            # Check for best streak
            if gamification.current_streak > gamification.best_streak:
                gamification.best_streak = gamification.current_streak
        
        # Update duration if provided
        if duration_minutes:
            gamification.daily_minutes_today += duration_minutes
            
            # Check daily goal
            if (not gamification.daily_goal_met_today and 
                gamification.daily_minutes_today >= gamification.daily_goal_minutes):
                gamification.daily_goal_met_today = True
                # Award bonus XP for meeting daily goal
                bonus_xp = XP_REWARDS.get(ActivityType.DAILY_GOAL_MET, 30)
                gamification.xp += bonus_xp
                gamification.lifetime_xp += bonus_xp
                gamification.daily_xp_today += bonus_xp
                xp_earned += bonus_xp
        
        # Record activity
        activity = StudyActivity(
            user_id=user_id,
            activity_type=activity_type.value,
            xp_earned=xp_earned,
            note_id=note_id,
            quiz_id=quiz_id,
            deck_id=deck_id,
            session_id=session_id,
            duration_minutes=duration_minutes,
            metadata=extra_metadata or {},
        )
        db.session.add(activity)
        
        # Check for new rewards
        new_rewards = GamificationService._check_rewards(user_id, gamification)
        
        # Update pet
        pet_reaction = GamificationService._update_pet_on_activity(user_id, activity_type)
        
        # Boss damage (if active)
        boss_damage = None
        if gamification.current_boss_id and gamification.boss_health:
            damage = xp_earned // 10  # 1 damage per 10 XP
            gamification.boss_health = max(0, gamification.boss_health - damage)
            boss_damage = {
                "damage_dealt": damage,
                "remaining_health": gamification.boss_health,
                "defeated": gamification.boss_health <= 0,
            }
            if gamification.boss_health <= 0:
                # Boss defeated!
                gamification.current_boss_id = None
                gamification.boss_health = None
                gamification.boss_max_health = None
        
        db.session.commit()
        
        return {
            "xp_earned": xp_earned,
            "total_xp": gamification.lifetime_xp,
            "current_level_xp": gamification.xp,
            "leveled_up": leveled_up,
            "new_level": new_level if leveled_up else None,
            "xp_to_next_level": gamification.xp_to_next_level,
            "xp_progress_percent": gamification.xp_progress_percent,
            "current_streak": gamification.current_streak,
            "daily_xp_today": gamification.daily_xp_today,
            "daily_goal_met": gamification.daily_goal_met_today,
            "new_rewards": [r.to_dict() for r in new_rewards],
            "pet_reaction": pet_reaction,
            "boss_damage": boss_damage,
        }
    
    @staticmethod
    def _check_rewards(user_id: int, gamification: UserGamification) -> List[UserReward]:
        """Check and grant any newly earned rewards."""
        new_rewards = []
        existing_reward_ids = {r.reward_id for r in UserReward.query.filter_by(user_id=user_id).all()}
        
        for reward_id, reward_data in AVAILABLE_REWARDS.items():
            if reward_id in existing_reward_ids:
                continue
            
            # Check level requirement
            level_required = reward_data.get("level_required", 0)
            if level_required > 0 and gamification.level >= level_required:
                reward = UserReward(
                    user_id=user_id,
                    reward_id=reward_id,
                    reward_type=reward_data["type"].value,
                    reward_data=reward_data,
                )
                db.session.add(reward)
                new_rewards.append(reward)
        
        # Check streak badges
        streak_badges = [
            ("badge_streak_3", 3),
            ("badge_streak_7", 7),
            ("badge_streak_30", 30),
        ]
        for badge_id, streak_required in streak_badges:
            if badge_id not in existing_reward_ids and gamification.current_streak >= streak_required:
                badge_data = AVAILABLE_REWARDS.get(badge_id, {})
                reward = UserReward(
                    user_id=user_id,
                    reward_id=badge_id,
                    reward_type=RewardType.BADGE.value,
                    reward_data=badge_data,
                )
                db.session.add(reward)
                new_rewards.append(reward)
        
        return new_rewards
    
    @staticmethod
    def _update_pet_on_activity(user_id: int, activity_type: ActivityType) -> Optional[Dict[str, Any]]:
        """Update pet state when user does an activity."""
        pet = UserPet.query.filter_by(user_id=user_id, is_active=True).first()
        if not pet:
            return None
        
        # Increase happiness based on activity
        happiness_boost = {
            ActivityType.NOTE_CREATED: 5,
            ActivityType.NOTE_REVIEWED: 3,
            ActivityType.FLASHCARD_CORRECT: 2,
            ActivityType.QUIZ_COMPLETED: 8,
            ActivityType.QUIZ_PERFECT: 15,
            ActivityType.SESSION_COMPLETED: 10,
        }
        
        boost = happiness_boost.get(activity_type, 1)
        pet.happiness = min(100, pet.happiness + boost)
        pet.energy = max(0, pet.energy - 1)  # Slight energy decrease
        pet.xp += boost
        pet.last_interaction = datetime.now(timezone.utc)
        
        # Check for pet level up
        pet_leveled_up = False
        while pet.xp >= pet.level * 100:  # Simple: 100 XP per level
            pet.xp -= pet.level * 100
            pet.level += 1
            pet_leveled_up = True
        
        pet.update_mood()
        
        return {
            "pet_id": pet.pet_id,
            "name": pet.name,
            "mood": pet.mood,
            "happiness": pet.happiness,
            "leveled_up": pet_leveled_up,
            "new_level": pet.level if pet_leveled_up else None,
        }
    
    @staticmethod
    def feed_pet(user_id: int) -> Dict[str, Any]:
        """Feed the user's active pet."""
        pet = UserPet.query.filter_by(user_id=user_id, is_active=True).first()
        if not pet:
            return {"error": "No active pet found"}
        
        pet.last_fed = datetime.now(timezone.utc)
        pet.happiness = min(100, pet.happiness + 20)
        pet.energy = min(100, pet.energy + 30)
        pet.update_mood()
        
        db.session.commit()
        
        return {
            "success": True,
            "pet": pet.to_dict(),
        }
    
    @staticmethod
    def play_with_pet(user_id: int) -> Dict[str, Any]:
        """Play with the user's active pet."""
        pet = UserPet.query.filter_by(user_id=user_id, is_active=True).first()
        if not pet:
            return {"error": "No active pet found"}
        
        pet.last_played = datetime.now(timezone.utc)
        pet.happiness = min(100, pet.happiness + 15)
        pet.energy = max(0, pet.energy - 10)  # Playing uses energy
        pet.xp += 5
        pet.update_mood()
        
        db.session.commit()
        
        return {
            "success": True,
            "pet": pet.to_dict(),
        }
    
    @staticmethod
    def get_user_stats(user_id: int) -> Dict[str, Any]:
        """Get complete gamification stats for a user."""
        gamification = GamificationService.get_or_create_user_gamification(user_id)
        rewards = UserReward.query.filter_by(user_id=user_id).all()
        pet = UserPet.query.filter_by(user_id=user_id, is_active=True).first()
        
        # Decay pet stats if not active
        if pet and pet.last_interaction:
            # Handle both timezone-aware and naive datetimes
            now = datetime.now(timezone.utc)
            last_interaction = pet.last_interaction
            if last_interaction.tzinfo is None:
                # Assume naive datetime is UTC
                last_interaction = last_interaction.replace(tzinfo=timezone.utc)
            hours_since_interaction = (now - last_interaction).total_seconds() / 3600
            if hours_since_interaction > 12:
                # Decrease happiness over time
                decay = int(hours_since_interaction // 12) * 5
                pet.happiness = max(0, pet.happiness - decay)
                pet.energy = max(0, pet.energy - decay // 2)
                pet.update_mood()
        
        return {
            "gamification": gamification.to_dict(),
            "rewards": [r.to_dict() for r in rewards],
            "pet": pet.to_dict() if pet else None,
            "available_rewards": [
                {
                    "reward_id": rid,
                    "name": rdata.get("name", rid),
                    "type": rdata["type"].value,
                    "level_required": rdata.get("level_required", 0),
                    "unlocked": rid in {r.reward_id for r in rewards},
                }
                for rid, rdata in AVAILABLE_REWARDS.items()
            ],
        }
    
    @staticmethod
    def get_activity_history(
        user_id: int,
        limit: int = 50,
        activity_types: Optional[List[ActivityType]] = None,
    ) -> List[Dict[str, Any]]:
        """Get recent activity history for a user."""
        query = StudyActivity.query.filter_by(user_id=user_id)
        
        if activity_types:
            query = query.filter(
                StudyActivity.activity_type.in_([at.value for at in activity_types])
            )
        
        activities = query.order_by(StudyActivity.created_at.desc()).limit(limit).all()
        return [a.to_dict() for a in activities]
    
    @staticmethod
    def mark_note_reviewed(user_id: int, note_id: int) -> Dict[str, Any]:
        """Mark a note as reviewed and award XP."""
        review = NoteReview.query.filter_by(user_id=user_id, note_id=note_id).first()
        
        if review:
            review.reviewed_at = datetime.now(timezone.utc)
            review.review_count += 1
            # Calculate next review date (simple spaced repetition)
            days_until_next = min(30, 2 ** review.review_count)
            review.next_review_date = date.today() + timedelta(days=days_until_next)
        else:
            review = NoteReview(
                user_id=user_id,
                note_id=note_id,
                next_review_date=date.today() + timedelta(days=1),
            )
            db.session.add(review)
        
        db.session.commit()
        
        # Award XP
        xp_result = GamificationService.award_xp(
            user_id=user_id,
            activity_type=ActivityType.NOTE_REVIEWED,
            note_id=note_id,
        )
        
        return {
            "review": review.to_dict(),
            "xp": xp_result,
        }
    
    @staticmethod
    def get_notes_due_for_review(user_id: int) -> List[Dict[str, Any]]:
        """Get notes that are due for review."""
        today = date.today()
        
        reviews = NoteReview.query.filter(
            NoteReview.user_id == user_id,
            NoteReview.next_review_date <= today,
        ).all()
        
        result = []
        for review in reviews:
            if review.note:
                result.append({
                    "note": review.note.to_list_dict(),
                    "review": review.to_dict(),
                    "days_overdue": (today - review.next_review_date).days,
                })
        
        return result
    
    @staticmethod
    def start_boss_challenge(user_id: int, boss_id: str) -> Dict[str, Any]:
        """Start a monthly boss challenge."""
        from ..models.gamification import BOSS_CHALLENGES
        
        if boss_id not in BOSS_CHALLENGES:
            return {"error": "Invalid boss ID"}
        
        gamification = GamificationService.get_or_create_user_gamification(user_id)
        
        if gamification.current_boss_id:
            return {"error": "Already have an active boss challenge"}
        
        boss = BOSS_CHALLENGES[boss_id]
        gamification.current_boss_id = boss_id
        gamification.boss_health = boss["health"]
        gamification.boss_max_health = boss["health"]
        
        db.session.commit()
        
        return {
            "success": True,
            "boss": {
                "id": boss_id,
                "name": boss["name"],
                "health": boss["health"],
                "max_health": boss["health"],
                "description": boss["description"],
            },
        }


# Convenience functions for common operations
def award_xp_for_note_created(user_id: int, note_id: int) -> Dict[str, Any]:
    """Award XP when user creates a note."""
    return GamificationService.award_xp(
        user_id=user_id,
        activity_type=ActivityType.NOTE_CREATED,
        note_id=note_id,
    )


def award_xp_for_quiz_completed(
    user_id: int, 
    quiz_id: int, 
    score: float,
    duration_minutes: int,
) -> Dict[str, Any]:
    """Award XP when user completes a quiz."""
    activity_type = ActivityType.QUIZ_PERFECT if score >= 100 else ActivityType.QUIZ_COMPLETED
    multiplier = 1.0 + (score / 200)  # 1.0 to 1.5 based on score
    
    return GamificationService.award_xp(
        user_id=user_id,
        activity_type=activity_type,
        multiplier=multiplier,
        quiz_id=quiz_id,
        duration_minutes=duration_minutes,
        extra_metadata={"score": score},
    )


def award_xp_for_flashcard_review(
    user_id: int,
    deck_id: int,
    correct: bool,
    duration_minutes: Optional[int] = None,
) -> Dict[str, Any]:
    """Award XP for reviewing flashcards."""
    activity_type = ActivityType.FLASHCARD_CORRECT if correct else ActivityType.FLASHCARD_REVIEWED
    
    return GamificationService.award_xp(
        user_id=user_id,
        activity_type=activity_type,
        deck_id=deck_id,
        duration_minutes=duration_minutes,
    )


def award_xp_for_session_completed(
    user_id: int,
    session_id: int,
    duration_minutes: int,
) -> Dict[str, Any]:
    """Award XP when user completes a study session."""
    return GamificationService.award_xp(
        user_id=user_id,
        activity_type=ActivityType.SESSION_COMPLETED,
        session_id=session_id,
        duration_minutes=duration_minutes,
    )
