"""Add note folders table and folder_id to notes

Revision ID: d5e6f7g8h9i0
Revises: c4d5e6f7g8h9
Create Date: 2024-12-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'd5e6f7g8h9i0'
down_revision = 'c4d5e6f7g8h9'
branch_labels = None
depends_on = None


def upgrade():
    # Create note_folders table
    op.create_table('note_folders',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=128), nullable=False),
        sa.Column('parent_id', sa.Integer(), nullable=True),
        sa.Column('color', sa.String(length=7), nullable=True, default='#5f8d4e'),
        sa.Column('icon', sa.String(length=32), nullable=True, default='folder'),
        sa.Column('position', sa.Integer(), nullable=True, default=0),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['parent_id'], ['note_folders.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'parent_id', 'name', name='uq_user_folder_name')
    )
    op.create_index(op.f('ix_note_folders_parent_id'), 'note_folders', ['parent_id'], unique=False)
    op.create_index(op.f('ix_note_folders_user_id'), 'note_folders', ['user_id'], unique=False)
    
    # Add folder_id column to notes table
    op.add_column('notes', sa.Column('folder_id', sa.Integer(), nullable=True))
    op.create_index(op.f('ix_notes_folder_id'), 'notes', ['folder_id'], unique=False)
    op.create_foreign_key('fk_notes_folder_id', 'notes', 'note_folders', ['folder_id'], ['id'], ondelete='SET NULL')


def downgrade():
    # Remove folder_id from notes
    op.drop_constraint('fk_notes_folder_id', 'notes', type_='foreignkey')
    op.drop_index(op.f('ix_notes_folder_id'), table_name='notes')
    op.drop_column('notes', 'folder_id')
    
    # Drop note_folders table
    op.drop_index(op.f('ix_note_folders_user_id'), table_name='note_folders')
    op.drop_index(op.f('ix_note_folders_parent_id'), table_name='note_folders')
    op.drop_table('note_folders')
