"""extend fb_profiles messenger cache + fb_graph_call_log

Revision ID: a1f5c06e0001
Revises: 12350e4dc762
Create Date: 2026-05-21 03:20:00.000000+00:00

"""
from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = 'a1f5c06e0001'
down_revision: str | None = '12350e4dc762'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # P5C-enrich: extend fb_profiles with Graph API cache fields.
    # user_id + fb_app_user_id become nullable so PSID-only (anonymous
    # Messenger) rows can exist without OAuth identity.
    op.add_column(
        'fb_profiles',
        sa.Column('page_id', sa.String(length=64), nullable=True),
    )
    op.add_column(
        'fb_profiles',
        sa.Column('messenger_name', sa.String(length=255), nullable=True),
    )
    op.add_column(
        'fb_profiles',
        sa.Column('messenger_pic_url', sa.String(length=1024), nullable=True),
    )
    op.add_column(
        'fb_profiles',
        sa.Column('messenger_age_range_min', sa.Integer(), nullable=True),
    )
    op.add_column(
        'fb_profiles',
        sa.Column('messenger_age_range_max', sa.Integer(), nullable=True),
    )
    op.add_column(
        'fb_profiles',
        sa.Column('messenger_gender', sa.String(length=16), nullable=True),
    )
    op.add_column(
        'fb_profiles',
        sa.Column('messenger_locale', sa.String(length=16), nullable=True),
    )
    op.add_column(
        'fb_profiles',
        sa.Column('messenger_fetched_at', sa.DateTime(), nullable=True),
    )
    op.add_column(
        'fb_profiles',
        sa.Column(
            'messenger_status',
            sa.String(length=32),
            server_default='active',
            nullable=False,
        ),
    )
    op.add_column(
        'fb_profiles',
        sa.Column('messenger_error_message', sa.Text(), nullable=True),
    )
    op.alter_column(
        'fb_profiles', 'user_id',
        existing_type=sa.INTEGER(),
        nullable=True,
    )
    op.alter_column(
        'fb_profiles', 'fb_app_user_id',
        existing_type=sa.VARCHAR(length=64),
        nullable=True,
    )
    op.alter_column(
        'fb_profiles', 'linked_at',
        existing_type=postgresql.TIMESTAMP(),
        nullable=True,
        existing_server_default=sa.text('now()'),
    )
    op.create_index(
        op.f('fb_profiles_page_id_idx'),
        'fb_profiles', ['page_id'], unique=False,
    )
    op.create_index(
        op.f('fb_profiles_messenger_fetched_at_idx'),
        'fb_profiles', ['messenger_fetched_at'], unique=False,
    )

    # fb_graph_call_log: debug audit for every Graph API call.
    op.create_table(
        'fb_graph_call_log',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('psid', sa.String(length=64), nullable=False),
        sa.Column('endpoint', sa.String(length=255), nullable=False),
        sa.Column('http_status', sa.Integer(), nullable=True),
        sa.Column('error_code', sa.Integer(), nullable=True),
        sa.Column('error_subcode', sa.Integer(), nullable=True),
        sa.Column('duration_ms', sa.Integer(), nullable=True),
        sa.Column(
            'called_at',
            sa.DateTime(),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint('id', name=op.f('fb_graph_call_log_pkey')),
    )
    op.create_index(
        op.f('fb_graph_call_log_psid_idx'),
        'fb_graph_call_log', ['psid'], unique=False,
    )
    op.create_index(
        op.f('fb_graph_call_log_called_at_idx'),
        'fb_graph_call_log', ['called_at'], unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        op.f('fb_graph_call_log_called_at_idx'),
        table_name='fb_graph_call_log',
    )
    op.drop_index(
        op.f('fb_graph_call_log_psid_idx'),
        table_name='fb_graph_call_log',
    )
    op.drop_table('fb_graph_call_log')
    op.drop_index(
        op.f('fb_profiles_messenger_fetched_at_idx'),
        table_name='fb_profiles',
    )
    op.drop_index(
        op.f('fb_profiles_page_id_idx'),
        table_name='fb_profiles',
    )
    op.alter_column(
        'fb_profiles', 'linked_at',
        existing_type=postgresql.TIMESTAMP(),
        nullable=False,
        existing_server_default=sa.text('now()'),
    )
    op.alter_column(
        'fb_profiles', 'fb_app_user_id',
        existing_type=sa.VARCHAR(length=64),
        nullable=False,
    )
    op.alter_column(
        'fb_profiles', 'user_id',
        existing_type=sa.INTEGER(),
        nullable=False,
    )
    op.drop_column('fb_profiles', 'messenger_error_message')
    op.drop_column('fb_profiles', 'messenger_status')
    op.drop_column('fb_profiles', 'messenger_fetched_at')
    op.drop_column('fb_profiles', 'messenger_locale')
    op.drop_column('fb_profiles', 'messenger_gender')
    op.drop_column('fb_profiles', 'messenger_age_range_max')
    op.drop_column('fb_profiles', 'messenger_age_range_min')
    op.drop_column('fb_profiles', 'messenger_pic_url')
    op.drop_column('fb_profiles', 'messenger_name')
    op.drop_column('fb_profiles', 'page_id')
