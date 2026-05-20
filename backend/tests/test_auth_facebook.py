"""Tests for Facebook OAuth login endpoints (P5A)."""
from __future__ import annotations

from httpx import AsyncClient


# ---------- /auth/facebook/start ----------


async def test_facebook_start_redirects_to_fb(client: AsyncClient) -> None:
    resp = await client.get("/api/v1/auth/facebook/start", follow_redirects=False)
    assert resp.status_code == 307
    location = resp.headers["location"]
    assert location.startswith("https://www.facebook.com/v19.0/dialog/oauth?")
    assert "scope=email%2Cpublic_profile" in location
    assert "response_type=code" in location
    assert "state=" in location


async def test_facebook_start_state_cookie_is_httponly_lax(
    client: AsyncClient,
) -> None:
    resp = await client.get("/api/v1/auth/facebook/start", follow_redirects=False)
    set_cookie = resp.headers.get("set-cookie", "")
    assert "fb_oauth_state=" in set_cookie
    assert "HttpOnly" in set_cookie
    # samesite cookie attr is case-insensitive (Starlette emits lowercase)
    assert "samesite=lax" in set_cookie.lower()
    assert "max-age=600" in set_cookie.lower()
    assert "path=/" in set_cookie.lower()
