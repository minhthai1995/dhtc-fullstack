"""Lightweight post-text classifier for proactive reply (P5E).

Classes:
  checkin   — Facebook check-in payload OR text mentions visiting a store.
  praise    — positive sentiment about DHTC.
  complaint — negative sentiment / problem report.
  question  — direct question to the page.
  other     — fallback when nothing else matches.

Pure function, no DB. Designed to be cheap (single pass) and explainable.
"""
from __future__ import annotations

import re

CHECKIN_KEYWORDS: tuple[str, ...] = (
    "checkin", "check-in", "check in",
    "đang ở", "tại dhtc", "ghé dhtc", "ghé tiệm", "đến dhtc",
    "ăn tại", "uống tại", "ngồi tại",
)

PRAISE_KEYWORDS: tuple[str, ...] = (
    "ngon", "tuyệt", "tuyet voi", "tuyệt vời", "rất ngon", "qua ngon",
    "yêu shop", "yeu shop", "thích", "thich", "đỉnh", "dinh",
    "5 sao", "5*", "recommend", "khen", "đẹp", "dep",
    "phục vụ tốt", "phuc vu tot", "thân thiện", "than thien",
    "love", "amazing", "great", "delicious", "perfect",
)

COMPLAINT_KEYWORDS: tuple[str, ...] = (
    "tệ", "te qua", "dở", "do qua", "thất vọng", "that vong",
    "không ngon", "khong ngon", "chậm", "cham qua",
    "bực", "buc", "phục vụ kém", "phuc vu kem",
    "không trả lời", "khong tra loi", "bị lỗi", "bi loi",
    "complain", "bad", "terrible", "awful", "worst",
    "1 sao", "1*", "không hài lòng", "khong hai long",
)

QUESTION_MARKERS: tuple[str, ...] = (
    "?", "có ", "co ", "bao nhiêu", "bao nhieu", "khi nào", "khi nao",
    "ở đâu", "o dau", "thế nào", "the nao", "làm sao", "lam sao",
    "mấy giờ", "may gio", "how", "what", "when", "where", "why",
)


def _normalize(text: str) -> str:
    """Collapse whitespace + lowercase. Diacritics preserved (matched both ways)."""
    return re.sub(r"\s+", " ", text or "").strip().lower()


def _any_keyword(haystack: str, keywords: tuple[str, ...]) -> bool:
    return any(kw in haystack for kw in keywords)


def classify_post_intent(text: str | None, has_checkin: bool) -> str:
    """Return one of {'checkin','praise','complaint','question','other'}.

    Priority order (first match wins):
      1. has_checkin flag from FB → 'checkin' (most reliable signal)
      2. complaint (negative sentiment trumps praise)
      3. praise
      4. question (markers + '?')
      5. checkin keywords in plain text
      6. other
    """
    if has_checkin:
        return "checkin"

    haystack = _normalize(text or "")
    if not haystack:
        return "other"

    if _any_keyword(haystack, COMPLAINT_KEYWORDS):
        return "complaint"
    if _any_keyword(haystack, PRAISE_KEYWORDS):
        return "praise"
    if _any_keyword(haystack, QUESTION_MARKERS):
        return "question"
    if _any_keyword(haystack, CHECKIN_KEYWORDS):
        return "checkin"
    return "other"
