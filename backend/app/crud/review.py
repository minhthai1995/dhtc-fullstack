from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.product import Product
from app.models.review import Review
from app.schemas.review import ReviewCreate


async def get_by_product(
    db: AsyncSession, product_id: int, limit: int = 20
) -> list[Review]:
    result = await db.execute(
        select(Review).where(Review.product_id == product_id).limit(limit)
    )
    return list(result.scalars().all())


async def get_by_customer_product(
    db: AsyncSession, customer_id: int, product_id: int
) -> Review | None:
    result = await db.execute(
        select(Review).where(Review.customer_id == customer_id, Review.product_id == product_id)
    )
    return result.scalars().first()


async def get_by_id(db: AsyncSession, review_id: int) -> Review | None:
    return await db.get(Review, review_id)


async def update(db: AsyncSession, review: Review, rating: int, comment: str) -> Review:
    review.rating = rating
    review.comment = comment
    # Recalculate product avg rating
    avg_result = await db.execute(
        select(func.avg(Review.rating)).where(Review.product_id == review.product_id)
    )
    avg = avg_result.scalar_one_or_none()
    if avg is not None:
        prod_result = await db.execute(
            select(Product).where(Product.id == review.product_id).with_for_update()
        )
        product = prod_result.scalar_one_or_none()
        if product:
            product.rating = round(float(avg), 2)
    await db.commit()
    await db.refresh(review)
    return review


async def delete(db: AsyncSession, review: Review) -> None:
    product_id = review.product_id
    await db.delete(review)
    # Recalculate product avg rating after deletion
    avg_result = await db.execute(
        select(func.avg(Review.rating)).where(Review.product_id == product_id)
    )
    avg = avg_result.scalar_one_or_none()
    prod_result = await db.execute(
        select(Product).where(Product.id == product_id).with_for_update()
    )
    product = prod_result.scalar_one_or_none()
    if product:
        product.rating = round(float(avg), 2) if avg is not None else None
    await db.commit()


async def create(
    db: AsyncSession, customer_id: int, product_id: int, data: ReviewCreate
) -> Review:
    review = Review(customer_id=customer_id, product_id=product_id, **data.model_dump())
    db.add(review)
    try:
        await db.flush()
    except IntegrityError as exc:
        await db.rollback()
        raise ValueError("Bạn đã đánh giá sản phẩm này rồi") from exc

    # Recalculate product avg rating
    avg_result = await db.execute(
        select(func.avg(Review.rating)).where(Review.product_id == product_id)
    )
    avg = avg_result.scalar_one_or_none()
    if avg is not None:
        prod_result = await db.execute(
            select(Product).where(Product.id == product_id).with_for_update()
        )
        product = prod_result.scalar_one_or_none()
        if product:
            product.rating = round(float(avg), 2)

    await db.commit()
    await db.refresh(review)
    return review
