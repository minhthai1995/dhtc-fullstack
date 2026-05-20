"""Integration tests for the customer order endpoints."""
from __future__ import annotations

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud import user as user_crud
from app.models.category import Category
from app.models.merchant import Merchant, MerchantStatus, MerchantTier
from app.models.product import Product, ProductStatus
from app.models.user import UserRole

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


_SHIPPING = {
    "name": "Test User",
    "phone": "0901234567",
    "address": "123 Lê Lợi",
    "city": "Hà Nội",
    "country": "VN",
}


async def _setup(
    client: AsyncClient,
    db_session: AsyncSession,
    customer_email: str = "cust@test.com",
    seller_email: str = "seller@test.com",
    stock: int = 10,
    product_status: ProductStatus = ProductStatus.active,
) -> tuple[str, str, int, int]:
    """Returns (customer_token, seller_token, product_id, merchant_id)."""
    customer_token = await create_user_and_token(
        client, db_session, customer_email, "pass1234"
    )
    seller_token = await create_user_and_token(
        client, db_session, seller_email, "pass1234", role=UserRole.seller
    )

    # Create category, merchant, product directly
    cat = Category(name_vi="Đặc sản", name_en="Specialty", slug=f"dac-san-{seller_email[:4]}")
    db_session.add(cat)
    await db_session.flush()

    seller_user = await user_crud.get_by_email(db_session, seller_email)
    assert seller_user is not None
    merchant = Merchant(
        user_id=seller_user.id,
        shop_name="Order Shop",
        slug=f"order-shop-{seller_email[:4]}",
        status=MerchantStatus.active,
        tier=MerchantTier.bronze,
        region="HN",
    )
    db_session.add(merchant)
    await db_session.flush()

    product = Product(
        merchant_id=merchant.id,
        category_id=cat.id,
        name_vi="Cà phê đặc sản",
        name_en="Specialty Coffee",
        slug=f"ca-phe-{seller_email[:4]}",
        price=150_000,
        stock=stock,
        status=product_status,
    )
    db_session.add(product)
    await db_session.commit()

    return customer_token, seller_token, product.id, merchant.id


def _order_payload(product_id: int, qty: int = 1) -> dict:
    return {
        "items": [{"product_id": product_id, "quantity": qty}],
        "shipping_address": _SHIPPING,
        "payment_method": "cod",
    }


# ── Tests ─────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_create_order_success(client: AsyncClient, db_session: AsyncSession) -> None:
    customer_token, _seller_token, product_id, _merchant_id = await _setup(
        client, db_session, stock=5
    )

    response = await client.post(
        "/api/v1/customer/orders",
        json=_order_payload(product_id, qty=2),
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    assert response.status_code == 201, response.text
    data = response.json()
    assert data["status"] == "pending"
    assert len(data["items"]) == 1
    assert data["items"][0]["quantity"] == 2
    assert float(data["total_amount"]) == pytest.approx(300_000)


@pytest.mark.asyncio
async def test_create_order_insufficient_stock(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    customer_token, _seller_token, product_id, _merchant_id = await _setup(
        client, db_session,
        customer_email="cust2@test.com",
        seller_email="sell2@test.com",
        stock=3,
    )

    response = await client.post(
        "/api/v1/customer/orders",
        json=_order_payload(product_id, qty=10),
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    assert response.status_code == 400
    assert "kho" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_create_order_inactive_product(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    customer_token, _seller_token, product_id, _merchant_id = await _setup(
        client, db_session,
        customer_email="cust3@test.com",
        seller_email="sell3@test.com",
        product_status=ProductStatus.inactive,
    )

    response = await client.post(
        "/api/v1/customer/orders",
        json=_order_payload(product_id),
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    assert response.status_code == 400
    detail = response.json()["detail"].lower()
    assert "bán" in detail or "không" in detail


@pytest.mark.asyncio
async def test_create_order_empty_items(client: AsyncClient, db_session: AsyncSession) -> None:
    customer_token = await create_user_and_token(
        client, db_session, "cust4@test.com", "pass1234"
    )

    response = await client.post(
        "/api/v1/customer/orders",
        json={"items": [], "shipping_address": _SHIPPING},
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    # Pydantic validation error → 422
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_cancel_order_restores_stock(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    customer_token, seller_token, product_id, _merchant_id = await _setup(
        client, db_session,
        customer_email="cust5@test.com",
        seller_email="sell5@test.com",
        stock=8,
    )

    # Create order (qty=3)
    create_resp = await client.post(
        "/api/v1/customer/orders",
        json=_order_payload(product_id, qty=3),
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    assert create_resp.status_code == 201, create_resp.text
    order_id = create_resp.json()["id"]

    # Stock should be 5 now; cancel via admin endpoint (no seller transition restriction)
    cancel_resp = await client.patch(
        f"/api/v1/admin/orders/{order_id}/status",
        json={"status": "cancelled"},
        headers={"Authorization": f"Bearer {seller_token}"},
    )
    # seller cannot access admin route → 403; use admin user instead
    # Create an admin token
    admin_token = await create_user_and_token(
        client, db_session, "admin5@test.com", "adminpass", role=UserRole.admin
    )
    cancel_resp = await client.patch(
        f"/api/v1/admin/orders/{order_id}/status",
        json={"status": "cancelled"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert cancel_resp.status_code == 200, cancel_resp.text
    assert cancel_resp.json()["status"] == "cancelled"

    # Verify stock restored
    product_resp = await client.get(f"/api/v1/customer/products/{product_id}")
    assert product_resp.status_code == 200
    assert product_resp.json()["stock"] == 8


@pytest.mark.asyncio
async def test_customer_can_list_own_orders(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    customer_token, _seller_token, product_id, _merchant_id = await _setup(
        client, db_session,
        customer_email="cust6@test.com",
        seller_email="sell6@test.com",
        stock=20,
    )

    for _ in range(2):
        r = await client.post(
            "/api/v1/customer/orders",
            json=_order_payload(product_id),
            headers={"Authorization": f"Bearer {customer_token}"},
        )
        assert r.status_code == 201, r.text

    list_resp = await client.get(
        "/api/v1/customer/orders",
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    assert list_resp.status_code == 200
    assert len(list_resp.json()) == 2


@pytest.mark.asyncio
async def test_customer_cannot_see_other_orders(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    customer_token, _seller_token, product_id, _merchant_id = await _setup(
        client, db_session,
        customer_email="cust7@test.com",
        seller_email="sell7@test.com",
        stock=20,
    )

    # Customer A places an order
    r = await client.post(
        "/api/v1/customer/orders",
        json=_order_payload(product_id),
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    assert r.status_code == 201, r.text
    order_id = r.json()["id"]

    # Customer B should NOT see customer A's order
    cust_b_token = await create_user_and_token(
        client, db_session, "custB7@test.com", "pass1234"
    )
    get_resp = await client.get(
        f"/api/v1/customer/orders/{order_id}",
        headers={"Authorization": f"Bearer {cust_b_token}"},
    )
    assert get_resp.status_code == 404
