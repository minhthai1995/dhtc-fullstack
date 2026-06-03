import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud import user as user_crud


async def _admin_token(client: AsyncClient, db: AsyncSession) -> str:
    from app.models.user import UserRole

    u = await user_crud.create_user(db, "admin@example.com", "adminpass")
    u.role = UserRole.admin
    await db.commit()
    r = await client.post(
        "/api/v1/auth/login",
        data={"username": "admin@example.com", "password": "adminpass"},
    )
    return r.json()["access_token"]


@pytest.mark.asyncio
async def test_log_consent_cookie_accept(client: AsyncClient) -> None:
    r = await client.post(
        "/api/v1/consent/log",
        json={"event_type": "cookie_accept"},
    )
    assert r.status_code == 201
    body = r.json()
    assert body["event_type"] == "cookie_accept"
    assert body["id"] > 0


@pytest.mark.asyncio
async def test_log_consent_with_user_and_session(client: AsyncClient) -> None:
    r = await client.post(
        "/api/v1/consent/log",
        json={"event_type": "privacy_accept", "user_id": 42, "session_id": "abc123"},
    )
    assert r.status_code == 201
    body = r.json()
    assert body["user_id"] == 42
    assert body["session_id"] == "abc123"


@pytest.mark.asyncio
async def test_submit_dsr_deletion(client: AsyncClient) -> None:
    r = await client.post(
        "/api/v1/consent/dsr",
        json={"email": "user@example.com", "request_type": "deletion"},
    )
    assert r.status_code == 201
    body = r.json()
    assert body["email"] == "user@example.com"
    assert body["request_type"] == "deletion"
    assert body["status"] == "pending"
    assert body["resolved_at"] is None


@pytest.mark.asyncio
async def test_submit_dsr_export_with_reason(client: AsyncClient) -> None:
    r = await client.post(
        "/api/v1/consent/dsr",
        json={
            "email": "someone@example.com",
            "request_type": "export",
            "reason": "Personal request",
        },
    )
    assert r.status_code == 201
    assert r.json()["reason"] == "Personal request"


@pytest.mark.asyncio
async def test_admin_list_dsr_requires_auth(client: AsyncClient) -> None:
    r = await client.get("/api/v1/consent/admin/dsr")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_admin_list_dsr(client: AsyncClient, db_session: AsyncSession) -> None:
    token = await _admin_token(client, db_session)
    await client.post(
        "/api/v1/consent/dsr",
        json={"email": "a@example.com", "request_type": "deletion"},
    )
    await client.post(
        "/api/v1/consent/dsr",
        json={"email": "b@example.com", "request_type": "export"},
    )
    r = await client.get(
        "/api/v1/consent/admin/dsr",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 200
    assert len(r.json()) == 2


@pytest.mark.asyncio
async def test_admin_update_dsr_status(client: AsyncClient, db_session: AsyncSession) -> None:
    token = await _admin_token(client, db_session)
    create = await client.post(
        "/api/v1/consent/dsr",
        json={"email": "c@example.com", "request_type": "deletion"},
    )
    dsr_id = create.json()["id"]

    r = await client.patch(
        f"/api/v1/consent/admin/dsr/{dsr_id}",
        json={"status": "completed", "admin_note": "Deleted within 30 days"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "completed"
    assert body["admin_note"] == "Deleted within 30 days"
    assert body["resolved_at"] is not None


@pytest.mark.asyncio
async def test_admin_update_dsr_not_found(client: AsyncClient, db_session: AsyncSession) -> None:
    token = await _admin_token(client, db_session)
    r = await client.patch(
        "/api/v1/consent/admin/dsr/99999",
        json={"status": "rejected"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 404
