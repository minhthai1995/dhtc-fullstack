"""Facebook OAuth login endpoints (P5A).

Standard OAuth 2.0 redirect flow:
- GET /auth/facebook/start  → set CSRF state cookie, 307 → FB dialog
- GET /auth/facebook/callback → verify state, exchange code, issue JWT, 302 → FE
"""
from __future__ import annotations

import hmac
import secrets
from urllib.parse import urlencode

from fastapi import APIRouter, Cookie, Depends, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.db import get_db
from app.core.security import create_access_token
from app.services.facebook_oauth_service import (
    FacebookOAuthError,
    build_authorize_url,
    exchange_code_for_token,
    fetch_user_profile,
    upsert_user_and_profile,
)

router = APIRouter(prefix="/auth/facebook", tags=["auth"])

STATE_COOKIE_NAME = "fb_oauth_state"
STATE_COOKIE_TTL_S = 600  # 10 minutes


def _is_secure_env() -> bool:
    return settings.ENVIRONMENT in ("staging", "production")


def _frontend_redirect(*, token: str | None = None, error: str | None = None) -> str:
    params: dict[str, str] = {}
    if token is not None:
        params["token"] = token
    if error is not None:
        params["error"] = error
    return f"{settings.FRONTEND_URL.rstrip('/')}/auth/fb-return?{urlencode(params)}"


def _redirect_with_cookie_cleared(url: str) -> RedirectResponse:
    response = RedirectResponse(url=url, status_code=302)
    response.delete_cookie(STATE_COOKIE_NAME, path="/")
    return response


@router.get("/start")
async def facebook_start() -> RedirectResponse:
    """Generate CSRF state, set HttpOnly cookie, redirect to FB authorize dialog."""
    state = secrets.token_urlsafe(32)
    response = RedirectResponse(url=build_authorize_url(state), status_code=307)
    response.set_cookie(
        key=STATE_COOKIE_NAME,
        value=state,
        max_age=STATE_COOKIE_TTL_S,
        httponly=True,
        secure=_is_secure_env(),
        samesite="lax",
        path="/",
    )
    return response


@router.get("/callback")
async def facebook_callback(
    request: Request,
    db: AsyncSession = Depends(get_db),
    state_cookie: str | None = Cookie(default=None, alias=STATE_COOKIE_NAME),
) -> RedirectResponse:
    """Verify state, exchange code, upsert user, issue JWT, redirect to FE."""
    state = request.query_params.get("state")
    code = request.query_params.get("code")
    # FB returns error_reason=user_denied when user cancels the authorize dialog
    fb_error_reason = request.query_params.get("error_reason") or request.query_params.get(
        "error"
    )

    if fb_error_reason:
        return _redirect_with_cookie_cleared(_frontend_redirect(error="user_cancelled"))

    if not state or not code or not state_cookie:
        return _redirect_with_cookie_cleared(_frontend_redirect(error="invalid_state"))

    if not hmac.compare_digest(state, state_cookie):
        return _redirect_with_cookie_cleared(_frontend_redirect(error="invalid_state"))

    try:
        access_token = await exchange_code_for_token(code)
        profile = await fetch_user_profile(access_token)
        user = await upsert_user_and_profile(db, profile)
    except FacebookOAuthError as exc:
        return _redirect_with_cookie_cleared(_frontend_redirect(error=exc.code))

    jwt_token = create_access_token(
        str(user.id), extra_claims={"role": user.role.value}
    )
    return _redirect_with_cookie_cleared(_frontend_redirect(token=jwt_token))
