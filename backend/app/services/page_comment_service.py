"""Post comments on Facebook posts as the Page (P5E).

Wraps:
    POST /{graph_version}/{post_id}/comments
    body: { message, access_token }

Requires Page Access Token with pages_manage_engagement (Advanced Access
after Meta App Review).

The page_token argument MUST come from settings.FACEBOOK_PAGE_ACCESS_TOKEN
loaded from .env. It is never logged.
"""
from __future__ import annotations

import logging

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

COMMENT_TIMEOUT_SECONDS = 10.0


class PageCommentError(RuntimeError):
    """Raised when Graph rejects a comment post (HTTP != 200 or no id)."""

    def __init__(
        self,
        message: str,
        *,
        http_status: int | None,
        error_code: int | None = None,
        error_subcode: int | None = None,
    ) -> None:
        super().__init__(message)
        self.http_status = http_status
        self.error_code = error_code
        self.error_subcode = error_subcode


async def post_comment(
    *,
    post_id: str,
    message: str,
    page_token: str,
) -> str:
    """Post a comment on the given post. Returns the new comment id.

    Raises PageCommentError on Graph failure; caller decides whether to
    audit + retry. Network timeouts surface as httpx exceptions and should
    be wrapped by the orchestrator (so the webhook handler stays clean).
    """
    endpoint = (
        f"https://graph.facebook.com/{settings.FACEBOOK_GRAPH_API_VERSION}"
        f"/{post_id}/comments"
    )
    payload = {"message": message, "access_token": page_token}

    async with httpx.AsyncClient(timeout=COMMENT_TIMEOUT_SECONDS) as client:
        resp = await client.post(endpoint, data=payload)

    try:
        data = resp.json()
    except ValueError:
        data = {}

    if resp.status_code == 200 and isinstance(data.get("id"), str):
        return data["id"]

    err = data.get("error") or {}
    logger.warning(
        "page_comment failed post_id=%s http=%s code=%s",
        post_id,
        resp.status_code,
        err.get("code"),
    )
    raise PageCommentError(
        err.get("message") or f"comment http_{resp.status_code}",
        http_status=resp.status_code,
        error_code=err.get("code"),
        error_subcode=err.get("error_subcode"),
    )
