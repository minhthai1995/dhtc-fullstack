from __future__ import annotations

from typing import Any

from sqlalchemy import select
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
