from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.fb_profile import FBProfile


async def get_by_fb_app_user_id(
    db: AsyncSession, fb_app_user_id: str
) -> FBProfile | None:
    result = await db.execute(
        select(FBProfile).where(FBProfile.fb_app_user_id == fb_app_user_id)
    )
    return result.scalars().first()


async def get_by_user_id(db: AsyncSession, user_id: int) -> FBProfile | None:
    result = await db.execute(select(FBProfile).where(FBProfile.user_id == user_id))
    return result.scalars().first()


async def create(
    db: AsyncSession,
    *,
    user_id: int,
    fb_app_user_id: str,
    fb_email: str | None = None,
    fb_first_name: str | None = None,
    fb_last_name: str | None = None,
    fb_profile_pic_url: str | None = None,
    fb_locale: str | None = None,
    raw_oauth_payload: dict[str, Any] | None = None,
) -> FBProfile:
    profile = FBProfile(
        user_id=user_id,
        fb_app_user_id=fb_app_user_id,
        fb_email=fb_email,
        fb_first_name=fb_first_name,
        fb_last_name=fb_last_name,
        fb_profile_pic_url=fb_profile_pic_url,
        fb_locale=fb_locale,
        raw_oauth_payload=raw_oauth_payload,
    )
    db.add(profile)
    await db.commit()
    await db.refresh(profile)
    return profile


async def get_by_psid(db: AsyncSession, psid: str) -> FBProfile | None:
    result = await db.execute(
        select(FBProfile).where(FBProfile.messenger_psid == psid)
    )
    return result.scalars().first()


# Fields populated by FBGraphService.fetch_messenger_profile.
# Keys MUST match column names; extras are ignored to keep upsert safe.
_MESSENGER_CACHE_KEYS = {
    "messenger_name",
    "messenger_pic_url",
    "messenger_age_range_min",
    "messenger_age_range_max",
    "messenger_gender",
    "messenger_locale",
}


async def upsert_messenger_cache(
    db: AsyncSession,
    *,
    psid: str,
    page_id: str | None,
    data: dict[str, Any],
) -> FBProfile:
    """Idempotent upsert keyed on messenger_psid.

    Use cases:
      • PSID-only row first seen → INSERT with messenger_* populated.
      • Existing row (OAuth or earlier cache) → UPDATE messenger_* + clear
        any prior error, mark status='active'.
    """
    payload: dict[str, Any] = {
        k: v for k, v in data.items() if k in _MESSENGER_CACHE_KEYS
    }
    now = datetime.now(UTC).replace(tzinfo=None)
    payload.update(
        {
            "messenger_psid": psid,
            "page_id": page_id,
            "messenger_fetched_at": now,
            "messenger_status": "active",
            "messenger_error_message": None,
        }
    )

    stmt = pg_insert(FBProfile).values(**payload)
    update_cols = {
        k: stmt.excluded[k] for k in payload if k != "messenger_psid"
    }
    stmt = stmt.on_conflict_do_update(
        index_elements=[FBProfile.messenger_psid],
        set_=update_cols,
    )
    await db.execute(stmt)
    await db.commit()
    profile = await get_by_psid(db, psid)
    assert profile is not None
    return profile


async def upsert_messenger_error(
    db: AsyncSession,
    *,
    psid: str,
    page_id: str | None,
    status: str,
    error_message: str | None,
) -> FBProfile:
    """Record a Graph fetch failure without overwriting prior good cache.

    status ∈ {'opted_out', 'error'}. messenger_fetched_at is set to now so
    we don't immediately retry a known-bad PSID.
    """
    now = datetime.now(UTC).replace(tzinfo=None)
    stmt = pg_insert(FBProfile).values(
        messenger_psid=psid,
        page_id=page_id,
        messenger_fetched_at=now,
        messenger_status=status,
        messenger_error_message=error_message,
    )
    stmt = stmt.on_conflict_do_update(
        index_elements=[FBProfile.messenger_psid],
        set_={
            "messenger_fetched_at": stmt.excluded.messenger_fetched_at,
            "messenger_status": stmt.excluded.messenger_status,
            "messenger_error_message": stmt.excluded.messenger_error_message,
        },
    )
    await db.execute(stmt)
    await db.commit()
    profile = await get_by_psid(db, psid)
    assert profile is not None
    return profile


async def get_stale(
    db: AsyncSession, *, older_than: timedelta
) -> list[FBProfile]:
    """Return PSID rows whose cache is older than threshold (for backfill jobs)."""
    cutoff = datetime.now(UTC).replace(tzinfo=None) - older_than
    result = await db.execute(
        select(FBProfile).where(
            FBProfile.messenger_psid.is_not(None),
            FBProfile.messenger_fetched_at < cutoff,
        )
    )
    return list(result.scalars().all())


async def update_oauth_payload(
    db: AsyncSession,
    profile: FBProfile,
    *,
    fb_email: str | None = None,
    fb_first_name: str | None = None,
    fb_last_name: str | None = None,
    fb_profile_pic_url: str | None = None,
    fb_locale: str | None = None,
    raw_oauth_payload: dict[str, Any] | None = None,
) -> FBProfile:
    """Refresh OAuth-derived fields on re-login. messenger_psid is preserved."""
    if fb_email is not None:
        profile.fb_email = fb_email
    if fb_first_name is not None:
        profile.fb_first_name = fb_first_name
    if fb_last_name is not None:
        profile.fb_last_name = fb_last_name
    if fb_profile_pic_url is not None:
        profile.fb_profile_pic_url = fb_profile_pic_url
    if fb_locale is not None:
        profile.fb_locale = fb_locale
    if raw_oauth_payload is not None:
        profile.raw_oauth_payload = raw_oauth_payload
    await db.commit()
    await db.refresh(profile)
    return profile
