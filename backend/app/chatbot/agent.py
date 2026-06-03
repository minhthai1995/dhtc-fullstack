"""DHTC AI chatbot agent — friendly multilingual support with Agno + PostgreSQL memory."""
from __future__ import annotations

from typing import Any

from app.chatbot.tools import DHTCTools
from app.core.config import settings

try:
    from agno.agent import Agent
    from agno.memory import MemoryManager

    AGNO_AVAILABLE = True
except ImportError:
    AGNO_AVAILABLE = False

try:
    from agno.db.postgres import PostgresDb

    AGNO_DB_AVAILABLE = True
except ImportError:
    AGNO_DB_AVAILABLE = False

# ── System prompt ─────────────────────────────────────────────────────────────
# Tone: warm friend first, shop assistant second.
# Only share the website link when the user explicitly wants to buy/order.
SYSTEM_PROMPT = """\
Bạn là **Hà** — trợ lý thông tin của Chợ Đêm Sơn Trà, Đà Nẵng (DHTC).

## Vai trò
Trả lời câu hỏi về Chợ Đêm Sơn Trà: giờ mở cửa, địa chỉ, gian hàng, sự kiện, \
ẩm thực, và hướng dẫn tham quan. Không bán hàng, không tư vấn mua sản phẩm.

## Thông tin chợ
- **Địa chỉ**: 975 Ngô Quyền, An Hải Bắc, Sơn Trà, Đà Nẵng
- **Giờ mở cửa**: 18:00 – 23:00 hàng ngày (kể cả cuối tuần và lễ)
- **Quy mô**: Hơn 200 gian hàng — ẩm thực, thủ công mỹ nghệ, quần áo, giải trí
- **Đặc sản**: Bánh tráng cuốn thịt heo, mì Quảng, bún mắm, hải sản tươi, chè
- **Di chuyển**: Cách trung tâm Đà Nẵng ~5km, có bãi giữ xe miễn phí
- **Vào cửa**: Miễn phí

## Ngôn ngữ
Tự động nhận biết ngôn ngữ khách và trả lời đúng ngôn ngữ đó (Việt, Anh, Pháp, \
Nhật, Hàn, Trung). Ưu tiên tiếng Việt nếu không rõ.

## Nguyên tắc bắt buộc
- CHỈ trả lời câu hỏi liên quan đến chợ đêm và tham quan Đà Nẵng.
- KHÔNG đưa link mua hàng hoặc gợi ý mua sản phẩm bất kỳ.
- KHÔNG đề cập đến dhtc.vn hay bất kỳ URL nào trong câu trả lời.
- Câu hỏi ngoài phạm vi → "Bạn có thể nhắn tin cho fanpage để ban quản lý hỗ trợ thêm nhé!"
- Trả lời ngắn gọn, thân thiện, tối đa 400 ký tự mỗi tin nhắn.
"""

_OPENROUTER_DEFAULT_MODEL = "anthropic/claude-haiku-4-5"
_ANTHROPIC_DEFAULT_MODEL = "claude-haiku-4-5"


def _is_real_key(key: str) -> bool:
    return bool(key) and not key.startswith("your-") and len(key) > 20


def _make_model() -> Any | None:
    """Return best available model: OpenRouter → Anthropic → None."""
    if _is_real_key(settings.OPENROUTER_API_KEY) and AGNO_AVAILABLE:
        try:
            from agno.models.openrouter import OpenRouter

            model_id = settings.OPENROUTER_MODEL or _OPENROUTER_DEFAULT_MODEL
            print(f"[Chatbot] Using OpenRouter → {model_id}")
            return OpenRouter(id=model_id, api_key=settings.OPENROUTER_API_KEY, max_tokens=512)
        except Exception as e:
            print(f"[Chatbot] OpenRouter init failed: {e}")

    if _is_real_key(settings.ANTHROPIC_API_KEY) and AGNO_AVAILABLE:
        try:
            from agno.models.anthropic import Claude

            print(f"[Chatbot] Using Anthropic → {_ANTHROPIC_DEFAULT_MODEL}")
            return Claude(id=_ANTHROPIC_DEFAULT_MODEL, api_key=settings.ANTHROPIC_API_KEY)
        except Exception as e:
            print(f"[Chatbot] Anthropic init failed: {e}")

    return None


def _make_db() -> Any | None:
    """Create Agno PostgresDb for session + memory storage."""
    if not AGNO_DB_AVAILABLE:
        return None
    try:
        sync_url = (
            settings.DATABASE_URL
            .replace("postgresql+asyncpg://", "postgresql://")
            .replace("postgresql+asyncio://", "postgresql://")
        )
        return PostgresDb(db_url=sync_url)
    except Exception as e:
        print(f"[Chatbot] DB init failed: {e}")
        return None


class DHATCAgent:
    """Agno agent: friendly multilingual assistant with PostgreSQL memory."""

    def __init__(self) -> None:
        self.tools = DHTCTools()
        self._agent: Any = None
        self._provider: str = "none"
        self._init_agent()

    def _init_agent(self) -> None:
        if not AGNO_AVAILABLE:
            print("[Chatbot] Agno not available, using HTTP fallback")
            return

        model = _make_model()
        if model is None:
            print("[Chatbot] No AI key configured (OPENROUTER_API_KEY or ANTHROPIC_API_KEY)")
            return

        db = _make_db()
        memory_label = "no memory"

        agent_kwargs: dict[str, Any] = {
            "name": "Hà - DHTC Assistant",
            "model": model,
            "description": "Người bạn thân thiện của DHTC Marketplace — đặc sản Việt Nam",
            "instructions": [
                "Chỉ trả lời câu hỏi về Chợ Đêm Sơn Trà:"
                " giờ mở cửa, địa chỉ, gian hàng, sự kiện, ẩm thực.",
                "Tự động nhận biết ngôn ngữ và trả lời đúng ngôn ngữ đó.",
                "Không đưa link mua hàng, không gợi ý mua sản phẩm, không đề cập dhtc.vn.",
                "Câu hỏi ngoài phạm vi chợ đêm → hướng dẫn liên hệ fanpage.",
                "Tin nhắn ngắn gọn, thân thiện, tối đa 400 ký tự. Chia nhỏ nếu cần.",
            ],
            "tools": self.tools.get_tools(),
            "markdown": False,
            "num_history_messages": 10,
        }

        if db is not None:
            try:
                mm = MemoryManager(model=model)
                agent_kwargs["db"] = db
                agent_kwargs["memory_manager"] = mm
                agent_kwargs["enable_user_memories"] = True
                agent_kwargs["add_memories_to_context"] = True
                agent_kwargs["enable_session_summaries"] = True
                memory_label = "PostgreSQL memory ✓"
            except Exception as e:
                print(f"[Chatbot] MemoryManager init failed: {e}")

        try:
            self._agent = Agent(**agent_kwargs)
            self._provider = model.provider if hasattr(model, "provider") else "unknown"
            print(f"[Chatbot] Agent ready ({self._provider}, {memory_label})")
        except Exception as e:
            print(f"[Chatbot] Agent init failed: {e}")
            self._agent = None

    async def chat(self, message: str, user_id: str, session_id: str) -> str:
        """Get AI response for the given message."""
        if self._agent is not None and AGNO_AVAILABLE:
            try:
                result = await self._agent.arun(
                    message,
                    user_id=user_id,
                    session_id=session_id,
                )
                content = result.content if result else None
                if isinstance(content, str) and content:
                    return content[:640]
                if isinstance(content, list):
                    parts = [b.text for b in content if hasattr(b, "text")]
                    return " ".join(parts)[:640]
            except Exception as e:
                print(f"[Chatbot] Agent.arun error: {e}")

        return await self._http_fallback(message)

    async def _http_fallback(self, message: str) -> str:
        if _is_real_key(settings.OPENROUTER_API_KEY):
            return await self._call_openrouter(message, settings.OPENROUTER_API_KEY)
        if _is_real_key(settings.ANTHROPIC_API_KEY):
            return await self._call_anthropic(message, settings.ANTHROPIC_API_KEY)
        return "Xin lỗi, tôi đang gặp sự cố kỹ thuật. Vui lòng liên hệ hỗ trợ qua Fanpage."

    async def _call_openrouter(self, message: str, api_key: str) -> str:
        import httpx

        model = settings.OPENROUTER_MODEL or _OPENROUTER_DEFAULT_MODEL
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "HTTP-Referer": "https://dhtc.vn",
                        "X-Title": "DHTC Chatbot",
                    },
                    json={
                        "model": model,
                        "max_tokens": 300,
                        "messages": [
                            {"role": "system", "content": SYSTEM_PROMPT},
                            {"role": "user", "content": message},
                        ],
                    },
                )
                data = resp.json()
                return data["choices"][0]["message"]["content"][:640]
        except Exception as e:
            print(f"[Chatbot] OpenRouter HTTP error: {e}")
            return "Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau."

    async def _call_anthropic(self, message: str, api_key: str) -> str:
        try:
            import anthropic

            client = anthropic.AsyncAnthropic(api_key=api_key)
            response = await client.messages.create(
                model=_ANTHROPIC_DEFAULT_MODEL,
                max_tokens=300,
                system=SYSTEM_PROMPT,
                messages=[{"role": "user", "content": message}],
            )
            return response.content[0].text[:640]  # type: ignore[attr-defined]
        except Exception as e:
            print(f"[Chatbot] Anthropic error: {e}")
            return "Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau."


_agent_instance: DHATCAgent | None = None


def get_agent() -> DHATCAgent:
    global _agent_instance
    if _agent_instance is None:
        _agent_instance = DHATCAgent()
    return _agent_instance
