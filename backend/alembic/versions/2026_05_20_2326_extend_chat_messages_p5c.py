"""extend chat_messages p5c

Revision ID: 12350e4dc762
Revises: ac108fdce352
Create Date: 2026-05-20 23:26:24.221735+00:00

"""
from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = '12350e4dc762'
down_revision: str | None = 'ac108fdce352'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # P5C reserve — add capture-everything columns + FK SET NULL preserves
    # chat audit trail when referenced product/order/user is deleted.
    op.add_column(
        'chat_messages',
        sa.Column('intent_cluster', sa.String(length=64), nullable=True),
    )
    op.add_column(
        'chat_messages',
        sa.Column('captured_phone', sa.String(length=20), nullable=True),
    )
    op.add_column(
        'chat_messages',
        sa.Column('captured_email', sa.String(length=255), nullable=True),
    )
    op.add_column(
        'chat_messages',
        sa.Column('captured_address', sa.String(length=500), nullable=True),
    )
    op.add_column(
        'chat_messages',
        sa.Column('linked_user_id', sa.Integer(), nullable=True),
    )
    op.add_column(
        'chat_messages',
        sa.Column('referenced_product_id', sa.Integer(), nullable=True),
    )
    op.add_column(
        'chat_messages',
        sa.Column('referenced_order_id', sa.Integer(), nullable=True),
    )

    op.create_index(
        op.f('chat_messages_linked_user_id_idx'),
        'chat_messages',
        ['linked_user_id'],
        unique=False,
    )
    op.create_index(
        op.f('chat_messages_referenced_order_id_idx'),
        'chat_messages',
        ['referenced_order_id'],
        unique=False,
    )
    op.create_index(
        op.f('chat_messages_referenced_product_id_idx'),
        'chat_messages',
        ['referenced_product_id'],
        unique=False,
    )

    op.create_foreign_key(
        op.f('chat_messages_linked_user_id_fkey'),
        'chat_messages', 'users',
        ['linked_user_id'], ['id'],
        ondelete='SET NULL',
    )
    op.create_foreign_key(
        op.f('chat_messages_referenced_product_id_fkey'),
        'chat_messages', 'products',
        ['referenced_product_id'], ['id'],
        ondelete='SET NULL',
    )
    op.create_foreign_key(
        op.f('chat_messages_referenced_order_id_fkey'),
        'chat_messages', 'orders',
        ['referenced_order_id'], ['id'],
        ondelete='SET NULL',
    )

    # T1 schema sync — the prior literal `server_default="now()"` got frozen
    # in Postgres as a static timestamp. Align DB default with the new
    # func.now() expression so future inserts use CURRENT_TIMESTAMP.
    op.alter_column(
        'notifications', 'created_at',
        existing_type=postgresql.TIMESTAMP(timezone=True),
        server_default=sa.text('now()'),
        existing_nullable=False,
    )


def downgrade() -> None:
    op.alter_column(
        'notifications', 'created_at',
        existing_type=postgresql.TIMESTAMP(timezone=True),
        server_default=sa.text(
            "'2026-05-18 16:04:53.447337+10'::timestamp with time zone"
        ),
        existing_nullable=False,
    )

    op.drop_constraint(
        op.f('chat_messages_linked_user_id_fkey'),
        'chat_messages',
        type_='foreignkey',
    )
    op.drop_constraint(
        op.f('chat_messages_referenced_product_id_fkey'),
        'chat_messages',
        type_='foreignkey',
    )
    op.drop_constraint(
        op.f('chat_messages_referenced_order_id_fkey'),
        'chat_messages',
        type_='foreignkey',
    )

    op.drop_index(
        op.f('chat_messages_referenced_product_id_idx'),
        table_name='chat_messages',
    )
    op.drop_index(
        op.f('chat_messages_referenced_order_id_idx'),
        table_name='chat_messages',
    )
    op.drop_index(
        op.f('chat_messages_linked_user_id_idx'),
        table_name='chat_messages',
    )

    op.drop_column('chat_messages', 'referenced_order_id')
    op.drop_column('chat_messages', 'referenced_product_id')
    op.drop_column('chat_messages', 'linked_user_id')
    op.drop_column('chat_messages', 'captured_address')
    op.drop_column('chat_messages', 'captured_email')
    op.drop_column('chat_messages', 'captured_phone')
    op.drop_column('chat_messages', 'intent_cluster')
