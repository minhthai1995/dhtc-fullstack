from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.shipping import ShippingZone
from app.schemas.shipping import ShippingZoneCreate, ShippingZoneUpdate


async def get_by_merchant(db: AsyncSession, merchant_id: int) -> list[ShippingZone]:
    result = await db.execute(
        select(ShippingZone).where(ShippingZone.merchant_id == merchant_id)
    )
    return list(result.scalars().all())


async def get_by_id(db: AsyncSession, zone_id: int) -> ShippingZone | None:
    result = await db.execute(select(ShippingZone).where(ShippingZone.id == zone_id))
    return result.scalars().first()


async def create(
    db: AsyncSession, merchant_id: int, data: ShippingZoneCreate
) -> ShippingZone:
    zone = ShippingZone(merchant_id=merchant_id, **data.model_dump())
    db.add(zone)
    await db.commit()
    await db.refresh(zone)
    return zone


async def update(
    db: AsyncSession, zone: ShippingZone, data: ShippingZoneUpdate
) -> ShippingZone:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(zone, field, value)
    await db.commit()
    await db.refresh(zone)
    return zone


async def delete(db: AsyncSession, zone: ShippingZone) -> None:
    await db.delete(zone)
    await db.commit()
