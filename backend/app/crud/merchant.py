from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.merchant import Merchant, MerchantStatus, MerchantTier
from app.schemas.merchant import MerchantCreate, MerchantUpdate


async def get_by_id(db: AsyncSession, merchant_id: int) -> Merchant | None:
    result = await db.execute(
        select(Merchant)
        .where(Merchant.id == merchant_id)
        .options(selectinload(Merchant.user))
    )
    return result.scalars().first()


async def get_by_user_id(db: AsyncSession, user_id: int) -> Merchant | None:
    result = await db.execute(select(Merchant).where(Merchant.user_id == user_id))
    return result.scalars().first()


async def get_by_slug(db: AsyncSession, slug: str) -> Merchant | None:
    result = await db.execute(select(Merchant).where(Merchant.slug == slug))
    return result.scalars().first()


async def get_all(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 50,
    status: MerchantStatus | None = None,
) -> list[Merchant]:
    query = select(Merchant)
    if status is not None:
        query = query.where(Merchant.status == status)
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def count_all(db: AsyncSession, status: MerchantStatus | None = None) -> int:
    query = select(func.count()).select_from(Merchant)
    if status is not None:
        query = query.where(Merchant.status == status)
    result = await db.execute(query)
    return result.scalar_one()


async def create(db: AsyncSession, user_id: int, data: MerchantCreate) -> Merchant:
    merchant = Merchant(user_id=user_id, **data.model_dump())
    db.add(merchant)
    await db.commit()
    await db.refresh(merchant)
    return merchant


async def update(db: AsyncSession, merchant: Merchant, data: MerchantUpdate) -> Merchant:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(merchant, field, value)
    await db.commit()
    await db.refresh(merchant)
    return merchant


async def update_status(
    db: AsyncSession, merchant: Merchant, status: MerchantStatus
) -> Merchant:
    merchant.status = status
    await db.commit()
    await db.refresh(merchant)
    return merchant


async def update_tier(db: AsyncSession, merchant: Merchant, tier: MerchantTier) -> Merchant:
    merchant.tier = tier
    await db.commit()
    await db.refresh(merchant)
    return merchant
