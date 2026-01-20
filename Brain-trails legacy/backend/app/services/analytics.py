"""Analytics service for study statistics and insights."""
from datetime import datetime, timezone, date, timedelta
from typing import Dict, Any, List, Optional
from collections import defaultdict

from sqlalchemy import func

from ..extensions import db
from ..models import (
    Deck, Flashcard, Quiz, StudySession, UserFlashcardProgress, UserQuizResult,
    Note, NoteTag,
)
from ..models.gamification import StudyActivity, UserGamification, ActivityType


def user_overview(user_id: int) -> dict:
    """Original overview function for backward compatibility."""
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
        "quizzes_created": total_quizzes,
        "quizzes_completed": quizzes_completed,
        "minutes_studied": minutes_studied or 0,
        "recent_sessions": [session.to_dict() for session in recent_sessions],
    }


def study_session_stats(user_id: int) -> dict:
    """Original session stats for backward compatibility."""
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


class AnalyticsService:
    """Service for computing study analytics and insights."""
    
    @staticmethod
    def get_study_heatmap(user_id: int, days: int = 365) -> Dict[str, Any]:
        """
        Get GitHub-style contribution heatmap data.
        Returns dict of date -> activity count for the past N days.
        """
        start_date = date.today() - timedelta(days=days)
        
        # Query activities grouped by date
        activities = db.session.query(
            func.date(StudyActivity.created_at).label('activity_date'),
            func.count(StudyActivity.id).label('count'),
            func.sum(StudyActivity.xp_earned).label('xp'),
        ).filter(
            StudyActivity.user_id == user_id,
            StudyActivity.created_at >= datetime.combine(start_date, datetime.min.time()),
        ).group_by(
            func.date(StudyActivity.created_at)
        ).all()
        
        # Build heatmap data
        heatmap = {}
        for row in activities:
            date_str = row.activity_date.isoformat() if hasattr(row.activity_date, 'isoformat') else str(row.activity_date)
            heatmap[date_str] = {
                "count": row.count,
                "xp": row.xp or 0,
                "level": AnalyticsService._activity_level(row.count),
            }
        
        # Fill in missing days with zero
        current = start_date
        while current <= date.today():
            date_str = current.isoformat()
            if date_str not in heatmap:
                heatmap[date_str] = {"count": 0, "xp": 0, "level": 0}
            current += timedelta(days=1)
        
        # Calculate stats
        total_days_active = sum(1 for v in heatmap.values() if v["count"] > 0)
        total_xp = sum(v["xp"] for v in heatmap.values())
        
        return {
            "heatmap": heatmap,
            "total_days_active": total_days_active,
            "total_xp": total_xp,
            "days_covered": days,
        }
    
    @staticmethod
    def _activity_level(count: int) -> int:
        """Convert activity count to level (0-4) for heatmap coloring."""
        if count == 0:
            return 0
        elif count <= 2:
            return 1
        elif count <= 5:
            return 2
        elif count <= 10:
            return 3
        else:
            return 4
    
    @staticmethod
    def get_time_breakdown(user_id: int, days: int = 30) -> Dict[str, Any]:
        """Get breakdown of study time per tag/topic."""
        start_date = datetime.now(timezone.utc) - timedelta(days=days)
        
        # Get activities with associated notes
        activities = StudyActivity.query.filter(
            StudyActivity.user_id == user_id,
            StudyActivity.created_at >= start_date,
            StudyActivity.note_id.isnot(None),
        ).all()
        
        # Group by tag
        tag_time = defaultdict(lambda: {"minutes": 0, "xp": 0, "count": 0})
        untagged_time = {"minutes": 0, "xp": 0, "count": 0}
        
        for activity in activities:
            note = Note.query.get(activity.note_id)
            if note and note.tags:
                for tag in note.tags:
                    tag_time[tag.name]["minutes"] += activity.duration_minutes or 0
                    tag_time[tag.name]["xp"] += activity.xp_earned
                    tag_time[tag.name]["count"] += 1
            else:
                untagged_time["minutes"] += activity.duration_minutes or 0
                untagged_time["xp"] += activity.xp_earned
                untagged_time["count"] += 1
        
        # Get activity type breakdown
        type_breakdown = defaultdict(lambda: {"count": 0, "xp": 0})
        all_activities = StudyActivity.query.filter(
            StudyActivity.user_id == user_id,
            StudyActivity.created_at >= start_date,
        ).all()
        
        for activity in all_activities:
            type_breakdown[activity.activity_type]["count"] += 1
            type_breakdown[activity.activity_type]["xp"] += activity.xp_earned
        
        return {
            "by_tag": dict(tag_time),
            "untagged": untagged_time,
            "by_activity_type": dict(type_breakdown),
            "days_covered": days,
        }
    
    @staticmethod
    def get_quiz_performance(user_id: int, days: int = 30) -> Dict[str, Any]:
        """Get quiz performance trends."""
        start_date = datetime.now(timezone.utc) - timedelta(days=days)
        
        results = UserQuizResult.query.filter(
            UserQuizResult.user_id == user_id,
            UserQuizResult.completed_at >= start_date,
        ).order_by(UserQuizResult.completed_at).all()
        
        if not results:
            return {
                "total_quizzes": 0,
                "average_score": 0,
                "scores_over_time": [],
                "perfect_scores": 0,
            }
        
        scores = [r.score for r in results if r.score is not None]
        
        return {
            "total_quizzes": len(results),
            "average_score": sum(scores) / len(scores) if scores else 0,
            "scores_over_time": [
                {
                    "date": r.completed_at.isoformat(),
                    "score": r.score,
                    "quiz_id": r.quiz_id,
                }
                for r in results
            ],
            "perfect_scores": sum(1 for s in scores if s >= 100),
            "trend": AnalyticsService._calculate_trend(scores),
        }
    
    @staticmethod
    def _calculate_trend(values: List[float]) -> str:
        """Calculate if values are trending up, down, or stable."""
        if len(values) < 3:
            return "stable"
        
        recent = values[-3:]
        earlier = values[:-3] if len(values) > 3 else values[:len(values)//2]
        
        recent_avg = sum(recent) / len(recent)
        earlier_avg = sum(earlier) / len(earlier) if earlier else recent_avg
        
        diff = recent_avg - earlier_avg
        if diff > 5:
            return "improving"
        elif diff < -5:
            return "declining"
        return "stable"
    
    @staticmethod
    def get_flashcard_stats(user_id: int) -> Dict[str, Any]:
        """Get flashcard mastery statistics."""
        progress = UserFlashcardProgress.query.filter_by(user_id=user_id).all()
        
        if not progress:
            return {
                "total_cards": 0,
                "mastered": 0,
                "learning": 0,
                "new": 0,
                "mastery_percent": 0,
            }
        
        # Mastery levels based on correct streak
        mastered = sum(1 for p in progress if p.correct_streak >= 3)
        learning = sum(1 for p in progress if 0 < p.correct_streak < 3)
        new_cards = sum(1 for p in progress if p.correct_streak == 0 and p.review_count == 0)
        
        return {
            "total_cards": len(progress),
            "mastered": mastered,
            "learning": learning,
            "new": new_cards,
            "mastery_percent": (mastered / len(progress) * 100) if progress else 0,
            "average_streak": sum(p.correct_streak for p in progress) / len(progress) if progress else 0,
        }
    
    @staticmethod
    def get_study_insights(user_id: int) -> List[Dict[str, Any]]:
        """Generate AI-style insights about study patterns."""
        insights = []
        
        # Get recent activities
        week_ago = datetime.now(timezone.utc) - timedelta(days=7)
        activities = StudyActivity.query.filter(
            StudyActivity.user_id == user_id,
            StudyActivity.created_at >= week_ago,
        ).all()
        
        if not activities:
            insights.append({
                "type": "warning",
                "title": "No recent activity",
                "message": "You haven't studied in the past week. Start a quick session to get back on track!",
                "icon": "warning",
            })
            return insights
        
        # Analyze time of day patterns
        hour_counts = defaultdict(int)
        for activity in activities:
            hour_counts[activity.created_at.hour] += 1
        
        if hour_counts:
            best_hour = max(hour_counts, key=hour_counts.get)
            time_of_day = (
                "morning" if 5 <= best_hour < 12 else
                "afternoon" if 12 <= best_hour < 17 else
                "evening" if 17 <= best_hour < 21 else
                "night"
            )
            insights.append({
                "type": "info",
                "title": f"You're a {time_of_day} studier",
                "message": f"Most of your study activity happens around {best_hour}:00. Consider scheduling important topics during this time.",
                "icon": "schedule",
            })
        
        # Check streak status
        gamification = UserGamification.query.filter_by(user_id=user_id).first()
        if gamification:
            if gamification.current_streak >= 7:
                insights.append({
                    "type": "success",
                    "title": "Amazing streak!",
                    "message": f"You've maintained a {gamification.current_streak}-day streak. Keep it going!",
                    "icon": "local_fire_department",
                })
            elif gamification.current_streak == 0:
                insights.append({
                    "type": "warning",
                    "title": "Start a new streak",
                    "message": "Your streak was reset. Study today to start building a new one!",
                    "icon": "replay",
                })
        
        # Activity type distribution
        type_counts = defaultdict(int)
        for activity in activities:
            type_counts[activity.activity_type] += 1
        
        if type_counts:
            most_common = max(type_counts, key=type_counts.get)
            
            if most_common == ActivityType.QUIZ_COMPLETED.value:
                insights.append({
                    "type": "info",
                    "title": "Quiz master",
                    "message": "You've been focusing on quizzes. Try reviewing notes to reinforce concepts.",
                    "icon": "quiz",
                })
            elif most_common == ActivityType.NOTE_CREATED.value:
                insights.append({
                    "type": "info", 
                    "title": "Note-taking pro",
                    "message": "Great job creating notes! Try generating quizzes from them to test yourself.",
                    "icon": "note_add",
                })
        
        # Daily goal analysis
        if gamification and gamification.daily_goal_met_today:
            insights.append({
                "type": "success",
                "title": "Daily goal achieved!",
                "message": f"You've hit your {gamification.daily_goal_minutes}-minute goal today. Great work!",
                "icon": "emoji_events",
            })
        
        # XP velocity
        xp_this_week = sum(a.xp_earned for a in activities)
        avg_daily_xp = xp_this_week / 7
        
        if avg_daily_xp > 100:
            insights.append({
                "type": "success",
                "title": "High XP earner",
                "message": f"You're averaging {int(avg_daily_xp)} XP per day this week. Excellent momentum!",
                "icon": "trending_up",
            })
        elif avg_daily_xp < 20:
            insights.append({
                "type": "warning",
                "title": "Room for growth",
                "message": "Try to study a little more each day to build momentum and earn more XP.",
                "icon": "trending_flat",
            })
        
        return insights
    
    @staticmethod
    def get_weekly_summary(user_id: int) -> Dict[str, Any]:
        """Get a summary of the past week's study activity."""
        week_ago = datetime.now(timezone.utc) - timedelta(days=7)
        
        activities = StudyActivity.query.filter(
            StudyActivity.user_id == user_id,
            StudyActivity.created_at >= week_ago,
        ).all()
        
        # Calculate stats
        total_xp = sum(a.xp_earned for a in activities)
        total_minutes = sum(a.duration_minutes or 0 for a in activities)
        days_active = len(set(a.created_at.date() for a in activities))
        
        # Count by type
        notes_created = sum(1 for a in activities if a.activity_type == ActivityType.NOTE_CREATED.value)
        quizzes_completed = sum(1 for a in activities if a.activity_type == ActivityType.QUIZ_COMPLETED.value)
        cards_reviewed = sum(1 for a in activities if a.activity_type in [
            ActivityType.FLASHCARD_REVIEWED.value, 
            ActivityType.FLASHCARD_CORRECT.value
        ])
        
        return {
            "period": {
                "start": week_ago.isoformat(),
                "end": datetime.now(timezone.utc).isoformat(),
            },
            "total_xp": total_xp,
            "total_minutes": total_minutes,
            "days_active": days_active,
            "notes_created": notes_created,
            "quizzes_completed": quizzes_completed,
            "cards_reviewed": cards_reviewed,
            "activity_count": len(activities),
        }
