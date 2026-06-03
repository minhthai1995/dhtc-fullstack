"""Integration tests for seller merchant logo + banner upload endpoints."""
from __future__ import annotations

from pathlib import Path

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.crud import user as user_crud
from app.models.merchant import Merchant, MerchantStatus, MerchantTier
from app.models.user import UserRole
from tests.conftest import make_test_image


async def _seller_with_merchant(
    client: AsyncClient, db_session: AsyncSession, email: str
) -> str:
    """Create a seller user + active merchant. Returns access token."""
    await user_crud.create_user(db_session, email, "sellerpass", role=UserRole.seller)
    seller = await user_crud.get_by_email(db_session, email)
    assert seller is not None
    merchant = Merchant(
        user_id=seller.id,
        shop_name="Brand Shop",
        slug=f"brand-shop-{email[:6]}",
        status=MerchantStatus.active,
        tier=MerchantTier.bronze,
    )
    db_session.add(merchant)
    await db_session.commit()
    login = await client.post(
        "/api/v1/auth/login", data={"username": email, "password": "sellerpass"}
    )
    assert login.status_code == 200, login.text
    return login.json()["access_token"]


@pytest.fixture(autouse=True)
def _isolated_upload_dir(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    monkeypatch.setattr(settings, "UPLOAD_DIR", tmp_path)
    return tmp_path


# ── Logo ─────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_upload_logo_happy_path(
    client: AsyncClient, db_session: AsyncSession, _isolated_upload_dir: Path
) -> None:
    token = await _seller_with_merchant(client, db_session, "logo-seller@test.com")
    image = make_test_image((400, 400))

    resp = await client.post(
        "/api/v1/seller/profile/logo",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("logo.jpg", image, "image/jpeg")},
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["logo_url"].startswith("/uploads/merchants/")
    assert body["logo_url"].endswith("/large.webp")
    image_id = body["logo_url"].split("/")[3]
    for size in ("original", "large", "medium", "thumb"):
        assert (_isolated_upload_dir / "merchants" / image_id / f"{size}.webp").exists()


@pytest.mark.asyncio
async def test_upload_logo_requires_auth(client: AsyncClient) -> None:
    resp = await client.post(
        "/api/v1/seller/profile/logo",
        files={"file": ("logo.jpg", make_test_image((100, 100)), "image/jpeg")},
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_upload_logo_rejects_invalid_mime(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    token = await _seller_with_merchant(client, db_session, "logo-mime@test.com")
    resp = await client.post(
        "/api/v1/seller/profile/logo",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("doc.pdf", b"%PDF-1.4 fake", "application/pdf")},
    )
    assert resp.status_code == 422
    assert "không được hỗ trợ" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_upload_logo_replaces_old(
    client: AsyncClient, db_session: AsyncSession, _isolated_upload_dir: Path
) -> None:
    """Uploading a second logo must delete the first folder on disk."""
    token = await _seller_with_merchant(client, db_session, "logo-replace@test.com")
    headers = {"Authorization": f"Bearer {token}"}

    first = await client.post(
        "/api/v1/seller/profile/logo",
        headers=headers,
        files={"file": ("a.jpg", make_test_image((200, 200)), "image/jpeg")},
    )
    assert first.status_code == 200
    old_id = first.json()["logo_url"].split("/")[3]
    old_folder = _isolated_upload_dir / "merchants" / old_id
    assert old_folder.exists()

    second = await client.post(
        "/api/v1/seller/profile/logo",
        headers=headers,
        files={"file": ("b.jpg", make_test_image((300, 300)), "image/jpeg")},
    )
    assert second.status_code == 200
    new_id = second.json()["logo_url"].split("/")[3]
    assert new_id != old_id
    assert not old_folder.exists(), "Old logo folder must be cleaned up on replace"
    assert (_isolated_upload_dir / "merchants" / new_id).exists()


@pytest.mark.asyncio
async def test_delete_logo_clears_field(
    client: AsyncClient, db_session: AsyncSession, _isolated_upload_dir: Path
) -> None:
    token = await _seller_with_merchant(client, db_session, "logo-del@test.com")
    headers = {"Authorization": f"Bearer {token}"}

    upload = await client.post(
        "/api/v1/seller/profile/logo",
        headers=headers,
        files={"file": ("logo.jpg", make_test_image((200, 200)), "image/jpeg")},
    )
    assert upload.status_code == 200
    image_id = upload.json()["logo_url"].split("/")[3]
    folder = _isolated_upload_dir / "merchants" / image_id
    assert folder.exists()

    delete = await client.delete("/api/v1/seller/profile/logo", headers=headers)
    assert delete.status_code == 200
    assert delete.json()["logo_url"] is None
    assert not folder.exists()


# ── Banner ────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_upload_banner_happy_path(
    client: AsyncClient, db_session: AsyncSession, _isolated_upload_dir: Path
) -> None:
    token = await _seller_with_merchant(client, db_session, "banner-seller@test.com")
    image = make_test_image((1600, 600))

    resp = await client.post(
        "/api/v1/seller/profile/banner",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("banner.jpg", image, "image/jpeg")},
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["banner_url"].startswith("/uploads/merchants/")
    assert body["logo_url"] is None, "banner upload must not touch logo_url"
    image_id = body["banner_url"].split("/")[3]
    assert (_isolated_upload_dir / "merchants" / image_id / "large.webp").exists()


@pytest.mark.asyncio
async def test_upload_banner_requires_auth(client: AsyncClient) -> None:
    resp = await client.post(
        "/api/v1/seller/profile/banner",
        files={"file": ("banner.jpg", make_test_image((400, 200)), "image/jpeg")},
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_logo_and_banner_independent(
    client: AsyncClient, db_session: AsyncSession, _isolated_upload_dir: Path
) -> None:
    """Replacing the banner must not delete the logo (or vice versa)."""
    token = await _seller_with_merchant(client, db_session, "indep@test.com")
    headers = {"Authorization": f"Bearer {token}"}

    logo_resp = await client.post(
        "/api/v1/seller/profile/logo",
        headers=headers,
        files={"file": ("l.jpg", make_test_image((200, 200)), "image/jpeg")},
    )
    logo_id = logo_resp.json()["logo_url"].split("/")[3]
    banner_resp = await client.post(
        "/api/v1/seller/profile/banner",
        headers=headers,
        files={"file": ("b.jpg", make_test_image((400, 200)), "image/jpeg")},
    )
    banner_id = banner_resp.json()["banner_url"].split("/")[3]
    assert logo_id != banner_id

    # Replace banner — logo folder must still exist
    await client.post(
        "/api/v1/seller/profile/banner",
        headers=headers,
        files={"file": ("b2.jpg", make_test_image((500, 250)), "image/jpeg")},
    )
    assert (_isolated_upload_dir / "merchants" / logo_id).exists()
    assert not (_isolated_upload_dir / "merchants" / banner_id).exists()


@pytest.mark.asyncio
async def test_upload_requires_merchant_profile(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """Seller without a merchant row gets a clear 404, not a 500."""
    await user_crud.create_user(
        db_session, "no-merchant@test.com", "pass", role=UserRole.seller
    )
    login = await client.post(
        "/api/v1/auth/login",
        data={"username": "no-merchant@test.com", "password": "pass"},
    )
    token = login.json()["access_token"]

    resp = await client.post(
        "/api/v1/seller/profile/logo",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("logo.jpg", make_test_image((100, 100)), "image/jpeg")},
    )
    assert resp.status_code == 404
