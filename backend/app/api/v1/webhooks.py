"""Facebook Messenger webhook handler — production-ready."""
from __future__ import annotations

import hashlib
import hmac
import logging

import httpx
from fastapi import APIRouter, Header, HTTPException, Request, status
from pydantic import BaseModel

from app.core.config import settings
from app.core.db import get_db

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

class FBWebhookBody(BaseModel):
    object: str
    entry: list[FBEntry] = []

@router.post("/facebook", status_code=200)
async def handle_facebook_webhook(
    request: Request,
    body: FBWebhookBody,
    x_hub_signature_256: str | None = Header(default=None),
) -> dict:
    raw = await request.body()
    if not _verify_signature(raw, x_hub_signature_256 or ""):
        raise HTTPException(status_code=403, detail="Invalid signature")

    if body.object != "page":
        return {"status": "ok"}

    from app.chatbot.agent import get_agent
    from app.models.chat_message import ChatMessage, MessageDirection, MessagePlatform

    agent = get_agent()

    async for db in get_db():
        for entry in body.entry:
            for event in entry.messaging:
                sender_id: str = event.get("sender", {}).get("id", "")
                if not sender_id:
                    continue

                session_id = f"fb_sess_{sender_id}"

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

    return {"status": "ok"}

# ── Postback handler ──────────────────────────────────────────────────────────

WELCOME_TEXT = (
    "Chào mừng bạn đến với DHTC Marketplace — sàn đặc sản Việt Nam! 🌿\n\n"
    "Tôi có thể giúp bạn:\n"
    "• Tìm sản phẩm đặc sản\n"
    "• Tư vấn về cà phê, hồ tiêu, xoài, điều, mật ong…\n"
    "• Giải đáp chính sách đổi trả, thanh toán\n\n"
    "Bạn muốn tìm hiểu về sản phẩm nào?"
)

async def _handle_postback(sender_id: str, payload: str) -> None:
    if payload in ("GET_STARTED", "GREETING"):
        await _send_text(sender_id, WELCOME_TEXT)
        await _send_quick_replies(
            sender_id,
            "Chọn chủ đề bạn quan tâm:",
            [
                {"content_type": "text", "title": "☕ Cà phê", "payload": "CAT_COFFEE"},
                {"content_type": "text", "title": "🌶️ Hồ tiêu", "payload": "CAT_PEPPER"},
                {"content_type": "text", "title": "🍋 Trái cây sấy", "payload": "CAT_DRIED"},
                {"content_type": "text", "title": "📦 Tra cứu đơn hàng", "payload": "ORDER_LOOKUP"},
            ],
        )
    elif payload.startswith("CAT_"):
        cat_map = {
            "CAT_COFFEE": "cà phê",
            "CAT_PEPPER": "hồ tiêu",
            "CAT_DRIED": "trái cây sấy",
            "CAT_HONEY": "mật ong",
        }
        keyword = cat_map.get(payload, "đặc sản")
        from app.chatbot.agent import get_agent
        agent = get_agent()
        response = await agent.chat(
            message=f"Tìm sản phẩm {keyword}",
            user_id=f"fb_{sender_id}",
            session_id=f"fb_sess_{sender_id}",
        )
        await _send_text(sender_id, response)
    elif payload == "ORDER_LOOKUP":
        await _send_text(
            sender_id,
            "Để tra cứu đơn hàng, vui lòng cung cấp mã đơn hàng (ví dụ: #123) "
            "hoặc email đặt hàng của bạn."
        )
    elif payload == "RETURN_POLICY":
        await _send_text(
            sender_id,
            "Chính sách đổi trả DHTC:\n"
            "• Đổi trả trong vòng 7 ngày kể từ khi nhận hàng\n"
            "• Sản phẩm còn nguyên vẹn, chưa qua sử dụng\n"
            "• Liên hệ qua Messenger hoặc email support@dhtc.vn\n"
            "• Hoàn tiền trong 3-5 ngày làm việc"
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
                "text": "Chào {{user_first_name}}! DHTC Marketplace — Đặc sản Việt Nam chính gốc 🌿"
            },
            {
                "locale": "vi_VN",
                "text": (
                    "Chào {{user_first_name}}! Tôi là trợ lý AI của DHTC"
                    " — sàn đặc sản Việt Nam. Nhắn tin để được tư vấn ngay!"
                ),
            }
        ],
        "persistent_menu": [
            {
                "locale": "default",
                "composer_input_disabled": False,
                "call_to_actions": [
                    {"type": "postback", "title": "☕ Tìm sản phẩm", "payload": "CAT_COFFEE"},
                    {"type": "postback", "title": "📦 Tra cứu đơn hàng", "payload": "ORDER_LOOKUP"},
                    {
                        "type": "postback",
                        "title": "🔄 Chính sách đổi trả",
                        "payload": "RETURN_POLICY",
                    },
                    {
                        "type": "web_url",
                        "title": "🛒 Vào DHTC Marketplace",
                        "url": "https://dhtc.vn",
                        "webview_height_ratio": "full",
                    },
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
