"""P5E orchestrator: process Facebook feed events and post proactive comments.

Pipeline per incoming feed event:
  1. Filter — verb=add + item ∈ {status, post, photo} only.
  2. Dedup — if proactive_replies has post_id, skip.
  3. Master kill switch — settings.PROACTIVE_REPLY_ENABLED.
  4. Page rate limit — sent+dry_run+queued in last hour.
  5. Per-PSID cooldown — last reply to this poster within 24h.
  6. Classify intent (post_intent.classify_post_intent).
  7. Intent enabled — proactive_template_config row toggle.
  8. Render template (reply_templates.pick_template).
  9. Either DRY-RUN (audit only) or call page_comment_service.post_comment.
 10. Audit row recorded with final status.

All branches end with create_audit(...) so the admin UI shows complete
history including skipped/error events.
"""
from __future__ import annotations

import logging
from datetime import timedelta
from typing import Any

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.crud import proactive_reply as proactive_crud
from app.models.proactive_reply import (
    ProactiveIntent,
    ProactiveReply,
    ProactiveStatus,
)
from app.services.page_comment_service import PageCommentError, post_comment
from app.services.post_intent import classify_post_intent
from app.services.reply_templates import pick_template

logger = logging.getLogger(__name__)

# Feed item types worth replying to. Webhook also fires for comments/likes
# on our own page — we don't touch those here.
SUPPORTED_ITEMS: frozenset[str] = frozenset({"status", "post", "photo"})


def _extract_post_url(value: dict[str, Any], post_id: str) -> str | None:
    permalink = value.get("permalink_url") or value.get("link")
    if permalink:
        return permalink
    # Fallback construction. {page_id}_{post_id} format is what Graph uses.
    if "_" in post_id:
        page_id, raw_post_id = post_id.split("_", 1)
        return f"https://www.facebook.com/{page_id}/posts/{raw_post_id}"
    return None


def _extract_place_name(value: dict[str, Any]) -> str | None:
    place = value.get("place") or {}
    if isinstance(place, dict):
        return place.get("name")
    return None


def _has_checkin(value: dict[str, Any]) -> bool:
    return bool(value.get("place")) or value.get("item") == "checkin"


async def handle_feed_event(
    event: dict[str, Any],
    page_id: str,
    db: AsyncSession,
) -> ProactiveReply | None:
    """Process one entry["changes"] item where field == 'feed'.

    Returns the audit row created (or None when event is filtered out
    before audit).
    """
    value = event.get("value") or {}
    verb = value.get("verb")
    item = value.get("item")
    post_id = value.get("post_id") or value.get("id")

    if verb != "add" or item not in SUPPORTED_ITEMS or not post_id:
        return None

    # 2. Dedup — UNIQUE post_id index catches races, but cheaper to check.
    existing = await proactive_crud.get_by_post_id(db, post_id)
    if existing is not None:
        return None

    post_text = value.get("message")
    post_author_psid = value.get("from", {}).get("id") if isinstance(
        value.get("from"), dict
    ) else None
    has_checkin = _has_checkin(value)
    place_name = _extract_place_name(value)
    post_url = _extract_post_url(value, post_id)

    intent_str = classify_post_intent(post_text, has_checkin)
    intent = ProactiveIntent(intent_str)
    template_used = f"{intent_str}_v1"
    reply_text = pick_template(intent_str, post_id=post_id, place=place_name)

    # 3. Master kill switch.
    if not settings.PROACTIVE_REPLY_ENABLED:
        return await proactive_crud.create_audit(
            db,
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
            reply_comment_id=None,
            status=ProactiveStatus.skipped_disabled,
        )

    # 4. Page rate limit (hour window).
    hour_count = await proactive_crud.count_replies_in_window(
        db, page_id=page_id, window=timedelta(hours=1)
    )
    if hour_count >= settings.PROACTIVE_REPLY_RATE_LIMIT_PER_HOUR:
        return await proactive_crud.create_audit(
            db,
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
            reply_comment_id=None,
            status=ProactiveStatus.skipped_rate_limit,
        )

    # 5. Per-PSID cooldown.
    if post_author_psid:
        cooldown = timedelta(
            hours=settings.PROACTIVE_REPLY_PER_PSID_COOLDOWN_HOURS
        )
        if await proactive_crud.psid_replied_within(
            db, psid=post_author_psid, window=cooldown
        ):
            return await proactive_crud.create_audit(
                db,
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
                reply_comment_id=None,
                status=ProactiveStatus.skipped_cooldown,
            )

    # 7. Per-intent toggle.
    cfg = await proactive_crud.get_template_config(db, intent)
    if cfg is None or not cfg.is_enabled:
        return await proactive_crud.create_audit(
            db,
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
            reply_comment_id=None,
            status=ProactiveStatus.skipped_disabled,
        )

    # 9a. DRY-RUN — audit only, no Graph call.
    if settings.PROACTIVE_REPLY_DRY_RUN:
        return await proactive_crud.create_audit(
            db,
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
            reply_comment_id=None,
            status=ProactiveStatus.dry_run,
        )

    # 9b. Real send.
    try:
        comment_id = await post_comment(
            post_id=post_id,
            message=reply_text,
            page_token=settings.FACEBOOK_PAGE_ACCESS_TOKEN,
        )
    except (PageCommentError, httpx.HTTPError) as exc:
        logger.warning("proactive reply send failed post_id=%s: %s", post_id, exc)
        return await proactive_crud.create_audit(
            db,
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
            reply_comment_id=None,
            status=ProactiveStatus.error,
            error_message=str(exc),
        )

    return await proactive_crud.create_audit(
        db,
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
        reply_comment_id=comment_id,
        status=ProactiveStatus.sent,
    )
