"""Tests for P5E proactive reply orchestrator (handle_feed_event).

Covers every pipeline branch so the admin audit trail is provably complete:
filter, dedup, master kill, rate limit, cooldown, intent toggle, dry-run,
real send success, and both error paths (PageCommentError + httpx.HTTPError).
"""
from __future__ import annotations

from typing import Any

import httpx
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.crud import proactive_reply as proactive_crud
from app.models.proactive_reply import (
    ProactiveIntent,
    ProactiveStatus,
    ProactiveTemplateConfig,
)
from app.services import proactive_reply_service as svc
from app.services.page_comment_service import PageCommentError

PAGE_ID = "100000000000001"


# ── helpers ──────────────────────────────────────────────────────────────────

def _checkin_event(post_id: str = "p_1001", psid: str = "psid_alice") -> dict:
    """Build a Graph feed webhook payload representing a check-in post."""
    return {
        "value": {
            "verb": "add",
            "item": "status",
            "post_id": post_id,
            "message": "Ăn quá ngon!",
            "from": {"id": psid, "name": "Alice"},
            "place": {"name": "DHTC Bạch Đằng"},
            "permalink_url": f"https://www.facebook.com/{PAGE_ID}/posts/{post_id}",
        }
    }


async def _enable_intent(db: AsyncSession, intent: ProactiveIntent) -> None:
    db.add(ProactiveTemplateConfig(intent=intent, is_enabled=True))
    await db.commit()


@pytest.fixture
def reset_settings(monkeypatch: pytest.MonkeyPatch):
    """Default to enabled + non-dry-run + generous limits unless test overrides."""
    monkeypatch.setattr(settings, "PROACTIVE_REPLY_ENABLED", True)
    monkeypatch.setattr(settings, "PROACTIVE_REPLY_DRY_RUN", False)
    monkeypatch.setattr(settings, "PROACTIVE_REPLY_RATE_LIMIT_PER_HOUR", 30)
    monkeypatch.setattr(settings, "PROACTIVE_REPLY_PER_PSID_COOLDOWN_HOURS", 24)


@pytest.fixture
def patch_post_comment(monkeypatch: pytest.MonkeyPatch):
    """Replace the Graph comment call. Returns a controller to set its behavior."""
    from types import SimpleNamespace

    state: dict[str, Any] = {"result": "fb_comment_999", "raise_exc": None}
    calls: list[dict[str, Any]] = []

    async def fake_post_comment(*, post_id: str, message: str, page_token: str) -> str:
        calls.append({"post_id": post_id, "message": message, "token_len": len(page_token)})
        if state["raise_exc"] is not None:
            raise state["raise_exc"]
        return state["result"]

    monkeypatch.setattr(svc, "post_comment", fake_post_comment)

    def returns(comment_id: str) -> None:
        state["result"] = comment_id
        state["raise_exc"] = None

    def raises(exc: Exception) -> None:
        state["raise_exc"] = exc

    return SimpleNamespace(returns=returns, raises=raises, calls=calls)


# ── tests ────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_filter_drops_non_add_verb(db_session: AsyncSession, reset_settings) -> None:
    event = _checkin_event()
    event["value"]["verb"] = "remove"

    result = await svc.handle_feed_event(event, PAGE_ID, db_session)

    assert result is None  # no audit row on filter rejection


@pytest.mark.asyncio
async def test_filter_drops_unsupported_item(db_session: AsyncSession, reset_settings) -> None:
    event = _checkin_event()
    event["value"]["item"] = "comment"  # not in SUPPORTED_ITEMS

    result = await svc.handle_feed_event(event, PAGE_ID, db_session)

    assert result is None


@pytest.mark.asyncio
async def test_dedup_skips_existing_post(
    db_session: AsyncSession, reset_settings, patch_post_comment
) -> None:
    await _enable_intent(db_session, ProactiveIntent.checkin)
    event = _checkin_event(post_id="p_dup")

    first = await svc.handle_feed_event(event, PAGE_ID, db_session)
    second = await svc.handle_feed_event(event, PAGE_ID, db_session)

    assert first is not None
    assert first.status == ProactiveStatus.sent
    assert second is None  # dedup path returns None without re-auditing


@pytest.mark.asyncio
async def test_master_kill_switch(
    db_session: AsyncSession, reset_settings, monkeypatch, patch_post_comment
) -> None:
    monkeypatch.setattr(settings, "PROACTIVE_REPLY_ENABLED", False)
    await _enable_intent(db_session, ProactiveIntent.checkin)

    audit = await svc.handle_feed_event(_checkin_event(), PAGE_ID, db_session)

    assert audit is not None
    assert audit.status == ProactiveStatus.skipped_disabled
    assert audit.reply_comment_id is None
    assert patch_post_comment.calls == []  # Graph never called


@pytest.mark.asyncio
async def test_rate_limit_skip(
    db_session: AsyncSession, reset_settings, monkeypatch, patch_post_comment
) -> None:
    monkeypatch.setattr(settings, "PROACTIVE_REPLY_RATE_LIMIT_PER_HOUR", 1)
    await _enable_intent(db_session, ProactiveIntent.checkin)

    first = await svc.handle_feed_event(_checkin_event("p_a", "psid_x"), PAGE_ID, db_session)
    second = await svc.handle_feed_event(_checkin_event("p_b", "psid_y"), PAGE_ID, db_session)

    assert first.status == ProactiveStatus.sent
    assert second.status == ProactiveStatus.skipped_rate_limit


@pytest.mark.asyncio
async def test_per_psid_cooldown(
    db_session: AsyncSession, reset_settings, patch_post_comment
) -> None:
    await _enable_intent(db_session, ProactiveIntent.checkin)

    first = await svc.handle_feed_event(_checkin_event("p_1", "psid_repeat"), PAGE_ID, db_session)
    second = await svc.handle_feed_event(_checkin_event("p_2", "psid_repeat"), PAGE_ID, db_session)

    assert first.status == ProactiveStatus.sent
    assert second.status == ProactiveStatus.skipped_cooldown


@pytest.mark.asyncio
async def test_intent_disabled_no_config(
    db_session: AsyncSession, reset_settings, patch_post_comment
) -> None:
    audit = await svc.handle_feed_event(_checkin_event(), PAGE_ID, db_session)

    # No ProactiveTemplateConfig row → treated as disabled
    assert audit.status == ProactiveStatus.skipped_disabled
    assert patch_post_comment.calls == []


@pytest.mark.asyncio
async def test_intent_explicitly_disabled(
    db_session: AsyncSession, reset_settings, patch_post_comment
) -> None:
    db_session.add(
        ProactiveTemplateConfig(intent=ProactiveIntent.checkin, is_enabled=False)
    )
    await db_session.commit()

    audit = await svc.handle_feed_event(_checkin_event(), PAGE_ID, db_session)

    assert audit.status == ProactiveStatus.skipped_disabled
    assert patch_post_comment.calls == []


@pytest.mark.asyncio
async def test_dry_run_audits_without_sending(
    db_session: AsyncSession, reset_settings, monkeypatch, patch_post_comment
) -> None:
    monkeypatch.setattr(settings, "PROACTIVE_REPLY_DRY_RUN", True)
    await _enable_intent(db_session, ProactiveIntent.checkin)

    audit = await svc.handle_feed_event(_checkin_event(), PAGE_ID, db_session)

    assert audit.status == ProactiveStatus.dry_run
    assert audit.reply_comment_id is None
    assert audit.reply_text  # template rendered even in dry-run
    assert patch_post_comment.calls == []


@pytest.mark.asyncio
async def test_real_send_success(
    db_session: AsyncSession, reset_settings, patch_post_comment
) -> None:
    patch_post_comment.returns("fb_comment_42")
    await _enable_intent(db_session, ProactiveIntent.checkin)

    audit = await svc.handle_feed_event(_checkin_event(), PAGE_ID, db_session)

    assert audit.status == ProactiveStatus.sent
    assert audit.reply_comment_id == "fb_comment_42"
    assert audit.intent == ProactiveIntent.checkin
    assert audit.place_name == "DHTC Bạch Đằng"
    assert len(patch_post_comment.calls) == 1


@pytest.mark.asyncio
async def test_page_comment_error_records_audit(
    db_session: AsyncSession, reset_settings, patch_post_comment
) -> None:
    patch_post_comment.raises(
        PageCommentError("permission denied", http_status=403, error_code=10)
    )
    await _enable_intent(db_session, ProactiveIntent.checkin)

    audit = await svc.handle_feed_event(_checkin_event(), PAGE_ID, db_session)

    assert audit.status == ProactiveStatus.error
    assert audit.reply_comment_id is None
    assert "permission denied" in (audit.error_message or "")


@pytest.mark.asyncio
async def test_httpx_error_records_audit(
    db_session: AsyncSession, reset_settings, patch_post_comment
) -> None:
    patch_post_comment.raises(httpx.ConnectTimeout("timed out"))
    await _enable_intent(db_session, ProactiveIntent.checkin)

    audit = await svc.handle_feed_event(_checkin_event(), PAGE_ID, db_session)

    assert audit.status == ProactiveStatus.error
    assert "timed out" in (audit.error_message or "")


@pytest.mark.asyncio
async def test_classifier_picks_complaint_intent(
    db_session: AsyncSession, reset_settings, patch_post_comment
) -> None:
    await _enable_intent(db_session, ProactiveIntent.complaint)
    event = _checkin_event(post_id="p_complaint", psid="psid_unhappy")
    # Strip place so checkin flag isn't triggered; use complaint text
    event["value"].pop("place", None)
    event["value"]["item"] = "post"
    event["value"]["message"] = "Phục vụ kém, rất thất vọng"

    audit = await svc.handle_feed_event(event, PAGE_ID, db_session)

    assert audit.intent == ProactiveIntent.complaint
    assert audit.status == ProactiveStatus.sent


@pytest.mark.asyncio
async def test_missing_post_id_drops_event(
    db_session: AsyncSession, reset_settings
) -> None:
    event = _checkin_event()
    event["value"].pop("post_id")
    event["value"].pop("id", None)

    result = await svc.handle_feed_event(event, PAGE_ID, db_session)

    assert result is None


@pytest.mark.asyncio
async def test_audit_query_returns_all_branches(
    db_session: AsyncSession, reset_settings, monkeypatch, patch_post_comment
) -> None:
    """End-to-end: every non-filtered branch should leave a queryable audit row."""
    await _enable_intent(db_session, ProactiveIntent.checkin)

    # 1 dry-run
    monkeypatch.setattr(settings, "PROACTIVE_REPLY_DRY_RUN", True)
    await svc.handle_feed_event(_checkin_event("p_dry", "psid_dry"), PAGE_ID, db_session)
    monkeypatch.setattr(settings, "PROACTIVE_REPLY_DRY_RUN", False)

    # 1 sent
    await svc.handle_feed_event(_checkin_event("p_sent", "psid_sent"), PAGE_ID, db_session)

    # 1 cooldown (reuses psid_sent within 24h)
    await svc.handle_feed_event(_checkin_event("p_cd", "psid_sent"), PAGE_ID, db_session)

    rows = await proactive_crud.list_audits(db_session, limit=10)
    statuses = sorted(r.status.value for r in rows)
    assert statuses == ["dry_run", "sent", "skipped_cooldown"]
