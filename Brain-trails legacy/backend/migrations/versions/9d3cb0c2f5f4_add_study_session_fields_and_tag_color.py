"""Add focus_score/notes to study sessions and tag color

Revision ID: 9d3cb0c2f5f4
Revises: 61dd01031461
Create Date: 2025-11-14 06:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '9d3cb0c2f5f4'
down_revision = '61dd01031461'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('study_session', schema=None) as batch_op:
        batch_op.add_column(sa.Column('focus_score', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('notes', sa.Text(), nullable=True))

    with op.batch_alter_table('tag', schema=None) as batch_op:
        batch_op.add_column(
            sa.Column('color', sa.String(length=16), nullable=True, server_default='#6366F1')
        )


def downgrade():
    with op.batch_alter_table('tag', schema=None) as batch_op:
        batch_op.drop_column('color')

    with op.batch_alter_table('study_session', schema=None) as batch_op:
        batch_op.drop_column('notes')
        batch_op.drop_column('focus_score')
