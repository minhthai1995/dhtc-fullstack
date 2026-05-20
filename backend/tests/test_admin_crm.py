"""Integration tests for the CRM admin endpoints added in the mockup-match work.

Covers /admin/crm/demographics, /admin/crm/conversation-overview, and
/admin/crm/conversations/{session_id}/profile — each with a happy-path test
seeded against the in-memory SQLite session, plus a 401 unauthenticated test.
"""
from __future__ import annotations

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud import user as user_crud
from app.models.chat_message import ChatMessage, MessageDirection, MessagePlatform
from app.models.merchant import Merchant, MerchantStatus, MerchantTier
from app.models.order import Order, OrderStatus
from app.models.user import User, UserRole

# ── Helpers ───────────────────────────────────────────────────────────────────

async def _admin_token(client: AsyncClient, db_session: AsyncSession, email: str) -> str:
    await user_crud.create_user(db_session, email, "adminpass", role=UserRole.admin)
    login = await client.post(
        "/api/v1/auth/login", data={"username": email, "password": "adminpass"}
    )
    assert login.status_code == 200, login.text
    return login.json()["access_token"]


async def _make_merchant(db_session: AsyncSession, email: str, slug: str) -> Merchant:
    seller = User(email=email, hashed_password="x", role=UserRole.seller)
    db_session.add(seller)
    await db_session.flush()
    merchant = Merchant(
        user_id=seller.id,
        shop_name="CRM Shop",
        slug=slug,
        status=MerchantStatus.active,
        tier=MerchantTier.bronze,
        region="HN",
    )
    db_session.add(merchant)
    await db_session.flush()
    return merchant


async def _seed_chat(
    db_session: AsyncSession,
    session_id: str,
    fb_user_id: str,
    *,
    inbound_contents: list[str],
    outbound_contents: list[str] | None = None,
) -> None:
    for content in inbound_contents:
        db_session.add(ChatMessage(
            session_id=session_id,
            fb_user_id=fb_user_id,
            direction=MessageDirection.inbound,
            platform=MessagePlatform.messenger,
            content=content,
        ))
    for content in outbound_contents or []:
        db_session.add(ChatMessage(
            session_id=session_id,
            fb_user_id=fb_user_id,
            direction=MessageDirection.outbound,
            platform=MessagePlatform.messenger,
            content=content,
        ))
    await db_session.commit()


# ── /admin/crm/demographics ───────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_crm_demographics_happy_path(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    token = await _admin_token(client, db_session, "crm-admin1@test.com")

    # 1 buyer with VN shipping address, 1 customer who never ordered → 1 lead
    buyer = await user_crud.create_user(db_session, "buyer@test.com", "p", role=UserRole.customer)
    await user_crud.create_user(db_session, "lead@test.com", "p", role=UserRole.customer)
    merchant = await _make_merchant(db_session, "seller-crm1@test.com", "crm-shop-1")
    db_session.add(Order(
        customer_id=buyer.id,
        merchant_id=merchant.id,
        status=OrderStatus.delivered,
        total_amount=100_000,
        shipping_address={"country": "VN", "city": "Hà Nội", "address": "1 Lê Lợi"},
    ))
    await db_session.commit()

    # Seed 2 distinct messenger contacts
    await _seed_chat(db_session, "sess-A", "fb-A", inbound_contents=["xin chào"])
    await _seed_chat(db_session, "sess-B", "fb-B", inbound_contents=["hello"])

    response = await client.get(
        "/api/v1/admin/crm/demographics",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200, response.text
    data = response.json()

    sources = {b["key"]: b["count"] for b in data["by_source"]}
    assert sources["messenger"] == 2
    assert sources["web"] == 1  # one distinct buyer
    assert sources["lead"] == 1  # one customer never ordered

    countries = {b["key"]: b["count"] for b in data["by_country"]}
    assert countries["vn"] == 1
    assert countries["other"] == 0

    assert data["by_device"] == []


@pytest.mark.asyncio
async def test_crm_demographics_requires_auth(client: AsyncClient) -> None:
    response = await client.get("/api/v1/admin/crm/demographics")
    assert response.status_code == 401


# ── /admin/crm/conversation-overview ──────────────────────────────────────────

@pytest.mark.asyncio
async def test_crm_conversation_overview_happy_path(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    token = await _admin_token(client, db_session, "crm-admin2@test.com")

    # One contact today — a shipping inquiry should bump shipping_inquiry intent
    await _seed_chat(
        db_session,
        "sess-overview-1",
        "fb-overview-1",
        inbound_contents=["khi nào giao hàng tới Hà Nội?"],
        outbound_contents=["3-5 ngày làm việc"],
    )

    response = await client.get(
        "/api/v1/admin/crm/conversation-overview",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200, response.text
    data = response.json()

    assert data["stats"]["total_today"] >= 1
    assert data["stats"]["total_messages_today"] >= 2
    assert data["stats"]["response_time_avg"] is None
    assert data["stats"]["conversion_rate"] is None

    intents = {b["key"]: b["count"] for b in data["intent_breakdown"]}
    assert intents["shipping_inquiry"] >= 1
    # The 5 cluster keys are always present
    for key in ("product_search", "price_inquiry", "order_lookup",
                "shipping_inquiry", "complaint"):
        assert key in intents

    assert len(data["trend_7d"]) == 7
    assert all("date" in p and "count" in p for p in data["trend_7d"])

    funnel_keys = {s["key"] for s in data["funnel"]}
    assert funnel_keys == {"total", "product_intent", "linked_to_order"}


@pytest.mark.asyncio
async def test_crm_conversation_overview_requires_auth(client: AsyncClient) -> None:
    response = await client.get("/api/v1/admin/crm/conversation-overview")
    assert response.status_code == 401


# ── /admin/crm/conversations/{session_id}/profile ─────────────────────────────

@pytest.mark.asyncio
async def test_crm_conversation_profile_happy_path(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    token = await _admin_token(client, db_session, "crm-admin3@test.com")

    # Customer whose phone appears in chat content → should be linked
    customer = await user_crud.create_user(
        db_session, "linked@test.com", "p",
        role=UserRole.customer, full_name="Linked Customer", phone="0912345678",
    )

    await _seed_chat(
        db_session,
        "sess-profile-1",
        "fb-profile-1",
        inbound_contents=[
            "shop ơi cho mình hỏi giá",
            "sđt 0912345678 tiện liên hệ",
        ],
        outbound_contents=["Vâng ạ"],
    )

    response = await client.get(
        "/api/v1/admin/crm/conversations/sess-profile-1/profile",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200, response.text
    data = response.json()

    assert data["session_id"] == "sess-profile-1"
    assert data["fb_user_id"] == "fb-profile-1"
    assert data["message_count"] == 3

    assert data["linked_user"] is not None
    assert data["linked_user"]["id"] == customer.id
    assert data["linked_user"]["phone"] == "0912345678"

    intent_keys = {i["key"] for i in data["intent_history"]}
    assert "price_inquiry" in intent_keys


@pytest.mark.asyncio
async def test_crm_conversation_profile_requires_auth(client: AsyncClient) -> None:
    response = await client.get(
        "/api/v1/admin/crm/conversations/whatever/profile"
    )
    assert response.status_code == 401
