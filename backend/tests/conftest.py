from collections.abc import AsyncIterator
from io import BytesIO
from typing import Any

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from PIL import Image
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.db import get_db
from app.main import app
from app.models import Base


def make_test_image(
    size: tuple[int, int] = (300, 300),
    fmt: str = "JPEG",
    color: tuple[int, int, int] = (200, 50, 50),
    exif: bytes | None = None,
) -> bytes:
    """Build an in-memory test image for upload endpoint tests.

    Returns encoded bytes ready to attach to multipart form data."""
    img = Image.new("RGB", size, color)
    buf = BytesIO()
    if exif is not None:
        img.save(buf, format=fmt, exif=exif)
    else:
        img.save(buf, format=fmt)
    return buf.getvalue()

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest_asyncio.fixture
async def db_session() -> AsyncIterator[AsyncSession]:
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    async with session_factory() as session:
        yield session
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture
async def client(db_session: AsyncSession) -> AsyncIterator[AsyncClient]:
    async def override_get_db() -> AsyncIterator[AsyncSession]:
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest.fixture
def fb_oauth_mocks(monkeypatch: pytest.MonkeyPatch):
    """Patch FB OAuth service helpers so callback tests run offline.

    Returns a small controller object with:
      - set_profile(profile_dict): override the /me response
      - set_token_error(code, detail=None): make exchange_code_for_token raise
      - set_profile_error(code, detail=None): make fetch_user_profile raise
      - calls: dict tracking inputs for assertions

    Default behavior: exchange returns "fake_token"; /me returns a stable
    profile dict matching `fetch_user_profile` schema.
    """
    from app.services import facebook_oauth_service as svc

    state: dict[str, Any] = {
        "token": "fake_token",
        "token_error": None,
        "profile": {
            "id": "100000001",
            "email": "fb_user@example.com",
            "first_name": "Test",
            "last_name": "User",
            "fb_profile_pic_url": "https://scontent.example/pic.jpg",
            "locale": "vi_VN",
            "raw": {"id": "100000001"},
        },
        "profile_error": None,
    }
    calls: dict[str, list[Any]] = {"exchange": [], "fetch": []}

    async def fake_exchange(code: str) -> str:
        calls["exchange"].append(code)
        if state["token_error"] is not None:
            code_, detail = state["token_error"]
            raise svc.FacebookOAuthError(code_, detail)
        return state["token"]

    async def fake_fetch(access_token: str) -> dict:
        calls["fetch"].append(access_token)
        if state["profile_error"] is not None:
            code_, detail = state["profile_error"]
            raise svc.FacebookOAuthError(code_, detail)
        return state["profile"]

    monkeypatch.setattr(
        "app.api.v1.auth_facebook.exchange_code_for_token", fake_exchange
    )
    monkeypatch.setattr(
        "app.api.v1.auth_facebook.fetch_user_profile", fake_fetch
    )

    class _Controller:
        calls = calls

        @staticmethod
        def set_profile(profile: dict) -> None:
            state["profile"] = profile

        @staticmethod
        def set_token_error(code: str, detail: str | None = None) -> None:
            state["token_error"] = (code, detail)

        @staticmethod
        def set_profile_error(code: str, detail: str | None = None) -> None:
            state["profile_error"] = (code, detail)

    return _Controller()
