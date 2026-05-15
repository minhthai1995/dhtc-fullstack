import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_returns_ok(client: AsyncClient) -> None:
    response = await client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": None}


@pytest.mark.asyncio
async def test_health_db_returns_reachable(client: AsyncClient) -> None:
    response = await client.get("/api/v1/health/db")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["database"] == "reachable"


@pytest.mark.asyncio
async def test_root_returns_app_metadata(client: AsyncClient) -> None:
    response = await client.get("/")
    assert response.status_code == 200
    assert response.json()["docs"] == "/api/docs"
