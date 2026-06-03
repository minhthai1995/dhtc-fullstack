"""Facebook Messenger webhook handler — production-ready."""
from __future__ import annotations

import base64
import hashlib
import hmac
import json
import logging
import secrets as secrets_module

import httpx
from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    Header,
    HTTPException,
    Request,
    status,
)
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.db import AsyncSessionLocal, get_db
from app.crud import fb_profile as fb_profile_crud
from app.services.fb_graph_service import (
    fetch_messenger_profile_safe,
)
from app.services.proactive_reply_service import handle_feed_event

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/webhook", tags=["webhooks"])

FB_PAGE_TOKEN = settings.FACEBOOK_PAGE_ACCESS_TOKEN
FB_VERIFY_TOKEN = settings.FACEBOOK_WEBHOOK_VERIFY_TOKEN
FB_APP_SECRET = settings.FACEBOOK_APP_SECRET
FB_SEND_API = "https://graph.facebook.com/v19.0/me/messages"

# ── Signature verification ────────────────────────────────────────────────────

def _verify_signature(payload: bytes, signature: str) -> bool:
    """Verify X-Hub-Signature-256 from Facebook."""
    if not FB_APP_SECRET:
        return True  # Skip if not configured (dev mode)
    if not signature or not signature.startswith("sha256="):
        return False
    expected = hmac.new(FB_APP_SECRET.encode(), payload, hashlib.sha256).hexdigest()
    return hmac.compare_digest(f"sha256={expected}", signature)

# ── Webhook verification (GET) ────────────────────────────────────────────────

@router.get("/facebook")
async def verify_webhook(request: Request) -> int | str:
    params = request.query_params
    mode = params.get("hub.mode")
    token = params.get("hub.verify_token")
    challenge = params.get("hub.challenge")
    if mode == "subscribe" and token == FB_VERIFY_TOKEN:
        logger.info("[Webhook] Facebook webhook verified")
        return int(challenge) if challenge and challenge.isdigit() else challenge or ""
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Verification failed")

# ── Incoming events (POST) ────────────────────────────────────────────────────

class FBEntry(BaseModel):
    id: str
    messaging: list[dict] = []
    changes: list[dict] = []  # Page-level events (feed, mentions, etc.)

class FBWebhookBody(BaseModel):
    object: str
    entry: list[FBEntry] = []


# Page-level webhook fields routed to P5E proactive reply orchestrator.
# Extending this set requires Meta App Review for the matching permission.
ALLOWED_FIELDS: frozenset[str] = frozenset({"feed", "mentions"})

async def _bg_fetch_profile(psid: str, page_token: str, page_id: str) -> None:
    """Background task: open dedicated session, enrich PSID profile via Graph.

    Runs after the webhook response is sent so latency-sensitive Meta retries
    aren't blocked. Never raises — fetch_messenger_profile_safe swallows.
    """
    async with AsyncSessionLocal() as session:
        await fetch_messenger_profile_safe(
            psid, page_token, session, page_id=page_id
        )


def _profile_cache_fresh(profile: object | None) -> bool:
    """Cheap inline cache check so we skip scheduling when row is recent."""
    if profile is None:
        return False
    fetched_at = getattr(profile, "messenger_fetched_at", None)
    if fetched_at is None:
        return False
    from datetime import UTC, datetime, timedelta
    age = datetime.now(UTC).replace(tzinfo=None) - fetched_at
    return age < timedelta(days=settings.MESSENGER_PROFILE_CACHE_DAYS)


@router.post("/facebook", status_code=200)
async def handle_facebook_webhook(
    request: Request,
    body: FBWebhookBody,
    background_tasks: BackgroundTasks,
    x_hub_signature_256: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
) -> dict:
    raw = await request.body()
    if not _verify_signature(raw, x_hub_signature_256 or ""):
        raise HTTPException(status_code=403, detail="Invalid signature")

    if body.object != "page":
        return {"status": "ok"}

    from app.chatbot.agent import get_agent
    from app.models.chat_message import ChatMessage, MessageDirection, MessagePlatform

    agent = get_agent()

    for entry in body.entry:
        page_id: str = entry.id
        for event in entry.messaging:
            sender_id: str = event.get("sender", {}).get("id", "")
            if not sender_id:
                continue

            session_id = f"fb_sess_{sender_id}"

            # ── P5C profile enrichment ────────────────────────────────
            # First-seen / stale PSID → schedule Graph profile fetch.
            # Token check protects dev environments without FB creds.
            if FB_PAGE_TOKEN:
                cached = await fb_profile_crud.get_by_psid(db, sender_id)
                if not _profile_cache_fresh(cached):
                    background_tasks.add_task(
                        _bg_fetch_profile,
                        sender_id,
                        FB_PAGE_TOKEN,
                        page_id,
                    )

            # ── Postback ──────────────────────────────────────────────
            if "postback" in event:
                payload = event["postback"].get("payload", "")
                await _handle_postback(sender_id, payload)
                continue

            # ── Text messages ─────────────────────────────────────────
            msg = event.get("message", {})
            if msg.get("is_echo"):
                continue
            text: str = msg.get("text", "").strip()
            if not text:
                continue

            logger.info("[Messenger] %s: %r", sender_id, text[:80])

            # Save inbound message
            db.add(ChatMessage(
                session_id=session_id,
                fb_user_id=sender_id,
                direction=MessageDirection.inbound,
                platform=MessagePlatform.messenger,
                content=text,
            ))
            await db.commit()

            await _send_action(sender_id, "typing_on")

            try:
                response = await agent.chat(
                    message=text,
                    user_id=f"fb_{sender_id}",
                    session_id=session_id,
                )
            except Exception as exc:
                logger.error("[Chatbot] Error: %s", exc)
                response = "Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau ít phút."

            # Save outbound response
            db.add(ChatMessage(
                session_id=session_id,
                fb_user_id=sender_id,
                direction=MessageDirection.outbound,
                platform=MessagePlatform.messenger,
                content=response,
            ))
            await db.commit()

            await _send_text(sender_id, response)

        # ── P5E proactive reply on page-level events (feed, mentions) ────
        # Each change is {"field": "feed", "value": {...}}. The orchestrator
        # owns dedup, rate limit, cooldown, dry-run, and audit — we just
        # filter by allowed field and dispatch.
        for change in entry.changes:
            field = change.get("field")
            if field not in ALLOWED_FIELDS:
                continue
            try:
                await handle_feed_event(change, page_id=page_id, db=db)
            except Exception:
                # Never crash the webhook on a single bad event — Meta
                # would retry the whole batch and likely double-fire it.
                logger.exception(
                    "proactive reply failed page_id=%s field=%s", page_id, field
                )

    return {"status": "ok"}

# ── Postback handler ──────────────────────────────────────────────────────────

WELCOME_TEXT = (
    "Chào mừng bạn đến với Chợ Đêm Sơn Trà — Đà Nẵng! 🌙\n\n"
    "Tôi có thể giúp bạn:\n"
    "• Giờ mở cửa & địa chỉ\n"
    "• Gian hàng ẩm thực & thủ công\n"
    "• Sự kiện & hoạt động tại chợ\n"
    "• Hướng dẫn di chuyển\n\n"
    "Bạn muốn biết thêm gì về chợ đêm?"
)

async def _handle_postback(sender_id: str, payload: str) -> None:
    if payload in ("GET_STARTED", "GREETING"):
        await _send_text(sender_id, WELCOME_TEXT)
        await _send_quick_replies(
            sender_id,
            "Chọn thông tin bạn cần:",
            [
                {"content_type": "text", "title": "🕕 Giờ mở cửa", "payload": "INFO_HOURS"},
                {
                    "content_type": "text",
                    "title": "📍 Địa chỉ & đường đi",
                    "payload": "INFO_LOCATION",
                },
                {"content_type": "text", "title": "🍜 Ẩm thực", "payload": "INFO_FOOD"},
                {"content_type": "text", "title": "🎪 Sự kiện", "payload": "INFO_EVENTS"},
            ],
        )
    elif payload == "INFO_HOURS":
        await _send_text(
            sender_id,
            "🕕 Chợ Đêm Sơn Trà mở cửa hàng ngày từ 18:00 – 23:00,"
            " kể cả cuối tuần và ngày lễ. Vào cửa miễn phí!"
        )
    elif payload == "INFO_LOCATION":
        await _send_text(
            sender_id,
            "📍 Địa chỉ: 975 Ngô Quyền, An Hải Bắc, Sơn Trà, Đà Nẵng."
            "\nCách trung tâm ~5km, có bãi giữ xe miễn phí."
        )
    elif payload == "INFO_FOOD":
        await _send_text(
            sender_id,
            "🍜 Chợ có hơn 100 gian hàng ẩm thực: bánh tráng cuốn thịt heo,"
            " mì Quảng, bún mắm, hải sản tươi, chè, và nhiều đặc sản Đà Nẵng khác!"
        )
    elif payload == "INFO_EVENTS":
        await _send_text(
            sender_id,
            "🎪 Chợ thường xuyên tổ chức biểu diễn nghệ thuật dân gian,"
            " âm nhạc đường phố và các sự kiện văn hóa cuối tuần."
            " Nhắn tin để biết lịch cụ thể nhé!"
        )

# ── Facebook Graph API helpers ────────────────────────────────────────────────

async def _send_action(recipient_id: str, action: str) -> None:
    if not FB_PAGE_TOKEN:
        return
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            await client.post(
                FB_SEND_API,
                params={"access_token": FB_PAGE_TOKEN},
                json={"recipient": {"id": recipient_id}, "sender_action": action},
            )
    except Exception:
        pass

async def _send_text(recipient_id: str, text: str) -> bool:
    if not FB_PAGE_TOKEN:
        logger.warning("[Messenger] PAGE_TOKEN not set — skipping send")
        return False
    chunks = [text[i: i + 640] for i in range(0, len(text), 640)]
    async with httpx.AsyncClient(timeout=10) as client:
        for chunk in chunks:
            try:
                resp = await client.post(
                    FB_SEND_API,
                    params={"access_token": FB_PAGE_TOKEN},
                    json={
                        "messaging_type": "RESPONSE",
                        "recipient": {"id": recipient_id},
                        "message": {"text": chunk},
                    },
                )
                if resp.status_code != 200:
                    logger.error("[Messenger] Send failed %d: %s", resp.status_code, resp.text)
                    return False
            except Exception as exc:
                logger.error("[Messenger] HTTP error: %s", exc)
                return False
    return True

async def _send_quick_replies(recipient_id: str, text: str, replies: list[dict]) -> None:
    if not FB_PAGE_TOKEN:
        return
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            await client.post(
                FB_SEND_API,
                params={"access_token": FB_PAGE_TOKEN},
                json={
                    "messaging_type": "RESPONSE",
                    "recipient": {"id": recipient_id},
                    "message": {"text": text, "quick_replies": replies},
                },
            )
    except Exception as exc:
        logger.error("[Messenger] Quick replies error: %s", exc)

# ── Facebook Setup API (call once to register Get Started + Persistent Menu) ──

@router.post("/facebook/setup")
async def setup_messenger_profile() -> dict:
    """
    Register Get Started button and Persistent Menu on the Fanpage.
    Call this once after configuring FACEBOOK_PAGE_ACCESS_TOKEN.
    """
    if not FB_PAGE_TOKEN:
        return {"error": "FACEBOOK_PAGE_ACCESS_TOKEN not configured"}

    profile_url = "https://graph.facebook.com/v19.0/me/messenger_profile"
    payload = {
        "get_started": {"payload": "GET_STARTED"},
        "greeting": [
            {
                "locale": "default",
                "text": (
                    "Hi {{user_first_name}}! Welcome to Son Tra Night Market 🌙"
                    " Ask me anything about the market!"
                ),
            },
            {
                "locale": "vi_VN",
                "text": (
                    "Chào {{user_first_name}}! Tôi là trợ lý của Chợ Đêm Sơn Trà 🌙"
                    " Hỏi tôi bất cứ điều gì về chợ nhé!"
                ),
            }
        ],
        "persistent_menu": [
            {
                "locale": "default",
                "composer_input_disabled": False,
                "call_to_actions": [
                    {"type": "postback", "title": "🕕 Giờ mở cửa", "payload": "INFO_HOURS"},
                    {
                        "type": "postback",
                        "title": "📍 Địa chỉ & đường đi",
                        "payload": "INFO_LOCATION",
                    },
                    {"type": "postback", "title": "🍜 Ẩm thực & gian hàng", "payload": "INFO_FOOD"},
                ],
            }
        ],
    }

    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(
            profile_url,
            params={"access_token": FB_PAGE_TOKEN},
            json=payload,
        )
    result = resp.json()
    logger.info("[Webhook] Messenger profile setup: %s", result)
    return result

# ── Test endpoint (no Facebook credentials needed) ───────────────────────────

@router.post("/facebook/test-chat")
async def test_chat(body: dict) -> dict:
    """Test chatbot without Facebook. POST {"message": "...", "user_id": "..."}"""
    from app.chatbot.agent import get_agent
    agent = get_agent()
    message: str = body.get("message", "")
    user_id: str = body.get("user_id", "test_user")
    if not message:
        return {"error": "message field required"}
    response = await agent.chat(
        message=message,
        user_id=user_id,
        session_id=f"test_{user_id}",
    )
    return {"response": response, "user_id": user_id}

# ── Health check ──────────────────────────────────────────────────────────────

@router.get("/facebook/status")
async def webhook_status() -> dict:
    """Return webhook configuration status (no secrets exposed)."""
    if settings.OPENROUTER_API_KEY:
        ai_provider = f"OpenRouter ({settings.OPENROUTER_MODEL})"
    elif settings.ANTHROPIC_API_KEY:
        ai_provider = "Anthropic (claude-haiku-4-5)"
    else:
        ai_provider = "chưa cấu hình"
    return {
        "page_token_configured": bool(FB_PAGE_TOKEN),
        "app_secret_configured": bool(FB_APP_SECRET),
        "verify_token": FB_VERIFY_TOKEN,
        "webhook_url": "/api/v1/webhook/facebook",
        "agno_available": _agno_status(),
        "ai_provider": ai_provider,
    }

def _agno_status() -> str:
    try:
        from agno.agent import Agent  # noqa: F401
        return "available"
    except ImportError:
        return "fallback (HTTP)"


# ── Facebook Data Deletion Callback ──────────────────────────────────────────
# Required for Meta App Review.
# Spec: developers.facebook.com/docs/development/create-an-app/app-dashboard/data-deletion-callback

def _b64url_decode(s: str) -> bytes:
    s += "=" * (-len(s) % 4)
    return base64.urlsafe_b64decode(s)


def _parse_and_verify_signed_request(signed_request: str) -> str | None:
    """Verify HMAC-SHA256 signature and return fb_user_id, or None on failure."""
    try:
        encoded_sig, payload_part = signed_request.split(".", 1)
        sig = _b64url_decode(encoded_sig)
        data: dict = json.loads(_b64url_decode(payload_part))
    except Exception:
        return None

    if data.get("algorithm", "").upper() != "HMAC-SHA256":
        return None

    if not FB_APP_SECRET:
        logger.warning("[DataDeletion] APP_SECRET not set — skipping signature verify (dev mode)")
        return data.get("user_id")

    expected = hmac.new(FB_APP_SECRET.encode(), payload_part.encode(), hashlib.sha256).digest()
    if not hmac.compare_digest(expected, sig):
        return None

    return data.get("user_id")


async def _delete_fb_user_data(db: AsyncSession, fb_user_id: str) -> str:
    """Delete all FB-linked data for fb_app_user_id. Returns confirmation_code."""
    from sqlalchemy import delete, select

    from app.models.chat_message import ChatMessage
    from app.models.fb_profile import FBProfile

    result = await db.execute(
        select(FBProfile).where(FBProfile.fb_app_user_id == fb_user_id)
    )
    profile = result.scalar_one_or_none()

    if profile and profile.messenger_psid:
        await db.execute(
            delete(ChatMessage).where(ChatMessage.fb_user_id == profile.messenger_psid)
        )

    if profile:
        await db.delete(profile)

    code = secrets_module.token_urlsafe(16)
    await db.commit()
    logger.info("[DataDeletion] Deleted FB data fb_user_id=%s code=%s", fb_user_id, code)
    return code


@router.post("/facebook/data-deletion")
async def facebook_data_deletion(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Facebook Data Deletion Callback — bắt buộc cho Meta App Review.

    Meta POST form data với signed_request khi user xóa app data.
    Returns confirmation_code + status URL.
    """
    form = await request.form()
    signed_request: str = form.get("signed_request", "")  # type: ignore[assignment]
    if not signed_request:
        raise HTTPException(status_code=400, detail="Missing signed_request")

    fb_user_id = _parse_and_verify_signed_request(signed_request)
    if fb_user_id is None:
        raise HTTPException(status_code=400, detail="Invalid signed_request")

    confirmation_code = await _delete_fb_user_data(db, fb_user_id)
    status_url = (
        f"{settings.FRONTEND_URL}/data-deletion?code={confirmation_code}"
    )
    return {"url": status_url, "confirmation_code": confirmation_code}
