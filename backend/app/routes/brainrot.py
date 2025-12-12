"""
Brainrot Mode API Routes
- Video presets
- User favorites
- Study stats for brainrot mode
"""
from datetime import datetime, timedelta
from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy import func

from app.extensions import db
from app.models import BrainrotFavorite, StudyActivity

brainrot_bp = Blueprint('brainrot', __name__, url_prefix='/api/brainrot')


# Curated video presets
VIDEO_PRESETS = {
    'classic_brainrot': {
        'name': 'Classic Brainrot',
        'description': 'The OG focus content',
        'videos': [
            {
                'id': 'subway-surfers',
                'title': 'Subway Surfers Gameplay',
                'youtube_id': 'WgkN9Z1DVLY',
                'thumbnail': 'https://img.youtube.com/vi/WgkN9Z1DVLY/hqdefault.jpg',
            },
            {
                'id': 'minecraft-parkour',
                'title': 'Minecraft Parkour',
                'youtube_id': 'n_Dv4JMiwK8',
                'thumbnail': 'https://img.youtube.com/vi/n_Dv4JMiwK8/hqdefault.jpg',
            },
            {
                'id': 'satisfying-comp',
                'title': 'Satisfying Compilation',
                'youtube_id': 'ZM1fkHQP_Pw',
                'thumbnail': 'https://img.youtube.com/vi/ZM1fkHQP_Pw/hqdefault.jpg',
            },
            {
                'id': 'slime-asmr',
                'title': 'Slime ASMR',
                'youtube_id': '1JLUn2DFW4w',
                'thumbnail': 'https://img.youtube.com/vi/1JLUn2DFW4w/hqdefault.jpg',
            },
        ]
    },
    'gaming': {
        'name': 'Gaming Content',
        'description': 'Chill gaming footage',
        'videos': [
            {
                'id': 'minecraft-building',
                'title': 'Minecraft Peaceful Building',
                'youtube_id': '9-9JPNLmT5s',
                'thumbnail': 'https://img.youtube.com/vi/9-9JPNLmT5s/hqdefault.jpg',
            },
            {
                'id': 'stardew-valley',
                'title': 'Stardew Valley Gameplay',
                'youtube_id': 'FjJx6u_5RdU',
                'thumbnail': 'https://img.youtube.com/vi/FjJx6u_5RdU/hqdefault.jpg',
            },
            {
                'id': 'animal-crossing',
                'title': 'Animal Crossing Tours',
                'youtube_id': 'auTi3stuL5M',
                'thumbnail': 'https://img.youtube.com/vi/auTi3stuL5M/hqdefault.jpg',
            },
        ]
    },
    'ambience': {
        'name': 'ASMR & Ambience',
        'description': 'Relaxing background',
        'videos': [
            {
                'id': 'rain-ambience',
                'title': 'Rain & Thunder Ambience',
                'youtube_id': 'mPZkdNFkNps',
                'thumbnail': 'https://img.youtube.com/vi/mPZkdNFkNps/hqdefault.jpg',
            },
            {
                'id': 'coffee-shop',
                'title': 'Coffee Shop Ambience',
                'youtube_id': 'h2zkV-l_TbY',
                'thumbnail': 'https://img.youtube.com/vi/h2zkV-l_TbY/hqdefault.jpg',
            },
            {
                'id': 'library-sounds',
                'title': 'Library Ambience',
                'youtube_id': '4d9H_1ygEv8',
                'thumbnail': 'https://img.youtube.com/vi/4d9H_1ygEv8/hqdefault.jpg',
            },
            {
                'id': 'fireplace',
                'title': 'Cozy Fireplace',
                'youtube_id': 'L_LUpnjgPso',
                'thumbnail': 'https://img.youtube.com/vi/L_LUpnjgPso/hqdefault.jpg',
            },
        ]
    },
    'educational': {
        'name': 'Educational Background',
        'description': 'Learn while you learn',
        'videos': [
            {
                'id': 'nature-doc',
                'title': 'Nature Documentary',
                'youtube_id': 'nlYlNF30bVg',
                'thumbnail': 'https://img.youtube.com/vi/nlYlNF30bVg/hqdefault.jpg',
            },
            {
                'id': 'space-footage',
                'title': 'Space & Stars',
                'youtube_id': 'GoW8Tf7hTGA',
                'thumbnail': 'https://img.youtube.com/vi/GoW8Tf7hTGA/hqdefault.jpg',
            },
            {
                'id': 'art-timelapse',
                'title': 'Art Time-lapse',
                'youtube_id': '0fEMJp70tGU',
                'thumbnail': 'https://img.youtube.com/vi/0fEMJp70tGU/hqdefault.jpg',
            },
        ]
    },
    'satisfying': {
        'name': 'Satisfying Content',
        'description': 'Oddly satisfying',
        'videos': [
            {
                'id': 'pressure-washing',
                'title': 'Pressure Washing',
                'youtube_id': 'DbxJJmP-S5w',
                'thumbnail': 'https://img.youtube.com/vi/DbxJJmP-S5w/hqdefault.jpg',
            },
            {
                'id': 'restoration',
                'title': 'Restoration Videos',
                'youtube_id': 'bFN-KR4SoQQ',
                'thumbnail': 'https://img.youtube.com/vi/bFN-KR4SoQQ/hqdefault.jpg',
            },
            {
                'id': 'cooking',
                'title': 'Cooking Videos',
                'youtube_id': 'egVGBKhBjgU',
                'thumbnail': 'https://img.youtube.com/vi/egVGBKhBjgU/hqdefault.jpg',
            },
        ]
    },
}


@brainrot_bp.route('/presets', methods=['GET'])
def get_presets():
    """Get all video presets"""
    return jsonify({
        'presets': VIDEO_PRESETS,
        'categories': list(VIDEO_PRESETS.keys()),
    })


@brainrot_bp.route('/presets/<category>', methods=['GET'])
def get_preset_category(category):
    """Get videos for a specific preset category"""
    if category not in VIDEO_PRESETS:
        return jsonify({'error': 'Category not found'}), 404
    
    return jsonify(VIDEO_PRESETS[category])


@brainrot_bp.route('/favorites', methods=['GET'])
@jwt_required()
def get_favorites():
    """Get user's favorite videos"""
    user_id = get_jwt_identity()
    
    favorites = BrainrotFavorite.query.filter_by(user_id=user_id)\
        .order_by(BrainrotFavorite.created_at.desc()).all()
    
    return jsonify({
        'favorites': [f.to_dict() for f in favorites],
        'count': len(favorites),
    })


@brainrot_bp.route('/favorites', methods=['POST'])
@jwt_required()
def add_favorite():
    """Add a video to favorites"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    video_id = data.get('video_id')
    if not video_id:
        return jsonify({'error': 'video_id is required'}), 400
    
    # Check if already favorited
    existing = BrainrotFavorite.query.filter_by(
        user_id=user_id, video_id=video_id
    ).first()
    
    if existing:
        return jsonify({'error': 'Already in favorites'}), 409
    
    favorite = BrainrotFavorite(
        user_id=user_id,
        video_id=video_id,
        video_url=data.get('video_url'),
        title=data.get('title'),
        thumbnail_url=data.get('thumbnail_url'),
        category=data.get('category'),
    )
    
    db.session.add(favorite)
    db.session.commit()
    
    return jsonify({
        'message': 'Added to favorites',
        'favorite': favorite.to_dict(),
    }), 201


@brainrot_bp.route('/favorites/<int:favorite_id>', methods=['DELETE'])
@jwt_required()
def remove_favorite(favorite_id):
    """Remove a video from favorites"""
    user_id = get_jwt_identity()
    
    favorite = BrainrotFavorite.query.filter_by(
        id=favorite_id, user_id=user_id
    ).first_or_404()
    
    db.session.delete(favorite)
    db.session.commit()
    
    return jsonify({
        'message': 'Removed from favorites',
    })


@brainrot_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_brainrot_stats():
    """Get brainrot mode study statistics"""
    user_id = get_jwt_identity()
    
    # Get brainrot mode study sessions (filter by activity_type instead of JSON)
    brainrot_activities = StudyActivity.query.filter(
        StudyActivity.user_id == user_id,
        StudyActivity.activity_type == 'brainrot_study'
    ).all()
    
    total_minutes = sum(a.duration_minutes or 0 for a in brainrot_activities)
    session_count = len(brainrot_activities)
    
    # Get most used video
    video_counts = {}
    for activity in brainrot_activities:
        if activity.activity_metadata:
            video = activity.activity_metadata.get('video_id', 'unknown')
            video_counts[video] = video_counts.get(video, 0) + 1
    
    favorite_video = max(video_counts, key=video_counts.get) if video_counts else None
    
    # XP earned in brainrot mode (1.2x multiplier)
    total_xp = sum(a.xp_earned or 0 for a in brainrot_activities)
    
    # Weekly stats
    week_ago = datetime.utcnow() - timedelta(days=7)
    weekly_activities = [a for a in brainrot_activities if a.created_at >= week_ago]
    weekly_minutes = sum(a.duration_minutes or 0 for a in weekly_activities)
    
    return jsonify({
        'total_minutes': total_minutes,
        'total_hours': round(total_minutes / 60, 1),
        'session_count': session_count,
        'favorite_video': favorite_video,
        'total_xp_earned': total_xp,
        'weekly_minutes': weekly_minutes,
        'achievement_progress': {
            'brainrot_scholar': {
                'current': total_minutes,
                'target': 600,  # 10 hours
                'percentage': min(100, round(total_minutes / 600 * 100, 1)),
            }
        }
    })


@brainrot_bp.route('/session', methods=['POST'])
@jwt_required()
def log_brainrot_session():
    """Log a brainrot study session"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    duration = data.get('duration_minutes', 0)
    video_id = data.get('video_id')
    video_category = data.get('category')
    
    # Calculate XP with brainrot bonus (1.2x)
    base_xp = duration * 2  # 2 XP per minute normally
    bonus_xp = int(base_xp * 0.2)  # 20% bonus
    total_xp = base_xp + bonus_xp
    
    activity = StudyActivity(
        user_id=user_id,
        activity_type='brainrot_study',
        duration_minutes=duration,
        xp_earned=total_xp,
        activity_metadata={
            'mode': 'brainrot',
            'video_id': video_id,
            'video_category': video_category,
            'bonus_xp': bonus_xp,
        }
    )
    
    db.session.add(activity)
    db.session.commit()
    
    # Check brainrot scholar achievement
    from app.routes.profile import check_achievement
    total_brainrot_minutes = db.session.query(
        func.sum(StudyActivity.duration_minutes)
    ).filter(
        StudyActivity.user_id == user_id,
        StudyActivity.activity_type == 'brainrot_study'
    ).scalar() or 0
    
    achievement_unlock = check_achievement(user_id, 'brainrot_scholar', total_brainrot_minutes)
    
    return jsonify({
        'message': 'Session logged',
        'xp_earned': total_xp,
        'bonus_xp': bonus_xp,
        'achievement_unlock': achievement_unlock,
    })
