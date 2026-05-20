from PIL import Image

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
