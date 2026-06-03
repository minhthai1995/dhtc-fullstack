"""Tests for customer shipping-zone discovery + server-side fee recompute."""
from __future__ import annotations

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud import user as user_crud
from app.models.category import Category
from app.models.merchant import Merchant, MerchantStatus, MerchantTier
from app.models.product import Product, ProductStatus
from app.models.shipping import ShippingZone
from app.models.user import UserRole

_SHIPPING_ADDR = {
    "name": "Test User",
    "phone": "0901234567",
    "address": "123 Lê Lợi",
    "city": "Đà Nẵng",
    "country": "VN",
}


async def _setup(
    client: AsyncClient,
    db_session: AsyncSession,
    *,
    customer_email: str,
    seller_email: str,
    slug: str,
    price: float = 100_000,
) -> tuple[str, int, int]:
    await user_crud.create_user(db_session, customer_email, "pass1234")
    await user_crud.create_user(
        db_session, seller_email, "pass1234", role=UserRole.seller
    )
    login = await client.post(
        "/api/v1/auth/login",
        data={"username": customer_email, "password": "pass1234"},
    )
    token = login.json()["access_token"]

    cat = Category(name_vi="Cat", name_en="Cat", slug=f"cat-{slug}")
    db_session.add(cat)
    await db_session.flush()

    seller = await user_crud.get_by_email(db_session, seller_email)
    assert seller is not None
    merchant = Merchant(
        user_id=seller.id,
        shop_name="Ship Shop",
        slug=f"ship-{slug}",
        status=MerchantStatus.active,
        tier=MerchantTier.bronze,
        region="DN",
    )
    db_session.add(merchant)
    await db_session.flush()

    product = Product(
        merchant_id=merchant.id,
        category_id=cat.id,
        name_vi="Sản phẩm",
        name_en="Product",
        slug=f"prod-{slug}",
        price=price,
        stock=20,
        status=ProductStatus.active,
    )
    db_session.add(product)
    await db_session.commit()
    return token, product.id, merchant.id


@pytest.mark.asyncio
async def test_list_shipping_zones_public(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    _, _, merchant_id = await _setup(
        client, db_session,
        customer_email="ship1c@test.com",
        seller_email="ship1s@test.com",
        slug="ship1",
    )
    db_session.add_all([
        ShippingZone(
            merchant_id=merchant_id, zone_name="Nội thành",
            countries=["VN"], base_rate=30_000, per_kg_rate=0,
            estimated_days_min=1, estimated_days_max=2,
        ),
        ShippingZone(
            merchant_id=merchant_id, zone_name="Quốc tế",
            countries=["US", "JP"], base_rate=300_000, per_kg_rate=0,
            estimated_days_min=7, estimated_days_max=14,
        ),
    ])
    await db_session.commit()

    resp = await client.get(f"/api/v1/customer/merchants/{merchant_id}/shipping")
    assert resp.status_code == 200, resp.text
    zones = resp.json()
    assert len(zones) == 2

    # country filter
    resp_vn = await client.get(
        f"/api/v1/customer/merchants/{merchant_id}/shipping",
        params={"country": "vn"},  # lowercase → still matches
    )
    assert resp_vn.status_code == 200
    vn_zones = resp_vn.json()
    assert len(vn_zones) == 1
    assert vn_zones[0]["zone_name"] == "Nội thành"


@pytest.mark.asyncio
async def test_list_shipping_zones_404_for_unknown_merchant(
    client: AsyncClient,
) -> None:
    resp = await client.get("/api/v1/customer/merchants/9999/shipping")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_order_with_zone_recomputes_fee(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    token, product_id, merchant_id = await _setup(
        client, db_session,
        customer_email="ship2c@test.com",
        seller_email="ship2s@test.com",
        slug="ship2",
        price=100_000,
    )
    zone = ShippingZone(
        merchant_id=merchant_id, zone_name="Nội thành",
        countries=["VN"], base_rate=30_000, per_kg_rate=0,
        estimated_days_min=1, estimated_days_max=2,
    )
    db_session.add(zone)
    await db_session.commit()
    await db_session.refresh(zone)

    # Client tries to send shipping_fee=0 with a zone — server must override.
    resp = await client.post(
        "/api/v1/customer/orders",
        json={
            "items": [{"product_id": product_id, "quantity": 1}],
            "shipping_address": _SHIPPING_ADDR,
            "payment_method": "cod",
            "shipping_fee": 0,
            "shipping_zone_id": zone.id,
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 201, resp.text
    body = resp.json()
    # 100k product + 30k recomputed shipping = 130k
    assert float(body["total_amount"]) == pytest.approx(130_000)
    assert float(body["shipping_fee"]) == pytest.approx(30_000)
    assert body["shipping_method"] == "zone:Nội thành"


@pytest.mark.asyncio
async def test_order_with_foreign_zone_rejected(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """Zone belonging to another merchant must not apply."""
    token, product_id, _own = await _setup(
        client, db_session,
        customer_email="ship3c@test.com",
        seller_email="ship3sa@test.com",
        slug="ship3a",
    )
    # Second merchant + zone
    await user_crud.create_user(
        db_session, "ship3sb@test.com", "pass1234", role=UserRole.seller
    )
    other_seller = await user_crud.get_by_email(db_session, "ship3sb@test.com")
    assert other_seller is not None
    other_merchant = Merchant(
        user_id=other_seller.id,
        shop_name="Other",
        slug="other-ship3",
        status=MerchantStatus.active,
        tier=MerchantTier.bronze,
        region="DN",
    )
    db_session.add(other_merchant)
    await db_session.flush()
    foreign_zone = ShippingZone(
        merchant_id=other_merchant.id, zone_name="X",
        countries=["VN"], base_rate=999_000, per_kg_rate=0,
        estimated_days_min=1, estimated_days_max=2,
    )
    db_session.add(foreign_zone)
    await db_session.commit()
    await db_session.refresh(foreign_zone)

    resp = await client.post(
        "/api/v1/customer/orders",
        json={
            "items": [{"product_id": product_id, "quantity": 1}],
            "shipping_address": _SHIPPING_ADDR,
            "payment_method": "cod",
            "shipping_zone_id": foreign_zone.id,
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 400
    assert "không hợp lệ" in resp.json()["detail"].lower()
