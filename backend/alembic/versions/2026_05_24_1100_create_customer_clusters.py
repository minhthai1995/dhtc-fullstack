"""create customer_clusters + seed 7 system clusters

Revision ID: c3a7e28f0003
Revises: b2f6d17f0002
Create Date: 2026-05-24 11:00:00.000000+00:00

P4A T9 — schema-only foundation for P5D multi-signal clustering.
The classification job (compile ``criteria_json`` → SQL filter, populate
``customer_cluster_members``) ships in P5D. This migration only stands up
the tables and seeds the 7 system clusters so admin UI can reference
known slugs immediately.

Downgrade strategy: drop user-created cluster rows is fine (they get
re-created from criteria), but we explicitly ``DELETE WHERE is_system``
first so the seed has a symmetric inverse.
"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = 'c3a7e28f0003'
down_revision: str | None = 'b2f6d17f0002'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


# Seed payload — kept inline (not loaded from JSON file) so the migration
# is self-contained and re-runs deterministically across environments.
# Slugs must match spec docs/specs/05-db-foundation/design.md Phase 3.
SYSTEM_CLUSTERS: list[dict] = [
    {
        "slug": "messenger_engaged",
        "name": "Đã chat Messenger",
        "description": "User có ≥ 1 ChatMessage inbound",
        "criteria_json": {"has_chat": True},
    },
    {
        "slug": "web_only_visitor",
        "name": "Khách web (chưa chat)",
        "description": "User có order nhưng chưa chat Messenger",
        "criteria_json": {"has_order": True, "has_chat": False},
    },
    {
        "slug": "lead_no_purchase",
        "name": "Lead chưa mua",
        "description": "User có chat nhưng chưa có order",
        "criteria_json": {"has_chat": True, "order_count": 0},
    },
    {
        "slug": "first_buyer",
        "name": "Mua lần đầu",
        "description": "Đúng 1 order completed",
        "criteria_json": {"completed_orders": 1},
    },
    {
        "slug": "repeat_buyer",
        "name": "Khách trung thành",
        "description": "≥ 2 orders completed",
        "criteria_json": {"completed_orders_gte": 2},
    },
    {
        "slug": "lapsed_60d",
        "name": "Khách ngủ quên",
        "description": "Order gần nhất > 60 ngày trước",
        "criteria_json": {"days_since_last_order_gt": 60},
    },
    {
        "slug": "high_value_vn",
        "name": "Khách VIP VN",
        "description": "Tổng spent ≥ 5M VND, ship VN",
        "criteria_json": {"total_spent_vnd_gte": 5000000, "country": "VN"},
    },
]


def upgrade() -> None:
    op.create_table(
        'customer_clusters',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('slug', sa.String(length=64), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('criteria_json', sa.JSON(), nullable=True),
        sa.Column(
            'is_system', sa.Boolean(), server_default='false', nullable=False,
        ),
        sa.Column(
            'is_active', sa.Boolean(), server_default='true', nullable=False,
        ),
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
        sa.PrimaryKeyConstraint('id', name=op.f('customer_clusters_pkey')),
        sa.UniqueConstraint('slug', name=op.f('customer_clusters_slug_key')),
    )
    op.create_index(
        op.f('customer_clusters_slug_idx'),
        'customer_clusters', ['slug'], unique=False,
    )

    op.create_table(
        'customer_cluster_members',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('cluster_id', sa.Integer(), nullable=False),
        sa.Column('score', sa.Float(), nullable=True),
        sa.Column('signals_json', sa.JSON(), nullable=True),
        sa.Column(
            'assigned_at',
            sa.DateTime(),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ['user_id'], ['users.id'],
            name=op.f('customer_cluster_members_user_id_fkey'),
            ondelete='CASCADE',
        ),
        sa.ForeignKeyConstraint(
            ['cluster_id'], ['customer_clusters.id'],
            name=op.f('customer_cluster_members_cluster_id_fkey'),
            ondelete='CASCADE',
        ),
        sa.PrimaryKeyConstraint(
            'id', name=op.f('customer_cluster_members_pkey'),
        ),
        sa.UniqueConstraint(
            'user_id', 'cluster_id',
            name='customer_cluster_members_user_cluster_key',
        ),
    )
    op.create_index(
        op.f('customer_cluster_members_user_id_idx'),
        'customer_cluster_members', ['user_id'], unique=False,
    )
    op.create_index(
        op.f('customer_cluster_members_cluster_id_idx'),
        'customer_cluster_members', ['cluster_id'], unique=False,
    )

    # Seed system clusters. ``is_system=true`` so downgrade can identify
    # and remove them symmetrically without nuking admin-created rows.
    clusters_table = sa.table(
        'customer_clusters',
        sa.column('slug', sa.String),
        sa.column('name', sa.String),
        sa.column('description', sa.Text),
        sa.column('criteria_json', sa.JSON),
        sa.column('is_system', sa.Boolean),
        sa.column('is_active', sa.Boolean),
    )
    op.bulk_insert(
        clusters_table,
        [
            {
                "slug": c["slug"],
                "name": c["name"],
                "description": c["description"],
                "criteria_json": c["criteria_json"],
                "is_system": True,
                "is_active": True,
            }
            for c in SYSTEM_CLUSTERS
        ],
    )


def downgrade() -> None:
    # Remove seeded rows first so a partial downgrade (table drop only)
    # never leaves orphaned data behind. Members CASCADE-clear via FK.
    op.execute("DELETE FROM customer_clusters WHERE is_system = true")

    op.drop_index(
        op.f('customer_cluster_members_cluster_id_idx'),
        table_name='customer_cluster_members',
    )
    op.drop_index(
        op.f('customer_cluster_members_user_id_idx'),
        table_name='customer_cluster_members',
    )
    op.drop_table('customer_cluster_members')

    op.drop_index(
        op.f('customer_clusters_slug_idx'),
        table_name='customer_clusters',
    )
    op.drop_table('customer_clusters')
