"""
CV Router
=========
POST /cv/upload   — CV file upload করো → pipeline চালাও
GET  /cv/         — Active CV info দেখাও
GET  /cv/chunks   — সব chunks দেখাও (debug)
DELETE /cv/       — CV delete করো
"""

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from core.auth import get_current_user
from core.database import get_db
from models.schema import User, CVDocument, CVChunk
from services.cv_service import process_cv

router = APIRouter()

# ─── Max file size: 10MB ────────────────────────────────────────
MAX_FILE_SIZE = 10 * 1024 * 1024
ALLOWED_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
}


@router.post("/upload")
async def upload_cv(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    CV upload করো এবং full pipeline চালাও।
    PDF বা DOCX accept করে।
    """
    # File type validation
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Only PDF or DOCX files are allowed."
        )

    # File size check
    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="File too large. Maximum size is 10MB."
        )

    try:
        # CV processing pipeline চালাও
        result = await process_cv(
            db=db,
            user_id=user.id,
            file_bytes=file_bytes,
            filename=file.filename,
        )
        return {
            "message": "CV uploaded and processed successfully!",
            **result,
        }
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")


@router.get("/")
async def get_active_cv(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """User এর active CV info দেখাও।"""
    result = await db.execute(
        select(CVDocument)
        .where(CVDocument.user_id == user.id, CVDocument.is_active == True)
        .order_by(CVDocument.created_at.desc())
    )
    cv = result.scalar_one_or_none()

    if not cv:
        return {"has_cv": False, "message": "No CV uploaded yet."}

    # Chunk count
    chunk_result = await db.execute(
        select(CVChunk).where(CVChunk.document_id == cv.id)
    )
    chunks = chunk_result.scalars().all()

    # Section breakdown
    sections: dict = {}
    for chunk in chunks:
        sections[chunk.section] = sections.get(chunk.section, 0) + 1

    return {
        "has_cv": True,
        "document_id": str(cv.id),
        "filename": cv.filename,
        "uploaded_at": cv.created_at.isoformat(),
        "total_chunks": len(chunks),
        "sections": sections,
        "preview": cv.raw_text[:300] + "..." if cv.raw_text else "",
    }


@router.get("/chunks")
async def get_cv_chunks(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """সব CV chunks দেখাও — debug/inspection এর জন্য।"""
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
                "id": str(c.id),
                "section": c.section,
                "content": c.content[:200] + "..." if len(c.content) > 200 else c.content,
                "chunk_index": c.chunk_index,
            }
            for c in chunks
        ],
    }


@router.delete("/")
async def delete_cv(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Active CV delete করো।"""
    result = await db.execute(
        select(CVDocument)
        .where(CVDocument.user_id == user.id, CVDocument.is_active == True)
    )
    cv = result.scalar_one_or_none()

    if not cv:
        raise HTTPException(status_code=404, detail="No active CV found.")

    await db.delete(cv)
    return {"message": "CV deleted successfully."}
