"""add user_preferences table

Revision ID: c4d5e6f7g8h9
Revises: b3c4d5e6f7g8
Create Date: 2025-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c4d5e6f7g8h9'
down_revision = 'b3c4d5e6f7g8'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('user_preferences',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        # Study preferences
        sa.Column('default_room', sa.String(length=50), nullable=True, server_default='forest'),
        sa.Column('daily_goal_minutes', sa.Integer(), nullable=True, server_default='120'),
        sa.Column('theme_mode', sa.String(length=20), nullable=True, server_default='dark'),
        sa.Column('language', sa.String(length=10), nullable=True, server_default='en'),
        sa.Column('timezone', sa.String(length=50), nullable=True, server_default='auto'),
        # Pomodoro settings
        sa.Column('pomodoro_duration', sa.Integer(), nullable=True, server_default='25'),
        sa.Column('short_break', sa.Integer(), nullable=True, server_default='5'),
        sa.Column('long_break', sa.Integer(), nullable=True, server_default='15'),
        sa.Column('auto_start_breaks', sa.Boolean(), nullable=True, server_default='1'),
        sa.Column('play_sound_on_complete', sa.Boolean(), nullable=True, server_default='1'),
        # Note editor settings
        sa.Column('editor_font_size', sa.Integer(), nullable=True, server_default='16'),
        sa.Column('editor_autosave', sa.Boolean(), nullable=True, server_default='1'),
        sa.Column('autosave_interval', sa.Integer(), nullable=True, server_default='30'),
        sa.Column('spell_check', sa.Boolean(), nullable=True, server_default='1'),
        # Flashcard settings
        sa.Column('cards_per_session', sa.Integer(), nullable=True, server_default='20'),
        sa.Column('show_answer_timer', sa.Boolean(), nullable=True, server_default='1'),
        sa.Column('card_shuffle', sa.Boolean(), nullable=True, server_default='1'),
        # Quiz settings
        sa.Column('default_quiz_time_limit', sa.Integer(), nullable=True, server_default='30'),
        sa.Column('show_explanations', sa.Boolean(), nullable=True, server_default='1'),
        sa.Column('allow_retry', sa.Boolean(), nullable=True, server_default='1'),
        # Notification preferences
        sa.Column('notifications_enabled', sa.Boolean(), nullable=True, server_default='1'),
        sa.Column('study_reminders', sa.Boolean(), nullable=True, server_default='1'),
        sa.Column('flashcard_reminders', sa.Boolean(), nullable=True, server_default='1'),
        sa.Column('daily_goal_reminders', sa.Boolean(), nullable=True, server_default='1'),
        sa.Column('streak_warning', sa.Boolean(), nullable=True, server_default='1'),
        sa.Column('level_up_notifications', sa.Boolean(), nullable=True, server_default='1'),
        sa.Column('achievement_notifications', sa.Boolean(), nullable=True, server_default='1'),
        # Email preferences
        sa.Column('email_weekly_report', sa.Boolean(), nullable=True, server_default='1'),
        sa.Column('email_feature_updates', sa.Boolean(), nullable=True, server_default='1'),
        sa.Column('email_study_tips', sa.Boolean(), nullable=True, server_default='0'),
        sa.Column('email_marketing', sa.Boolean(), nullable=True, server_default='0'),
        # Quiet hours
        sa.Column('quiet_hours_enabled', sa.Boolean(), nullable=True, server_default='0'),
        sa.Column('quiet_hours_start', sa.String(length=10), nullable=True, server_default='22:00'),
        sa.Column('quiet_hours_end', sa.String(length=10), nullable=True, server_default='08:00'),
        # Privacy
        sa.Column('share_anonymous_data', sa.Boolean(), nullable=True, server_default='1'),
        sa.Column('personalized_suggestions', sa.Boolean(), nullable=True, server_default='1'),
        sa.Column('allow_buddy_requests', sa.Boolean(), nullable=True, server_default='1'),
        sa.Column('show_online_status', sa.Boolean(), nullable=True, server_default='0'),
        sa.Column('allow_mentions', sa.Boolean(), nullable=True, server_default='1'),
        # Brainrot mode preferences
        sa.Column('brainrot_default_video', sa.String(length=100), nullable=True, server_default='subway-surfers'),
        sa.Column('brainrot_layout', sa.String(length=20), nullable=True, server_default='split'),
        sa.Column('brainrot_opacity', sa.Integer(), nullable=True, server_default='70'),
        sa.Column('brainrot_mute_video', sa.Boolean(), nullable=True, server_default='1'),
        sa.Column('brainrot_auto_start', sa.Boolean(), nullable=True, server_default='0'),
        sa.Column('brainrot_show_timer', sa.Boolean(), nullable=True, server_default='1'),
        # UI Layout preferences
        sa.Column('sidebar_collapsed', sa.Boolean(), nullable=True, server_default='0'),
        # Timestamps
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id')
    )


def downgrade():
    op.drop_table('user_preferences')
