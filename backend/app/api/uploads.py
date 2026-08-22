from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.auth import get_current_user
from app.models import User
from app.services.storage_service import is_configured, upload_image

router = APIRouter(prefix="/uploads", tags=["uploads"])

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_BYTES = 8 * 1024 * 1024


@router.post("/image")
async def upload_cover_image(file: UploadFile = File(...), _: User = Depends(get_current_user)):
    if not is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Image uploads aren't configured yet - set SUPABASE_URL and "
                "SUPABASE_SERVICE_ROLE_KEY, and create a public storage bucket "
                "named 'globetrotter-uploads'. You can paste an image URL instead."
            ),
        )

    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Please upload a JPEG, PNG, WebP, or GIF image.")

    contents = await file.read()
    if len(contents) > MAX_BYTES:
        raise HTTPException(status_code=400, detail="Image is too large (max 8 MB).")

    url = await upload_image(contents, file.content_type)
    if not url:
        raise HTTPException(status_code=502, detail="Upload failed. Please try again or paste an image URL instead.")

    return {"url": url}
