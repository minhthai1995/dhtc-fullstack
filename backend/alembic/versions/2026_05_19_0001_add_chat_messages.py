"""add chat_messages table

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-05-19 00:01:00.000000
"""
from __future__ import annotations

import sqlalchemy as sa

from alembic import op

revision = "b2c3d4e5f6a7"
down_revision = "a1b2c3d4e5f6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "chat_messages",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("session_id", sa.String(128), nullable=False, index=True),
        sa.Column("fb_user_id", sa.String(64), nullable=False, index=True),
        sa.Column(
            "direction",
            sa.Enum("inbound", "outbound", name="messagedirection"),
            nullable=False,
        ),
        sa.Column(
            "platform",
            sa.Enum("messenger", "web", name="messageplatform"),
            nullable=False,
            server_default="messenger",
        ),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("chat_messages")
    op.execute("DROP TYPE IF EXISTS messagedirection")
    op.execute("DROP TYPE IF EXISTS messageplatform")
