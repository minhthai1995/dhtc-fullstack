"""Tests for Facebook Data Deletion Callback endpoint."""
from __future__ import annotations

import base64
import hashlib
import hmac
import json

import pytest
from httpx import ASGITransport, AsyncClient

from app.core.db import get_db
from app.main import app


# ── Helpers ───────────────────────────────────────────────────────────────────

def _make_signed_request(user_id: str, secret: str) -> str:
    """Build a valid Facebook signed_request for testing."""
    payload_bytes = json.dumps({
        "algorithm": "HMAC-SHA256",
        "expires": 9_999_999_999,
        "issued_at": 1_000_000_000,
        "user_id": user_id,
    }).encode()
    payload_b64 = base64.urlsafe_b64encode(payload_bytes).rstrip(b"=").decode()
    sig = hmac.new(secret.encode(), payload_b64.encode(), hashlib.sha256).digest()
    sig_b64 = base64.urlsafe_b64encode(sig).rstrip(b"=").decode()
    return f"{sig_b64}.{payload_b64}"


@pytest.fixture
async def client(db_session):
    app.dependency_overrides[get_db] = lambda: db_session
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as c:
        yield c
    app.dependency_overrides.clear()


# ── Tests ─────────────────────────────────────────────────────────────────────

async def test_data_deletion_valid_returns_code(client, monkeypatch):
    monkeypatch.setattr("app.api.v1.webhooks.FB_APP_SECRET", "test_secret")
    signed = _make_signed_request("fb_user_42", "test_secret")
    resp = await client.post(
        "/api/v1/webhook/facebook/data-deletion",
        data={"signed_request": signed},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert "confirmation_code" in body
    assert len(body["confirmation_code"]) > 10
    assert "url" in body
    assert body["confirmation_code"] in body["url"]


async def test_data_deletion_missing_body_returns_400(client):
    resp = await client.post("/api/v1/webhook/facebook/data-deletion", data={})
    assert resp.status_code == 400
    assert "signed_request" in resp.json()["detail"]


async def test_data_deletion_bad_signature_returns_400(client, monkeypatch):
    monkeypatch.setattr("app.api.v1.webhooks.FB_APP_SECRET", "correct_secret")
    signed = _make_signed_request("fb_user_42", "wrong_secret")
    resp = await client.post(
        "/api/v1/webhook/facebook/data-deletion",
        data={"signed_request": signed},
    )
    assert resp.status_code == 400


async def test_data_deletion_malformed_signed_request_returns_400(client, monkeypatch):
    monkeypatch.setattr("app.api.v1.webhooks.FB_APP_SECRET", "test_secret")
    resp = await client.post(
        "/api/v1/webhook/facebook/data-deletion",
        data={"signed_request": "not.valid.format.extra"},
    )
    assert resp.status_code == 400


async def test_data_deletion_idempotent_no_profile(client, monkeypatch):
    """Calling deletion for unknown fb_user_id still returns 200 — no crash."""
    monkeypatch.setattr("app.api.v1.webhooks.FB_APP_SECRET", "test_secret")
    signed = _make_signed_request("fb_nonexistent_999", "test_secret")
    resp = await client.post(
        "/api/v1/webhook/facebook/data-deletion",
        data={"signed_request": signed},
    )
    assert resp.status_code == 200
    assert "confirmation_code" in resp.json()
