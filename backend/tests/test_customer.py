"""Integration tests for customer wishlist, addresses, reviews, and profile."""
from __future__ import annotations

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud import user as user_crud
from app.models.category import Category
from app.models.merchant import Merchant, MerchantStatus, MerchantTier
from app.models.order import Order, OrderItem, OrderStatus
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


async def _make_product(db_session: AsyncSession, slug: str) -> tuple[Product, Merchant]:
    cat = Category(name_vi="Customer Cat", name_en="Customer Cat", slug=f"cc-{slug}")
    db_session.add(cat)
    await db_session.flush()

    seller = User(email=f"s-{slug}@cust.com", hashed_password="x", role=UserRole.seller)
    db_session.add(seller)
    await db_session.flush()

    merchant = Merchant(
        user_id=seller.id,
        shop_name="Cust Shop",
        slug=f"cust-shop-{slug}",
        status=MerchantStatus.active,
        tier=MerchantTier.bronze,
        region="HN",
    )
    db_session.add(merchant)
    await db_session.flush()

    product = Product(
        merchant_id=merchant.id,
        category_id=cat.id,
        name_vi="Sản phẩm test",
        name_en="Test product",
        slug=f"prod-{slug}",
        price=100_000,
        stock=50,
        status=ProductStatus.active,
    )
    db_session.add(product)
    await db_session.flush()
    return product, merchant


async def _make_delivered_order(
    db_session: AsyncSession,
    customer_id: int,
    product: Product,
    merchant: Merchant,
) -> Order:
    """Insert a delivered order + item directly so the review gate passes."""
    order = Order(
        customer_id=customer_id,
        merchant_id=merchant.id,
        status=OrderStatus.delivered,
        total_amount=float(product.price),
        shipping_address={"name": "X", "phone": "0", "address": "A", "city": "B", "country": "VN"},
    )
    db_session.add(order)
    await db_session.flush()

    item = OrderItem(
        order_id=order.id,
        product_id=product.id,
        quantity=1,
        unit_price=float(product.price),
    )
    db_session.add(item)
    await db_session.commit()
    return order


# ── Wishlist tests ────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_add_to_wishlist(client: AsyncClient, db_session: AsyncSession) -> None:
    token = await create_user_and_token(client, db_session, "w1@test.com", "pass1234")
    product, _ = await _make_product(db_session, "wl1")
    await db_session.commit()

    response = await client.post(
        f"/api/v1/customer/wishlist/{product.id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 201, response.text
    assert response.json()["product_id"] == product.id


@pytest.mark.asyncio
async def test_wishlist_duplicate_returns_409(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    token = await create_user_and_token(client, db_session, "w2@test.com", "pass1234")
    product, _ = await _make_product(db_session, "wl2")
    await db_session.commit()

    headers = {"Authorization": f"Bearer {token}"}
    await client.post(f"/api/v1/customer/wishlist/{product.id}", headers=headers)
    response = await client.post(f"/api/v1/customer/wishlist/{product.id}", headers=headers)
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_remove_from_wishlist(client: AsyncClient, db_session: AsyncSession) -> None:
    token = await create_user_and_token(client, db_session, "w3@test.com", "pass1234")
    product, _ = await _make_product(db_session, "wl3")
    await db_session.commit()

    headers = {"Authorization": f"Bearer {token}"}
    await client.post(f"/api/v1/customer/wishlist/{product.id}", headers=headers)
    del_resp = await client.delete(f"/api/v1/customer/wishlist/{product.id}", headers=headers)
    assert del_resp.status_code == 204

    list_resp = await client.get("/api/v1/customer/wishlist", headers=headers)
    assert list_resp.json() == []


# ── Address tests ─────────────────────────────────────────────────────────────

_ADDR_PAYLOAD = {
    "label": "Nhà",
    "name": "Nguyễn Văn A",
    "phone": "0901234567",
    "address": "123 Trần Phú",
    "city": "Đà Nẵng",
    "country": "Việt Nam",
}


@pytest.mark.asyncio
async def test_create_address(client: AsyncClient, db_session: AsyncSession) -> None:
    token = await create_user_and_token(client, db_session, "addr1@test.com", "pass1234")
    headers = {"Authorization": f"Bearer {token}"}

    response = await client.post(
        "/api/v1/customer/addresses", json=_ADDR_PAYLOAD, headers=headers
    )
    assert response.status_code == 201, response.text
    data = response.json()
    assert data["name"] == "Nguyễn Văn A"
    assert data["city"] == "Đà Nẵng"


@pytest.mark.asyncio
async def test_set_default_address(client: AsyncClient, db_session: AsyncSession) -> None:
    token = await create_user_and_token(client, db_session, "addr2@test.com", "pass1234")
    headers = {"Authorization": f"Bearer {token}"}

    r1 = await client.post("/api/v1/customer/addresses", json=_ADDR_PAYLOAD, headers=headers)
    addr1_id = r1.json()["id"]

    addr2_payload = {**_ADDR_PAYLOAD, "name": "Nguyễn Văn B", "city": "HCM"}
    r2 = await client.post("/api/v1/customer/addresses", json=addr2_payload, headers=headers)
    addr2_id = r2.json()["id"]

    patch_resp = await client.patch(
        f"/api/v1/customer/addresses/{addr2_id}/default", headers=headers
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["is_default"] is True

    # addr1 should no longer be default
    list_resp = await client.get("/api/v1/customer/addresses", headers=headers)
    by_id = {a["id"]: a for a in list_resp.json()}
    assert by_id[addr1_id]["is_default"] is False
    assert by_id[addr2_id]["is_default"] is True


# ── Profile tests ─────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_update_profile(client: AsyncClient, db_session: AsyncSession) -> None:
    token = await create_user_and_token(client, db_session, "prof1@test.com", "pass1234")
    headers = {"Authorization": f"Bearer {token}"}

    response = await client.patch(
        "/api/v1/customer/profile",
        json={"full_name": "Nguyễn Profile", "phone": "0909123456"},
        headers=headers,
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["full_name"] == "Nguyễn Profile"
    assert data["phone"] == "0909123456"


# ── Review tests ──────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_review_requires_purchase(client: AsyncClient, db_session: AsyncSession) -> None:
    """Customer without a delivered order should get 403 when reviewing."""
    token = await create_user_and_token(client, db_session, "rev1@test.com", "pass1234")
    product, _ = await _make_product(db_session, "rev1")
    await db_session.commit()

    response = await client.post(
        f"/api/v1/customer/products/{product.id}/reviews",
        json={"rating": 5, "comment": "Tuyệt vời"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_review_duplicate_returns_409(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    token = await create_user_and_token(client, db_session, "rev2@test.com", "pass1234")
    product, merchant = await _make_product(db_session, "rev2")

    customer = await user_crud.get_by_email(db_session, "rev2@test.com")
    assert customer is not None
    await _make_delivered_order(db_session, customer.id, product, merchant)

    headers = {"Authorization": f"Bearer {token}"}
    r1 = await client.post(
        f"/api/v1/customer/products/{product.id}/reviews",
        json={"rating": 4, "comment": "Tốt"},
        headers=headers,
    )
    assert r1.status_code == 201, r1.text

    r2 = await client.post(
        f"/api/v1/customer/products/{product.id}/reviews",
        json={"rating": 3, "comment": "Cũng được"},
        headers=headers,
    )
    assert r2.status_code == 409


# ── Password change tests ─────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_password_change_wrong_current(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    token = await create_user_and_token(client, db_session, "pwd1@test.com", "correct123")
    response = await client.patch(
        "/api/v1/auth/password",
        json={"current_password": "wrong_password", "new_password": "newpass456"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_password_change_success(client: AsyncClient, db_session: AsyncSession) -> None:
    token = await create_user_and_token(client, db_session, "pwd2@test.com", "oldpass123")
    headers = {"Authorization": f"Bearer {token}"}

    change_resp = await client.patch(
        "/api/v1/auth/password",
        json={"current_password": "oldpass123", "new_password": "newpass456"},
        headers=headers,
    )
    assert change_resp.status_code == 204

    # Login with new password should succeed
    login_resp = await client.post(
        "/api/v1/auth/login",
        data={"username": "pwd2@test.com", "password": "newpass456"},
    )
    assert login_resp.status_code == 200
    assert "access_token" in login_resp.json()
