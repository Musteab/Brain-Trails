"""
Profile and Activity Models
- UserProfile: Extended user info (bio, avatar, privacy settings)
- Achievement: Achievement definitions
- UserAchievement: User's unlocked achievements
- ActivityLog: User activity feed
- UserPreferences: User settings and preferences
"""
from datetime import datetime
from app.extensions import db


class UserProfile(db.Model):
    """Extended user profile information"""
    __tablename__ = 'user_profiles'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), unique=True, nullable=False)
    
    # Profile info
    display_name = db.Column(db.String(100))
    bio = db.Column(db.String(200))
    avatar_url = db.Column(db.String(500))
    
    # Privacy settings
    is_public = db.Column(db.Boolean, default=False)
    show_stats = db.Column(db.Boolean, default=True)
    show_activity = db.Column(db.Boolean, default=True)
    show_achievements = db.Column(db.Boolean, default=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    user = db.relationship('User', backref=db.backref('profile', uselist=False))
    
    def to_dict(self, is_owner=False):
        """Serialize profile to dict"""
        data = {
            'display_name': self.display_name,
            'bio': self.bio,
            'avatar_url': self.avatar_url,
            'is_public': self.is_public,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
        
        # Include privacy settings only for owner
        if is_owner:
            data.update({
                'show_stats': self.show_stats,
                'show_activity': self.show_activity,
                'show_achievements': self.show_achievements,
            })
        
        return data


class Achievement(db.Model):
    """Achievement definitions"""
    __tablename__ = 'achievements'
    
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(50), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    icon = db.Column(db.String(10))  # emoji
    rarity = db.Column(db.String(20), default='common')  # common, rare, epic, legendary
    xp_reward = db.Column(db.Integer, default=100)
    
    # For progressive achievements
    target_value = db.Column(db.Integer, default=1)
    category = db.Column(db.String(50), default='general')
    
    # Hidden achievements aren't shown until unlocked
    is_hidden = db.Column(db.Boolean, default=False)
    
    def to_dict(self, include_hidden=False):
        if self.is_hidden and not include_hidden:
            return {
                'id': self.id,
                'code': self.code,
                'name': '???',
                'description': 'Hidden achievement',
                'icon': '❓',
                'rarity': self.rarity,
                'is_hidden': True,
            }
        
        return {
            'id': self.id,
            'code': self.code,
            'name': self.name,
            'description': self.description,
            'icon': self.icon,
            'rarity': self.rarity,
            'xp_reward': self.xp_reward,
            'target_value': self.target_value,
            'category': self.category,
            'is_hidden': self.is_hidden,
        }


class UserAchievement(db.Model):
    """User's unlocked achievements"""
    __tablename__ = 'user_achievements'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    achievement_id = db.Column(db.Integer, db.ForeignKey('achievements.id'), nullable=False)
    
    # Progress tracking
    progress = db.Column(db.Integer, default=0)
    is_unlocked = db.Column(db.Boolean, default=False)
    unlocked_at = db.Column(db.DateTime)
    
    # Relationships
    user = db.relationship('User', backref=db.backref('achievements', lazy='dynamic'))
    achievement = db.relationship('Achievement')
    
    __table_args__ = (
        db.UniqueConstraint('user_id', 'achievement_id', name='unique_user_achievement'),
    )
    
    def to_dict(self):
        return {
            'achievement': self.achievement.to_dict(include_hidden=self.is_unlocked),
            'progress': self.progress,
            'is_unlocked': self.is_unlocked,
            'unlocked_at': self.unlocked_at.isoformat() if self.unlocked_at else None,
        }


class ActivityLog(db.Model):
    """User activity feed"""
    __tablename__ = 'activity_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    # Activity type: note_created, quiz_completed, flashcard_reviewed, 
    # achievement_unlocked, level_up, streak_milestone, etc.
    activity_type = db.Column(db.String(50), nullable=False)
    
    # Flexible metadata for different activity types
    activity_data = db.Column(db.JSON)
    
    # Privacy
    is_public = db.Column(db.Boolean, default=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship
    user = db.relationship('User', backref=db.backref('activities', lazy='dynamic'))
    
    def to_dict(self):
        return {
            'id': self.id,
            'type': self.activity_type,
            'data': self.activity_data,
            'is_public': self.is_public,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class UserPreferences(db.Model):
    """User settings and preferences"""
    __tablename__ = 'user_preferences'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), unique=True, nullable=False)
    
    # Study preferences
    default_room = db.Column(db.String(50), default='forest')
    daily_goal_minutes = db.Column(db.Integer, default=120)
    theme_mode = db.Column(db.String(20), default='dark')  # dark, light, auto
    language = db.Column(db.String(10), default='en')
    timezone = db.Column(db.String(50), default='auto')
    
    # Pomodoro settings
    pomodoro_duration = db.Column(db.Integer, default=25)
    short_break = db.Column(db.Integer, default=5)
    long_break = db.Column(db.Integer, default=15)
    auto_start_breaks = db.Column(db.Boolean, default=True)
    play_sound_on_complete = db.Column(db.Boolean, default=True)
    
    # Note editor settings
    editor_font_size = db.Column(db.Integer, default=16)
    editor_autosave = db.Column(db.Boolean, default=True)
    autosave_interval = db.Column(db.Integer, default=30)  # seconds
    spell_check = db.Column(db.Boolean, default=True)
    
    # Flashcard settings
    cards_per_session = db.Column(db.Integer, default=20)
    show_answer_timer = db.Column(db.Boolean, default=True)
    card_shuffle = db.Column(db.Boolean, default=True)
    
    # Quiz settings
    default_quiz_time_limit = db.Column(db.Integer, default=30)  # minutes
    show_explanations = db.Column(db.Boolean, default=True)
    allow_retry = db.Column(db.Boolean, default=True)
    
    # Notification preferences
    notifications_enabled = db.Column(db.Boolean, default=True)
    study_reminders = db.Column(db.Boolean, default=True)
    flashcard_reminders = db.Column(db.Boolean, default=True)
    daily_goal_reminders = db.Column(db.Boolean, default=True)
    streak_warning = db.Column(db.Boolean, default=True)
    level_up_notifications = db.Column(db.Boolean, default=True)
    achievement_notifications = db.Column(db.Boolean, default=True)
    
    # Email preferences
    email_weekly_report = db.Column(db.Boolean, default=True)
    email_feature_updates = db.Column(db.Boolean, default=True)
    email_study_tips = db.Column(db.Boolean, default=False)
    email_marketing = db.Column(db.Boolean, default=False)
    
    # Quiet hours
    quiet_hours_enabled = db.Column(db.Boolean, default=False)
    quiet_hours_start = db.Column(db.String(10), default='22:00')
    quiet_hours_end = db.Column(db.String(10), default='08:00')
    
    # Privacy
    share_anonymous_data = db.Column(db.Boolean, default=True)
    personalized_suggestions = db.Column(db.Boolean, default=True)
    allow_buddy_requests = db.Column(db.Boolean, default=True)
    show_online_status = db.Column(db.Boolean, default=False)
    allow_mentions = db.Column(db.Boolean, default=True)
    
    # Brainrot mode preferences
    brainrot_default_video = db.Column(db.String(100), default='subway-surfers')
    brainrot_layout = db.Column(db.String(20), default='split')  # split, pip, background
    brainrot_opacity = db.Column(db.Integer, default=70)
    brainrot_mute_video = db.Column(db.Boolean, default=True)
    brainrot_auto_start = db.Column(db.Boolean, default=False)
    brainrot_show_timer = db.Column(db.Boolean, default=True)
    
    # UI Layout preferences
    sidebar_collapsed = db.Column(db.Boolean, default=False)
    
    # Timestamps
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    user = db.relationship('User', backref=db.backref('preferences', uselist=False))
    
    def to_dict(self):
        return {
            # Study preferences
            'default_room': self.default_room,
            'daily_goal_minutes': self.daily_goal_minutes,
            'theme_mode': self.theme_mode,
            'language': self.language,
            'timezone': self.timezone,
            
            # Pomodoro
            'pomodoro_duration': self.pomodoro_duration,
            'short_break': self.short_break,
            'long_break': self.long_break,
            'auto_start_breaks': self.auto_start_breaks,
            'play_sound_on_complete': self.play_sound_on_complete,
            
            # Editor
            'editor_font_size': self.editor_font_size,
            'editor_autosave': self.editor_autosave,
            'autosave_interval': self.autosave_interval,
            'spell_check': self.spell_check,
            
            # Flashcards
            'cards_per_session': self.cards_per_session,
            'show_answer_timer': self.show_answer_timer,
            'card_shuffle': self.card_shuffle,
            
            # Quizzes
            'default_quiz_time_limit': self.default_quiz_time_limit,
            'show_explanations': self.show_explanations,
            'allow_retry': self.allow_retry,
            
            # Notifications
            'notifications_enabled': self.notifications_enabled,
            'study_reminders': self.study_reminders,
            'flashcard_reminders': self.flashcard_reminders,
            'daily_goal_reminders': self.daily_goal_reminders,
            'streak_warning': self.streak_warning,
            'level_up_notifications': self.level_up_notifications,
            'achievement_notifications': self.achievement_notifications,
            
            # Email
            'email_weekly_report': self.email_weekly_report,
            'email_feature_updates': self.email_feature_updates,
            'email_study_tips': self.email_study_tips,
            'email_marketing': self.email_marketing,
            
            # Quiet hours
            'quiet_hours_enabled': self.quiet_hours_enabled,
            'quiet_hours_start': self.quiet_hours_start,
            'quiet_hours_end': self.quiet_hours_end,
            
            # Privacy
            'share_anonymous_data': self.share_anonymous_data,
            'personalized_suggestions': self.personalized_suggestions,
            'allow_buddy_requests': self.allow_buddy_requests,
            'show_online_status': self.show_online_status,
            'allow_mentions': self.allow_mentions,
            
            # Brainrot
            'brainrot_default_video': self.brainrot_default_video,
            'brainrot_layout': self.brainrot_layout,
            'brainrot_opacity': self.brainrot_opacity,
            'brainrot_mute_video': self.brainrot_mute_video,
            'brainrot_auto_start': self.brainrot_auto_start,
            'brainrot_show_timer': self.brainrot_show_timer,
            
            # UI Layout
            'sidebar_collapsed': self.sidebar_collapsed,
        }


class BrainrotFavorite(db.Model):
    """User's favorite brainrot videos"""
    __tablename__ = 'brainrot_favorites'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    video_id = db.Column(db.String(100), nullable=False)  # YouTube ID or custom
    video_url = db.Column(db.String(500))
    title = db.Column(db.String(200))
    thumbnail_url = db.Column(db.String(500))
    category = db.Column(db.String(50))
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship('User', backref=db.backref('brainrot_favorites', lazy='dynamic'))
    
    def to_dict(self):
        return {
            'id': self.id,
            'video_id': self.video_id,
            'video_url': self.video_url,
            'title': self.title,
            'thumbnail_url': self.thumbnail_url,
            'category': self.category,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


# Default achievements to seed
DEFAULT_ACHIEVEMENTS = [
    {
        'code': 'first_study',
        'name': 'First Steps',
        'description': 'Complete your first study session',
        'icon': '🎯',
        'rarity': 'common',
        'xp_reward': 50,
        'category': 'milestones',
    },
    {
        'code': 'bookworm',
        'name': 'Bookworm',
        'description': 'Create 10 notes',
        'icon': '📚',
        'rarity': 'common',
        'xp_reward': 100,
        'target_value': 10,
        'category': 'notes',
    },
    {
        'code': 'week_streak',
        'name': 'Week Warrior',
        'description': 'Maintain a 7-day study streak',
        'icon': '🔥',
        'rarity': 'rare',
        'xp_reward': 200,
        'target_value': 7,
        'category': 'streaks',
    },
    {
        'code': 'quiz_master',
        'name': 'Quiz Master',
        'description': 'Score 100% on 5 quizzes',
        'icon': '🧠',
        'rarity': 'rare',
        'xp_reward': 250,
        'target_value': 5,
        'category': 'quizzes',
    },
    {
        'code': 'boss_slayer',
        'name': 'Boss Slayer',
        'description': 'Defeat your first study boss',
        'icon': '⚔️',
        'rarity': 'epic',
        'xp_reward': 300,
        'category': 'bosses',
    },
    {
        'code': 'month_streak',
        'name': 'Dedicated Scholar',
        'description': 'Maintain a 30-day study streak',
        'icon': '🏆',
        'rarity': 'epic',
        'xp_reward': 500,
        'target_value': 30,
        'category': 'streaks',
    },
    {
        'code': 'flashcard_guru',
        'name': 'Flashcard Guru',
        'description': 'Review 500 flashcards',
        'icon': '🎴',
        'rarity': 'rare',
        'xp_reward': 200,
        'target_value': 500,
        'category': 'flashcards',
    },
    {
        'code': 'night_owl',
        'name': 'Night Owl',
        'description': 'Study after midnight',
        'icon': '🦉',
        'rarity': 'common',
        'xp_reward': 50,
        'category': 'special',
        'is_hidden': True,
    },
    {
        'code': 'early_bird',
        'name': 'Early Bird',
        'description': 'Study before 6 AM',
        'icon': '🐦',
        'rarity': 'common',
        'xp_reward': 50,
        'category': 'special',
        'is_hidden': True,
    },
    {
        'code': 'brainrot_scholar',
        'name': 'Brainrot Scholar',
        'description': 'Study 10 hours in Brainrot Mode',
        'icon': '🧟',
        'rarity': 'epic',
        'xp_reward': 300,
        'target_value': 600,  # 600 minutes = 10 hours
        'category': 'brainrot',
    },
    {
        'code': 'centurion',
        'name': 'Centurion',
        'description': 'Reach level 100',
        'icon': '💯',
        'rarity': 'legendary',
        'xp_reward': 1000,
        'target_value': 100,
        'category': 'levels',
    },
    {
        'code': 'note_master',
        'name': 'Note Master',
        'description': 'Create 100 notes',
        'icon': '📝',
        'rarity': 'epic',
        'xp_reward': 400,
        'target_value': 100,
        'category': 'notes',
    },
    {
        'code': 'pet_lover',
        'name': 'Pet Lover',
        'description': 'Unlock 3 different pets',
        'icon': '🐾',
        'rarity': 'rare',
        'xp_reward': 200,
        'target_value': 3,
        'category': 'pets',
    },
    {
        'code': 'perfectionist',
        'name': 'Perfectionist',
        'description': 'Score 100% on 10 quizzes',
        'icon': '💎',
        'rarity': 'legendary',
        'xp_reward': 500,
        'target_value': 10,
        'category': 'quizzes',
    },
    {
        'code': 'marathon_runner',
        'name': 'Marathon Runner',
        'description': 'Study for 5 hours in one day',
        'icon': '🏃',
        'rarity': 'epic',
        'xp_reward': 350,
        'target_value': 300,  # 300 minutes
        'category': 'sessions',
    },
]
