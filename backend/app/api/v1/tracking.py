from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.rate_limit import hit as rate_limit_hit
from app.core.security import decode_access_token
from app.crud import page_view as pv_crud
from app.deps import oauth2_scheme
from app.schemas.tracking import PageViewIn
from app.services.tracking import derive_country_code

RATE_LIMIT_PER_MIN = 60

router = APIRouter(prefix="/tracking", tags=["tracking"])


def _optional_user_id(token: str | None) -> int | None:
    if not token:
        return None
    payload = decode_access_token(token)
    if not payload:
        return None
    sub = payload.get("sub")
    if sub is None:
        return None
    try:
        return int(sub)
    except (TypeError, ValueError):
        return None


@router.post("/page-view", status_code=status.HTTP_204_NO_CONTENT)
async def post_page_view(
    payload: PageViewIn,
    request: Request,
    token: str | None = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> None:
    allowed = rate_limit_hit(
        f"pv:{payload.visitor_id}", limit=RATE_LIMIT_PER_MIN, window_sec=60.0
    )
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests",
        )

    user_id = _optional_user_id(token)
    user_agent = request.headers.get("user-agent")
    country = derive_country_code({k.lower(): v for k, v in request.headers.items()})

    await pv_crud.create_page_view(
        db,
        visitor_id=payload.visitor_id,
        session_id=payload.session_id,
        path=payload.path,
        referrer=payload.referrer,
        user_id=user_id,
        user_agent=user_agent[:500] if user_agent else None,
        country_code=country,
    )
    await db.commit()
