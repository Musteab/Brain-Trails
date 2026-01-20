"""
Settings API Routes
- User preferences CRUD
- Session management
- Data export
- Account deletion
- Progress reset
"""
from datetime import datetime
from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import get_jwt_identity, jwt_required
import json

from app.extensions import db
from app.models import (
    User,
    UserPreferences,
    UserGamification,
    UserPet,
    StudyActivity,
    Note,
    Quiz,
    Deck,
    Flashcard,
    UserFlashcardProgress,
    UserQuizResult,
    ActivityLog,
    UserAchievement,
)

settings_bp = Blueprint('settings', __name__, url_prefix='/api/settings')


def get_or_create_preferences(user_id):
    """Get or create user preferences"""
    prefs = UserPreferences.query.filter_by(user_id=user_id).first()
    if not prefs:
        prefs = UserPreferences(user_id=user_id)
        db.session.add(prefs)
        db.session.commit()
    return prefs


@settings_bp.route('/preferences', methods=['GET'])
@jwt_required()
def get_preferences():
    """Get all user preferences"""
    user_id = get_jwt_identity()
    prefs = get_or_create_preferences(user_id)
    
    return jsonify({
        'preferences': prefs.to_dict()
    })


@settings_bp.route('/preferences', methods=['PATCH'])
@jwt_required()
def update_preferences():
    """Update user preferences"""
    user_id = get_jwt_identity()
    prefs = get_or_create_preferences(user_id)
    data = request.get_json()
    
    # List of allowed preference fields
    allowed_fields = [
        # Study preferences
        'default_room', 'daily_goal_minutes', 'theme_mode', 'language', 'timezone',
        # Pomodoro
        'pomodoro_duration', 'short_break', 'long_break', 'auto_start_breaks', 'play_sound_on_complete',
        # Editor
        'editor_font_size', 'editor_autosave', 'autosave_interval', 'spell_check',
        # Flashcards
        'cards_per_session', 'show_answer_timer', 'card_shuffle',
        # Quizzes
        'default_quiz_time_limit', 'show_explanations', 'allow_retry',
        # Notifications
        'notifications_enabled', 'study_reminders', 'flashcard_reminders',
        'daily_goal_reminders', 'streak_warning', 'level_up_notifications', 'achievement_notifications',
        # Email
        'email_weekly_report', 'email_feature_updates', 'email_study_tips', 'email_marketing',
        # Quiet hours
        'quiet_hours_enabled', 'quiet_hours_start', 'quiet_hours_end',
        # Privacy
        'share_anonymous_data', 'personalized_suggestions', 'allow_buddy_requests',
        'show_online_status', 'allow_mentions',
        # Brainrot
        'brainrot_default_video', 'brainrot_layout', 'brainrot_opacity',
        'brainrot_mute_video', 'brainrot_auto_start', 'brainrot_show_timer',
        # UI Layout
        'sidebar_collapsed',
    ]
    
    updated_fields = []
    for field in allowed_fields:
        if field in data:
            setattr(prefs, field, data[field])
            updated_fields.append(field)
    
    db.session.commit()
    
    return jsonify({
        'message': 'Preferences updated',
        'updated_fields': updated_fields,
        'preferences': prefs.to_dict(),
    })


@settings_bp.route('/preferences/category/<category>', methods=['PATCH'])
@jwt_required()
def update_preference_category(category):
    """Update preferences by category"""
    user_id = get_jwt_identity()
    prefs = get_or_create_preferences(user_id)
    data = request.get_json()
    
    # Category field mappings
    categories = {
        'study': ['default_room', 'daily_goal_minutes', 'theme_mode', 'language', 'timezone'],
        'pomodoro': ['pomodoro_duration', 'short_break', 'long_break', 'auto_start_breaks', 'play_sound_on_complete'],
        'editor': ['editor_font_size', 'editor_autosave', 'autosave_interval', 'spell_check'],
        'flashcards': ['cards_per_session', 'show_answer_timer', 'card_shuffle'],
        'quizzes': ['default_quiz_time_limit', 'show_explanations', 'allow_retry'],
        'notifications': ['notifications_enabled', 'study_reminders', 'flashcard_reminders',
                         'daily_goal_reminders', 'streak_warning', 'level_up_notifications', 'achievement_notifications'],
        'email': ['email_weekly_report', 'email_feature_updates', 'email_study_tips', 'email_marketing'],
        'quiet_hours': ['quiet_hours_enabled', 'quiet_hours_start', 'quiet_hours_end'],
        'privacy': ['share_anonymous_data', 'personalized_suggestions', 'allow_buddy_requests',
                   'show_online_status', 'allow_mentions'],
        'brainrot': ['brainrot_default_video', 'brainrot_layout', 'brainrot_opacity',
                    'brainrot_mute_video', 'brainrot_auto_start', 'brainrot_show_timer'],
    }
    
    if category not in categories:
        return jsonify({'error': 'Invalid category'}), 400
    
    allowed_fields = categories[category]
    updated_fields = []
    
    for field in allowed_fields:
        if field in data:
            setattr(prefs, field, data[field])
            updated_fields.append(field)
    
    db.session.commit()
    
    return jsonify({
        'message': f'{category.title()} preferences updated',
        'updated_fields': updated_fields,
    })


@settings_bp.route('/account', methods=['GET'])
@jwt_required()
def get_account_info():
    """Get account information"""
    user_id = get_jwt_identity()
    user = User.query.get_or_404(user_id)
    
    return jsonify({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'created_at': user.created_at.isoformat() if user.created_at else None,
        'updated_at': user.updated_at.isoformat() if user.updated_at else None,
    })


@settings_bp.route('/account/username', methods=['PATCH'])
@jwt_required()
def update_username():
    """Update username"""
    user_id = get_jwt_identity()
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    
    new_username = data.get('username', '').strip()
    
    if not new_username:
        return jsonify({'error': 'Username is required'}), 400
    
    if len(new_username) < 3 or len(new_username) > 30:
        return jsonify({'error': 'Username must be 3-30 characters'}), 400
    
    # Check if username is taken
    existing = User.query.filter_by(username=new_username).first()
    if existing and existing.id != user_id:
        return jsonify({'error': 'Username already taken'}), 409
    
    user.username = new_username
    db.session.commit()
    
    return jsonify({
        'message': 'Username updated',
        'username': user.username,
    })


@settings_bp.route('/account/email', methods=['PATCH'])
@jwt_required()
def update_email():
    """Update email"""
    user_id = get_jwt_identity()
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    
    new_email = data.get('email', '').strip().lower()
    
    if not new_email:
        return jsonify({'error': 'Email is required'}), 400
    
    # Basic email validation
    if '@' not in new_email or '.' not in new_email:
        return jsonify({'error': 'Invalid email format'}), 400
    
    # Check if email is taken
    existing = User.query.filter_by(email=new_email).first()
    if existing and existing.id != user_id:
        return jsonify({'error': 'Email already in use'}), 409
    
    user.email = new_email
    db.session.commit()
    
    return jsonify({
        'message': 'Email updated',
        'email': user.email,
    })


@settings_bp.route('/account/password', methods=['PATCH'])
@jwt_required()
def update_password():
    """Update password"""
    user_id = get_jwt_identity()
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    
    current_password = data.get('current_password')
    new_password = data.get('new_password')
    
    if not current_password or not new_password:
        return jsonify({'error': 'Current and new password required'}), 400
    
    if not user.check_password(current_password):
        return jsonify({'error': 'Current password is incorrect'}), 401
    
    if len(new_password) < 8:
        return jsonify({'error': 'Password must be at least 8 characters'}), 400
    
    user.set_password(new_password)
    db.session.commit()
    
    return jsonify({
        'message': 'Password updated successfully',
    })


@settings_bp.route('/export-data', methods=['POST'])
@jwt_required()
def export_user_data():
    """Export all user data as JSON"""
    user_id = get_jwt_identity()
    user = User.query.get_or_404(user_id)
    
    # Collect all user data
    export_data = {
        'exported_at': datetime.utcnow().isoformat(),
        'user': {
            'username': user.username,
            'email': user.email,
            'created_at': user.created_at.isoformat() if user.created_at else None,
        },
        'notes': [],
        'quizzes': [],
        'decks': [],
        'study_activities': [],
        'achievements': [],
    }
    
    # Export notes
    notes = Note.query.filter_by(user_id=user_id).all()
    export_data['notes'] = [
        {
            'title': n.title,
            'content': n.content,
            'created_at': n.created_at.isoformat() if n.created_at else None,
            'updated_at': n.updated_at.isoformat() if n.updated_at else None,
        }
        for n in notes
    ]
    
    # Export quizzes
    quizzes = Quiz.query.filter_by(user_id=user_id).all()
    export_data['quizzes'] = [
        {
            'title': q.title,
            'created_at': q.created_at.isoformat() if q.created_at else None,
        }
        for q in quizzes
    ]
    
    # Export decks
    decks = Deck.query.filter_by(user_id=user_id).all()
    for deck in decks:
        flashcards = Flashcard.query.filter_by(deck_id=deck.id).all()
        export_data['decks'].append({
            'name': deck.name,
            'description': deck.description,
            'flashcards': [
                {'front': f.front, 'back': f.back}
                for f in flashcards
            ],
        })
    
    # Export study activities
    activities = StudyActivity.query.filter_by(user_id=user_id).all()
    export_data['study_activities'] = [
        {
            'type': a.activity_type,
            'duration_minutes': a.duration_minutes,
            'xp_earned': a.xp_earned,
            'created_at': a.created_at.isoformat() if a.created_at else None,
        }
        for a in activities
    ]
    
    # Export achievements
    user_achievements = UserAchievement.query.filter_by(user_id=user_id, is_unlocked=True).all()
    export_data['achievements'] = [
        {
            'name': ua.achievement.name,
            'unlocked_at': ua.unlocked_at.isoformat() if ua.unlocked_at else None,
        }
        for ua in user_achievements
    ]
    
    return jsonify(export_data)


# Aliases to match frontend expectations
@settings_bp.route('/export', methods=['GET'])
@jwt_required()
def export_user_data_alias():
    """GET alias for exporting user data (delegates to export_user_data)."""
    return export_user_data()


@settings_bp.route('/reset-progress', methods=['POST'])
@jwt_required()
def reset_progress():
    """Reset gamification progress"""
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}
    reset_type = data.get('type', 'all')
    
    if reset_type == 'streak':
        gamification = UserGamification.query.filter_by(user_id=user_id).first()
        if gamification:
            gamification.current_streak = 0
            gamification.last_study_date = None
        message = 'Streak reset'
    
    elif reset_type == 'xp':
        gamification = UserGamification.query.filter_by(user_id=user_id).first()
        if gamification:
            gamification.xp = 0
            gamification.lifetime_xp = 0
            gamification.level = 1
        message = 'XP and level reset'
    
    elif reset_type == 'all':
        # Reset gamification
        gamification = UserGamification.query.filter_by(user_id=user_id).first()
        if gamification:
            gamification.xp = 0
            gamification.lifetime_xp = 0
            gamification.level = 1
            gamification.current_streak = 0
            gamification.best_streak = 0
            gamification.last_study_date = None
            gamification.daily_xp_today = 0
            gamification.daily_minutes_today = 0
        
        # Reset achievements
        UserAchievement.query.filter_by(user_id=user_id).delete()
        
        # Reset activity log
        ActivityLog.query.filter_by(user_id=user_id).delete()
        
        # Reset study activities
        StudyActivity.query.filter_by(user_id=user_id).delete()
        
        message = 'All gamification progress reset'
    
    else:
        return jsonify({'error': 'Invalid reset type'}), 400
    
    db.session.commit()
    
    return jsonify({
        'message': message,
        'reset_type': reset_type,
    })


@settings_bp.route('/progress', methods=['DELETE'])
@jwt_required()
def reset_progress_alias():
    """DELETE alias for resetting progress (defaults to full reset)."""
    # Mimic a POST reset with default body
    return reset_progress()


@settings_bp.route('/clear-cache', methods=['POST'])
@jwt_required()
def clear_cache():
    """Clear cached data (placeholder - actual implementation depends on caching setup)"""
    return jsonify({
        'message': 'Cache cleared',
    })


@settings_bp.route('/delete-study-sessions', methods=['DELETE'])
@jwt_required()
def delete_study_sessions():
    """Delete all study sessions"""
    user_id = get_jwt_identity()
    
    deleted = StudyActivity.query.filter_by(user_id=user_id).delete()
    db.session.commit()
    
    return jsonify({
        'message': f'Deleted {deleted} study sessions',
        'deleted_count': deleted,
    })


@settings_bp.route('/account', methods=['DELETE'])
@jwt_required()
def delete_account():
    """Delete user account and all associated data"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    # Require password confirmation
    password = data.get('password')
    if not password:
        return jsonify({'error': 'Password required to delete account'}), 400
    
    user = User.query.get_or_404(user_id)
    if not user.check_password(password):
        return jsonify({'error': 'Incorrect password'}), 401
    
    # Delete all user data (cascade should handle most)
    # But being explicit for safety
    
    # Delete flashcard progress
    UserFlashcardProgress.query.filter_by(user_id=user_id).delete()
    
    # Delete flashcards and decks
    decks = Deck.query.filter_by(user_id=user_id).all()
    for deck in decks:
        Flashcard.query.filter_by(deck_id=deck.id).delete()
    Deck.query.filter_by(user_id=user_id).delete()
    
    # Delete quiz results and quizzes
    UserQuizResult.query.filter_by(user_id=user_id).delete()
    quizzes = Quiz.query.filter_by(user_id=user_id).all()
    for quiz in quizzes:
        from app.models import Question
        Question.query.filter_by(quiz_id=quiz.id).delete()
    Quiz.query.filter_by(user_id=user_id).delete()
    
    # Delete notes
    Note.query.filter_by(user_id=user_id).delete()
    
    # Delete gamification data
    UserGamification.query.filter_by(user_id=user_id).delete()
    UserPet.query.filter_by(user_id=user_id).delete()
    StudyActivity.query.filter_by(user_id=user_id).delete()
    
    # Delete profile data
    from app.models import UserProfile, BrainrotFavorite
    UserProfile.query.filter_by(user_id=user_id).delete()
    UserPreferences.query.filter_by(user_id=user_id).delete()
    UserAchievement.query.filter_by(user_id=user_id).delete()
    ActivityLog.query.filter_by(user_id=user_id).delete()
    BrainrotFavorite.query.filter_by(user_id=user_id).delete()
    
    # Finally delete user
    db.session.delete(user)
    db.session.commit()
    
    return jsonify({
        'message': 'Account deleted successfully',
    })


@settings_bp.route('/check-username/<username>', methods=['GET'])
def check_username_availability(username):
    """Check if username is available"""
    existing = User.query.filter_by(username=username).first()
    
    return jsonify({
        'username': username,
        'available': existing is None,
    })
