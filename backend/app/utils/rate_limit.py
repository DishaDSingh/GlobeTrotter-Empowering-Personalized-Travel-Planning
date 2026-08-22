import time
from collections import defaultdict

from fastapi import HTTPException, Request, status


class RateLimiter:
    """Simple in-memory sliding-window rate limiter, keyed by client IP + route."""

    def __init__(self, max_requests: int, window_seconds: int):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.hits: dict[str, list[float]] = defaultdict(list)

    def check(self, request: Request) -> None:
        key = f"{request.client.host if request.client else 'unknown'}:{request.url.path}"
        now = time.time()
        window_start = now - self.window_seconds
        recent = [t for t in self.hits[key] if t > window_start]
        if len(recent) >= self.max_requests:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests. Please try again later.",
            )
        recent.append(now)
        self.hits[key] = recent


auth_rate_limiter = RateLimiter(max_requests=10, window_seconds=60)
