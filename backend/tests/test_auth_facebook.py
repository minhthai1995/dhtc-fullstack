"""Tests for Facebook OAuth login endpoints (P5A)."""
from __future__ import annotations

from urllib.parse import parse_qs, urlparse

from httpx import AsyncClient
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.fb_profile import FBProfile
from app.models.user import User


async def _start_and_get_state(client: AsyncClient) -> str:
    """Hit /start, return the CSRF state value stored in the cookie jar."""
    await client.get("/api/v1/auth/facebook/start", follow_redirects=False)
    return client.cookies["fb_oauth_state"]


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


# ---------- /auth/facebook/callback — happy + idempotent ----------


async def test_facebook_callback_new_user_happy(
    client: AsyncClient,
    db_session: AsyncSession,
    fb_oauth_mocks,
) -> None:
    state = await _start_and_get_state(client)
    resp = await client.get(
        f"/api/v1/auth/facebook/callback?state={state}&code=fakecode",
        follow_redirects=False,
    )

    assert resp.status_code == 302
    parsed = urlparse(resp.headers["location"])
    assert parsed.path == "/auth/fb-return"
    qs = parse_qs(parsed.query)
    assert "token" in qs and qs["token"][0]
    assert "error" not in qs

    # state cookie cleared after callback
    assert "fb_oauth_state=" in resp.headers.get("set-cookie", "")
    assert 'max-age=0' in resp.headers["set-cookie"].lower() or \
        'expires=' in resp.headers["set-cookie"].lower()

    # DB: 1 user + 1 fb_profile linked
    user_count = (await db_session.execute(select(func.count(User.id)))).scalar_one()
    assert user_count == 1
    user = (await db_session.execute(select(User))).scalar_one()
    assert user.email == "fb_user@example.com"
    assert user.is_active is True

    profile = (await db_session.execute(select(FBProfile))).scalar_one()
    assert profile.fb_app_user_id == "100000001"
    assert profile.user_id == user.id
    assert profile.fb_first_name == "Test"
    assert profile.fb_last_name == "User"
    assert profile.messenger_psid is None  # reserved P5C

    # mocks were actually called
    assert fb_oauth_mocks.calls["exchange"] == ["fakecode"]
    assert fb_oauth_mocks.calls["fetch"] == ["fake_token"]


async def test_facebook_callback_duplicate_fb_app_user_id(
    client: AsyncClient,
    db_session: AsyncSession,
    fb_oauth_mocks,
) -> None:
    """Re-login with same FB user must be idempotent: no duplicate user/profile."""
    # First login
    state1 = await _start_and_get_state(client)
    r1 = await client.get(
        f"/api/v1/auth/facebook/callback?state={state1}&code=code1",
        follow_redirects=False,
    )
    assert r1.status_code == 302
    assert "token=" in r1.headers["location"]

    # Simulate FB returning slightly different display name on re-login
    fb_oauth_mocks.set_profile({
        "id": "100000001",
        "email": "fb_user@example.com",
        "first_name": "Test",
        "last_name": "User-Renamed",
        "fb_profile_pic_url": "https://scontent.example/pic2.jpg",
        "locale": "vi_VN",
        "raw": {"id": "100000001", "v": 2},
    })

    state2 = await _start_and_get_state(client)
    r2 = await client.get(
        f"/api/v1/auth/facebook/callback?state={state2}&code=code2",
        follow_redirects=False,
    )
    assert r2.status_code == 302
    assert "token=" in r2.headers["location"]

    # Still exactly one user + one fb_profile
    user_count = (await db_session.execute(select(func.count(User.id)))).scalar_one()
    fb_count = (await db_session.execute(select(func.count(FBProfile.id)))).scalar_one()
    assert user_count == 1
    assert fb_count == 1

    # Profile got refreshed
    profile = (await db_session.execute(select(FBProfile))).scalar_one()
    assert profile.fb_last_name == "User-Renamed"
    assert profile.fb_profile_pic_url == "https://scontent.example/pic2.jpg"


async def test_facebook_callback_email_merge(
    client: AsyncClient,
    db_session: AsyncSession,
    fb_oauth_mocks,
) -> None:
    """User registered via email/password first → FB login with same email
    must LINK to existing user, not create a second one."""
    from app.core.security import hash_password
    from app.models.user import UserRole

    existing = User(
        email="overlap@example.com",
        hashed_password=hash_password("realpassword123"),
        full_name="Existing User",
        role=UserRole.customer,
        is_active=True,
    )
    db_session.add(existing)
    await db_session.commit()
    await db_session.refresh(existing)
    existing_id = existing.id
    existing_pw_hash = existing.hashed_password

    fb_oauth_mocks.set_profile({
        "id": "200000002",
        "email": "overlap@example.com",
        "first_name": "FB",
        "last_name": "Linked",
        "fb_profile_pic_url": None,
        "locale": None,
        "raw": {"id": "200000002"},
    })

    state = await _start_and_get_state(client)
    resp = await client.get(
        f"/api/v1/auth/facebook/callback?state={state}&code=mergecode",
        follow_redirects=False,
    )
    assert resp.status_code == 302
    assert "token=" in resp.headers["location"]

    user_count = (await db_session.execute(select(func.count(User.id)))).scalar_one()
    fb_count = (await db_session.execute(select(func.count(FBProfile.id)))).scalar_one()
    assert user_count == 1, "email merge must not create a second user"
    assert fb_count == 1

    # The new FBProfile linked back to the original user — original creds untouched
    await db_session.refresh(existing)
    assert existing.id == existing_id
    assert existing.hashed_password == existing_pw_hash  # password not overwritten
    profile = (await db_session.execute(select(FBProfile))).scalar_one()
    assert profile.user_id == existing_id
    assert profile.fb_app_user_id == "200000002"
