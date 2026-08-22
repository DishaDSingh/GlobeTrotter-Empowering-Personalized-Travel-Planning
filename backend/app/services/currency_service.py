"""Live currency conversion via open.er-api.com - free, key-free, and covers
every currency used across our seeded destinations (verified: all 34).
Rates are cached in-process for an hour since they only update daily upstream
and there's no reason to hit the API on every request.
"""

import time

import httpx

_CACHE: dict[str, tuple[float, dict[str, float]]] = {}
_CACHE_TTL_SECONDS = 60 * 60


async def get_rates(base: str) -> dict[str, float] | None:
    base = base.upper()
    cached = _CACHE.get(base)
    if cached and (time.time() - cached[0]) < _CACHE_TTL_SECONDS:
        return cached[1]

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(f"https://open.er-api.com/v6/latest/{base}")
            resp.raise_for_status()
            data = resp.json()
            if data.get("result") != "success":
                return None
            rates = data["rates"]
            _CACHE[base] = (time.time(), rates)
            return rates
    except (httpx.HTTPError, httpx.TimeoutException, KeyError, ValueError):
        return cached[1] if cached else None


async def convert(amount: float, from_currency: str, to_currency: str) -> float | None:
    if from_currency.upper() == to_currency.upper():
        return amount
    rates = await get_rates(from_currency)
    if not rates:
        return None
    rate = rates.get(to_currency.upper())
    if rate is None:
        return None
    return round(amount * rate, 2)
