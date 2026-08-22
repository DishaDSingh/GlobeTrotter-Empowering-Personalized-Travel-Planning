from fastapi import APIRouter, HTTPException, Query

from app.services.currency_service import get_rates

router = APIRouter(prefix="/currency", tags=["currency"])


@router.get("/rates")
async def rates(base: str = Query("USD", min_length=3, max_length=3)):
    result = await get_rates(base)
    if result is None:
        raise HTTPException(status_code=503, detail="Exchange rates are temporarily unavailable.")
    return {"base": base.upper(), "rates": result}
