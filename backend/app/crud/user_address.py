from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user_address import UserAddress
from app.schemas.user_address import AddressCreate


async def get_by_user(db: AsyncSession, user_id: int) -> list[UserAddress]:
    result = await db.execute(
        select(UserAddress)
        .where(UserAddress.user_id == user_id)
        .order_by(UserAddress.is_default.desc(), UserAddress.created_at)
    )
    return list(result.scalars().all())


async def get_by_id(db: AsyncSession, address_id: int) -> UserAddress | None:
    return await db.get(UserAddress, address_id)


async def create(db: AsyncSession, user_id: int, data: AddressCreate) -> UserAddress:
    if data.is_default:
        existing = await get_by_user(db, user_id)
        for addr in existing:
            if addr.is_default:
                addr.is_default = False
    addr = UserAddress(user_id=user_id, **data.model_dump())
    db.add(addr)
    await db.commit()
    await db.refresh(addr)
    return addr


async def delete(db: AsyncSession, addr: UserAddress) -> None:
    await db.delete(addr)
    await db.commit()


async def set_default(db: AsyncSession, user_id: int, addr: UserAddress) -> UserAddress:
    existing = await get_by_user(db, user_id)
    for a in existing:
        a.is_default = False
    addr.is_default = True
    await db.commit()
    await db.refresh(addr)
    return addr
