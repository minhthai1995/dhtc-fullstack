"""Integration tests for server-side promotion application on order create."""
from __future__ import annotations

from datetime import UTC, datetime, timedelta

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud import user as user_crud
from app.models.category import Category
from app.models.merchant import Merchant, MerchantStatus, MerchantTier
from app.models.product import Product, ProductStatus
from app.models.promotion import Promotion, PromotionType
from app.models.user import UserRole

_SHIPPING = {
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
    price: float = 100_000,
    stock: int = 20,
) -> tuple[str, int, int]:
    """Returns (customer_token, product_id, merchant_id)."""
    await user_crud.create_user(db_session, customer_email, "pass1234")
    await user_crud.create_user(
        db_session, seller_email, "pass1234", role=UserRole.seller
    )
    login = await client.post(
        "/api/v1/auth/login",
        data={"username": customer_email, "password": "pass1234"},
    )
    assert login.status_code == 200, login.text
    customer_token = login.json()["access_token"]

    slug_suffix = seller_email.split("@")[0]
    cat = Category(
        name_vi="Đặc sản",
        name_en="Specialty",
        slug=f"dac-san-{slug_suffix}",
    )
    db_session.add(cat)
    await db_session.flush()

    seller = await user_crud.get_by_email(db_session, seller_email)
    assert seller is not None
    merchant = Merchant(
        user_id=seller.id,
        shop_name="Promo Shop",
        slug=f"promo-shop-{slug_suffix}",
        status=MerchantStatus.active,
        tier=MerchantTier.bronze,
        region="DN",
    )
    db_session.add(merchant)
    await db_session.flush()

    product = Product(
        merchant_id=merchant.id,
        category_id=cat.id,
        name_vi="Cà phê",
        name_en="Coffee",
        slug=f"coffee-{slug_suffix}",
        price=price,
        stock=stock,
        status=ProductStatus.active,
    )
    db_session.add(product)
    await db_session.commit()

    return customer_token, product.id, merchant.id


async def _create_promo(
    db_session: AsyncSession,
    merchant_id: int,
    *,
    code: str,
    promo_type: PromotionType = PromotionType.percentage,
    value: float = 10,
    min_order: float = 0,
    max_usage: int | None = None,
    expires_at: datetime | None = None,
    is_active: bool = True,
) -> Promotion:
    promo = Promotion(
        merchant_id=merchant_id,
        code=code,
        type=promo_type,
        value=value,
        min_order=min_order,
        max_usage=max_usage,
        expires_at=expires_at,
        is_active=is_active,
    )
    db_session.add(promo)
    await db_session.commit()
    await db_session.refresh(promo)
    return promo


def _payload(product_id: int, *, qty: int = 1, code: str | None = None) -> dict:
    body: dict = {
        "items": [{"product_id": product_id, "quantity": qty}],
        "shipping_address": _SHIPPING,
        "payment_method": "cod",
        "shipping_fee": 0,
    }
    if code is not None:
        body["promotion_code"] = code
    return body


@pytest.mark.asyncio
async def test_percentage_promo_discounts_total(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    token, product_id, merchant_id = await _setup(
        client, db_session,
        customer_email="promo1c@test.com",
        seller_email="promo1s@test.com",
        price=100_000,
    )
    promo = await _create_promo(
        db_session, merchant_id, code="SAVE10", value=10  # 10%
    )

    resp = await client.post(
        "/api/v1/customer/orders",
        json=_payload(product_id, qty=2, code="SAVE10"),
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 201, resp.text
    # subtotal = 200_000, 10% = 20_000 discount → total 180_000
    assert float(resp.json()["total_amount"]) == pytest.approx(180_000)

    refreshed = await db_session.execute(
        select(Promotion).where(Promotion.id == promo.id)
    )
    assert refreshed.scalars().one().usage_count == 1


@pytest.mark.asyncio
async def test_fixed_promo_caps_at_subtotal(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    token, product_id, merchant_id = await _setup(
        client, db_session,
        customer_email="promo2c@test.com",
        seller_email="promo2s@test.com",
        price=50_000,
    )
    # fixed discount larger than subtotal → discount caps at subtotal
    await _create_promo(
        db_session, merchant_id,
        code="BIG500K", promo_type=PromotionType.fixed, value=500_000,
    )

    resp = await client.post(
        "/api/v1/customer/orders",
        json=_payload(product_id, qty=1, code="BIG500K"),
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 201, resp.text
    # subtotal 50_000, discount min(500_000, 50_000)=50_000 → total 0
    assert float(resp.json()["total_amount"]) == pytest.approx(0)


@pytest.mark.asyncio
async def test_lowercase_code_normalized(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    token, product_id, merchant_id = await _setup(
        client, db_session,
        customer_email="promo3c@test.com",
        seller_email="promo3s@test.com",
    )
    await _create_promo(db_session, merchant_id, code="WELCOME", value=20)

    resp = await client.post(
        "/api/v1/customer/orders",
        json=_payload(product_id, qty=1, code="welcome"),
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 201, resp.text


@pytest.mark.asyncio
async def test_expired_promo_rejected(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    token, product_id, merchant_id = await _setup(
        client, db_session,
        customer_email="promo4c@test.com",
        seller_email="promo4s@test.com",
    )
    await _create_promo(
        db_session, merchant_id,
        code="EXPIRED",
        value=10,
        expires_at=datetime.now(UTC) - timedelta(days=1),
    )

    resp = await client.post(
        "/api/v1/customer/orders",
        json=_payload(product_id, qty=1, code="EXPIRED"),
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 400
    assert "hết hạn" in resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_max_usage_reached_rejected(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    token, product_id, merchant_id = await _setup(
        client, db_session,
        customer_email="promo5c@test.com",
        seller_email="promo5s@test.com",
    )
    promo = await _create_promo(
        db_session, merchant_id, code="ONESHOT", value=10, max_usage=1
    )
    promo.usage_count = 1
    await db_session.commit()

    resp = await client.post(
        "/api/v1/customer/orders",
        json=_payload(product_id, qty=1, code="ONESHOT"),
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 400
    assert "lượt" in resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_min_order_not_met_rejected(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    token, product_id, merchant_id = await _setup(
        client, db_session,
        customer_email="promo6c@test.com",
        seller_email="promo6s@test.com",
        price=50_000,
    )
    await _create_promo(
        db_session, merchant_id,
        code="MIN500",
        value=10,
        min_order=500_000,
    )

    resp = await client.post(
        "/api/v1/customer/orders",
        json=_payload(product_id, qty=1, code="MIN500"),
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 400
    assert "tối thiểu" in resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_wrong_merchant_code_rejected(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """Promo issued by merchant A must not apply to merchant B's order."""
    token_a, _product_a, merchant_a = await _setup(
        client, db_session,
        customer_email="promo7c@test.com",
        seller_email="promo7sa@test.com",
    )
    # second merchant with their own product, same customer
    await user_crud.create_user(
        db_session, "promo7sb@test.com", "pass1234", role=UserRole.seller
    )
    seller_b = await user_crud.get_by_email(db_session, "promo7sb@test.com")
    assert seller_b is not None
    cat_b = Category(name_vi="Khác", name_en="Other", slug="other-promo7")
    db_session.add(cat_b)
    await db_session.flush()
    merchant_b = Merchant(
        user_id=seller_b.id,
        shop_name="Shop B",
        slug="shop-b-promo7",
        status=MerchantStatus.active,
        tier=MerchantTier.bronze,
        region="DN",
    )
    db_session.add(merchant_b)
    await db_session.flush()
    product_b = Product(
        merchant_id=merchant_b.id,
        category_id=cat_b.id,
        name_vi="Sản phẩm B",
        name_en="Product B",
        slug="product-b-promo7",
        price=100_000,
        stock=10,
        status=ProductStatus.active,
    )
    db_session.add(product_b)
    await db_session.commit()

    # Promo belongs to merchant A
    await _create_promo(db_session, merchant_a, code="MERCH_A_ONLY", value=10)

    # Ordering from merchant B with merchant A's code must fail
    resp = await client.post(
        "/api/v1/customer/orders",
        json=_payload(product_b.id, qty=1, code="MERCH_A_ONLY"),
        headers={"Authorization": f"Bearer {token_a}"},
    )
    assert resp.status_code == 400
    assert "không tồn tại" in resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_inactive_promo_rejected(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    token, product_id, merchant_id = await _setup(
        client, db_session,
        customer_email="promo8c@test.com",
        seller_email="promo8s@test.com",
    )
    await _create_promo(
        db_session, merchant_id, code="OFF", value=10, is_active=False
    )

    resp = await client.post(
        "/api/v1/customer/orders",
        json=_payload(product_id, qty=1, code="OFF"),
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_order_without_promo_unchanged(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """Sanity: no promotion_code → no discount, no usage bump anywhere."""
    token, product_id, _merchant = await _setup(
        client, db_session,
        customer_email="promo9c@test.com",
        seller_email="promo9s@test.com",
        price=100_000,
    )
    resp = await client.post(
        "/api/v1/customer/orders",
        json=_payload(product_id, qty=2),  # no code
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 201, resp.text
    assert float(resp.json()["total_amount"]) == pytest.approx(200_000)
