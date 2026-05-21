"""Graph API caller for Messenger profile enrichment (P5C).

All Page access tokens stay in app/core/config (sourced from .env). This
module never logs the token value — only opaque psids + http_status codes.
"""
from __future__ import annotations

import logging
import time
from datetime import UTC, datetime, timedelta
from typing import Any

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.crud import fb_profile as fb_profile_crud
from app.models.fb_graph_call_log import FBGraphCallLog
from app.models.fb_profile import FBProfile

logger = logging.getLogger(__name__)

GRAPH_TIMEOUT_SECONDS = 5.0
PROFILE_FIELDS = "id,name,picture.width(200),age_range,gender,locale"


async def _log_call(
    db: AsyncSession,
    *,
    psid: str,
    endpoint: str,
    http_status: int | None,
    error_code: int | None,
    error_subcode: int | None,
    duration_ms: int,
) -> None:
    db.add(
        FBGraphCallLog(
            psid=psid,
            endpoint=endpoint,
            http_status=http_status,
            error_code=error_code,
            error_subcode=error_subcode,
            duration_ms=duration_ms,
        )
    )
    await db.commit()


def _is_cache_fresh(profile: FBProfile | None) -> bool:
    if profile is None or profile.messenger_fetched_at is None:
        return False
    if profile.messenger_status != "active":
        # opted_out / error rows: respect the same TTL so we don't hammer Graph.
        pass
    age = datetime.now(UTC).replace(tzinfo=None) - profile.messenger_fetched_at
    return age < timedelta(days=settings.MESSENGER_PROFILE_CACHE_DAYS)


def _parse_profile(data: dict[str, Any]) -> dict[str, Any]:
    """Translate Graph payload → upsert kwargs."""
    age_range = data.get("age_range") or {}
    picture = (data.get("picture") or {}).get("data") or {}
    return {
        "messenger_name": data.get("name"),
        "messenger_pic_url": picture.get("url"),
        "messenger_age_range_min": age_range.get("min"),
        "messenger_age_range_max": age_range.get("max"),
        "messenger_gender": data.get("gender"),
        "messenger_locale": data.get("locale"),
    }


async def fetch_messenger_profile(
    psid: str,
    page_token: str,
    db: AsyncSession,
    *,
    page_id: str | None = None,
) -> FBProfile:
    """Fetch (with cache) Graph profile for a PSID and upsert into fb_profiles.

    Behaviour:
      • Cache fresh (<MESSENGER_PROFILE_CACHE_DAYS) → return cached row, no
        network call.
      • HTTP 200 → upsert with full payload, status='active'.
      • HTTP 4xx (opted_out / privacy / invalid) → upsert error row with
        status derived from Meta error_code so retries are skipped.
      • Timeout / network error → log + re-raise; caller (BackgroundTasks
        wrapper) decides whether to swallow.
    """
    cached = await fb_profile_crud.get_by_psid(db, psid)
    if _is_cache_fresh(cached):
        return cached  # type: ignore[return-value]

    endpoint = (
        f"https://graph.facebook.com/{settings.FACEBOOK_GRAPH_API_VERSION}/{psid}"
    )
    params = {"fields": PROFILE_FIELDS, "access_token": page_token}

    start = time.monotonic()
    try:
        async with httpx.AsyncClient(timeout=GRAPH_TIMEOUT_SECONDS) as client:
            resp = await client.get(endpoint, params=params)
    except httpx.TimeoutException:
        duration_ms = int((time.monotonic() - start) * 1000)
        await _log_call(
            db,
            psid=psid,
            endpoint=endpoint,
            http_status=None,
            error_code=None,
            error_subcode=None,
            duration_ms=duration_ms,
        )
        logger.warning("graph profile fetch timeout psid=%s", psid)
        raise

    duration_ms = int((time.monotonic() - start) * 1000)
    try:
        payload = resp.json()
    except ValueError:
        payload = {}
    err = payload.get("error") or {}

    await _log_call(
        db,
        psid=psid,
        endpoint=endpoint,
        http_status=resp.status_code,
        error_code=err.get("code"),
        error_subcode=err.get("error_subcode"),
        duration_ms=duration_ms,
    )

    if resp.status_code == 200 and "id" in payload:
        return await fb_profile_crud.upsert_messenger_cache(
            db, psid=psid, page_id=page_id, data=_parse_profile(payload)
        )

    # Failure path: classify so we can surface privacy-protected UI later.
    status = "opted_out" if err.get("code") in {10, 200, 230} else "error"
    return await fb_profile_crud.upsert_messenger_error(
        db,
        psid=psid,
        page_id=page_id,
        status=status,
        error_message=err.get("message") or f"http_{resp.status_code}",
    )


async def fetch_messenger_profile_safe(
    psid: str,
    page_token: str,
    db: AsyncSession,
    *,
    page_id: str | None = None,
) -> FBProfile | None:
    """Background-task friendly wrapper. Never raises; logs and returns None."""
    try:
        return await fetch_messenger_profile(
            psid, page_token, db, page_id=page_id
        )
    except Exception:  # noqa: BLE001 — background task must not crash request
        logger.exception("fetch_messenger_profile_safe failed psid=%s", psid)
        return None
