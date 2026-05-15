import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud import user as user_crud


@pytest.mark.asyncio
async def test_login_returns_token(client: AsyncClient, db_session: AsyncSession) -> None:
    await user_crud.create_user(db_session, "test@example.com", "secret123")
    response = await client.post(
        "/api/v1/auth/login",
        data={"username": "test@example.com", "password": "secret123"},
    )
    assert response.status_code == 200
    assert "access_token" in response.json()
    assert response.json()["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient, db_session: AsyncSession) -> None:
    await user_crud.create_user(db_session, "test@example.com", "secret123")
    response = await client.post(
        "/api/v1/auth/login",
        data={"username": "test@example.com", "password": "wrong"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_me_returns_user(client: AsyncClient, db_session: AsyncSession) -> None:
    await user_crud.create_user(db_session, "me@example.com", "password123")
    login = await client.post(
        "/api/v1/auth/login",
        data={"username": "me@example.com", "password": "password123"},
    )
    token = login.json()["access_token"]
    response = await client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["email"] == "me@example.com"
    assert response.json()["is_active"] is True


@pytest.mark.asyncio
async def test_get_me_unauthorized(client: AsyncClient) -> None:
    response = await client.get("/api/v1/users/me")
    assert response.status_code == 401
