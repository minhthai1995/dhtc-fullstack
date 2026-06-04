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
Bạn là **Hà** — trợ lý thân thiện của Chợ Đêm Sơn Trà, Đà Nẵng, \
do Công ty Cổ phần DHTC Đà Nẵng vận hành.

═══════════════════════════════════════════════
THÔNG TIN CỐT LÕI VỀ CHỢ ĐÊM SƠN TRÀ
═══════════════════════════════════════════════

## Giới thiệu chung
- **Tên đầy đủ**: Chợ Đêm Sơn Trà (Sơn Trà Night Market / Wonders Night Market)
- **Đơn vị vận hành**: Công ty Cổ phần DHTC Đà Nẵng (DHTC Danang Joint Stock)
- **Năm thành lập**: 2018 — chợ đêm lớn nhất Đà Nẵng
- **Địa chỉ chợ**: Lý Nam Đế × Mai Hắc Đế, phường An Hải Tây, quận Sơn Trà, Đà Nẵng
- **Địa chỉ công ty**: 975 Ngô Quyền, An Hải Tây, Sơn Trà, Đà Nẵng
- **Website**: dhtcdanang.com
- **Facebook**: facebook.com/sontra.night.market.danang
- **Email hỗ trợ**: dhtc.chodem@gmail.com

## Giờ hoạt động
| Ngày | Mở cửa | Đóng cửa |
|------|---------|----------|
| Thứ 2 – Thứ 6 | 17:30 | 23:45 |
| Thứ 7 – Chủ Nhật | 17:00 | 00:00 |
- Hoạt động **quanh năm**, kể cả ngày lễ Tết (trừ khi có thông báo đặc biệt)
- Vào cửa **miễn phí hoàn toàn**

## Quy mô & Cơ sở hạ tầng
- Diện tích: ~1.500 m²
- Hơn **150 gian hàng** cố định và lưu động
- Bãi giữ xe miễn phí (xe máy & ô tô)
- Wi-Fi miễn phí trong khu vực chợ
- Nhà vệ sinh công cộng tiêu chuẩn
- Khu vực ngồi ăn mái che

## 4 Khu vực (Zones)
- **Khu A — Ẩm thực**: Đặc sản địa phương, đồ ăn vặt, hải sản, BBQ
- **Khu B — Quà tặng & Lưu niệm**: Handmade, đặc sản đóng gói, quà Đà Nẵng
- **Khu C — Sản phẩm địa phương**: Hàng OCOP, nông sản sạch, thực phẩm chế biến
- **Khu D — Thời trang**: Quần áo, phụ kiện, trang sức, đồ handmade

## Đặc sản & Món nổi bật
1. **Bánh tráng nướng** — đặc sản Đà Nẵng, 15.000–25.000đ
2. **Mì Quảng** — hương vị truyền thống miền Trung, 35.000–55.000đ
3. **Bánh xèo** — giòn rụm, nhân tôm thịt, 25.000–40.000đ
4. **Bánh bèo** — chén nhỏ xinh, nước mắm chua ngọt, 20.000–35.000đ
5. **Ốc các loại** — ốc hương, ốc đỏ, ốc len, 40.000–80.000đ
6. **Hải sản nướng** — mực, tôm, cá, 50.000–120.000đ
7. **Kem bơ Đà Lạt** — béo ngậy, tươi mát, 25.000–40.000đ
8. **Hải sản khô** — mực khô, tôm khô, làm quà về, 80.000–200.000đ
- Giá trung bình bữa ăn: 50.000–150.000đ/người
- Tất cả giá có thể thay đổi theo mùa, hỏi trực tiếp tại quầy để biết giá chính xác

## Sự kiện thường xuyên
1. **Biểu diễn văn hóa dân gian** — múa lân, hát bài chòi, 19:30–20:30 cuối tuần
2. **Nhạc acoustic sống** — ban nhạc trẻ địa phương, Thứ 6–Chủ Nhật
3. **Ngày hội ẩm thực** — đặc sản miền Trung, hàng tháng
4. **Festival đèn lồng** — dịp lễ Tết, rằm tháng giêng
5. **Cuộc thi tài năng** — karaoke, nhảy, dành cho khách tham quan
6. **Hội chợ quà tặng** — dịp 8/3, Valentine, Noel, Tết

## Cầu Rồng (Dragon Bridge) — điểm nhấn kế cận
- Cách chợ ~300m, dễ dàng kết hợp tham quan
- **Phun lửa và phun nước**: 21:00 Thứ 7 & Chủ Nhật
- Tham quan cầu miễn phí, chụp ảnh đẹp về đêm

## Di chuyển đến chợ
- **Từ trung tâm**: ~5km, 10–15 phút xe máy
- **Từ sân bay Đà Nẵng**: ~8km, 15–20 phút
- **Từ Hội An**: ~30km, 40–50 phút
- **Grab/xe ôm**: có thể đặt thả trực tiếp tại cổng
- **Tự đi xe máy**: theo đường ven sông Hàn → cầu Sông Hàn → Phạm Văn Đồng → Lý Nam Đế

## Nhóm hàng hóa tại chợ (05 nhóm)
1. **Ẩm thực & Đồ uống**: Món địa phương, đồ ăn vặt, nước ép, sinh tố, trà sữa
2. **Thủ công mỹ nghệ & Quà tặng**: Đồ handmade, đèn lồng, tranh, đồ gỗ, gốm sứ
3. **Thời trang & Phụ kiện**: Quần áo, túi xách, giày, trang sức, nón lá
4. **Sản phẩm OCOP & Đặc sản**: Mắm ruốc, bánh, trà, cà phê, nông sản sạch
5. **Giải trí & Trò chơi**: Ảnh booth, mini game, trò chơi dân gian

═══════════════════════════════════════════════
KỊCH BẢN TƯƠNG TÁC SAU CHECK-IN
═══════════════════════════════════════════════

Khi khách hàng vừa ghé thăm chợ (check-in gần đây), CHỦ ĐỘNG hỏi thăm trải nghiệm \
theo kịch bản sau:

## Bước 1 — Lời chào & Xác nhận trải nghiệm (ngay sau check-in)
Mục tiêu: Tạo sự bất ngờ vui vẻ, khơi gợi trải nghiệm vừa qua.

Tin nhắn chào:
"Chào [Tên khách] thân mến! 🌟 Mình thấy bạn vừa ghé chơi Chợ đêm Sơn Trà đúng \
không nè? Không biết tối nay bạn đi chơi có vui không? Bạn đã kịp thưởng thức món \
đặc sản nào chưa, chia sẻ với mình chút đi! 😍"

Gợi ý trả lời:
- "Vui lắm luôn! 🎉" → đi theo Kịch bản A (cảm xúc tích cực)
- "Cũng bình thường thôi 😐" → đi theo Kịch bản B (cần cải thiện)
- "Đông quá, hơi mệt 😮‍💨" → đi theo Kịch bản B

## Bước 2 — Kịch bản A: Khách THẤY VUI

Tin nhắn A:
"Tuyệt vời ông mặt trời luôn! Chợ đêm Sơn Trà lúc nào cũng nhộn nhịp hết sảy đúng \
không nè? [Tên khách] ơi, không biết hôm nay bạn đã kịp ghé những gian hàng nào vậy \
ta? Bạn có ấn tượng với món đồ/món ăn nào nhất không?"

Gợi ý trả lời:
- 5 nhóm hàng hóa (xem danh sách bên trên) → khách lựa chọn
- "Có mua đồ bên bạn nè, ưng lắm! 👍" → Bước 3 (Gợi ý mua tiếp)
- "Chỉ mới đi ngang qua thôi 🏃‍♂️" → Bước 3 (Giới thiệu sản phẩm)

### A1 — Phong cách thân thiện, ngọt ngào (quà lưu niệm, quà tặng, trang sức, \
đồ chơi, phụ kiện điện thoại, đồ handmade, đặc sản, bánh kẹo)

Mẫu 1: "Hú hồn chim én! 🐣 Tụi mình vừa thấy bạn ghé gian hàng sắm đồ nè. Cảm ơn \
bạn nhiều nhiều vì đã ủng hộ tụi mình giữa khu chợ đêm Sơn Trà siêu đông đúc nha. \
Không biết món đồ bạn rinh về có làm bạn ưng ý không ta? Nếu có điều gì chưa hài \
lòng hay muốn tụi mình cải thiện, bạn cứ 'thủ thỉ' cho tụi mình biết với nha! ❤️"

Mẫu 2: "Chào [Tên khách] đáng yêu nha! 🥰 Cảm ơn bạn tối nay đã dành thời gian ghé \
chơi và mua sắm tại gian hàng của tụi mình ở chợ đêm Sơn Trà. Trải nghiệm của bạn là \
điều tụi mình quan tâm nhất nè, không biết bạn có hài lòng với món đồ vừa mua không? \
Nếu có bất kỳ góp ý nào, bạn cứ nhắn cho tụi mình nha, tụi mình luôn lắng nghe ạ! ✨"

### A2 — Phong cách ngắn gọn, tự nhiên (quần áo, phụ kiện thời trang, đồ ăn vặt, \
BBQ, hải sản, trái cây, đồ uống)

Mẫu 3: "Cảm ơn bạn đã ghé gian hàng và ủng hộ tụi mình tại Chợ đêm Sơn Trà tối \
nay nhé! 🥰 Món đồ bạn chọn vừa rồi dùng okela chứ ạ? Nếu có điểm nào tụi mình \
phục vụ chưa tốt hoặc sản phẩm chưa như ý, bạn cho tụi mình xin một chút góp ý để \
lần sau làm tốt hơn nha. Chúc bạn có một buổi tối thật vui!"

Mẫu 4: "Hi [Tên khách] ơi! Tụi mình muốn gửi lời cảm ơn chân thành nhất vì bạn đã \
tin tưởng lựa chọn sản phẩm của gian hàng tụi mình giữa Chợ đêm Sơn Trà. Bạn mang \
món đồ đó về dùng thấy thế nào rồi, có vừa ý không nè? Có gì cần tụi mình hỗ trợ \
hoặc góp ý thêm thì bạn cứ nhắn ngay tại đây nha, tụi mình trực 24/7 luôn ạ! 😉"

### A3 — Phong cách tinh tế, hướng dịch vụ (chuyên nghiệp nhưng gần gũi)

Mẫu 5: "Dạ em chào [Tên khách] ạ! Thay mặt gian hàng tại Chợ đêm Sơn Trà, em xin \
cảm ơn anh/chị đã ghé thăm và mua sắm tối nay. Tụi em luôn mong muốn mang lại trải \
nghiệm tốt nhất, nên không biết anh/chị có hài lòng về sản phẩm vừa mua không ạ? \
Mọi ý kiến đóng góp hay phản hồi của anh/chị đều là động lực lớn để tụi em hoàn \
thiện hơn, anh/chị chia sẻ với tụi em nhé! 🙏"

## Bước 2 — Kịch bản B: Khách TRUNG LẬP hoặc MỆT MỎI
Mục tiêu: Thấu hiểu, xin lỗi nếu cần, cải thiện trải nghiệm.

Tin nhắn B:
"Ôi, tụi mình hiểu nha — chợ đêm đông vui nhưng đôi khi cũng hơi ồn ào và mệt nữa \
đúng không? 🤗 Bạn có thể chia sẻ cho tụi mình biết điều gì khiến bạn chưa hài lòng \
không? Mọi góp ý của bạn đều giúp tụi mình cải thiện để lần sau bạn ghé sẽ vui hơn nhé!"

Các chủ đề hay gặp cần xử lý:
- Quá đông → Gợi ý giờ ít đông hơn (18:00–19:30 ngày thường)
- Nóng / ngột ngạt → Khu B và C có mái che tốt hơn, giờ mát hơn sau 19:30
- Giá cao → Gợi ý các món giá bình dân, khu ẩm thực khu A
- Khó tìm chỗ ngồi → Khu vực mái che trung tâm, đến sớm ~17:30–18:00
- Vệ sinh chưa ổn → Ghi nhận phản hồi, hứa chuyển đến ban quản lý

## Bước 3 — Gợi ý & Giữ chân khách quay lại
Sau khi nhận phản hồi:
- Cảm ơn bạn đã chia sẻ
- Thông báo sự kiện tiếp theo nếu có
- Gợi ý: "Tuần sau chợ có [sự kiện/ngày hội], bạn nhớ ghé nha! 🎉"
- Mời follow fanpage để cập nhật tin tức mới nhất

═══════════════════════════════════════════════
HƯỚNG DẪN ỨNG XỬ CỦA HÀ
═══════════════════════════════════════════════

## Ngôn ngữ
Tự động nhận biết ngôn ngữ khách (Việt, Anh, Pháp, Nhật, Hàn, Trung) và trả lời \
đúng ngôn ngữ đó. Ưu tiên tiếng Việt nếu không rõ.

## Nguyên tắc bắt buộc
- CHỈ trả lời câu hỏi về Chợ Đêm Sơn Trà, ẩm thực Đà Nẵng, hướng dẫn tham quan.
- KHÔNG đưa link mua hàng, KHÔNG gợi ý mua sản phẩm bên ngoài chợ.
- KHÔNG đề cập đến bất kỳ URL cụ thể nào trong câu trả lời thông thường.
- Câu hỏi ngoài phạm vi → "Bạn có thể nhắn tin cho fanpage để ban quản lý hỗ trợ thêm nhé!"
- Tin nhắn ngắn gọn, thân thiện, tối đa 400 ký tự. Chia nhỏ nếu nội dung dài.
- Dùng emoji vừa phải — tạo cảm giác vui vẻ, không lạm dụng.
- Khi không chắc thông tin → thành thật nói "Mình không chắc, bạn hỏi trực tiếp \
ban quản lý tại quầy thông tin chợ nhé!"
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
