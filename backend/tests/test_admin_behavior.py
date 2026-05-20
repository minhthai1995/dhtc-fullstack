"""Tests for GET /admin/behavior/overview and /admin/behavior/sessions."""
from __future__ import annotations

from datetime import datetime, timedelta

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud import user as user_crud
from app.models.cart import CartItem
from app.models.merchant import Merchant, MerchantStatus, MerchantTier
from app.models.order import Order, OrderStatus
from app.models.page_view import PageView
from app.models.product import Product, ProductStatus
from app.models.user import User, UserRole


async def _admin_token(client: AsyncClient, db_session: AsyncSession, email: str) -> str:
    await user_crud.create_user(db_session, email, "adminpass", role=UserRole.admin)
    login = await client.post(
        "/api/v1/auth/login", data={"username": email, "password": "adminpass"}
    )
    assert login.status_code == 200
    return login.json()["access_token"]


async def _seed_merchant_product(
    db_session: AsyncSession, *, owner_email: str, slug: str
) -> tuple[Merchant, Product]:
    seller = User(email=owner_email, hashed_password="x", role=UserRole.seller)
    db_session.add(seller)
    await db_session.flush()
    merchant = Merchant(
        user_id=seller.id,
        shop_name="Behavior Shop",
        slug=slug,
        status=MerchantStatus.active,
        tier=MerchantTier.bronze,
        region="DN",
    )
    db_session.add(merchant)
    await db_session.flush()
    product = Product(
        merchant_id=merchant.id,
        name_vi="cha bo",
        name_en="beef sausage",
        slug=f"{slug}-cb",
        price=100_000,
        stock=10,
        status=ProductStatus.active,
    )
    db_session.add(product)
    await db_session.flush()
    return merchant, product


def _today(hour: int) -> datetime:
    today = datetime.now().replace(minute=0, second=0, microsecond=0)
    return today.replace(hour=hour)


@pytest.mark.asyncio
async def test_behavior_overview_happy_path(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    token = await _admin_token(client, db_session, "behavior-admin1@test.com")

    # 2 sessions seeded today:
    # session-a: 3 pageviews (mobile, google referrer), visits product + checkout → not bounced
    # session-b: 1 pageview (desktop, direct) → bounced
    base = _today(10)
    db_session.add_all([
        PageView(
            visitor_id="vis-a", session_id="sess-a",
            path="/shop", referrer="https://www.google.com/",
            user_agent="iPhone; Mobile",
            viewed_at=base,
        ),
        PageView(
            visitor_id="vis-a", session_id="sess-a",
            path="/product/cha-bo", referrer=None,
            user_agent="iPhone; Mobile",
            viewed_at=base + timedelta(seconds=30),
        ),
        PageView(
            visitor_id="vis-a", session_id="sess-a",
            path="/checkout", referrer=None,
            user_agent="iPhone; Mobile",
            viewed_at=base + timedelta(seconds=90),
        ),
        PageView(
            visitor_id="vis-b", session_id="sess-b",
            path="/", referrer=None,
            user_agent="Mozilla/5.0 (X11; Linux x86_64)",
            viewed_at=base + timedelta(minutes=5),
        ),
    ])

    # Cart item from a third customer — adds to add_to_cart funnel stage
    customer = await user_crud.create_user(
        db_session, "cart-user@test.com", "p", role=UserRole.customer
    )
    _, product = await _seed_merchant_product(
        db_session, owner_email="b-seller1@test.com", slug="bshop1"
    )
    db_session.add(CartItem(customer_id=customer.id, product_id=product.id, quantity=2))

    # Completed order for funnel `complete`. Pin created_at to today's local
    # boundary used by the endpoint — otherwise SQLite's UTC CURRENT_TIMESTAMP
    # falls on the previous day when run early-morning local time.
    db_session.add(Order(
        customer_id=customer.id,
        merchant_id=product.merchant_id,
        status=OrderStatus.delivered,
        total_amount=200_000,
        shipping_address={"country": "VN"},
        created_at=base,
    ))
    await db_session.commit()

    response = await client.get(
        "/api/v1/admin/behavior/overview",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200, response.text
    data = response.json()

    assert data["stats"]["total_sessions"] == 2
    assert data["stats"]["bounce_rate"] == 0.5
    assert data["stats"]["pages_per_session"] == 2.0

    devices = {b["key"]: b["count"] for b in data["by_device"]}
    assert devices.get("mobile", 0) == 3
    assert devices.get("desktop", 0) == 1

    sources = {b["key"]: b["count"] for b in data["by_source"]}
    assert sources.get("google", 0) == 1
    assert sources.get("direct", 0) == 3

    paths = {p["path"]: p["count"] for p in data["top_pages"]}
    assert paths["/shop"] == 1
    assert paths["/product/cha-bo"] == 1
    assert paths["/checkout"] == 1

    funnel = {s["key"]: s["count"] for s in data["funnel"]}
    assert funnel["view_product"] == 1   # vis-a only
    assert funnel["add_to_cart"] == 1    # 1 distinct cart user
    assert funnel["checkout"] == 1       # vis-a only
    assert funnel["complete"] == 1       # 1 delivered order today

    assert len(data["hourly_24h"]) == 24
    busy_hour = next(h for h in data["hourly_24h"] if h["hour"] == 10)
    assert busy_hour["count"] >= 3


@pytest.mark.asyncio
async def test_behavior_overview_requires_admin(client: AsyncClient) -> None:
    response = await client.get("/api/v1/admin/behavior/overview")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_behavior_sessions_happy_path(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    token = await _admin_token(client, db_session, "behavior-admin2@test.com")

    base = _today(8)
    db_session.add_all([
        PageView(visitor_id="v1", session_id="s1", path="/", viewed_at=base),
        PageView(
            visitor_id="v1", session_id="s1", path="/shop",
            viewed_at=base + timedelta(seconds=45),
        ),
        PageView(
            visitor_id="v2", session_id="s2", path="/", viewed_at=base + timedelta(minutes=2)
        ),
    ])
    await db_session.commit()

    response = await client.get(
        "/api/v1/admin/behavior/sessions?limit=10",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert len(data) == 2

    by_session = {row["session_id"]: row for row in data}
    assert by_session["s1"]["page_count"] == 2
    assert by_session["s1"]["duration_sec"] == 45
    assert by_session["s2"]["page_count"] == 1
    assert by_session["s2"]["duration_sec"] == 0


@pytest.mark.asyncio
async def test_behavior_sessions_requires_admin(client: AsyncClient) -> None:
    response = await client.get("/api/v1/admin/behavior/sessions")
    assert response.status_code == 401
