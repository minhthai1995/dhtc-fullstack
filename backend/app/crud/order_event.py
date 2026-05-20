from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.order import OrderStatus
from app.models.order_event import OrderEvent


async def get_by_order(db: AsyncSession, order_id: int) -> list[OrderEvent]:
    result = await db.execute(
        select(OrderEvent)
        .where(OrderEvent.order_id == order_id)
        .order_by(OrderEvent.created_at)
    )
    return list(result.scalars().all())


async def create_event(
    db: AsyncSession,
    order_id: int,
    status: OrderStatus,
    note: str | None = None,
) -> OrderEvent:
    event = OrderEvent(order_id=order_id, status=status, note=note)
    db.add(event)
    await db.flush()
    return event
