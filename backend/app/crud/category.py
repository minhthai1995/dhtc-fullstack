from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.category import Category


async def get_all(db: AsyncSession) -> list[Category]:
    result = await db.execute(select(Category).order_by(Category.sort_order))
    return list(result.scalars().all())


async def get_by_id(db: AsyncSession, category_id: int) -> Category | None:
    result = await db.execute(select(Category).where(Category.id == category_id))
    return result.scalars().first()


async def get_by_slug(db: AsyncSession, slug: str) -> Category | None:
    result = await db.execute(select(Category).where(Category.slug == slug))
    return result.scalars().first()
