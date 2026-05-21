"""Vietnamese reply templates per post intent (P5E).

Templates intentionally vary in tone and length so consecutive replies
don't look bot-generated. Selection is round-robin via a per-page hash on
post_id so the same post always gets a deterministic variant — that
prevents two parallel workers picking different replies for the same post
(audit table also has UNIQUE post_id so only one wins).

Placeholders:
  {place}  — Facebook place name when has_checkin (else 'DHTC').

Keep VN-first; English second only where natural.
"""
from __future__ import annotations

import hashlib

TEMPLATES: dict[str, tuple[str, ...]] = {
    "checkin": (
        "Cảm ơn bạn đã ghé {place}! Chúc bạn có những trải nghiệm tuyệt vời "
        "tại Đà Nẵng. 🌊",
        "DHTC rất vui khi được đón tiếp bạn tại {place}. Hẹn gặp lại lần "
        "sau nhé! 💚",
        "Cảm ơn bạn đã check-in tại {place}. Mọi góp ý xin gửi inbox để "
        "DHTC phục vụ tốt hơn.",
        "Chào bạn! Cảm ơn vì đã ghé thăm {place}. Đừng quên thử các đặc "
        "sản Đà Nẵng nhé.",
    ),
    "praise": (
        "Cảm ơn bạn rất nhiều về lời khen! DHTC sẽ tiếp tục cố gắng để "
        "phục vụ bạn tốt hơn.",
        "Thật vui khi bạn hài lòng. Rất mong sớm được đón tiếp bạn lần "
        "nữa tại DHTC nhé! 💚",
        "Cảm ơn feedback dễ thương của bạn. Team DHTC xin ghi nhận và "
        "tiếp tục phát huy ạ.",
    ),
    "complaint": (
        "DHTC rất tiếc về trải nghiệm chưa tốt của bạn. Bạn có thể inbox "
        "chi tiết để team xử lý ngay không ạ?",
        "Cảm ơn bạn đã phản ánh. DHTC xin lỗi và mong được liên hệ qua "
        "inbox để khắc phục sớm nhất.",
        "Xin lỗi bạn về sự bất tiện. Team DHTC sẽ liên hệ qua tin nhắn để "
        "hỗ trợ riêng nhé.",
    ),
    "question": (
        "Chào bạn! Để DHTC trả lời cụ thể, bạn vui lòng inbox giúp team "
        "với nhé.",
        "Cảm ơn câu hỏi của bạn. Bạn nhắn tin trực tiếp để DHTC tư vấn "
        "chi tiết nha.",
        "Hi bạn, DHTC vừa nhắn riêng cho bạn để trả lời chi tiết nhé!",
    ),
    "other": (
        "Cảm ơn bạn đã quan tâm DHTC! 💚",
        "DHTC xin ghi nhận. Cảm ơn bạn rất nhiều!",
    ),
}


def pick_template(intent: str, *, post_id: str, place: str | None = None) -> str:
    """Deterministic per-post template selection.

    Hash(post_id) % len(variants) — same post always renders the same reply,
    yet different posts spread across variants for natural variety.
    """
    variants = TEMPLATES.get(intent) or TEMPLATES["other"]
    digest = hashlib.sha1(post_id.encode("utf-8")).digest()
    idx = digest[0] % len(variants)
    rendered = variants[idx].replace("{place}", (place or "DHTC").strip())
    return rendered
