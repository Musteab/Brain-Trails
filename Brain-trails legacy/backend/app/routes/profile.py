"""
Profile API Routes
- GET/PATCH own profile
- GET public profiles
- Avatar upload
- Achievements
- Activity feed
"""
from datetime import datetime, timedelta
from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy import func

from app.extensions import db
from app.models import (
    User,
    UserProfile,
    Achievement,
    UserAchievement,
    ActivityLog,
    UserGamification,
    Note,
    Quiz,
    UserQuizResult,
    Flashcard,
    Deck,
    UserFlashcardProgress,
    StudyActivity,
    UserPet,
    DEFAULT_ACHIEVEMENTS,
)

profile_bp = Blueprint('profile', __name__, url_prefix='/api/profile')


def get_or_create_profile(user_id):
    """Get or create a user profile"""
    profile = UserProfile.query.filter_by(user_id=user_id).first()
    if not profile:
        profile = UserProfile(user_id=user_id)
        db.session.add(profile)
        db.session.commit()
    return profile


@profile_bp.route('/me', methods=['GET'])
@jwt_required()
def get_my_profile():
    """Get current user's full profile"""
    user_id = get_jwt_identity()
    user = User.query.get_or_404(user_id)
    profile = get_or_create_profile(user_id)
    gamification = UserGamification.query.filter_by(user_id=user_id).first()
    
    # Calculate stats
    total_notes = Note.query.filter_by(user_id=user_id).count()
    total_quizzes = UserQuizResult.query.filter_by(user_id=user_id).count()
    total_decks = Deck.query.filter_by(user_id=user_id).count()
    
    # Get achievement count
    unlocked_achievements = UserAchievement.query.filter_by(
        user_id=user_id, is_unlocked=True
    ).count()
    
    # Get pet count
    pet_count = UserPet.query.filter_by(user_id=user_id).count()
    
    return jsonify({
        'username': user.username,
        'email': user.email,
        'profile': profile.to_dict(is_owner=True),
        'gamification': {
            'level': gamification.level if gamification else 1,
            'total_xp': gamification.lifetime_xp if gamification else 0,
            'current_streak': gamification.current_streak if gamification else 0,
        },
        'stats': {
            'total_notes': total_notes,
            'total_quizzes': total_quizzes,
            'total_decks': total_decks,
            'achievements_unlocked': unlocked_achievements,
            'pet_count': pet_count,
        },
        'joined_at': user.created_at.isoformat() if user.created_at else None,
    })


@profile_bp.route('/me', methods=['PATCH'])
@jwt_required()
def update_my_profile():
    """Update current user's profile"""
    user_id = get_jwt_identity()
    profile = get_or_create_profile(user_id)
    data = request.get_json()
    
    allowed_fields = [
        'display_name', 'bio', 'avatar_url',
        'is_public', 'show_stats', 'show_activity', 'show_achievements'
    ]
    
    for field in allowed_fields:
        if field in data:
            # Validate bio length
            if field == 'bio' and data[field] and len(data[field]) > 200:
                return jsonify({'error': 'Bio must be 200 characters or less'}), 400
            setattr(profile, field, data[field])
    
    db.session.commit()
    
    return jsonify({
        'message': 'Profile updated',
        'profile': profile.to_dict(is_owner=True),
    })


@profile_bp.route('/@<username>', methods=['GET'])
def get_public_profile(username):
    """Get public profile by username"""
    user = User.query.filter_by(username=username).first_or_404()
    profile = get_or_create_profile(user.id)
    
    # Check if profile is public
    if not profile.is_public:
        return jsonify({'error': 'Profile is private'}), 403
    
    gamification = UserGamification.query.filter_by(user_id=user.id).first()
    
    response = {
        'username': user.username,
        'profile': {
            'display_name': profile.display_name,
            'bio': profile.bio,
            'avatar_url': profile.avatar_url,
        },
        'gamification': {
            'level': gamification.level if gamification else 1,
            'total_xp': gamification.lifetime_xp if gamification else 0,
            'current_streak': gamification.current_streak if gamification else 0,
        },
        'joined_at': user.created_at.isoformat() if user.created_at else None,
    }
    
    # Add optional public info based on privacy settings
    if profile.show_stats:
        response['stats'] = {
            'total_notes': Note.query.filter_by(user_id=user.id).count(),
            'total_quizzes': UserQuizResult.query.filter_by(user_id=user.id).count(),
        }
    
    if profile.show_achievements:
        unlocked = UserAchievement.query.filter_by(
            user_id=user.id, is_unlocked=True
        ).all()
        response['achievements'] = [ua.to_dict() for ua in unlocked[:6]]  # Top 6
    
    return jsonify(response)


@profile_bp.route('/achievements', methods=['GET'])
@jwt_required()
def get_achievements():
    """Get all achievements with user progress"""
    user_id = get_jwt_identity()
    
    # Get all achievements
    achievements = Achievement.query.all()
    
    # Get user's progress
    user_achievements = {
        ua.achievement_id: ua
        for ua in UserAchievement.query.filter_by(user_id=user_id).all()
    }
    
    result = []
    for achievement in achievements:
        user_progress = user_achievements.get(achievement.id)
        
        # Include hidden achievements only if unlocked
        if achievement.is_hidden and (not user_progress or not user_progress.is_unlocked):
            continue
        
        result.append({
            'achievement': achievement.to_dict(
                include_hidden=user_progress and user_progress.is_unlocked
            ),
            'progress': user_progress.progress if user_progress else 0,
            'is_unlocked': user_progress.is_unlocked if user_progress else False,
            'unlocked_at': user_progress.unlocked_at.isoformat() if user_progress and user_progress.unlocked_at else None,
        })
    
    # Sort: unlocked first, then by rarity
    rarity_order = {'legendary': 0, 'epic': 1, 'rare': 2, 'common': 3}
    result.sort(key=lambda x: (
        0 if x['is_unlocked'] else 1,
        rarity_order.get(x['achievement']['rarity'], 4)
    ))
    
    return jsonify({
        'achievements': result,
        'unlocked_count': sum(1 for r in result if r['is_unlocked']),
        'total_count': len(result),
    })


@profile_bp.route('/activity', methods=['GET'])
@jwt_required()
def get_activity_feed():
    """Get user's activity feed"""
    user_id = get_jwt_identity()
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    activity_type = request.args.get('type')  # Filter by type
    
    query = ActivityLog.query.filter_by(user_id=user_id)
    
    if activity_type:
        query = query.filter_by(activity_type=activity_type)
    
    activities = query.order_by(ActivityLog.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    return jsonify({
        'activities': [a.to_dict() for a in activities.items],
        'has_more': activities.has_next,
        'total': activities.total,
    })


@profile_bp.route('/heatmap', methods=['GET'])
@jwt_required()
def get_study_heatmap():
    """Get study heatmap data for the past year"""
    user_id = get_jwt_identity()
    
    # Get study activities for the past year
    one_year_ago = datetime.utcnow() - timedelta(days=365)
    
    activities = db.session.query(
        func.date(StudyActivity.created_at).label('date'),
        func.sum(StudyActivity.duration_minutes).label('minutes')
    ).filter(
        StudyActivity.user_id == user_id,
        StudyActivity.created_at >= one_year_ago
    ).group_by(
        func.date(StudyActivity.created_at)
    ).all()
    
    # Convert to dict format
    heatmap_data = {
        str(activity.date): activity.minutes or 0
        for activity in activities
    }
    
    # Calculate stats
    total_minutes = sum(heatmap_data.values())
    study_days = len(heatmap_data)
    
    # Calculate longest streak
    dates = sorted(heatmap_data.keys())
    longest_streak = 0
    current_streak_count = 0
    
    for i, date_str in enumerate(dates):
        if i == 0:
            current_streak_count = 1
        else:
            prev_date = datetime.strptime(dates[i-1], '%Y-%m-%d').date()
            curr_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            if (curr_date - prev_date).days == 1:
                current_streak_count += 1
            else:
                current_streak_count = 1
        longest_streak = max(longest_streak, current_streak_count)
    
    return jsonify({
        'heatmap': heatmap_data,
        'stats': {
            'total_minutes': total_minutes,
            'total_hours': round(total_minutes / 60, 1),
            'study_days': study_days,
            'longest_streak': longest_streak,
        }
    })


@profile_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_detailed_stats():
    """Get detailed study statistics"""
    user_id = get_jwt_identity()
    
    # Notes stats
    total_notes = Note.query.filter_by(user_id=user_id).count()
    
    # Quiz stats
    quiz_results = UserQuizResult.query.filter_by(user_id=user_id).all()
    total_quizzes = len(quiz_results)
    avg_score = (
        sum(r.score for r in quiz_results) / total_quizzes
        if total_quizzes > 0 else 0
    )
    
    # Flashcard stats
    flashcard_progress = UserFlashcardProgress.query.filter_by(user_id=user_id).all()
    total_reviewed = len(flashcard_progress)
    mastered = sum(1 for p in flashcard_progress if p.ease_factor >= 2.5)
    
    # Study time stats
    study_activities = StudyActivity.query.filter_by(user_id=user_id).all()
    total_study_minutes = sum(a.duration_minutes or 0 for a in study_activities)
    
    # Favorite room (most used)
    room_counts = {}
    for activity in study_activities:
        room = activity.activity_metadata.get('room', 'forest') if activity.activity_metadata else 'forest'
        room_counts[room] = room_counts.get(room, 0) + 1
    favorite_room = max(room_counts, key=room_counts.get) if room_counts else 'forest'
    
    # Most productive hour
    hour_counts = {}
    for activity in study_activities:
        hour = activity.created_at.hour
        hour_counts[hour] = hour_counts.get(hour, 0) + (activity.duration_minutes or 0)
    productive_hour = max(hour_counts, key=hour_counts.get) if hour_counts else 14
    
    # Study breakdown percentages
    note_time = sum(
        a.duration_minutes or 0 for a in study_activities
        if a.activity_type == 'note_study'
    )
    flashcard_time = sum(
        a.duration_minutes or 0 for a in study_activities
        if a.activity_type == 'flashcard_review'
    )
    quiz_time = sum(
        a.duration_minutes or 0 for a in study_activities
        if a.activity_type == 'quiz_attempt'
    )
    other_time = total_study_minutes - note_time - flashcard_time - quiz_time
    
    total_for_breakdown = note_time + flashcard_time + quiz_time + other_time or 1
    
    return jsonify({
        'total_study_hours': round(total_study_minutes / 60, 1),
        'total_notes': total_notes,
        'flashcards_reviewed': total_reviewed,
        'flashcards_mastered': mastered,
        'quizzes_completed': total_quizzes,
        'quiz_average_score': round(avg_score, 1),
        'favorite_room': favorite_room,
        'productive_hour': productive_hour,
        'study_breakdown': {
            'notes': round(note_time / total_for_breakdown * 100, 1),
            'flashcards': round(flashcard_time / total_for_breakdown * 100, 1),
            'quizzes': round(quiz_time / total_for_breakdown * 100, 1),
            'other': round(other_time / total_for_breakdown * 100, 1),
        }
    })


@profile_bp.route('/pets', methods=['GET'])
@jwt_required()
def get_pet_collection():
    """Get user's pet collection"""
    user_id = get_jwt_identity()
    
    pets = UserPet.query.filter_by(user_id=user_id).all()
    
    return jsonify({
        'pets': [
            {
                'id': pet.id,
                'pet_type': pet.pet_type,
                'name': pet.name,
                'level': pet.level,
                'happiness': pet.happiness,
                'is_active': pet.is_active,
                'created_at': pet.created_at.isoformat() if pet.created_at else None,
            }
            for pet in pets
        ],
        'total_count': len(pets),
    })


@profile_bp.route('/public', methods=['POST'])
@jwt_required()
def toggle_public_profile():
    """Toggle profile public/private status"""
    user_id = get_jwt_identity()
    profile = get_or_create_profile(user_id)
    
    data = request.get_json()
    profile.is_public = data.get('is_public', not profile.is_public)
    db.session.commit()
    
    user = User.query.get(user_id)
    public_url = f"/@{user.username}" if profile.is_public else None
    
    return jsonify({
        'is_public': profile.is_public,
        'public_url': public_url,
        'message': 'Profile is now public' if profile.is_public else 'Profile is now private',
    })


# Helper function to log activity
def log_activity(user_id, activity_type, activity_data=None, is_public=True):
    """Log a user activity"""
    activity = ActivityLog(
        user_id=user_id,
        activity_type=activity_type,
        activity_data=activity_data or {},
        is_public=is_public,
    )
    db.session.add(activity)
    db.session.commit()
    return activity


# Helper function to check and unlock achievements
def check_achievement(user_id, achievement_code, progress_value=1):
    """Check and update achievement progress"""
    achievement = Achievement.query.filter_by(code=achievement_code).first()
    if not achievement:
        return None
    
    user_achievement = UserAchievement.query.filter_by(
        user_id=user_id, achievement_id=achievement.id
    ).first()
    
    if not user_achievement:
        user_achievement = UserAchievement(
            user_id=user_id,
            achievement_id=achievement.id,
            progress=0,
        )
        db.session.add(user_achievement)
    
    # Already unlocked
    if user_achievement.is_unlocked:
        return None
    
    # Update progress
    user_achievement.progress = progress_value
    
    # Check if unlocked
    if user_achievement.progress >= achievement.target_value:
        user_achievement.is_unlocked = True
        user_achievement.unlocked_at = datetime.utcnow()
        
        # Log achievement unlock
        log_activity(user_id, 'achievement_unlocked', {
            'achievement_code': achievement_code,
            'achievement_name': achievement.name,
            'xp_reward': achievement.xp_reward,
        })
        
        db.session.commit()
        return {
            'unlocked': True,
            'achievement': achievement.to_dict(include_hidden=True),
            'xp_reward': achievement.xp_reward,
        }
    
    db.session.commit()
    return None


# Seed achievements command
def seed_achievements():
    """Seed default achievements to database"""
    for ach_data in DEFAULT_ACHIEVEMENTS:
        existing = Achievement.query.filter_by(code=ach_data['code']).first()
        if not existing:
            achievement = Achievement(**ach_data)
            db.session.add(achievement)
    db.session.commit()
