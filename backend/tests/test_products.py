"""Integration tests for the public product endpoints."""
from __future__ import annotations

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.category import Category
from app.models.merchant import Merchant, MerchantStatus, MerchantTier
from app.models.product import Product, ProductStatus
from app.models.user import User, UserRole

# ── Shared helpers ────────────────────────────────────────────────────────────

async def _make_category(db: AsyncSession, slug: str, name_vi: str = "Danh mục") -> Category:
    cat = Category(name_vi=name_vi, name_en="Category", slug=slug)
    db.add(cat)
    await db.flush()
    return cat


async def _make_seller_and_merchant(db: AsyncSession, email: str, shop_slug: str) -> Merchant:
    seller = User(email=email, hashed_password="x", role=UserRole.seller)
    db.add(seller)
    await db.flush()
    merchant = Merchant(
        user_id=seller.id,
        shop_name="Test Shop",
        slug=shop_slug,
        status=MerchantStatus.active,
        tier=MerchantTier.bronze,
        region="HCM",
    )
    db.add(merchant)
    await db.flush()
    return merchant


async def _make_product(
    db: AsyncSession,
    merchant: Merchant,
    category: Category,
    slug: str,
    price: float = 100_000,
    stock: int = 50,
    status: ProductStatus = ProductStatus.active,
    name_vi: str = "Sản phẩm test",
) -> Product:
    p = Product(
        merchant_id=merchant.id,
        category_id=category.id,
        name_vi=name_vi,
        name_en="Test product",
        slug=slug,
        price=price,
        stock=stock,
        status=status,
    )
    db.add(p)
    await db.flush()
    return p


# ── Tests ─────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_list_products_empty(client: AsyncClient) -> None:
    response = await client.get("/api/v1/customer/products")
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_list_products_with_data(client: AsyncClient, db_session: AsyncSession) -> None:
    cat = await _make_category(db_session, "ca-phe")
    merchant = await _make_seller_and_merchant(db_session, "s1@t.com", "shop-1")
    await _make_product(db_session, merchant, cat, "sp-1", name_vi="Cà phê A")
    await _make_product(db_session, merchant, cat, "sp-2", name_vi="Cà phê B")
    await db_session.commit()

    response = await client.get("/api/v1/customer/products")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    slugs = {p["slug"] for p in data}
    assert {"sp-1", "sp-2"} == slugs


@pytest.mark.asyncio
async def test_list_products_filter_category(client: AsyncClient, db_session: AsyncSession) -> None:
    cat1 = await _make_category(db_session, "ca-phe-filter")
    cat2 = await _make_category(db_session, "tra-filter")
    merchant = await _make_seller_and_merchant(db_session, "s2@t.com", "shop-2")
    await _make_product(db_session, merchant, cat1, "cf-product", name_vi="Cà phê C")
    await _make_product(db_session, merchant, cat2, "tea-product", name_vi="Trà D")
    await db_session.commit()

    response = await client.get("/api/v1/customer/products", params={"category_id": cat1.id})
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["slug"] == "cf-product"


@pytest.mark.asyncio
async def test_list_products_sort_price_asc(client: AsyncClient, db_session: AsyncSession) -> None:
    cat = await _make_category(db_session, "sort-cat")
    merchant = await _make_seller_and_merchant(db_session, "s3@t.com", "shop-3")
    await _make_product(db_session, merchant, cat, "p-300", price=300_000, name_vi="Đắt")
    await _make_product(db_session, merchant, cat, "p-100", price=100_000, name_vi="Rẻ")
    await _make_product(db_session, merchant, cat, "p-200", price=200_000, name_vi="Trung")
    await db_session.commit()

    response = await client.get("/api/v1/customer/products", params={"sort_by": "price_asc"})
    assert response.status_code == 200
    prices = [p["price"] for p in response.json()]
    assert prices == sorted(prices)


@pytest.mark.asyncio
async def test_get_product_not_found(client: AsyncClient) -> None:
    response = await client.get("/api/v1/customer/products/999")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_product_found(client: AsyncClient, db_session: AsyncSession) -> None:
    cat = await _make_category(db_session, "get-cat")
    merchant = await _make_seller_and_merchant(db_session, "s4@t.com", "shop-4")
    product = await _make_product(db_session, merchant, cat, "get-product", name_vi="Tìm thấy")
    await db_session.commit()

    response = await client.get(f"/api/v1/customer/products/{product.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == product.id
    assert data["slug"] == "get-product"


@pytest.mark.asyncio
async def test_related_products(client: AsyncClient, db_session: AsyncSession) -> None:
    cat = await _make_category(db_session, "related-cat")
    merchant = await _make_seller_and_merchant(db_session, "s5@t.com", "shop-5")
    p1 = await _make_product(db_session, merchant, cat, "related-1", name_vi="Liên quan A")
    p2 = await _make_product(db_session, merchant, cat, "related-2", name_vi="Liên quan B")
    await db_session.commit()

    response = await client.get(f"/api/v1/customer/products/{p1.id}/related")
    assert response.status_code == 200
    data = response.json()
    ids = [p["id"] for p in data]
    assert p2.id in ids
    assert p1.id not in ids
