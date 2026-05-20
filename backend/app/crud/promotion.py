from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.promotion import Promotion
from app.schemas.promotion import PromotionCreate, PromotionUpdate


async def get_by_merchant(db: AsyncSession, merchant_id: int) -> list[Promotion]:
    result = await db.execute(
        select(Promotion).where(Promotion.merchant_id == merchant_id)
    )
    return list(result.scalars().all())


async def get_by_id(db: AsyncSession, promotion_id: int) -> Promotion | None:
    result = await db.execute(select(Promotion).where(Promotion.id == promotion_id))
    return result.scalars().first()


async def create(
    db: AsyncSession, merchant_id: int, data: PromotionCreate
) -> Promotion:
    promotion = Promotion(merchant_id=merchant_id, **data.model_dump())
    db.add(promotion)
    await db.commit()
    await db.refresh(promotion)
    return promotion


async def update(db: AsyncSession, promotion: Promotion, data: PromotionUpdate) -> Promotion:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(promotion, field, value)
    await db.commit()
    await db.refresh(promotion)
    return promotion


async def delete(db: AsyncSession, promotion: Promotion) -> None:
    await db.delete(promotion)
    await db.commit()
