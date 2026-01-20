"""Add gamification tables

Revision ID: b3c4d5e6f7g8
Revises: 8a2c3d4e5f6g
Create Date: 2024-12-13 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b3c4d5e6f7g8'
down_revision = '8a2c3d4e5f6g'
branch_labels = None
depends_on = None


def upgrade():
    # UserGamification table
    op.create_table('user_gamification',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('xp', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('level', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('lifetime_xp', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('current_streak', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('best_streak', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('last_study_date', sa.Date(), nullable=True),
        sa.Column('daily_xp_today', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('daily_minutes_today', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('daily_goal_minutes', sa.Integer(), nullable=False, server_default='25'),
        sa.Column('daily_goal_met_today', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('active_challenge_id', sa.String(64), nullable=True),
        sa.Column('challenge_progress', sa.JSON(), nullable=False, server_default='{}'),
        sa.Column('current_boss_id', sa.String(64), nullable=True),
        sa.Column('boss_health', sa.Integer(), nullable=True),
        sa.Column('boss_max_health', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_user_gamification_user_id', 'user_gamification', ['user_id'], unique=True)
    
    # UserReward table
    op.create_table('user_rewards',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('reward_id', sa.String(64), nullable=False),
        sa.Column('reward_type', sa.String(32), nullable=False),
        sa.Column('reward_data', sa.JSON(), nullable=False, server_default='{}'),
        sa.Column('unlocked_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'reward_id', name='uq_user_reward')
    )
    op.create_index('ix_user_rewards_user_id', 'user_rewards', ['user_id'])
    
    # UserPet table
    op.create_table('user_pets',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('pet_id', sa.String(32), nullable=False),
        sa.Column('name', sa.String(32), nullable=False, server_default='Buddy'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('mood', sa.String(16), nullable=False, server_default='neutral'),
        sa.Column('happiness', sa.Integer(), nullable=False, server_default='50'),
        sa.Column('energy', sa.Integer(), nullable=False, server_default='50'),
        sa.Column('xp', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('level', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('last_fed', sa.DateTime(), nullable=True),
        sa.Column('last_played', sa.DateTime(), nullable=True),
        sa.Column('last_interaction', sa.DateTime(), nullable=True),
        sa.Column('accessories', sa.JSON(), nullable=False, server_default='[]'),
        sa.Column('active_accessory', sa.String(64), nullable=True),
        sa.Column('adopted_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_user_pets_user_id', 'user_pets', ['user_id'])
    
    # StudyActivity table
    op.create_table('study_activities',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('activity_type', sa.String(32), nullable=False),
        sa.Column('xp_earned', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('note_id', sa.Integer(), nullable=True),
        sa.Column('quiz_id', sa.Integer(), nullable=True),
        sa.Column('deck_id', sa.Integer(), nullable=True),
        sa.Column('session_id', sa.Integer(), nullable=True),
        sa.Column('duration_minutes', sa.Integer(), nullable=True),
        sa.Column('activity_metadata', sa.JSON(), nullable=False, server_default='{}'),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['note_id'], ['notes.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['quiz_id'], ['quiz.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['deck_id'], ['deck.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['session_id'], ['study_session.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_study_activities_user_id', 'study_activities', ['user_id'])
    op.create_index('ix_study_activities_created_at', 'study_activities', ['created_at'])
    
    # NoteReview table
    op.create_table('note_reviews',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('note_id', sa.Integer(), nullable=False),
        sa.Column('reviewed_at', sa.DateTime(), nullable=True),
        sa.Column('next_review_date', sa.Date(), nullable=True),
        sa.Column('review_count', sa.Integer(), nullable=False, server_default='1'),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['note_id'], ['notes.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'note_id', name='uq_user_note_review')
    )
    op.create_index('ix_note_reviews_user_id', 'note_reviews', ['user_id'])
    op.create_index('ix_note_reviews_note_id', 'note_reviews', ['note_id'])
    
    # NoteLink table
    op.create_table('note_links',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('source_note_id', sa.Integer(), nullable=False),
        sa.Column('target_note_id', sa.Integer(), nullable=False),
        sa.Column('link_type', sa.String(32), nullable=False, server_default='reference'),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['source_note_id'], ['notes.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['target_note_id'], ['notes.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('source_note_id', 'target_note_id', name='uq_note_link')
    )
    op.create_index('ix_note_links_source_note_id', 'note_links', ['source_note_id'])
    op.create_index('ix_note_links_target_note_id', 'note_links', ['target_note_id'])


def downgrade():
    op.drop_table('note_links')
    op.drop_table('note_reviews')
    op.drop_table('study_activities')
    op.drop_table('user_pets')
    op.drop_table('user_rewards')
    op.drop_table('user_gamification')
