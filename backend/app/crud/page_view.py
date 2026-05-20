from __future__ import annotations

from datetime import date, datetime, time

from sqlalchemy import distinct, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.page_view import PageView


async def create_page_view(
    db: AsyncSession,
    *,
    visitor_id: str,
    session_id: str,
    path: str,
    referrer: str | None = None,
    user_id: int | None = None,
    user_agent: str | None = None,
    country_code: str | None = None,
) -> PageView:
    pv = PageView(
        visitor_id=visitor_id,
        session_id=session_id,
        user_id=user_id,
        path=path,
        referrer=referrer,
        user_agent=user_agent,
        country_code=country_code,
    )
    db.add(pv)
    await db.flush()
    return pv


def _day_range(day: date) -> tuple[datetime, datetime]:
    start = datetime.combine(day, time.min)
    end = datetime.combine(day, time.max)
    return start, end


async def get_for_date(db: AsyncSession, day: date) -> list[PageView]:
    start, end = _day_range(day)
    result = await db.execute(
        select(PageView)
        .where(PageView.viewed_at >= start, PageView.viewed_at <= end)
        .order_by(PageView.viewed_at.asc())
    )
    return list(result.scalars().all())


async def count_distinct_sessions(db: AsyncSession, day: date) -> int:
    start, end = _day_range(day)
    result = await db.execute(
        select(func.count(distinct(PageView.session_id))).where(
            PageView.viewed_at >= start, PageView.viewed_at <= end
        )
    )
    return result.scalar_one() or 0
