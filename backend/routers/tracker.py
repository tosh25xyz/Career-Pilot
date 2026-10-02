"""
Tracker Router
==============
/tracker/applications  — Kanban CRUD
/tracker/goals         — Goal management
/tracker/todos         — Todo items
/tracker/stats         — Progress dashboard data
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional

from core.auth import get_current_user
from core.database import get_db
from models.schema import User
from services.tracker_service import (
    get_applications, create_application,
    update_application_status, update_application, delete_application,
    get_goals, create_goal, update_goal_progress, delete_goal,
    get_todos, create_todo, toggle_todo, delete_todo,
    get_progress_stats,
)

router = APIRouter()


# ── Schemas ─────────────────────────────────────────────────────
class AppCreate(BaseModel):
    job_title: str
    company: str
    location: str = ""
    salary_range: str = ""
    job_url: str = ""
    job_desc: str = ""
    fit_score: Optional[float] = None
    status: str = "saved"
    notes: str = ""
    deadline: Optional[str] = None

class AppStatusUpdate(BaseModel):
    status: str

class AppUpdate(BaseModel):
    job_title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    salary_range: Optional[str] = None
    notes: Optional[str] = None
    job_url: Optional[str] = None
    status: Optional[str] = None
    deadline: Optional[str] = None

class GoalCreate(BaseModel):
    title: str
    goal_type: str = "other"
    target_value: int = 1
    deadline: Optional[str] = None

class GoalProgress(BaseModel):
    current_value: int

class TodoCreate(BaseModel):
    title: str
    due_date: Optional[str] = None
    priority: int = 2


# ── Applications ─────────────────────────────────────────────────
@router.get("/applications")
async def list_applications(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return {"applications": await get_applications(db, user.id)}

@router.post("/applications")
async def add_application(body: AppCreate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await create_application(db, user.id, body.model_dump())

@router.patch("/applications/{app_id}/status")
async def change_status(app_id: str, body: AppStatusUpdate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    try:
        return await update_application_status(db, user.id, app_id, body.status)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.patch("/applications/{app_id}")
async def edit_application(app_id: str, body: AppUpdate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    try:
        return await update_application(db, user.id, app_id, body.model_dump(exclude_none=True))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.delete("/applications/{app_id}")
async def remove_application(app_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await delete_application(db, user.id, app_id)
    return {"message": "Deleted."}


# ── Goals ────────────────────────────────────────────────────────
@router.get("/goals")
async def list_goals(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return {"goals": await get_goals(db, user.id)}

@router.post("/goals")
async def add_goal(body: GoalCreate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await create_goal(db, user.id, body.model_dump())

@router.patch("/goals/{goal_id}/progress")
async def set_goal_progress(goal_id: str, body: GoalProgress, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    try:
        return await update_goal_progress(db, user.id, goal_id, body.current_value)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.delete("/goals/{goal_id}")
async def remove_goal(goal_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await delete_goal(db, user.id, goal_id)
    return {"message": "Deleted."}


# ── Todos ────────────────────────────────────────────────────────
@router.get("/todos")
async def list_todos(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return {"todos": await get_todos(db, user.id)}

@router.post("/todos")
async def add_todo(body: TodoCreate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await create_todo(db, user.id, body.model_dump())

@router.patch("/todos/{todo_id}/toggle")
async def check_todo(todo_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    try:
        return await toggle_todo(db, user.id, todo_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.delete("/todos/{todo_id}")
async def remove_todo(todo_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await delete_todo(db, user.id, todo_id)
    return {"message": "Deleted."}


# ── Stats ────────────────────────────────────────────────────────
@router.get("/stats")
async def progress_stats(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await get_progress_stats(db, user.id)
