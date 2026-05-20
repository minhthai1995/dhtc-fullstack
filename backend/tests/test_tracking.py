"""Tests for the public POST /api/v1/tracking/page-view endpoint."""
from __future__ import annotations

import pytest
from httpx import AsyncClient
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import rate_limit
from app.crud import user as user_crud
from app.models.page_view import PageView
from app.models.user import UserRole


@pytest.fixture(autouse=True)
def _reset_rate_limit() -> None:
    rate_limit.reset()
    yield
    rate_limit.reset()


@pytest.mark.asyncio
async def test_page_view_happy_path_no_auth(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    body = {
        "visitor_id": "11111111-aaaa-bbbb-cccc-222222222222",
        "session_id": "33333333-dddd-eeee-ffff-444444444444",
        "path": "/shop",
        "referrer": "https://www.google.com/search?q=cha+bo",
    }
    response = await client.post(
        "/api/v1/tracking/page-view",
        json=body,
        headers={"User-Agent": "Mozilla/5.0 (iPhone)"},
    )
    assert response.status_code == 204, response.text

    rows = (await db_session.execute(select(PageView))).scalars().all()
    assert len(rows) == 1
    row = rows[0]
    assert row.visitor_id == body["visitor_id"]
    assert row.session_id == body["session_id"]
    assert row.path == "/shop"
    assert row.referrer == body["referrer"]
    assert row.user_id is None
    assert row.user_agent is not None and "iPhone" in row.user_agent


@pytest.mark.asyncio
async def test_page_view_links_user_when_bearer_present(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    user = await user_crud.create_user(
        db_session, "track-user@test.com", "trackpass", role=UserRole.customer
    )
    login = await client.post(
        "/api/v1/auth/login",
        data={"username": "track-user@test.com", "password": "trackpass"},
    )
    assert login.status_code == 200
    token = login.json()["access_token"]

    body = {
        "visitor_id": "vid-with-user-aaaaaaaaaaaaaaaaaaaa",
        "session_id": "sid-with-user-aaaaaaaaaaaaaaaaaaaa",
        "path": "/orders/42",
        "referrer": None,
    }
    response = await client.post(
        "/api/v1/tracking/page-view",
        json=body,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 204, response.text

    row = (await db_session.execute(select(PageView))).scalar_one()
    assert row.user_id == user.id
    assert row.path == "/orders/42"


@pytest.mark.asyncio
async def test_page_view_rate_limited_after_60(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    body = {
        "visitor_id": "ratelimit-aaaaaaaaaaaaaaaaaaaaaaaa",
        "session_id": "ratelimit-bbbbbbbbbbbbbbbbbbbbbbbb",
        "path": "/shop",
        "referrer": None,
    }
    for i in range(60):
        r = await client.post("/api/v1/tracking/page-view", json=body)
        assert r.status_code == 204, f"req {i} failed: {r.text}"

    blocked = await client.post("/api/v1/tracking/page-view", json=body)
    assert blocked.status_code == 429

    count = (await db_session.execute(select(func.count()).select_from(PageView))).scalar_one()
    assert count == 60


@pytest.mark.asyncio
async def test_page_view_invalid_payload_returns_422(client: AsyncClient) -> None:
    response = await client.post(
        "/api/v1/tracking/page-view",
        json={"visitor_id": "short", "session_id": "x", "path": ""},
    )
    assert response.status_code == 422
