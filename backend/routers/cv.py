"""CV upload & RAG pipeline router — Day 2 will flesh this out."""
from fastapi import APIRouter, Depends
from core.auth import get_current_user
from models.schema import User

router = APIRouter()

@router.post("/upload")
async def upload_cv(user: User = Depends(get_current_user)):
    # TODO: Day 2 — PDF/DOCX parsing → chunking → embedding → pgvector
    return {"message": "CV upload endpoint — coming Day 2", "user_id": user.id}

@router.get("/")
async def get_cv(user: User = Depends(get_current_user)):
    return {"message": "Get active CV", "user_id": user.id}
