"""P4A T6 — verify ChatMessage P5C capture-everything columns.

Three guarantees:
  1. All 7 new fields persist + reload as expected values
  2. FK SET NULL: deleting the referenced user nulls ``linked_user_id``
     while the message row survives (capture history must outlive the link)
  3. Indexes exist on the 3 FK columns (linked_user_id,
     referenced_product_id, referenced_order_id) — queries on the CRM
     timeline filter by these and need to stay fast at scale
"""

from __future__ import annotations

import pytest
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.chat_message import ChatMessage, MessageDirection, MessagePlatform
from app.models.merchant import Merchant, MerchantStatus, MerchantTier
from app.models.order import Order, OrderStatus
from app.models.product import Product
from app.models.user import User, UserRole


@pytest.fixture(autouse=True)
async def _sqlite_enforce_fks(db_session: AsyncSession) -> None:
    """SQLite ignores FK constraints unless ``PRAGMA foreign_keys=ON`` is
    set per-connection. Without it the SET NULL assertion silently passes.
    Run on the session's existing connection (the engine ``connect`` event
    fires too late — the conftest connection is already established)."""
    await db_session.execute(text("PRAGMA foreign_keys=ON"))


async def _seed_owner_product_order(
    db_session: AsyncSession,
) -> tuple[User, Product, Order]:
    seller = User(email="seller-p5c@test.com", hashed_password="x", role=UserRole.seller)
    db_session.add(seller)
    await db_session.flush()
    merchant = Merchant(
        user_id=seller.id,
        shop_name="P5C Shop",
        slug="p5c-shop",
        status=MerchantStatus.active,
        tier=MerchantTier.bronze,
        region="HN",
    )
    db_session.add(merchant)
    await db_session.flush()
    product = Product(
        merchant_id=merchant.id,
        name_vi="Sản phẩm P5C",
        slug="sp-p5c",
        price=99000,
    )
    db_session.add(product)
    buyer = User(email="buyer-p5c@test.com", hashed_password="x", role=UserRole.customer)
    db_session.add(buyer)
    await db_session.flush()
    order = Order(
        customer_id=buyer.id,
        merchant_id=merchant.id,
        status=OrderStatus.delivered,
        total_amount=99000,
        shipping_address={"country": "VN", "city": "Hà Nội"},
    )
    db_session.add(order)
    await db_session.flush()
    return buyer, product, order


@pytest.mark.asyncio
async def test_chat_message_p5c_fields_round_trip(db_session: AsyncSession) -> None:
    buyer, product, order = await _seed_owner_product_order(db_session)
    msg = ChatMessage(
        session_id="sess-p5c",
        fb_user_id="fb-p5c",
        direction=MessageDirection.inbound,
        platform=MessagePlatform.messenger,
        content="cho mình hỏi giá sản phẩm này",
        intent_cluster="price_inquiry",
        captured_phone="0901234567",
        captured_email="buyer@example.com",
        captured_address="1 Lê Lợi, Quận 1, TP.HCM",
        linked_user_id=buyer.id,
        referenced_product_id=product.id,
        referenced_order_id=order.id,
    )
    db_session.add(msg)
    await db_session.commit()
    db_session.expunge_all()

    reloaded = (await db_session.execute(select(ChatMessage))).scalar_one()
    assert reloaded.intent_cluster == "price_inquiry"
    assert reloaded.captured_phone == "0901234567"
    assert reloaded.captured_email == "buyer@example.com"
    assert reloaded.captured_address == "1 Lê Lợi, Quận 1, TP.HCM"
    assert reloaded.linked_user_id == buyer.id
    assert reloaded.referenced_product_id == product.id
    assert reloaded.referenced_order_id == order.id


@pytest.mark.asyncio
async def test_chat_message_linked_user_set_null_on_user_delete(
    db_session: AsyncSession,
) -> None:
    # Standalone customer with no orders — keeps the SET NULL assertion
    # focused on chat_messages.linked_user_id without other FK cascades.
    visitor = User(email="visitor@test.com", hashed_password="x", role=UserRole.customer)
    db_session.add(visitor)
    await db_session.flush()
    msg = ChatMessage(
        session_id="sess-orphan",
        fb_user_id="fb-orphan",
        direction=MessageDirection.inbound,
        platform=MessagePlatform.messenger,
        content="test orphan",
        linked_user_id=visitor.id,
    )
    db_session.add(msg)
    await db_session.commit()

    await db_session.delete(visitor)
    await db_session.commit()
    db_session.expunge_all()

    rows = (await db_session.execute(select(ChatMessage))).scalars().all()
    assert len(rows) == 1, "message must survive linked user deletion"
    assert rows[0].linked_user_id is None, "FK should be nulled, not the row deleted"


def test_chat_message_p5c_indexes_present() -> None:
    """Static metadata audit — no DB roundtrip needed."""
    indexed_cols = {
        col.name
        for col in ChatMessage.__table__.columns
        if col.index
    }
    for required in ("linked_user_id", "referenced_product_id", "referenced_order_id"):
        assert required in indexed_cols, (
            f"chat_messages.{required} must be indexed (CRM timeline filters on it)"
        )
