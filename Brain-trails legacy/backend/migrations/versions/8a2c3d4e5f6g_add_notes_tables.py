"""Add notes tables

Revision ID: 8a2c3d4e5f6g
Revises: fd5b307db9d6
Create Date: 2025-12-13 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '8a2c3d4e5f6g'
down_revision = 'fd5b307db9d6'
branch_labels = None
depends_on = None


def upgrade():
    # Drop old note_tags table (was a simple join table in initial migration)
    op.drop_table('note_tags')
    
    # Create notes table
    op.create_table(
        'notes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False, server_default='Untitled'),
        sa.Column('content', sa.JSON(), nullable=False),
        sa.Column('plaintext_cache', sa.Text(), nullable=False, server_default=''),
        sa.Column('version', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_notes_user_id', 'notes', ['user_id'])

    # Create note_tags table
    op.create_table(
        'note_tags',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=64), nullable=False),
        sa.Column('color', sa.String(length=7), server_default='#5f8d4e'),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'name', name='uq_user_tag_name')
    )
    op.create_index('ix_note_tags_user_id', 'note_tags', ['user_id'])

    # Create note_tag_links table (many-to-many)
    op.create_table(
        'note_tag_links',
        sa.Column('note_id', sa.Integer(), nullable=False),
        sa.Column('tag_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['note_id'], ['notes.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['tag_id'], ['note_tags.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('note_id', 'tag_id')
    )

    # Create quiz_source_links table
    op.create_table(
        'quiz_source_links',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('quiz_id', sa.Integer(), nullable=False),
        sa.Column('source_type', sa.String(length=32), nullable=False, server_default='note'),
        sa.Column('source_id', sa.Integer(), nullable=False),
        sa.Column('source_meta', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['quiz_id'], ['quiz.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_quiz_source_links_quiz_id', 'quiz_source_links', ['quiz_id'])
    op.create_index('ix_quiz_source_links_source_id', 'quiz_source_links', ['source_id'])


def downgrade():
    op.drop_table('quiz_source_links')
    op.drop_table('note_tag_links')
    op.drop_table('note_tags')
    op.drop_table('notes')
    
    # Recreate old note_tags join table
    op.create_table('note_tags',
        sa.Column('note_id', sa.Integer(), nullable=True),
        sa.Column('tag_id', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['note_id'], ['note.id'], ),
        sa.ForeignKeyConstraint(['tag_id'], ['tag.id'], )
    )
