from fastapi import APIRouter, Depends
from core.auth import get_current_user
from models.schema import User

router = APIRouter()

@router.post("/chat")
async def chat(user: User = Depends(get_current_user)):
    return {"message": "AI Assistant — coming Day 3"}
