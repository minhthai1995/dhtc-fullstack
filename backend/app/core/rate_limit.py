from __future__ import annotations

import time
from collections import defaultdict, deque
from collections.abc import Iterable
from threading import Lock

_BUCKETS: dict[str, deque[float]] = defaultdict(deque)
_LOCK = Lock()


def hit(key: str, *, limit: int, window_sec: float, now: float | None = None) -> bool:
    """Record a hit for `key` and return True if it's allowed under `limit` per `window_sec`.

    Sliding-window counter using deque of timestamps. Single-process only —
    swap for Redis in P3 when running multiple workers.
    """
    ts = time.monotonic() if now is None else now
    cutoff = ts - window_sec
    with _LOCK:
        bucket = _BUCKETS[key]
        while bucket and bucket[0] <= cutoff:
            bucket.popleft()
        if len(bucket) >= limit:
            return False
        bucket.append(ts)
        return True


def reset(keys: Iterable[str] | None = None) -> None:
    """Clear rate-limit state (testing helper)."""
    with _LOCK:
        if keys is None:
            _BUCKETS.clear()
        else:
            for k in keys:
                _BUCKETS.pop(k, None)
