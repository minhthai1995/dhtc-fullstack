from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.product import Product, ProductStatus
from app.schemas.product import ProductCreate, ProductUpdate


async def get_by_id(db: AsyncSession, product_id: int) -> Product | None:
    result = await db.execute(
        select(Product)
        .where(Product.id == product_id)
        .options(selectinload(Product.merchant), selectinload(Product.category))
    )
    return result.scalars().first()


async def get_by_merchant(
    db: AsyncSession,
    merchant_id: int,
    skip: int = 0,
    limit: int = 50,
    status: ProductStatus | None = None,
) -> list[Product]:
    query = select(Product).where(Product.merchant_id == merchant_id)
    if status is not None:
        query = query.where(Product.status == status)
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_all_public(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 50,
    category_id: int | None = None,
    merchant_id: int | None = None,
    search: str | None = None,
    sort_by: str | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    min_rating: float | None = None,
    certification: str | None = None,
    origin: str | None = None,
) -> list[Product]:
    import sqlalchemy as sa

    query = select(Product).where(Product.status == ProductStatus.active)
    if category_id is not None:
        query = query.where(Product.category_id == category_id)
    if merchant_id is not None:
        query = query.where(Product.merchant_id == merchant_id)
    if search:
        pattern = f"%{search}%"
        query = query.where(
            Product.name_vi.ilike(pattern) | Product.name_en.ilike(pattern)
        )
    # Price filters
    if min_price is not None:
        query = query.where(Product.price >= min_price)
    if max_price is not None:
        query = query.where(Product.price <= max_price)
    # Rating filter
    if min_rating is not None:
        query = query.where(Product.rating >= min_rating)
    # Certification filter (JSON array text search)
    if certification is not None:
        query = query.where(
            func.cast(Product.certifications, sa.Text).ilike(f"%{certification}%")
        )
    # Origin/region filter
    if origin is not None:
        query = query.where(Product.origin.ilike(f"%{origin}%"))
    # Sorting
    if sort_by == "price_asc":
        query = query.order_by(Product.price.asc())
    elif sort_by == "price_desc":
        query = query.order_by(Product.price.desc())
    elif sort_by == "rating":
        query = query.order_by(Product.rating.desc().nullslast())
    elif sort_by == "best_seller":
        query = query.order_by(Product.sold_count.desc())
    else:  # newest (default)
        query = query.order_by(Product.created_at.desc())
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def count_public(
    db: AsyncSession,
    category_id: int | None = None,
    merchant_id: int | None = None,
    search: str | None = None,
    min_rating: float | None = None,
    certification: str | None = None,
    origin: str | None = None,
) -> int:
    import sqlalchemy as sa

    query = select(func.count()).select_from(Product).where(
        Product.status == ProductStatus.active
    )
    if category_id is not None:
        query = query.where(Product.category_id == category_id)
    if merchant_id is not None:
        query = query.where(Product.merchant_id == merchant_id)
    if search:
        pattern = f"%{search}%"
        query = query.where(
            Product.name_vi.ilike(pattern) | Product.name_en.ilike(pattern)
        )
    if min_rating is not None:
        query = query.where(Product.rating >= min_rating)
    if certification is not None:
        query = query.where(
            func.cast(Product.certifications, sa.Text).ilike(f"%{certification}%")
        )
    if origin is not None:
        query = query.where(Product.origin.ilike(f"%{origin}%"))
    result = await db.execute(query)
    return result.scalar_one()


async def get_all(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 50,
    status: ProductStatus | None = None,
) -> list[Product]:
    query = select(Product)
    if status is not None:
        query = query.where(Product.status == status)
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def create(db: AsyncSession, merchant_id: int, data: ProductCreate) -> Product:
    product = Product(merchant_id=merchant_id, **data.model_dump())
    db.add(product)
    await db.commit()
    await db.refresh(product)
    return product


async def update(db: AsyncSession, product: Product, data: ProductUpdate) -> Product:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(product, field, value)
    await db.commit()
    await db.refresh(product)
    return product


async def delete(db: AsyncSession, product: Product) -> None:
    await db.delete(product)
    await db.commit()
