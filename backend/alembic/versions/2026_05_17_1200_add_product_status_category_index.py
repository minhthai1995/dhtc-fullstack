"""add_product_status_category_index

Revision ID: b4c9f1d2e3a8
Revises: 7eaa66378a06
Create Date: 2026-05-17 12:00:00.000000+00:00

"""
from collections.abc import Sequence

from alembic import op

revision: str = 'b4c9f1d2e3a8'
down_revision: str | None = '7eaa66378a06'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_index('ix_products_status', 'products', ['status'])
    op.create_index('ix_products_category_id', 'products', ['category_id'])


def downgrade() -> None:
    op.drop_index('ix_products_category_id', table_name='products')
    op.drop_index('ix_products_status', table_name='products')
