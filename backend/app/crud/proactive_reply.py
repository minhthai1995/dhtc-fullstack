"""CRUD for proactive reply (P5E) — audit, rate limit, per-PSID cooldown,
template config toggle.
"""
from __future__ import annotations

from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.proactive_reply import (
    ProactiveIntent,
    ProactiveReply,
    ProactiveStatus,
    ProactiveTemplateConfig,
)


def _now_naive() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


async def get_by_post_id(
    db: AsyncSession, post_id: str
) -> ProactiveReply | None:
    result = await db.execute(
        select(ProactiveReply).where(ProactiveReply.post_id == post_id)
    )
    return result.scalars().first()


async def count_replies_in_window(
    db: AsyncSession, *, page_id: str, window: timedelta
) -> int:
    """Count audit rows (sent/dry_run/queued) for rate-limit decisions."""
    cutoff = _now_naive() - window
    result = await db.execute(
        select(func.count(ProactiveReply.id)).where(
            ProactiveReply.page_id == page_id,
            ProactiveReply.created_at >= cutoff,
            ProactiveReply.status.in_(
                (
                    ProactiveStatus.sent,
                    ProactiveStatus.dry_run,
                    ProactiveStatus.queued,
                )
            ),
        )
    )
    return int(result.scalar() or 0)


async def count_replies_today(db: AsyncSession, *, page_id: str) -> int:
    return await count_replies_in_window(
        db, page_id=page_id, window=timedelta(hours=24)
    )


async def psid_replied_within(
    db: AsyncSession, *, psid: str, window: timedelta
) -> bool:
    """Cooldown check: have we replied to this PSID recently?"""
    cutoff = _now_naive() - window
    result = await db.execute(
        select(ProactiveReply.id).where(
            ProactiveReply.post_author_psid == psid,
            ProactiveReply.created_at >= cutoff,
            ProactiveReply.status.in_(
                (ProactiveStatus.sent, ProactiveStatus.dry_run)
            ),
        ).limit(1)
    )
    return result.scalar() is not None


async def create_audit(
    db: AsyncSession,
    *,
    page_id: str,
    post_id: str,
    post_url: str | None,
    post_text: str | None,
    post_author_psid: str | None,
    has_checkin: bool,
    place_name: str | None,
    intent: ProactiveIntent,
    template_used: str | None,
    reply_text: str,
    reply_comment_id: str | None,
    status: ProactiveStatus,
    error_message: str | None = None,
) -> ProactiveReply:
    audit = ProactiveReply(
        page_id=page_id,
        post_id=post_id,
        post_url=post_url,
        post_text=post_text,
        post_author_psid=post_author_psid,
        has_checkin=has_checkin,
        place_name=place_name,
        intent=intent,
        template_used=template_used,
        reply_text=reply_text,
        reply_comment_id=reply_comment_id,
        status=status,
        error_message=error_message,
    )
    db.add(audit)
    await db.commit()
    await db.refresh(audit)
    return audit


async def get_template_config(
    db: AsyncSession, intent: ProactiveIntent
) -> ProactiveTemplateConfig | None:
    result = await db.execute(
        select(ProactiveTemplateConfig).where(
            ProactiveTemplateConfig.intent == intent
        )
    )
    return result.scalars().first()


async def list_template_configs(
    db: AsyncSession,
) -> list[ProactiveTemplateConfig]:
    result = await db.execute(
        select(ProactiveTemplateConfig).order_by(
            ProactiveTemplateConfig.intent
        )
    )
    return list(result.scalars().all())


async def update_template_config(
    db: AsyncSession,
    *,
    intent: ProactiveIntent,
    is_enabled: bool,
    user_id: int | None,
) -> ProactiveTemplateConfig:
    cfg = await get_template_config(db, intent)
    if cfg is None:
        cfg = ProactiveTemplateConfig(
            intent=intent, is_enabled=is_enabled, updated_by=user_id
        )
        db.add(cfg)
    else:
        cfg.is_enabled = is_enabled
        cfg.updated_by = user_id
    await db.commit()
    await db.refresh(cfg)
    return cfg


async def list_audits(
    db: AsyncSession,
    *,
    intent: ProactiveIntent | None = None,
    status: ProactiveStatus | None = None,
    since: datetime | None = None,
    limit: int = 50,
) -> list[ProactiveReply]:
    stmt = select(ProactiveReply).order_by(ProactiveReply.created_at.desc())
    if intent is not None:
        stmt = stmt.where(ProactiveReply.intent == intent)
    if status is not None:
        stmt = stmt.where(ProactiveReply.status == status)
    if since is not None:
        stmt = stmt.where(ProactiveReply.created_at >= since)
    stmt = stmt.limit(limit)
    result = await db.execute(stmt)
    return list(result.scalars().all())
