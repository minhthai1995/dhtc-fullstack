"""Facebook OAuth login service (P5A).

Standard OAuth 2.0 redirect flow with `email + public_profile` scope.
- FB access_token is used once per callback then discarded (not persisted).
- FACEBOOK_APP_SECRET stays backend-only — never logged or echoed.
"""
from __future__ import annotations

import secrets
from urllib.parse import urlencode

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.crud import fb_profile as fb_profile_crud
from app.crud import user as user_crud
from app.models.user import User, UserRole

FB_GRAPH_VERSION = "v19.0"
FB_DIALOG_URL = f"https://www.facebook.com/{FB_GRAPH_VERSION}/dialog/oauth"
FB_GRAPH_BASE = f"https://graph.facebook.com/{FB_GRAPH_VERSION}"
FB_SCOPES = "email,public_profile"
FB_ME_FIELDS = "id,email,first_name,last_name,picture.width(400).height(400)"
FB_HTTP_TIMEOUT_S = 8.0


class FacebookOAuthError(Exception):
    """Base class for graceful FB OAuth failures.

    `code` is a short stable identifier (e.g. 'invalid_state', 'fb_unavailable')
    that the callback handler maps to a Vietnamese message in the FE redirect.
    """

    def __init__(self, code: str, detail: str | None = None) -> None:
        super().__init__(detail or code)
        self.code = code
        self.detail = detail


def build_authorize_url(state: str) -> str:
    """Return the FB dialog URL the user is redirected to from /auth/facebook/start."""
    params = {
        "client_id": settings.FACEBOOK_APP_ID,
        "redirect_uri": settings.FACEBOOK_OAUTH_REDIRECT_URI,
        "state": state,
        "scope": FB_SCOPES,
        "response_type": "code",
    }
    return f"{FB_DIALOG_URL}?{urlencode(params)}"


async def exchange_code_for_token(code: str) -> str:
    """Exchange the OAuth `code` from FB redirect for a short-lived access token.

    The token is returned to the caller for a one-shot /me fetch then discarded.
    Never log, persist, or echo this value.
    """
    params = {
        "client_id": settings.FACEBOOK_APP_ID,
        "client_secret": settings.FACEBOOK_APP_SECRET,
        "redirect_uri": settings.FACEBOOK_OAUTH_REDIRECT_URI,
        "code": code,
    }
    try:
        async with httpx.AsyncClient(timeout=FB_HTTP_TIMEOUT_S) as client:
            resp = await client.get(f"{FB_GRAPH_BASE}/oauth/access_token", params=params)
    except httpx.HTTPError as exc:
        raise FacebookOAuthError("fb_unavailable", str(exc)) from exc

    if resp.status_code >= 400:
        raise FacebookOAuthError("fb_unavailable", f"status={resp.status_code}")

    payload = resp.json()
    if "error" in payload:
        raise FacebookOAuthError("fb_unavailable", payload["error"].get("type", "error"))

    token = payload.get("access_token")
    if not isinstance(token, str) or not token:
        raise FacebookOAuthError("fb_unavailable", "missing access_token")
    return token


async def fetch_user_profile(access_token: str) -> dict:
    """Fetch user profile from Graph API /me.

    Returns a dict with keys: id, email (optional), first_name, last_name,
    fb_profile_pic_url (extracted from nested picture.data.url), locale (optional).
    """
    params = {"fields": FB_ME_FIELDS, "access_token": access_token}
    try:
        async with httpx.AsyncClient(timeout=FB_HTTP_TIMEOUT_S) as client:
            resp = await client.get(f"{FB_GRAPH_BASE}/me", params=params)
    except httpx.HTTPError as exc:
        raise FacebookOAuthError("fb_unavailable", str(exc)) from exc

    if resp.status_code >= 400:
        raise FacebookOAuthError("fb_unavailable", f"status={resp.status_code}")

    payload = resp.json()
    if "error" in payload or "id" not in payload:
        raise FacebookOAuthError("fb_unavailable", "invalid /me response")

    picture_url: str | None = None
    picture = payload.get("picture")
    if isinstance(picture, dict):
        data = picture.get("data")
        if isinstance(data, dict):
            url = data.get("url")
            if isinstance(url, str):
                picture_url = url

    return {
        "id": str(payload["id"]),
        "email": payload.get("email"),
        "first_name": payload.get("first_name"),
        "last_name": payload.get("last_name"),
        "fb_profile_pic_url": picture_url,
        "locale": payload.get("locale"),
        "raw": payload,
    }


def _synthetic_email(fb_app_user_id: str) -> str:
    """Used when FB user denied the email scope — keeps users.email NOT NULL invariant."""
    return f"fb_{fb_app_user_id}@dhtc.local"


def _unusable_password_hash() -> str:
    """Random unusable bcrypt hash so email+password login can never reach FB-only users."""
    from app.core.security import hash_password

    return hash_password(secrets.token_urlsafe(48))


async def upsert_user_and_profile(db: AsyncSession, profile: dict) -> User:
    """Idempotent upsert keyed on fb_app_user_id, with email-merge fallback.

    Resolution order:
      1. Existing FBProfile by fb_app_user_id → refresh OAuth fields, return its user
      2. Existing User by email → link new FBProfile to that user (merge)
      3. New User (random unusable password) + new FBProfile

    `profile` must come from `fetch_user_profile`.
    """
    fb_id = profile["id"]
    fb_email: str | None = profile.get("email")
    first_name: str | None = profile.get("first_name")
    last_name: str | None = profile.get("last_name")
    pic_url: str | None = profile.get("fb_profile_pic_url")
    locale: str | None = profile.get("locale")
    raw = profile.get("raw")

    existing_profile = await fb_profile_crud.get_by_fb_app_user_id(db, fb_id)
    if existing_profile is not None:
        await fb_profile_crud.update_oauth_payload(
            db,
            existing_profile,
            fb_email=fb_email,
            fb_first_name=first_name,
            fb_last_name=last_name,
            fb_profile_pic_url=pic_url,
            fb_locale=locale,
            raw_oauth_payload=raw,
        )
        user = await user_crud.get_by_id(db, existing_profile.user_id)
        assert user is not None  # FK guarantees this
        return user

    user: User | None = None
    if fb_email:
        user = await user_crud.get_by_email(db, fb_email)

    if user is None:
        email_to_use = fb_email or _synthetic_email(fb_id)
        full_name = " ".join(p for p in (first_name, last_name) if p) or None
        user = User(
            email=email_to_use,
            hashed_password=_unusable_password_hash(),
            full_name=full_name,
            role=UserRole.customer,
            is_active=True,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    await fb_profile_crud.create(
        db,
        user_id=user.id,
        fb_app_user_id=fb_id,
        fb_email=fb_email,
        fb_first_name=first_name,
        fb_last_name=last_name,
        fb_profile_pic_url=pic_url,
        fb_locale=locale,
        raw_oauth_payload=raw,
    )
    return user
