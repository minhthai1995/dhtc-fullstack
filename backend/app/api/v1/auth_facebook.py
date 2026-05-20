"""Facebook OAuth login endpoints (P5A).

Standard OAuth 2.0 redirect flow:
- GET /auth/facebook/start  → set CSRF state cookie, 307 → FB dialog
- GET /auth/facebook/callback → verify state, exchange code, issue JWT, 302 → FE
"""
from __future__ import annotations

import secrets

from fastapi import APIRouter
from fastapi.responses import RedirectResponse

from app.core.config import settings
from app.services.facebook_oauth_service import build_authorize_url

router = APIRouter(prefix="/auth/facebook", tags=["auth"])

STATE_COOKIE_NAME = "fb_oauth_state"
STATE_COOKIE_TTL_S = 600  # 10 minutes


def _is_secure_env() -> bool:
    return settings.ENVIRONMENT in ("staging", "production")


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
