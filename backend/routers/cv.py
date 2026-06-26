"""
CV Router — Fixed
=================
Upload error গুলো properly handle করা হয়েছে।
"""

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from core.auth import get_current_user
from core.database import get_db
from models.schema import User, CVDocument, CVChunk
from services.cv_service import process_cv

router = APIRouter()

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

ALLOWED_CONTENT_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
    "application/octet-stream",  # কিছু browser এটা send করে
}


@router.post("/upload")
async def upload_cv(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Filename check
    fname = (file.filename or "").lower()
    if not (fname.endswith(".pdf") or fname.endswith(".docx") or fname.endswith(".doc")):
        raise HTTPException(
            status_code=400,
            detail="Only PDF or DOCX files are supported."
        )

    # Read file
    try:
        file_bytes = await file.read()
    except Exception:
        raise HTTPException(status_code=400, detail="Could not read the file.")

    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="File is empty.")

    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Max 10MB.")

    # Process
    try:
        result = await process_cv(
            db=db,
            user_id=user.id,
            file_bytes=file_bytes,
            filename=file.filename or "cv",
        )
        return {"message": "CV uploaded successfully!", **result}

    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        # Log the real error for debugging
        import traceback
        print("CV Upload Error:", traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Processing failed: {str(e)[:200]}"
        )


@router.get("/")
async def get_active_cv(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CVDocument).where(
            CVDocument.user_id == user.id,
            CVDocument.is_active == True,
        ).order_by(CVDocument.created_at.desc())
    )
    cv = result.scalar_one_or_none()

    if not cv:
        return {"has_cv": False}

    chunk_result = await db.execute(
        select(CVChunk).where(CVChunk.document_id == cv.id)
    )
    chunks = chunk_result.scalars().all()

    sections: dict = {}
    for chunk in chunks:
        sections[chunk.section] = sections.get(chunk.section, 0) + 1

    return {
        "has_cv":       True,
        "document_id":  str(cv.id),
        "filename":     cv.filename,
        "uploaded_at":  cv.created_at.isoformat(),
        "total_chunks": len(chunks),
        "sections":     sections,
        "preview":      (cv.raw_text or "")[:400] + "..." if cv.raw_text and len(cv.raw_text) > 400 else cv.raw_text,
    }


@router.get("/chunks")
async def get_chunks(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CVChunk)
        .where(CVChunk.user_id == user.id)
        .order_by(CVChunk.chunk_index)
    )
    chunks = result.scalars().all()
    return {
        "total": len(chunks),
        "chunks": [
            {
                "section": c.section,
                "content": c.content[:150] + "..." if len(c.content) > 150 else c.content,
                "index":   c.chunk_index,
            }
            for c in chunks
        ],
    }


@router.delete("/")
async def delete_cv(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CVDocument).where(
            CVDocument.user_id == user.id,
            CVDocument.is_active == True,
        )
    )
    cv = result.scalar_one_or_none()
    if not cv:
        raise HTTPException(status_code=404, detail="No CV found.")
    await db.delete(cv)
    return {"message": "CV deleted."}