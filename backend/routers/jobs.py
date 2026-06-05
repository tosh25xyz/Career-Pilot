"""Job Hunter Agent router — Day 4."""
from fastapi import APIRouter, Depends
from core.auth import get_current_user
from models.schema import User

router = APIRouter()

@router.post("/search")
async def search_jobs(user: User = Depends(get_current_user)):
    return {"message": "Job search — coming Day 4"}

@router.post("/fit-score")
async def compute_fit_score(user: User = Depends(get_current_user)):
    return {"message": "Fit score — coming Day 4"}
