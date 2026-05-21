"""Derive country / language / declared-birthday signals from existing data.

All helpers are pure-ish: they query DB read-only and return primitives. No
external Graph calls. Cheap to compute per request — admin endpoint runs
these on-the-fly per conversation.
"""
from __future__ import annotations

import json
import re
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.chat_message import ChatMessage, MessageDirection
from app.models.order import Order

# Lower-cased keywords matched against address blobs. Covers Vietnam's 63
# provinces (subset of the most common spellings + diacritic-stripped forms).
VN_CITY_KEYWORDS: tuple[str, ...] = (
    "hà nội", "ha noi", "hanoi",
    "tp.hcm", "tp hcm", "hồ chí minh", "ho chi minh", "saigon", "sài gòn",
    "đà nẵng", "da nang", "danang",
    "hải phòng", "hai phong",
    "cần thơ", "can tho",
    "an giang", "bà rịa", "ba ria", "vũng tàu", "vung tau",
    "bắc giang", "bac giang", "bắc kạn", "bac kan",
    "bạc liêu", "bac lieu", "bắc ninh", "bac ninh",
    "bến tre", "ben tre", "bình định", "binh dinh",
    "bình dương", "binh duong", "bình phước", "binh phuoc",
    "bình thuận", "binh thuan", "cà mau", "ca mau",
    "cao bằng", "cao bang", "đắk lắk", "dak lak",
    "đắk nông", "dak nong", "điện biên", "dien bien",
    "đồng nai", "dong nai", "đồng tháp", "dong thap",
    "gia lai", "hà giang", "ha giang", "hà nam", "ha nam",
    "hà tĩnh", "ha tinh", "hải dương", "hai duong",
    "hậu giang", "hau giang", "hòa bình", "hoa binh",
    "hưng yên", "hung yen", "khánh hòa", "khanh hoa",
    "kiên giang", "kien giang", "kon tum",
    "lai châu", "lai chau", "lâm đồng", "lam dong",
    "lạng sơn", "lang son", "lào cai", "lao cai",
    "long an", "nam định", "nam dinh", "nghệ an", "nghe an",
    "ninh bình", "ninh binh", "ninh thuận", "ninh thuan",
    "phú thọ", "phu tho", "phú yên", "phu yen",
    "quảng bình", "quang binh", "quảng nam", "quang nam",
    "quảng ngãi", "quang ngai", "quảng ninh", "quang ninh",
    "quảng trị", "quang tri", "sóc trăng", "soc trang",
    "sơn la", "son la", "tây ninh", "tay ninh",
    "thái bình", "thai binh", "thái nguyên", "thai nguyen",
    "thanh hóa", "thanh hoa", "thừa thiên", "thua thien", "huế", "hue",
    "tiền giang", "tien giang", "trà vinh", "tra vinh",
    "tuyên quang", "tuyen quang", "vĩnh long", "vinh long",
    "vĩnh phúc", "vinh phuc", "yên bái", "yen bai",
)

VN_KEYWORDS_EXTRA: tuple[str, ...] = ("vietnam", "viet nam", "việt nam", ", vn")

# Lowercase set of Vietnamese-diacritic characters used to score language.
_VN_DIACRITICS: frozenset[str] = frozenset(
    "ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩị"
    "óòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ"
)

# Order matters: more specific patterns first.
BIRTHDAY_PATTERNS: tuple[str, ...] = (
    r"sinh\s+ng[àa]y\s+(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})",
    r"(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})\s*l[àa]\s*sinh\s*nh[ậa]t",
    r"sinh\s+n[ăa]m\s+(\d{4})",
    r"birthday[:\s]+(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})",
)


async def _get_user_addresses(
    db: AsyncSession, user_id: int
) -> list[Any]:
    """Pull shipping_address blobs from this user's orders (any status)."""
    result = await db.execute(
        select(Order.shipping_address).where(Order.user_id == user_id)
    )
    return [row[0] for row in result.all() if row[0] is not None]


async def _get_captured_addresses_by_psid(
    db: AsyncSession, psid: str
) -> list[str]:
    """Pull captured_address strings ChatMessage P5C reserve column."""
    result = await db.execute(
        select(ChatMessage.captured_address).where(
            ChatMessage.fb_user_id == psid,
            ChatMessage.captured_address.is_not(None),
        )
    )
    return [row[0] for row in result.all() if row[0]]


async def _get_inbound_message_text(
    db: AsyncSession, psid: str, *, limit: int
) -> list[str]:
    result = await db.execute(
        select(ChatMessage.content)
        .where(
            ChatMessage.fb_user_id == psid,
            ChatMessage.direction == MessageDirection.inbound,
        )
        .order_by(ChatMessage.created_at.desc())
        .limit(limit)
    )
    return [row[0] for row in result.all() if row[0]]


def _addr_to_text(addr: Any) -> str:
    if isinstance(addr, dict):
        return json.dumps(addr, ensure_ascii=False).lower()
    return str(addr).lower()


async def derive_country(
    db: AsyncSession, *, user_id: int | None, psid: str | None
) -> str | None:
    """'VN' | 'OTHER' | None.

    'VN' if any address contains a province keyword or Vietnam marker.
    'OTHER' if addresses exist but none matched.
    None if user has no orders and no captured addresses.
    """
    addresses: list[Any] = []
    if user_id is not None:
        addresses.extend(await _get_user_addresses(db, user_id))
    if psid:
        addresses.extend(await _get_captured_addresses_by_psid(db, psid))

    if not addresses:
        return None

    for addr in addresses:
        text = _addr_to_text(addr)
        if any(kw in text for kw in VN_CITY_KEYWORDS):
            return "VN"
        if any(kw in text for kw in VN_KEYWORDS_EXTRA):
            return "VN"
    return "OTHER"


async def derive_language(
    db: AsyncSession, psid: str, *, sample_size: int = 20
) -> str | None:
    """'vi' | 'en' | 'mixed' | None.

    Decision: ratio of VN-diacritic chars over total alphabetic chars.
      ratio > 0.05 → 'vi'   (Vietnamese)
      0.01 < ratio ≤ 0.05  → 'mixed'
      ratio ≤ 0.01 with text present → 'en'
      no inbound messages → None
    """
    msgs = await _get_inbound_message_text(db, psid, limit=sample_size)
    if not msgs:
        return None
    text = " ".join(msgs).lower()
    alpha = [c for c in text if c.isalpha()]
    if not alpha:
        return None
    vi_chars = sum(1 for c in alpha if c in _VN_DIACRITICS)
    ratio = vi_chars / len(alpha)
    if ratio > 0.05:
        return "vi"
    if ratio > 0.01:
        return "mixed"
    return "en"


def _normalize_birthday(groups: tuple[str, ...]) -> str | None:
    """Normalize regex match groups to ISO 'YYYY-MM-DD' or fallback 'YYYY'."""
    cleaned = [g for g in groups if g]
    if len(cleaned) == 1:
        year = cleaned[0]
        if len(year) == 4 and year.isdigit():
            return year
        return None
    if len(cleaned) == 3:
        d, m, y = cleaned
        if len(y) == 2:
            y = "19" + y if int(y) > 30 else "20" + y
        try:
            day = int(d)
            month = int(m)
            year = int(y)
        except ValueError:
            return None
        if not (1 <= day <= 31 and 1 <= month <= 12 and 1900 <= year <= 2030):
            return None
        return f"{year:04d}-{month:02d}-{day:02d}"
    return None


async def extract_declared_birthday(
    db: AsyncSession, psid: str, *, scan_messages: int = 100
) -> str | None:
    """Scan inbound chat for self-declared DOB. Returns ISO date or 'YYYY'."""
    msgs = await _get_inbound_message_text(db, psid, limit=scan_messages)
    for content in msgs:
        for pat in BIRTHDAY_PATTERNS:
            match = re.search(pat, content, re.IGNORECASE)
            if match:
                normalized = _normalize_birthday(match.groups())
                if normalized:
                    return normalized
    return None
