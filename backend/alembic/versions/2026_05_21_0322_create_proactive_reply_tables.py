"""create proactive_reply tables + seed config

Revision ID: b2f6d17f0002
Revises: a1f5c06e0001
Create Date: 2026-05-21 03:22:00.000000+00:00

"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = 'b2f6d17f0002'
down_revision: str | None = 'a1f5c06e0001'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


PROACTIVE_INTENT_VALUES = (
    'checkin', 'praise', 'complaint', 'question', 'other',
)
PROACTIVE_STATUS_VALUES = (
    'queued', 'sent', 'dry_run', 'error',
    'skipped_cooldown', 'skipped_disabled', 'skipped_rate_limit',
)
DM_STATUS_VALUES = ('sent', 'window_expired', 'error')


def upgrade() -> None:
    intent_enum = sa.Enum(*PROACTIVE_INTENT_VALUES, name='proactiveintent')
    status_enum = sa.Enum(*PROACTIVE_STATUS_VALUES, name='proactivestatus')
    dm_status_enum = sa.Enum(*DM_STATUS_VALUES, name='dmstatus')

    op.create_table(
        'proactive_replies',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('page_id', sa.String(length=64), nullable=False),
        sa.Column('post_id', sa.String(length=128), nullable=False),
        sa.Column('post_url', sa.Text(), nullable=True),
        sa.Column('post_text', sa.Text(), nullable=True),
        sa.Column('post_author_psid', sa.String(length=64), nullable=True),
        sa.Column(
            'has_checkin',
            sa.Boolean(),
            server_default='false',
            nullable=False,
        ),
        sa.Column('place_name', sa.String(length=255), nullable=True),
        sa.Column('intent', intent_enum, nullable=False),
        sa.Column('template_used', sa.String(length=64), nullable=True),
        sa.Column('reply_text', sa.Text(), nullable=False),
        sa.Column('reply_comment_id', sa.String(length=128), nullable=True),
        sa.Column('status', status_enum, nullable=False),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column(
            'created_at',
            sa.DateTime(),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.Column(
            'updated_at',
            sa.DateTime(),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint('id', name=op.f('proactive_replies_pkey')),
    )
    op.create_index(
        op.f('proactive_replies_page_id_idx'),
        'proactive_replies', ['page_id'], unique=False,
    )
    op.create_index(
        op.f('proactive_replies_post_id_idx'),
        'proactive_replies', ['post_id'], unique=True,
    )
    op.create_index(
        op.f('proactive_replies_post_author_psid_idx'),
        'proactive_replies', ['post_author_psid'], unique=False,
    )
    op.create_index(
        op.f('proactive_replies_intent_idx'),
        'proactive_replies', ['intent'], unique=False,
    )
    op.create_index(
        op.f('proactive_replies_status_idx'),
        'proactive_replies', ['status'], unique=False,
    )
    op.create_index(
        'proactive_replies_psid_created_at_idx',
        'proactive_replies',
        ['post_author_psid', 'created_at'],
        unique=False,
    )

    op.create_table(
        'comment_threads',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('comment_id', sa.String(length=128), nullable=False),
        sa.Column('post_id', sa.String(length=128), nullable=False),
        sa.Column('proactive_reply_id', sa.Integer(), nullable=False),
        sa.Column('poster_psid', sa.String(length=64), nullable=True),
        sa.Column('poster_replied_at', sa.DateTime(), nullable=True),
        sa.Column('dm_sent_at', sa.DateTime(), nullable=True),
        sa.Column('dm_status', dm_status_enum, nullable=True),
        sa.Column(
            'created_at',
            sa.DateTime(),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.Column(
            'updated_at',
            sa.DateTime(),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ['proactive_reply_id'],
            ['proactive_replies.id'],
            name=op.f('comment_threads_proactive_reply_id_fkey'),
            ondelete='CASCADE',
        ),
        sa.PrimaryKeyConstraint('id', name=op.f('comment_threads_pkey')),
    )
    op.create_index(
        op.f('comment_threads_comment_id_idx'),
        'comment_threads', ['comment_id'], unique=True,
    )
    op.create_index(
        op.f('comment_threads_post_id_idx'),
        'comment_threads', ['post_id'], unique=False,
    )
    op.create_index(
        op.f('comment_threads_proactive_reply_id_idx'),
        'comment_threads', ['proactive_reply_id'], unique=False,
    )
    op.create_index(
        op.f('comment_threads_poster_psid_idx'),
        'comment_threads', ['poster_psid'], unique=False,
    )

    op.create_table(
        'proactive_template_config',
        sa.Column('intent', intent_enum, nullable=False),
        sa.Column(
            'is_enabled',
            sa.Boolean(),
            server_default='true',
            nullable=False,
        ),
        sa.Column(
            'updated_at',
            sa.DateTime(),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.Column('updated_by', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(
            ['updated_by'],
            ['users.id'],
            name=op.f('proactive_template_config_updated_by_fkey'),
        ),
        sa.PrimaryKeyConstraint(
            'intent', name=op.f('proactive_template_config_pkey'),
        ),
    )

    # Seed: only check-in proactive replies on by default.
    # Praise/complaint/question/other start disabled — admins enable per
    # intent after reviewing template wording.
    op.execute(
        "INSERT INTO proactive_template_config (intent, is_enabled) VALUES "
        "('checkin', true), "
        "('praise', false), "
        "('complaint', false), "
        "('question', false), "
        "('other', false)"
    )


def downgrade() -> None:
    op.drop_table('proactive_template_config')
    op.drop_index(
        op.f('comment_threads_poster_psid_idx'),
        table_name='comment_threads',
    )
    op.drop_index(
        op.f('comment_threads_proactive_reply_id_idx'),
        table_name='comment_threads',
    )
    op.drop_index(
        op.f('comment_threads_post_id_idx'),
        table_name='comment_threads',
    )
    op.drop_index(
        op.f('comment_threads_comment_id_idx'),
        table_name='comment_threads',
    )
    op.drop_table('comment_threads')
    op.drop_index(
        'proactive_replies_psid_created_at_idx',
        table_name='proactive_replies',
    )
    op.drop_index(
        op.f('proactive_replies_status_idx'),
        table_name='proactive_replies',
    )
    op.drop_index(
        op.f('proactive_replies_intent_idx'),
        table_name='proactive_replies',
    )
    op.drop_index(
        op.f('proactive_replies_post_author_psid_idx'),
        table_name='proactive_replies',
    )
    op.drop_index(
        op.f('proactive_replies_post_id_idx'),
        table_name='proactive_replies',
    )
    op.drop_index(
        op.f('proactive_replies_page_id_idx'),
        table_name='proactive_replies',
    )
    op.drop_table('proactive_replies')
    sa.Enum(name='dmstatus').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='proactivestatus').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='proactiveintent').drop(op.get_bind(), checkfirst=True)
