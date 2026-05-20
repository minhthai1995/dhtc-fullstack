"""Integration tests for product image upload endpoints (P3)."""
from __future__ import annotations

from pathlib import Path

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.crud import user as user_crud
from app.models.user import UserRole
from tests.conftest import make_test_image


async def _seller_token(client: AsyncClient, db_session: AsyncSession, email: str) -> str:
    await user_crud.create_user(db_session, email, "sellerpass", role=UserRole.seller)
    login = await client.post(
        "/api/v1/auth/login", data={"username": email, "password": "sellerpass"}
    )
    assert login.status_code == 200, login.text
    return login.json()["access_token"]


@pytest.fixture(autouse=True)
def _isolated_upload_dir(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    """Redirect UPLOAD_DIR to a per-test tmp_path so disk writes don't leak."""
    monkeypatch.setattr(settings, "UPLOAD_DIR", tmp_path)
    return tmp_path


@pytest.mark.asyncio
async def test_upload_happy_path(
    client: AsyncClient, db_session: AsyncSession, _isolated_upload_dir: Path
) -> None:
    token = await _seller_token(client, db_session, "happy-seller@test.com")
    image = make_test_image((400, 300))

    resp = await client.post(
        "/api/v1/products/images",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("photo.jpg", image, "image/jpeg")},
    )

    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert set(body["urls"].keys()) == {"original", "large", "medium", "thumb"}
    image_id = body["id"]
    for size in ("original", "large", "medium", "thumb"):
        assert (_isolated_upload_dir / "products" / image_id / f"{size}.webp").exists()


@pytest.mark.asyncio
async def test_upload_requires_auth(client: AsyncClient) -> None:
    image = make_test_image((200, 200))
    resp = await client.post(
        "/api/v1/products/images",
        files={"file": ("photo.jpg", image, "image/jpeg")},
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_upload_rejects_oversized(
    client: AsyncClient,
    db_session: AsyncSession,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Threshold logic — shrink MAX_UPLOAD_BYTES so a normal JPEG trips it."""
    monkeypatch.setattr(settings, "MAX_UPLOAD_BYTES", 500)
    token = await _seller_token(client, db_session, "big-seller@test.com")
    image = make_test_image((400, 400))
    assert len(image) > 500

    resp = await client.post(
        "/api/v1/products/images",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("photo.jpg", image, "image/jpeg")},
    )
    assert resp.status_code == 422
    assert "quá lớn" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_upload_rejects_invalid_mime(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    token = await _seller_token(client, db_session, "bad-mime-seller@test.com")
    resp = await client.post(
        "/api/v1/products/images",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("doc.pdf", b"%PDF-1.4 fake", "application/pdf")},
    )
    assert resp.status_code == 422
    assert "không được hỗ trợ" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_upload_rejects_malformed_image(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """JPEG content-type but garbage bytes — Pillow verify() must reject."""
    token = await _seller_token(client, db_session, "malformed-seller@test.com")
    resp = await client.post(
        "/api/v1/products/images",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("fake.jpg", b"NOT_REALLY_AN_IMAGE" * 50, "image/jpeg")},
    )
    assert resp.status_code == 422
    assert "không phải ảnh hợp lệ" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_delete_image_idempotent(
    client: AsyncClient, db_session: AsyncSession, _isolated_upload_dir: Path
) -> None:
    token = await _seller_token(client, db_session, "delete-seller@test.com")
    headers = {"Authorization": f"Bearer {token}"}

    upload = await client.post(
        "/api/v1/products/images",
        headers=headers,
        files={"file": ("photo.jpg", make_test_image((200, 200)), "image/jpeg")},
    )
    assert upload.status_code == 201
    image_id = upload.json()["id"]
    folder = _isolated_upload_dir / "products" / image_id
    assert folder.exists()

    first = await client.delete(
        f"/api/v1/products/images/{image_id}", headers=headers
    )
    assert first.status_code == 204
    assert not folder.exists()

    # Idempotent: deleting again still returns 204
    second = await client.delete(
        f"/api/v1/products/images/{image_id}", headers=headers
    )
    assert second.status_code == 204


@pytest.mark.asyncio
async def test_delete_blocks_path_traversal(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    token = await _seller_token(client, db_session, "traversal-seller@test.com")
    resp = await client.delete(
        "/api/v1/products/images/..%2Fescape",
        headers={"Authorization": f"Bearer {token}"},
    )
    # FastAPI may 404 the path, or service raises 400 — both block traversal
    assert resp.status_code in (400, 404)


@pytest.mark.asyncio
async def test_upload_exif_rotation_applied(
    client: AsyncClient, db_session: AsyncSession, _isolated_upload_dir: Path
) -> None:
    """EXIF orientation 6 = rotate 90° CCW — saved image must end up upright.

    Source: 400 wide × 200 tall, with orientation=6 marker. After
    exif_transpose, dimensions should swap to (200 wide × 400 tall)."""
    from PIL import Image as PILImage

    exif = PILImage.Exif()
    exif[0x0112] = 6  # ExifTags.Base.Orientation = rotate 270° CW (i.e. CCW 90°)
    raw = make_test_image((400, 200), exif=exif.tobytes())

    token = await _seller_token(client, db_session, "exif-seller@test.com")
    resp = await client.post(
        "/api/v1/products/images",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("rotated.jpg", raw, "image/jpeg")},
    )
    assert resp.status_code == 201, resp.text
    image_id = resp.json()["id"]
    original_path = _isolated_upload_dir / "products" / image_id / "original.webp"
    with PILImage.open(original_path) as img:
        # After transpose: raw 400×200 landscape → upright 200×400 portrait.
        # ImageOps.contain may rescale, but height > width must hold.
        w, h = img.size
        assert h > w, f"EXIF rotation not applied — got {w}×{h}, expected portrait"
