from io import BytesIO
from pathlib import Path
from uuid import uuid4

from PIL import Image, ImageOps, UnidentifiedImageError

from app.core.config import settings
from app.schemas.product_image import ProductImageOut, ProductImageUrls

SIZES: dict[str, tuple[int, int, int]] = {
    "original": (1600, 1600, 85),
    "large": (800, 800, 85),
    "medium": (400, 400, 80),
    "thumb": (200, 200, 75),
}

ALLOWED_MIME: set[str] = {"image/jpeg", "image/png", "image/webp", "image/heic"}

Image.MAX_IMAGE_PIXELS = 50_000_000


class ImageValidationError(ValueError):
    """Raised when uploaded file fails MIME/size/format validation (HTTP 422)."""


def process_upload(content: bytes, upload_dir: Path) -> ProductImageOut:
    """Validate, auto-orient, transcode to 4 WebP sizes. Returns persisted URLs."""
    if len(content) > settings.MAX_UPLOAD_BYTES:
        kb = len(content) // 1024
        raise ImageValidationError(f"Ảnh quá lớn ({kb}KB) — tối đa 2MB")

    try:
        verifier = Image.open(BytesIO(content))
        verifier.verify()
        img = Image.open(BytesIO(content))
    except (UnidentifiedImageError, OSError) as e:
        raise ImageValidationError("File không phải ảnh hợp lệ") from e

    img = ImageOps.exif_transpose(img)
    if img.mode in ("RGBA", "P", "LA"):
        img = img.convert("RGB")

    image_id = str(uuid4())
    folder = upload_dir / image_id
    folder.mkdir(parents=True, exist_ok=True)

    urls: dict[str, str] = {}
    for size_name, (width, height, quality) in SIZES.items():
        resized = ImageOps.contain(img, (width, height))
        path = folder / f"{size_name}.webp"
        resized.save(path, format="WEBP", quality=quality, method=6)
        urls[size_name] = f"/uploads/products/{image_id}/{size_name}.webp"

    return ProductImageOut(id=image_id, urls=ProductImageUrls(**urls), order=0)


def delete_image(image_id: str, upload_dir: Path) -> bool:
    """Delete all WebP variants + folder for an image_id. Idempotent — returns
    True if anything was deleted, False if folder didn't exist."""
    folder = (upload_dir / image_id).resolve()
    base = upload_dir.resolve()
    if base not in folder.parents:
        raise ImageValidationError("Invalid image_id path")

    if not folder.exists() or not folder.is_dir():
        return False

    for entry in folder.iterdir():
        if entry.is_file():
            entry.unlink()
    folder.rmdir()
    return True
