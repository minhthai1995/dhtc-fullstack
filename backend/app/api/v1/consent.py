"""Consent logging and Data Subject Request (DSR) endpoints.

VN compliance: Luật An toàn thông tin mạng 86/2015, Nghị định 13/2023.
"""
from __future__ import annotations

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.deps import require_admin
from app.models.consent import ConsentEventType, ConsentLog, DSRRequest, DSRStatus, DSRType
from app.models.user import User

router = APIRouter(prefix="/consent", tags=["consent"])


# ── Schemas ────────────────────────────────────────────────────────────────────


class ConsentLogCreate(BaseModel):
    event_type: ConsentEventType
    user_id: int | None = None
    session_id: str | None = Field(None, max_length=128)


class ConsentLogRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int | None
    session_id: str | None
    event_type: ConsentEventType
    ip_addr: str | None
    created_at: datetime


class DSRCreate(BaseModel):
    email: EmailStr
    request_type: DSRType
    fb_user_id: str | None = Field(None, max_length=64)
    reason: str | None = Field(None, max_length=2000)


class DSRRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    request_type: DSRType
    fb_user_id: str | None
    reason: str | None
    status: DSRStatus
    admin_note: str | None
    created_at: datetime
    resolved_at: datetime | None


class DSRUpdate(BaseModel):
    status: DSRStatus
    admin_note: str | None = Field(None, max_length=2000)


# ── Public endpoints ───────────────────────────────────────────────────────────


@router.post("/log", response_model=ConsentLogRead, status_code=201)
async def log_consent(
    payload: ConsentLogCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> ConsentLog:
    """Record a consent event. No auth required — called from browser."""
    ip = request.client.host if request.client else None
    ua = request.headers.get("user-agent")
    entry = ConsentLog(
        user_id=payload.user_id,
        session_id=payload.session_id,
        event_type=payload.event_type,
        ip_addr=ip,
        user_agent=ua[:512] if ua else None,
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry


@router.post("/dsr", response_model=DSRRead, status_code=201)
async def submit_dsr(
    payload: DSRCreate,
    db: AsyncSession = Depends(get_db),
) -> DSRRequest:
    """Submit a Data Subject Request. No auth required."""
    req = DSRRequest(
        email=str(payload.email),
        request_type=payload.request_type,
        fb_user_id=payload.fb_user_id,
        reason=payload.reason,
    )
    db.add(req)
    await db.commit()
    await db.refresh(req)
    return req


# ── Admin endpoints ────────────────────────────────────────────────────────────


@router.get("/admin/dsr", response_model=list[DSRRead])
async def list_dsr(
    status: DSRStatus | None = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> list[DSRRequest]:
    stmt = select(DSRRequest).order_by(DSRRequest.created_at.desc())
    if status:
        stmt = stmt.where(DSRRequest.status == status)
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.patch("/admin/dsr/{dsr_id}", response_model=DSRRead)
async def update_dsr(
    dsr_id: int,
    payload: DSRUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> DSRRequest:
    result = await db.execute(select(DSRRequest).where(DSRRequest.id == dsr_id).with_for_update())
    req = result.scalar_one_or_none()
    if req is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="DSR not found")
    req.status = payload.status
    req.admin_note = payload.admin_note
    if payload.status in (DSRStatus.completed, DSRStatus.rejected):
        req.resolved_at = datetime.now(UTC)
    await db.commit()
    await db.refresh(req)
    return req
