"""Integration tests for admin endpoints."""
from __future__ import annotations

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud import user as user_crud
from app.models.merchant import Merchant, MerchantStatus, MerchantTier
from app.models.user import User, UserRole

# ── Shared helpers ────────────────────────────────────────────────────────────

async def create_user_and_token(
    client: AsyncClient,
    db_session: AsyncSession,
    email: str,
    password: str,
    role: UserRole = UserRole.customer,
) -> str:
    await user_crud.create_user(db_session, email, password, role=role)
    login = await client.post(
        "/api/v1/auth/login", data={"username": email, "password": password}
    )
    assert login.status_code == 200, login.text
    return login.json()["access_token"]


async def _make_merchant(
    db_session: AsyncSession,
    email: str,
    shop_slug: str,
    status: MerchantStatus = MerchantStatus.pending,
) -> Merchant:
    seller = User(email=email, hashed_password="x", role=UserRole.seller)
    db_session.add(seller)
    await db_session.flush()

    merchant = Merchant(
        user_id=seller.id,
        shop_name="Admin Test Shop",
        slug=shop_slug,
        status=status,
        tier=MerchantTier.bronze,
        region="HN",
    )
    db_session.add(merchant)
    await db_session.commit()
    return merchant


# ── Tests ─────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_admin_dashboard(client: AsyncClient, db_session: AsyncSession) -> None:
    admin_token = await create_user_and_token(
        client, db_session, "admin1@test.com", "adminpass", role=UserRole.admin
    )
    response = await client.get(
        "/api/v1/admin/dashboard",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200, response.text
    data = response.json()
    for key in (
        "total_merchants", "total_products", "total_orders",
        "pending_approvals", "gmv_total",
    ):
        assert key in data, f"Missing key: {key}"
    assert isinstance(data["total_merchants"], int)
    assert isinstance(data["total_orders"], int)
    assert isinstance(data["gmv_total"], float)


@pytest.mark.asyncio
async def test_admin_list_customers(client: AsyncClient, db_session: AsyncSession) -> None:
    admin_token = await create_user_and_token(
        client, db_session, "admin2@test.com", "adminpass", role=UserRole.admin
    )
    # Create two customer users
    await user_crud.create_user(db_session, "custA@list.com", "pass")
    await user_crud.create_user(db_session, "custB@list.com", "pass")

    response = await client.get(
        "/api/v1/admin/customers",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200, response.text
    data = response.json()
    emails = {d["email"] for d in data}
    assert "custA@list.com" in emails
    assert "custB@list.com" in emails
    # Each entry should have order_count
    for entry in data:
        assert "order_count" in entry
        assert isinstance(entry["order_count"], int)


@pytest.mark.asyncio
async def test_admin_approve_merchant(client: AsyncClient, db_session: AsyncSession) -> None:
    admin_token = await create_user_and_token(
        client, db_session, "admin3@test.com", "adminpass", role=UserRole.admin
    )
    merchant = await _make_merchant(
        db_session, "sell3@test.com", "shop-pending-3", status=MerchantStatus.pending
    )

    response = await client.patch(
        f"/api/v1/admin/merchants/{merchant.id}/approve",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200, response.text
    assert response.json()["status"] == "active"


@pytest.mark.asyncio
async def test_admin_suspend_merchant(client: AsyncClient, db_session: AsyncSession) -> None:
    admin_token = await create_user_and_token(
        client, db_session, "admin4@test.com", "adminpass", role=UserRole.admin
    )
    merchant = await _make_merchant(
        db_session, "sell4@test.com", "shop-active-4", status=MerchantStatus.active
    )

    response = await client.patch(
        f"/api/v1/admin/merchants/{merchant.id}/suspend",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200, response.text
    assert response.json()["status"] == "suspended"


@pytest.mark.asyncio
async def test_non_admin_cannot_access(client: AsyncClient, db_session: AsyncSession) -> None:
    customer_token = await create_user_and_token(
        client, db_session, "cust5@test.com", "pass1234", role=UserRole.customer
    )
    response = await client.get(
        "/api/v1/admin/dashboard",
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    assert response.status_code == 403
