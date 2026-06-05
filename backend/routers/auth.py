"""Auth router — user sync endpoint."""
from fastapi import APIRouter, Depends
from core.auth import get_current_user
from models.schema import User

router = APIRouter()

@router.get("/me")
async def get_me(user: User = Depends(get_current_user)):
    return {"id": user.id, "email": user.email, "name": user.name}
