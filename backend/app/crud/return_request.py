from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.return_request import ReturnRequest, ReturnStatus


async def create(
    db: AsyncSession, order_id: int, customer_id: int, reason: str
) -> ReturnRequest:
    rr = ReturnRequest(order_id=order_id, customer_id=customer_id, reason=reason)
    db.add(rr)
    await db.commit()
    await db.refresh(rr)
    return rr


async def get_by_id(db: AsyncSession, return_id: int) -> ReturnRequest | None:
    return await db.get(ReturnRequest, return_id)


async def get_by_order(db: AsyncSession, order_id: int) -> ReturnRequest | None:
    result = await db.execute(
        select(ReturnRequest).where(ReturnRequest.order_id == order_id)
    )
    return result.scalars().first()


async def get_for_customer(db: AsyncSession, customer_id: int) -> list[ReturnRequest]:
    result = await db.execute(
        select(ReturnRequest)
        .where(ReturnRequest.customer_id == customer_id)
        .order_by(ReturnRequest.created_at.desc())
    )
    return list(result.scalars().all())


async def get_for_merchant(
    db: AsyncSession, merchant_id: int
) -> list[ReturnRequest]:
    from app.models.order import Order
    result = await db.execute(
        select(ReturnRequest)
        .join(Order, Order.id == ReturnRequest.order_id)
        .where(Order.merchant_id == merchant_id)
        .order_by(ReturnRequest.created_at.desc())
    )
    return list(result.scalars().all())


async def get_all(db: AsyncSession, limit: int = 200) -> list[ReturnRequest]:
    result = await db.execute(
        select(ReturnRequest)
        .order_by(ReturnRequest.created_at.desc())
        .limit(limit)
    )
    return list(result.scalars().all())


async def approve(
    db: AsyncSession, rr: ReturnRequest, note: str | None = None
) -> ReturnRequest:
    rr.status = ReturnStatus.approved
    if note:
        rr.seller_note = note
    await db.commit()
    await db.refresh(rr)
    return rr


async def reject(
    db: AsyncSession, rr: ReturnRequest, note: str | None = None
) -> ReturnRequest:
    rr.status = ReturnStatus.rejected
    if note:
        rr.seller_note = note
    await db.commit()
    await db.refresh(rr)
    return rr
