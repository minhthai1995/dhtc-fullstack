"""Facebook OAuth login service (P5A).

Standard OAuth 2.0 redirect flow with `email + public_profile` scope.
- FB access_token is used once per callback then discarded (not persisted).
- FACEBOOK_APP_SECRET stays backend-only — never logged or echoed.
"""
from __future__ import annotations

from urllib.parse import urlencode

import httpx

from app.core.config import settings

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
