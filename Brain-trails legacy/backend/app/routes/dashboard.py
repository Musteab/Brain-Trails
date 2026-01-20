"""
Dashboard API Routes
Single endpoint for all dashboard data - reduces API calls from 10+ to 1
Also provides sidebar-stats endpoint for quick sidebar data
"""
from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from sqlalchemy import func, or_

from ..extensions import db
from ..models import User, Note, Flashcard, FlashcardDeck, Quiz, QuizAttempt, StudySession
from ..models.gamification import UserGamification, UserPet

dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/api/dashboard')


def get_flashcards_due_count(user_id):
    """Count flashcards due for review today"""
    today = datetime.utcnow().date()
    count = db.session.query(func.count(Flashcard.id)).join(FlashcardDeck).filter(
        FlashcardDeck.user_id == user_id,
        Flashcard.next_review <= today
    ).scalar()
    return count or 0


def get_unfinished_quizzes(user_id, limit=3):
    """Get quizzes with incomplete attempts"""
    # Get quizzes where user has started but not completed
    incomplete = db.session.query(Quiz).join(QuizAttempt).filter(
        QuizAttempt.user_id == user_id,
        QuizAttempt.completed_at.is_(None)
    ).limit(limit).all()
    return incomplete


def get_stale_notes(user_id, days=7, limit=3):
    """Get notes not reviewed in X days"""
    cutoff = datetime.utcnow() - timedelta(days=days)
    stale = Note.query.filter(
        Note.user_id == user_id,
        Note.updated_at < cutoff
    ).order_by(Note.updated_at.asc()).limit(limit).all()
    return stale


def get_recent_notes(user_id, limit=5):
    """Get most recently edited notes"""
    notes = Note.query.filter(
        Note.user_id == user_id
    ).order_by(Note.updated_at.desc()).limit(limit).all()
    return notes


def get_weekly_stats(user_id):
    """Get stats for the current week"""
    week_ago = datetime.utcnow() - timedelta(days=7)
    
    # Total study minutes
    total_minutes = db.session.query(
        func.coalesce(func.sum(StudySession.duration), 0)
    ).filter(
        StudySession.user_id == user_id,
        StudySession.start_time >= week_ago
    ).scalar() or 0
    
    # Notes created
    notes_created = Note.query.filter(
        Note.user_id == user_id,
        Note.created_at >= week_ago
    ).count()
    
    # Quizzes completed
    quizzes_completed = QuizAttempt.query.filter(
        QuizAttempt.user_id == user_id,
        QuizAttempt.completed_at >= week_ago,
        QuizAttempt.completed_at.isnot(None)
    ).count()
    
    # Daily breakdown
    daily = []
    for i in range(7):
        day = datetime.utcnow().date() - timedelta(days=6-i)
        day_start = datetime.combine(day, datetime.min.time())
        day_end = datetime.combine(day, datetime.max.time())
        
        minutes = db.session.query(
            func.coalesce(func.sum(StudySession.duration), 0)
        ).filter(
            StudySession.user_id == user_id,
            StudySession.start_time >= day_start,
            StudySession.start_time <= day_end
        ).scalar() or 0
        
        daily.append({
            'date': day.isoformat(),
            'minutes': minutes
        })
    
    return {
        'total_minutes': total_minutes,
        'total_xp': 0,  # Would come from gamification
        'notes_created': notes_created,
        'quizzes_completed': quizzes_completed,
        'daily': daily
    }


def calculate_pet_mood(user_id):
    """Calculate pet mood based on recent activity"""
    today = datetime.utcnow().date()
    yesterday = today - timedelta(days=1)
    
    # Check if user studied today
    studied_today = StudySession.query.filter(
        StudySession.user_id == user_id,
        func.date(StudySession.start_time) == today
    ).first() is not None
    
    # Check streak (simplified)
    studied_yesterday = StudySession.query.filter(
        StudySession.user_id == user_id,
        func.date(StudySession.start_time) == yesterday
    ).first() is not None
    
    if studied_today and studied_yesterday:
        return 'excited'
    elif studied_today:
        return 'happy'
    elif studied_yesterday:
        return 'sleepy'
    else:
        return 'hungry'


def get_pet_message(mood):
    """Get pet message based on mood"""
    messages = {
        'happy': 'Ready to study!',
        'excited': 'On fire! Keep going!',
        'sleepy': 'Miss you... come study!',
        'hungry': 'Feed me with knowledge!',
    }
    return messages.get(mood, 'Ready to study!')


@dashboard_bp.route('/summary', methods=['GET'])
@jwt_required()
def get_dashboard_summary():
    """
    Single endpoint that returns all dashboard data
    Reduces API calls from 10+ to 1
    """
    user_id = get_jwt_identity()
    
    try:
        # Flashcards due
        flashcards_due = get_flashcards_due_count(user_id)
        
        # Unfinished quizzes
        unfinished_quizzes = get_unfinished_quizzes(user_id)
        
        # Stale notes (not reviewed in 7+ days)
        stale_notes = get_stale_notes(user_id, days=7, limit=3)
        
        # Recent notes (last 5)
        recent_notes = get_recent_notes(user_id, limit=5)
        
        # Weekly stats
        weekly_stats = get_weekly_stats(user_id)
        
        # Get real gamification data
        gamification = UserGamification.query.filter_by(user_id=user_id).first()
        
        # Get active pet with real mood
        active_pet = UserPet.query.filter_by(user_id=user_id, is_active=True).first()
        pet_mood = active_pet.mood if active_pet else calculate_pet_mood(user_id)
        
        # Calculate real values from gamification
        today_minutes = gamification.daily_minutes_today if gamification else 0
        goal_minutes = gamification.daily_goal_minutes if gamification else 120
        xp_today = gamification.daily_xp_today if gamification else 0
        current_streak = gamification.current_streak if gamification else 0
        current_level = gamification.level if gamification else 1
        current_xp = gamification.xp if gamification else 0
        xp_to_next = gamification.xp_to_next_level if gamification else 100
        
        return jsonify({
            "ok": True,
            "data": {
                "today": {
                    "minutes": today_minutes,
                    "goal_minutes": goal_minutes,
                    "xp_today": xp_today,
                    "streak": current_streak
                },
                "level": {
                    "current": current_level,
                    "xp": current_xp,
                    "xp_for_next": xp_to_next
                },
                "up_next": {
                    "flashcards_due": flashcards_due,
                    "unfinished_quizzes": [
                        {"id": q.id, "title": q.title} 
                        for q in unfinished_quizzes
                    ],
                    "stale_notes": [
                        {
                            "id": n.id, 
                            "title": n.title,
                            "updated_at": n.updated_at.isoformat() if n.updated_at else None
                        } 
                        for n in stale_notes
                    ]
                },
                "recent_notes": [
                    {
                        "id": n.id,
                        "title": n.title,
                        "updated_at": n.updated_at.isoformat() if n.updated_at else None
                    }
                    for n in recent_notes
                ],
                "weekly": weekly_stats,
                "pet": {
                    "mood": pet_mood,
                    "message": get_pet_message(pet_mood),
                    "name": active_pet.name if active_pet else "Study Buddy",
                    "pet_id": active_pet.pet_id if active_pet else "fox"
                }
            }
        })
    except Exception as e:
        current_app.logger.exception("dashboard summary failed: %s", e)
        return jsonify({
            "ok": False,
            "error": {"code": "SERVER_ERROR", "message": "Unable to load dashboard"},
        }), 500


@dashboard_bp.route('/sidebar-stats', methods=['GET'])
@jwt_required()
def get_sidebar_stats():
    """
    Quick stats for sidebar display.
    Returns minimal data for fast sidebar rendering.
    """
    user_id = get_jwt_identity()
    
    try:
        # Get gamification data
        gamification = UserGamification.query.filter_by(user_id=user_id).first()
        
        # Today's minutes from gamification or sessions
        minutes_today = 0
        daily_goal = 120
        if gamification:
            minutes_today = gamification.daily_minutes_today or 0
            daily_goal = gamification.daily_goal_minutes or 120
        
        # Count notes
        note_count = Note.query.filter_by(user_id=user_id).count()
        
        # Flashcards due
        cards_due = get_flashcards_due_count(user_id)
        
        # Unfinished quizzes count
        unfinished_count = db.session.query(func.count(Quiz.id)).join(QuizAttempt).filter(
            QuizAttempt.user_id == user_id,
            QuizAttempt.completed_at.is_(None)
        ).scalar() or 0
        
        # Get active pet
        pet_data = None
        active_pet = UserPet.query.filter_by(user_id=user_id, is_active=True).first()
        if active_pet:
            xp_to_next = (active_pet.level * 100) if active_pet.level else 100
            pet_data = {
                "id": active_pet.id,
                "pet_type": active_pet.pet_id,
                "name": active_pet.name,
                "emoji": get_pet_emoji(active_pet.pet_id),
                "mood": active_pet.mood or "happy",
                "level": active_pet.level,
                "xp": active_pet.xp,
                "xp_to_next": xp_to_next,
                "xp_percent": round((active_pet.xp / max(xp_to_next, 1)) * 100),
            }
        else:
            # Default pet for users without one
            pet_data = {
                "id": None,
                "pet_type": "fox",
                "name": "Study Buddy",
                "emoji": "🦊",
                "mood": calculate_pet_mood(user_id),
                "level": 1,
                "xp": 0,
                "xp_to_next": 100,
                "xp_percent": 0,
            }
        
        # Build up_next items
        up_next = []
        if cards_due > 0:
            up_next.append({
                "type": "cards",
                "text": f"Review {cards_due} flashcard{'s' if cards_due != 1 else ''}",
                "priority": "high" if cards_due >= 5 else "normal",
            })
        
        if unfinished_count > 0:
            up_next.append({
                "type": "quiz",
                "text": f"Finish {unfinished_count} quiz{'zes' if unfinished_count != 1 else ''}",
                "priority": "normal",
            })
        
        # Check stale notes
        cutoff = datetime.utcnow() - timedelta(days=7)
        stale_count = Note.query.filter(
            Note.user_id == user_id,
            Note.updated_at < cutoff
        ).count()
        if stale_count > 0:
            up_next.append({
                "type": "review",
                "text": f"Review {stale_count} stale note{'s' if stale_count != 1 else ''}",
                "priority": "low",
            })
        
        return jsonify({
            "ok": True,
            "minutes_today": minutes_today,
            "daily_goal": daily_goal,
            "daily_progress": round((minutes_today / max(daily_goal, 1)) * 100),
            "note_count": note_count,
            "cards_due": cards_due,
            "unfinished_quizzes": unfinished_count,
            "pet": pet_data,
            "up_next": up_next[:3],  # Max 3 items
        })
    except Exception as e:
        current_app.logger.exception("sidebar stats failed: %s", e)
        return jsonify({
            "ok": False,
            "error": {"code": "SERVER_ERROR", "message": "Unable to load sidebar stats"},
        }), 500


def get_pet_emoji(pet_id):
    """Get emoji for pet type"""
    pet_emojis = {
        "fox": "🦊",
        "owl": "🦉",
        "cat": "🐱",
        "dragon": "🐉",
        "forest-sprite": "🦊",
        "cabin-cat": "🐱",
        "space-blob": "🛸",
        "tide-fish": "🐠",
        "cyber-robot": "🤖",
    }
    return pet_emojis.get(pet_id, "🦊")


@dashboard_bp.route('/search', methods=['GET'])
@jwt_required()
def global_search():
    """
    Global search across notes, decks, and quizzes.
    Used by command palette.
    """
    user_id = get_jwt_identity()
    query = request.args.get('q', '').strip()
    
    if not query or len(query) < 2:
        return jsonify({
            "ok": True,
            "notes": [],
            "decks": [],
            "quizzes": [],
        })
    
    search_pattern = f"%{query}%"
    limit = 5  # Limit per category
    
    try:
        # Search notes
        notes = Note.query.filter(
            Note.user_id == user_id,
            or_(
                Note.title.ilike(search_pattern),
                Note.content.ilike(search_pattern)
            )
        ).order_by(Note.updated_at.desc()).limit(limit).all()
        
        # Search decks
        decks = FlashcardDeck.query.filter(
            FlashcardDeck.user_id == user_id,
            FlashcardDeck.name.ilike(search_pattern)
        ).order_by(FlashcardDeck.updated_at.desc()).limit(limit).all()
        
        # Search quizzes
        quizzes = Quiz.query.filter(
            Quiz.user_id == user_id,
            Quiz.title.ilike(search_pattern)
        ).order_by(Quiz.created_at.desc()).limit(limit).all()
        
        return jsonify({
            "ok": True,
            "notes": [
                {"id": n.id, "title": n.title, "type": "note"}
                for n in notes
            ],
            "decks": [
                {"id": d.id, "name": d.name, "type": "deck", "card_count": len(d.flashcards) if hasattr(d, 'flashcards') else 0}
                for d in decks
            ],
            "quizzes": [
                {"id": q.id, "title": q.title, "type": "quiz"}
                for q in quizzes
            ],
        })
    except Exception as e:
        current_app.logger.exception("global search failed: %s", e)
        return jsonify({
            "ok": False,
            "error": {"code": "SERVER_ERROR", "message": "Search failed"},
        }), 500
