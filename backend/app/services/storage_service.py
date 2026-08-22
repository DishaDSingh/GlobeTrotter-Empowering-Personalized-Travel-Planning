"""Cover-image uploads via Supabase Storage's REST API (no extra SDK needed -
it's a plain authenticated PUT). This is optional: if SUPABASE_URL and
SUPABASE_SERVICE_ROLE_KEY aren't configured, upload_image returns None and
the frontend falls back to pasting an image URL directly, exactly like the
OpenAI/Mapbox integrations elsewhere in this app.
"""

import uuid

import httpx

from app.config import get_settings

BUCKET = "globetrotter-uploads"


def is_configured() -> bool:
    settings = get_settings()
    return bool(settings.supabase_url and settings.supabase_service_role_key)


async def upload_image(file_bytes: bytes, content_type: str) -> str | None:
    settings = get_settings()
    if not is_configured():
        return None

    extension = (content_type.split("/")[-1] or "jpg").lower()
    if extension not in {"jpg", "jpeg", "png", "webp", "gif"}:
        extension = "jpg"
    path = f"covers/{uuid.uuid4()}.{extension}"

    upload_url = f"{settings.supabase_url}/storage/v1/object/{BUCKET}/{path}"
    headers = {
        "Authorization": f"Bearer {settings.supabase_service_role_key}",
        "Content-Type": content_type,
        "x-upsert": "true",
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(upload_url, headers=headers, content=file_bytes)
            resp.raise_for_status()
    except httpx.HTTPError:
        return None

    return f"{settings.supabase_url}/storage/v1/object/public/{BUCKET}/{path}"
