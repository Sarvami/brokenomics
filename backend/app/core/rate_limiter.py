"""Sliding window rate limiter.

Cloud Run might scale to multiple instances; in-memory rate limiting is best-effort.
If REDIS_URL is present, we use Redis for shared limits.
"""

from __future__ import annotations

import asyncio
import os
from collections import defaultdict, deque
from datetime import datetime, timedelta

from fastapi import Depends, HTTPException, Request

from app.config import settings
from app.core.security import get_optional_user
from app.models.user import UserInDB


class InMemoryRateLimiter:
    def __init__(self, limit: int, window_seconds: int = 60) -> None:
        self.limit = limit
        self.window_seconds = window_seconds
        self._events: dict[str, deque[datetime]] = defaultdict(deque)
        self._lock = asyncio.Lock()

    async def is_allowed(self, key: str) -> bool:
        now = datetime.utcnow()
        cutoff = now - timedelta(seconds=self.window_seconds)
        async with self._lock:
            q = self._events[key]
            while q and q[0] < cutoff:
                q.popleft()
            if len(q) >= self.limit:
                return False
            q.append(now)
            return True


class RedisRateLimiter:
    def __init__(self, redis_url: str, limit: int, window_seconds: int = 60) -> None:
        self.redis_url = redis_url
        self.limit = limit
        self.window_seconds = window_seconds
        self._redis = None

    async def _client(self):
        if self._redis is None:
            import redis.asyncio as redis  # optional dependency

            self._redis = redis.from_url(self.redis_url, encoding="utf-8", decode_responses=True)
        return self._redis

    async def is_allowed(self, key: str) -> bool:
        r = await self._client()
        now_ms = int(datetime.utcnow().timestamp() * 1000)
        cutoff_ms = now_ms - (self.window_seconds * 1000)

        zkey = f"rate:{key}"
        pipe = r.pipeline(transaction=True)
        pipe.zremrangebyscore(zkey, 0, cutoff_ms)
        pipe.zadd(zkey, {str(now_ms): now_ms})
        pipe.zcard(zkey)
        pipe.expire(zkey, self.window_seconds)
        _, _, count, _ = await pipe.execute()
        return int(count) <= self.limit


def _build_limiter():
    redis_url = os.getenv("REDIS_URL")
    if redis_url:
        return RedisRateLimiter(redis_url, settings.RATE_LIMIT_PER_MINUTE)
    return InMemoryRateLimiter(settings.RATE_LIMIT_PER_MINUTE)


limiter = _build_limiter()


async def rate_limit(
    request: Request,
    user: UserInDB | None = Depends(get_optional_user),
) -> None:
    if user is not None:
        key = str(user._id)
    else:
        key = request.client.host if request.client else "anonymous"

    allowed = await limiter.is_allowed(key)
    if not allowed:
        raise HTTPException(
            status_code=429,
            detail="Too many requests. Take a breath! 🧘",
            headers={"Retry-After": "60"},
        )
