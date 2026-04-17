"""In-memory TTL cache for politician results (30-minute expiry)."""

import time
import threading
from typing import Any, Optional

_cache: dict[str, tuple[float, Any]] = {}
_lock = threading.Lock()

DEFAULT_TTL = 1800  # 30 minutes in seconds


def get(key: str) -> Optional[Any]:
    """Return cached value if it exists and hasn't expired, else None."""
    with _lock:
        entry = _cache.get(key)
        if entry is None:
            return None
        timestamp, value = entry
        if time.time() - timestamp > DEFAULT_TTL:
            del _cache[key]
            return None
        return value


def set(key: str, value: Any, ttl: int = DEFAULT_TTL) -> None:
    """Store a value in the cache with the given TTL."""
    with _lock:
        _cache[key] = (time.time(), value)


def clear() -> None:
    """Clear the entire cache."""
    with _lock:
        _cache.clear()
