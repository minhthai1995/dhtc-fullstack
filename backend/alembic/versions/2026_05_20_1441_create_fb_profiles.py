"""create fb_profiles

Revision ID: ac108fdce352
Revises: c3d4e5f6a7b8
Create Date: 2026-05-20 14:41:18.019714+00:00

"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = 'ac108fdce352'
down_revision: str | None = 'c3d4e5f6a7b8'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        'fb_profiles',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('fb_app_user_id', sa.String(length=64), nullable=False),
        sa.Column('fb_email', sa.String(length=255), nullable=True),
        sa.Column('fb_first_name', sa.String(length=255), nullable=True),
        sa.Column('fb_last_name', sa.String(length=255), nullable=True),
        sa.Column('fb_profile_pic_url', sa.String(length=1024), nullable=True),
        sa.Column('fb_locale', sa.String(length=20), nullable=True),
        sa.Column('raw_oauth_payload', sa.JSON(), nullable=True),
        sa.Column('linked_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('messenger_psid', sa.String(length=64), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name=op.f('fb_profiles_user_id_fkey')),
        sa.PrimaryKeyConstraint('id', name=op.f('fb_profiles_pkey')),
    )
    op.create_index(
        op.f('fb_profiles_fb_app_user_id_idx'),
        'fb_profiles',
        ['fb_app_user_id'],
        unique=True,
    )
    op.create_index(
        op.f('fb_profiles_messenger_psid_idx'),
        'fb_profiles',
        ['messenger_psid'],
        unique=True,
    )
    op.create_index(
        op.f('fb_profiles_user_id_idx'),
        'fb_profiles',
        ['user_id'],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index(op.f('fb_profiles_user_id_idx'), table_name='fb_profiles')
    op.drop_index(op.f('fb_profiles_messenger_psid_idx'), table_name='fb_profiles')
    op.drop_index(op.f('fb_profiles_fb_app_user_id_idx'), table_name='fb_profiles')
    op.drop_table('fb_profiles')
