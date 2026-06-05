from fastapi import APIRouter, Depends
from core.auth import get_current_user
from models.schema import User

router = APIRouter()

@router.get("/applications")
async def get_applications(user: User = Depends(get_current_user)):
    return {"message": "Tracker — coming Day 5"}
