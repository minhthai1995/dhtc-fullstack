"""add page_views table

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-05-20 00:01:00.000000
"""
from __future__ import annotations

import sqlalchemy as sa

from alembic import op

revision = "c3d4e5f6a7b8"
down_revision = "b2c3d4e5f6a7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "page_views",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("visitor_id", sa.String(36), nullable=False),
        sa.Column("session_id", sa.String(36), nullable=False),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("path", sa.String(500), nullable=False),
        sa.Column("referrer", sa.String(500), nullable=True),
        sa.Column("user_agent", sa.String(500), nullable=True),
        sa.Column("country_code", sa.String(2), nullable=True),
        sa.Column("viewed_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("page_views_viewed_at_idx", "page_views", ["viewed_at"])
    op.create_index("page_views_visitor_id_idx", "page_views", ["visitor_id"])
    op.create_index("page_views_session_id_idx", "page_views", ["session_id"])
    op.create_index("page_views_user_id_idx", "page_views", ["user_id"])
    op.create_index("page_views_viewed_at_path_idx", "page_views", ["viewed_at", "path"])


def downgrade() -> None:
    op.drop_index("page_views_viewed_at_path_idx", table_name="page_views")
    op.drop_index("page_views_user_id_idx", table_name="page_views")
    op.drop_index("page_views_session_id_idx", table_name="page_views")
    op.drop_index("page_views_visitor_id_idx", table_name="page_views")
    op.drop_index("page_views_viewed_at_idx", table_name="page_views")
    op.drop_table("page_views")
