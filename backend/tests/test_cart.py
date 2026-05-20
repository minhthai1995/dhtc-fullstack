"""Integration tests for the customer cart endpoints."""
from __future__ import annotations

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud import user as user_crud
from app.models.category import Category
from app.models.merchant import Merchant, MerchantStatus, MerchantTier
from app.models.product import Product, ProductStatus
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


async def _make_product(db_session: AsyncSession, slug: str, stock: int = 10) -> Product:
    cat = Category(name_vi="Cart Cat", name_en="Cart Cat", slug=f"cart-cat-{slug}")
    db_session.add(cat)
    await db_session.flush()

    seller = User(email=f"seller-{slug}@cart.com", hashed_password="x", role=UserRole.seller)
    db_session.add(seller)
    await db_session.flush()

    merchant = Merchant(
        user_id=seller.id,
        shop_name="Cart Shop",
        slug=f"cart-shop-{slug}",
        status=MerchantStatus.active,
        tier=MerchantTier.bronze,
        region="HCM",
    )
    db_session.add(merchant)
    await db_session.flush()

    product = Product(
        merchant_id=merchant.id,
        category_id=cat.id,
        name_vi="Sản phẩm giỏ hàng",
        name_en="Cart product",
        slug=slug,
        price=50_000,
        stock=stock,
        status=ProductStatus.active,
    )
    db_session.add(product)
    await db_session.commit()
    return product


# ── Tests ─────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_add_to_cart(client: AsyncClient, db_session: AsyncSession) -> None:
    token = await create_user_and_token(client, db_session, "cart1@test.com", "pass1234")
    product = await _make_product(db_session, "cart-p1")

    response = await client.post(
        "/api/v1/customer/cart",
        json={"product_id": product.id, "quantity": 2},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 201, response.text
    data = response.json()
    assert data["product_id"] == product.id
    assert data["quantity"] == 2


@pytest.mark.asyncio
async def test_add_same_product_twice_updates_qty(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    token = await create_user_and_token(client, db_session, "cart2@test.com", "pass1234")
    product = await _make_product(db_session, "cart-p2", stock=20)

    await client.post(
        "/api/v1/customer/cart",
        json={"product_id": product.id, "quantity": 3},
        headers={"Authorization": f"Bearer {token}"},
    )
    await client.post(
        "/api/v1/customer/cart",
        json={"product_id": product.id, "quantity": 2},
        headers={"Authorization": f"Bearer {token}"},
    )

    list_resp = await client.get(
        "/api/v1/customer/cart",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert list_resp.status_code == 200
    items = list_resp.json()
    assert len(items) == 1
    assert items[0]["quantity"] == 5


@pytest.mark.asyncio
async def test_remove_from_cart(client: AsyncClient, db_session: AsyncSession) -> None:
    token = await create_user_and_token(client, db_session, "cart3@test.com", "pass1234")
    product = await _make_product(db_session, "cart-p3")

    await client.post(
        "/api/v1/customer/cart",
        json={"product_id": product.id, "quantity": 1},
        headers={"Authorization": f"Bearer {token}"},
    )
    del_resp = await client.delete(
        f"/api/v1/customer/cart/{product.id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert del_resp.status_code == 204

    list_resp = await client.get(
        "/api/v1/customer/cart",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert list_resp.json() == []


@pytest.mark.asyncio
async def test_update_cart_quantity(client: AsyncClient, db_session: AsyncSession) -> None:
    token = await create_user_and_token(client, db_session, "cart4@test.com", "pass1234")
    product = await _make_product(db_session, "cart-p4", stock=20)

    await client.post(
        "/api/v1/customer/cart",
        json={"product_id": product.id, "quantity": 1},
        headers={"Authorization": f"Bearer {token}"},
    )
    patch_resp = await client.patch(
        f"/api/v1/customer/cart/{product.id}",
        json={"quantity": 7},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert patch_resp.status_code == 200, patch_resp.text
    assert patch_resp.json()["quantity"] == 7


@pytest.mark.asyncio
async def test_cart_update_exceeds_stock(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    token = await create_user_and_token(client, db_session, "cart5@test.com", "pass1234")
    product = await _make_product(db_session, "cart-p5", stock=3)

    await client.post(
        "/api/v1/customer/cart",
        json={"product_id": product.id, "quantity": 1},
        headers={"Authorization": f"Bearer {token}"},
    )
    patch_resp = await client.patch(
        f"/api/v1/customer/cart/{product.id}",
        json={"quantity": 100},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert patch_resp.status_code == 400


@pytest.mark.asyncio
async def test_clear_cart(client: AsyncClient, db_session: AsyncSession) -> None:
    token = await create_user_and_token(client, db_session, "cart6@test.com", "pass1234")
    product = await _make_product(db_session, "cart-p6", stock=10)

    await client.post(
        "/api/v1/customer/cart",
        json={"product_id": product.id, "quantity": 2},
        headers={"Authorization": f"Bearer {token}"},
    )
    clear_resp = await client.delete(
        "/api/v1/customer/cart",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert clear_resp.status_code == 204

    list_resp = await client.get(
        "/api/v1/customer/cart",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert list_resp.json() == []
