from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.wishlist import WishlistItem


async def get_by_user(db: AsyncSession, user_id: int) -> list[WishlistItem]:
    result = await db.execute(
        select(WishlistItem)
        .where(WishlistItem.user_id == user_id)
        .options(selectinload(WishlistItem.product))
        .order_by(WishlistItem.created_at.desc())
    )
    return list(result.scalars().all())


async def get_item(
    db: AsyncSession, user_id: int, product_id: int
) -> WishlistItem | None:
    result = await db.execute(
        select(WishlistItem)
        .where(
            WishlistItem.user_id == user_id,
            WishlistItem.product_id == product_id,
        )
        .options(selectinload(WishlistItem.product))
    )
    return result.scalars().first()


async def add(db: AsyncSession, user_id: int, product_id: int) -> WishlistItem:
    item = WishlistItem(user_id=user_id, product_id=product_id)
    db.add(item)
    await db.commit()
    result = await db.execute(
        select(WishlistItem)
        .where(
            WishlistItem.user_id == user_id,
            WishlistItem.product_id == product_id,
        )
        .options(selectinload(WishlistItem.product))
    )
    return result.scalars().one()


async def remove(db: AsyncSession, item: WishlistItem) -> None:
    await db.delete(item)
    await db.commit()
