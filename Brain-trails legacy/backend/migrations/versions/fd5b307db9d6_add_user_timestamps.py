"""Align schema with updated models

Revision ID: fd5b307db9d6
Revises: 9d3cb0c2f5f4
Create Date: 2025-11-14 08:05:31.624824

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'fd5b307db9d6'
down_revision = '9d3cb0c2f5f4'
branch_labels = None
depends_on = None


def upgrade():
    """Bring existing SQLite/PostgreSQL databases in sync with current models."""
    with op.batch_alter_table('deck', schema=None) as batch_op:
        batch_op.add_column(sa.Column('created_at', sa.DateTime(), nullable=True))

    with op.batch_alter_table('flashcard', schema=None) as batch_op:
        batch_op.add_column(sa.Column('created_at', sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column('updated_at', sa.DateTime(), nullable=True))

    with op.batch_alter_table('note', schema=None) as batch_op:
        batch_op.alter_column('title',
               existing_type=sa.String(length=100),
               type_=sa.String(length=150),
               existing_nullable=False)

    with op.batch_alter_table('note_tags', schema=None) as batch_op:
        batch_op.alter_column('note_id',
               existing_type=sa.Integer(),
               nullable=False)
        batch_op.alter_column('tag_id',
               existing_type=sa.Integer(),
               nullable=False)

    with op.batch_alter_table('question', schema=None) as batch_op:
        batch_op.add_column(sa.Column('explanation', sa.Text(), nullable=True))
        batch_op.alter_column('options',
               existing_type=sa.JSON(),
               nullable=False)

    with op.batch_alter_table('quiz', schema=None) as batch_op:
        batch_op.alter_column('title',
               existing_type=sa.String(length=100),
               type_=sa.String(length=140),
               existing_nullable=False)

    with op.batch_alter_table('user', schema=None) as batch_op:
        batch_op.add_column(sa.Column('created_at', sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column('updated_at', sa.DateTime(), nullable=True))
        batch_op.alter_column('password_hash',
               existing_type=sa.String(length=512),
               nullable=False)
        batch_op.alter_column('display_name',
               existing_type=sa.String(length=80),
               type_=sa.String(length=120),
               existing_nullable=True)
        batch_op.alter_column('avatar_url',
               existing_type=sa.String(length=256),
               type_=sa.String(length=255),
               existing_nullable=True)

    with op.batch_alter_table('user_preference', schema=None) as batch_op:
        batch_op.alter_column('music',
               new_column_name='focus_music',
               existing_type=sa.String(length=100),
               type_=sa.String(length=64),
               existing_nullable=True)
        batch_op.add_column(sa.Column('daily_goal_minutes', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('notifications_enabled', sa.Boolean(), nullable=True))
        batch_op.add_column(sa.Column('created_at', sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column('updated_at', sa.DateTime(), nullable=True))
        batch_op.alter_column('theme',
               existing_type=sa.String(length=50),
               type_=sa.String(length=32),
               existing_nullable=True)

    with op.batch_alter_table('user_quiz_result', schema=None) as batch_op:
        batch_op.add_column(sa.Column('duration_seconds', sa.Integer(), nullable=True))

def downgrade():
    with op.batch_alter_table('user_quiz_result', schema=None) as batch_op:
        batch_op.drop_column('duration_seconds')

    with op.batch_alter_table('user_preference', schema=None) as batch_op:
        batch_op.alter_column('focus_music',
               new_column_name='music',
               existing_type=sa.String(length=64),
               type_=sa.String(length=100),
               existing_nullable=True)
        batch_op.alter_column('theme',
               existing_type=sa.String(length=32),
               type_=sa.String(length=50),
               existing_nullable=True)
        batch_op.drop_column('updated_at')
        batch_op.drop_column('created_at')
        batch_op.drop_column('notifications_enabled')
        batch_op.drop_column('daily_goal_minutes')

    with op.batch_alter_table('user', schema=None) as batch_op:
        batch_op.alter_column('avatar_url',
               existing_type=sa.String(length=255),
               type_=sa.String(length=256),
               existing_nullable=True)
        batch_op.alter_column('display_name',
               existing_type=sa.String(length=120),
               type_=sa.String(length=80),
               existing_nullable=True)
        batch_op.alter_column('password_hash',
               existing_type=sa.String(length=512),
               nullable=True)
        batch_op.drop_column('updated_at')
        batch_op.drop_column('created_at')

    with op.batch_alter_table('quiz', schema=None) as batch_op:
        batch_op.alter_column('title',
               existing_type=sa.String(length=140),
               type_=sa.String(length=100),
               existing_nullable=False)

    with op.batch_alter_table('question', schema=None) as batch_op:
        batch_op.alter_column('options',
               existing_type=sa.JSON(),
               nullable=True)
        batch_op.drop_column('explanation')

    with op.batch_alter_table('note_tags', schema=None) as batch_op:
        batch_op.alter_column('tag_id',
               existing_type=sa.Integer(),
               nullable=True)
        batch_op.alter_column('note_id',
               existing_type=sa.Integer(),
               nullable=True)

    with op.batch_alter_table('note', schema=None) as batch_op:
        batch_op.alter_column('title',
               existing_type=sa.String(length=150),
               type_=sa.String(length=100),
               existing_nullable=False)

    with op.batch_alter_table('flashcard', schema=None) as batch_op:
        batch_op.drop_column('updated_at')
        batch_op.drop_column('created_at')

    with op.batch_alter_table('deck', schema=None) as batch_op:
        batch_op.drop_column('created_at')
