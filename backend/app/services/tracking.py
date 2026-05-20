from __future__ import annotations


def derive_device(user_agent: str | None) -> str:
    if not user_agent:
        return "unknown"
    ua = user_agent.lower()
    if any(x in ua for x in ("ipad", "tablet")):
        return "tablet"
    if any(x in ua for x in ("mobile", "iphone", "android")):
        return "mobile"
    return "desktop"


def derive_source(referrer: str | None) -> str:
    if not referrer:
        return "direct"
    ref = referrer.lower()
    if "google." in ref:
        return "google"
    if "facebook." in ref or "fb." in ref:
        return "facebook"
    return "other"


def derive_country_code(headers: dict[str, str]) -> str | None:
    """Pull ISO-3166 alpha-2 country code from Cloudflare or custom header."""
    code = headers.get("cf-ipcountry") or headers.get("x-country-code")
    if not code:
        return None
    code = code.strip().upper()
    if len(code) != 2 or not code.isalpha():
        return None
    return code
