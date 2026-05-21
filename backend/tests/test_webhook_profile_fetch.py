"""Webhook integration test for P5C profile enrichment.

Verifies that a Messenger inbound event for a previously-unseen PSID
triggers a BackgroundTask that calls Graph and writes to fb_profiles,
and that a fresh cache row skips the Graph call entirely.
"""
from __future__ import annotations

from contextlib import asynccontextmanager
from datetime import UTC, datetime, timedelta
from typing import Any

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1 import webhooks as webhooks_mod
from app.crud import fb_profile as fb_profile_crud
from app.models.fb_profile import FBProfile
from app.services import fb_graph_service as graph_mod

PAGE_ID = "100000000000001"
PSID = "psid_alice_001"


# ── Fakes ────────────────────────────────────────────────────────────────────

class _FakeResp:
    def __init__(self, status_code: int, payload: dict[str, Any]) -> None:
        self.status_code = status_code
        self._payload = payload

    def json(self) -> dict[str, Any]:
        return self._payload


class _FakeAsyncClient:
    """Replaces httpx.AsyncClient for Graph profile calls in tests."""

    last_call: dict[str, Any] = {}

    def __init__(self, *args: Any, **kwargs: Any) -> None:  # noqa: ARG002
        pass

    async def __aenter__(self) -> _FakeAsyncClient:
        return self

    async def __aexit__(self, *_: Any) -> None:
        return None

    async def get(self, endpoint: str, params: dict[str, Any] | None = None) -> _FakeResp:
        _FakeAsyncClient.last_call = {"endpoint": endpoint, "params": params or {}}
        return _FakeResp(
            200,
            {
                "id": PSID,
                "name": "Alice Real",
                "picture": {"data": {"url": "https://scontent.fb/alice.jpg"}},
                "age_range": {"min": 25, "max": 34},
                "gender": "female",
                "locale": "vi_VN",
            },
        )


@pytest.fixture
def patch_graph(monkeypatch: pytest.MonkeyPatch):
    """Stub httpx.AsyncClient inside fb_graph_service to return canned profile."""
    _FakeAsyncClient.last_call = {}
    monkeypatch.setattr(graph_mod.httpx, "AsyncClient", _FakeAsyncClient)
    return _FakeAsyncClient


@pytest.fixture
def patch_session_factory(monkeypatch: pytest.MonkeyPatch, db_session: AsyncSession):
    """Make BackgroundTasks use the test DB session, not a new pool conn."""

    @asynccontextmanager
    async def fake_factory():
        # Reuse the active test session — the fixture keeps it open across the
        # request lifecycle, and we don't want bg task to close it.
        yield db_session

    monkeypatch.setattr(webhooks_mod, "AsyncSessionLocal", fake_factory)


@pytest.fixture(autouse=True)
def disable_signature_check(monkeypatch: pytest.MonkeyPatch):
    """Local .env may set FACEBOOK_APP_SECRET; force dev-mode skip in tests."""
    monkeypatch.setattr(webhooks_mod, "FB_APP_SECRET", "")


@pytest.fixture
def patch_page_token(monkeypatch: pytest.MonkeyPatch):
    """Token must be truthy for the enrichment scheduler branch to fire."""
    monkeypatch.setattr(webhooks_mod, "FB_PAGE_TOKEN", "fake_page_token_xyz")


def _webhook_payload(psid: str = PSID, page_id: str = PAGE_ID) -> dict:
    """Minimal payload: no text → agent path skipped, only enrichment fires."""
    return {
        "object": "page",
        "entry": [
            {
                "id": page_id,
                "messaging": [
                    {
                        "sender": {"id": psid},
                        "recipient": {"id": page_id},
                        "timestamp": 1700000000000,
                        "message": {},
                    }
                ],
            }
        ],
    }


# ── Tests ────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_webhook_first_seen_psid_triggers_graph_fetch(
    client: AsyncClient,
    db_session: AsyncSession,
    patch_graph,
    patch_session_factory,
    patch_page_token,
) -> None:
    pre = await fb_profile_crud.get_by_psid(db_session, PSID)
    assert pre is None

    resp = await client.post("/api/v1/webhook/facebook", json=_webhook_payload())

    assert resp.status_code == 200
    # AsyncClient + ASGITransport awaits BackgroundTasks before returning.
    row = await fb_profile_crud.get_by_psid(db_session, PSID)
    assert row is not None
    assert row.messenger_name == "Alice Real"
    assert row.messenger_pic_url == "https://scontent.fb/alice.jpg"
    assert row.messenger_age_range_min == 25
    assert row.messenger_gender == "female"
    assert row.messenger_locale == "vi_VN"
    assert row.page_id == PAGE_ID
    assert row.messenger_status == "active"
    assert patch_graph.last_call["endpoint"].endswith(f"/{PSID}")


@pytest.mark.asyncio
async def test_webhook_cache_hit_skips_graph_call(
    client: AsyncClient,
    db_session: AsyncSession,
    patch_graph,
    patch_session_factory,
    patch_page_token,
) -> None:
    # Seed a recently-fetched profile so the in-handler freshness check skips
    # scheduling the BG fetch.
    fresh = datetime.now(UTC).replace(tzinfo=None) - timedelta(days=2)
    db_session.add(
        FBProfile(
            messenger_psid=PSID,
            page_id=PAGE_ID,
            messenger_name="Alice Cached",
            messenger_fetched_at=fresh,
            messenger_status="active",
        )
    )
    await db_session.commit()

    resp = await client.post("/api/v1/webhook/facebook", json=_webhook_payload())
    assert resp.status_code == 200

    # Cached row should still hold the seeded name (not overwritten by Graph).
    row = await fb_profile_crud.get_by_psid(db_session, PSID)
    assert row is not None
    assert row.messenger_name == "Alice Cached"
    assert patch_graph.last_call == {}  # Graph never called


@pytest.mark.asyncio
async def test_webhook_no_token_skips_enrichment(
    client: AsyncClient,
    db_session: AsyncSession,
    patch_graph,
    patch_session_factory,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Dev env without FB_PAGE_TOKEN must not crash the webhook path."""
    monkeypatch.setattr(webhooks_mod, "FB_PAGE_TOKEN", "")

    resp = await client.post("/api/v1/webhook/facebook", json=_webhook_payload())

    assert resp.status_code == 200
    assert await fb_profile_crud.get_by_psid(db_session, PSID) is None
    assert patch_graph.last_call == {}
