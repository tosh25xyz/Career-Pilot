"""
Jobs Router
===========
POST /jobs/search      — natural language job search + fit scores
POST /jobs/analyze     — paste a JD → get fit score
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from core.auth import get_current_user
from core.database import get_db
from models.schema import User
from services.job_service import run_job_hunter, analyze_single_job

router = APIRouter()


class SearchRequest(BaseModel):
    query: str  # "Find ML internships in Dhaka"


class AnalyzeRequest(BaseModel):
    job_title: str
    job_description: str
    company: str = ""


@router.post("/search")
async def search_jobs(
    body: SearchRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not body.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")
    try:
        result = await run_job_hunter(db=db, user_id=user.id, query=body.query)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze")
async def analyze_job(
    body: AnalyzeRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not body.job_description.strip():
        raise HTTPException(status_code=400, detail="Job description cannot be empty.")
    try:
        result = await analyze_single_job(
            db=db, user_id=user.id,
            job_title=body.job_title,
            job_description=body.job_description,
            company=body.company,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
