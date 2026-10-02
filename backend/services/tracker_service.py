"""
Tracker Service
===============
- Application Kanban (Applied/Interviewing/Offer/Rejected)
- Goals management
- Todo items
- Progress stats
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from models.schema import Application, ApplicationStatus, Goal, GoalType, Todo, CVDocument


def utcnow():
    return datetime.now(timezone.utc)


# ════════════════════════════════════════════════════════════════
#  APPLICATIONS — Kanban
# ════════════════════════════════════════════════════════════════

async def get_applications(db: AsyncSession, user_id: str) -> list[dict]:
    result = await db.execute(
        select(Application)
        .where(Application.user_id == user_id)
        .order_by(Application.created_at.desc())
    )
    apps = result.scalars().all()
    return [_app_to_dict(a) for a in apps]


async def create_application(db: AsyncSession, user_id: str, data: dict) -> dict:
    app = Application(
        id=uuid.uuid4(),
        user_id=user_id,
        job_title=data["job_title"],
        company=data["company"],
        location=data.get("location", ""),
        salary_range=data.get("salary_range", ""),
        job_url=data.get("job_url", ""),
        job_desc=data.get("job_desc", ""),
        fit_score=data.get("fit_score"),
        status=ApplicationStatus(data.get("status", "saved")),
        notes=data.get("notes", ""),
        deadline=_parse_date(data.get("deadline")),
    )
    db.add(app)
    await db.flush()
    return _app_to_dict(app)


async def update_application_status(db: AsyncSession, user_id: str, app_id: str, status: str) -> dict:
    result = await db.execute(
        select(Application).where(
            Application.id == uuid.UUID(app_id),
            Application.user_id == user_id,
        )
    )
    app = result.scalar_one_or_none()
    if not app:
        raise ValueError("Application not found.")
    app.status = ApplicationStatus(status)
    if status == "applied" and not app.applied_date:
        app.applied_date = utcnow()
    await db.flush()
    return _app_to_dict(app)


async def update_application(db: AsyncSession, user_id: str, app_id: str, data: dict) -> dict:
    result = await db.execute(
        select(Application).where(
            Application.id == uuid.UUID(app_id),
            Application.user_id == user_id,
        )
    )
    app = result.scalar_one_or_none()
    if not app:
        raise ValueError("Application not found.")
    for field in ["job_title", "company", "location", "salary_range", "notes", "job_url"]:
        if field in data:
            setattr(app, field, data[field])
    if "status" in data:
        app.status = ApplicationStatus(data["status"])
    if "deadline" in data:
        app.deadline = _parse_date(data["deadline"])
    await db.flush()
    return _app_to_dict(app)


async def delete_application(db: AsyncSession, user_id: str, app_id: str):
    result = await db.execute(
        select(Application).where(
            Application.id == uuid.UUID(app_id),
            Application.user_id == user_id,
        )
    )
    app = result.scalar_one_or_none()
    if app:
        await db.delete(app)


def _app_to_dict(app: Application) -> dict:
    return {
        "id":           str(app.id),
        "job_title":    app.job_title,
        "company":      app.company,
        "location":     app.location or "",
        "salary_range": app.salary_range or "",
        "job_url":      app.job_url or "",
        "fit_score":    app.fit_score,
        "status":       app.status.value,
        "notes":        app.notes or "",
        "applied_date": app.applied_date.isoformat() if app.applied_date else None,
        "deadline":     app.deadline.isoformat() if app.deadline else None,
        "created_at":   app.created_at.isoformat(),
    }


# ════════════════════════════════════════════════════════════════
#  GOALS
# ════════════════════════════════════════════════════════════════

async def get_goals(db: AsyncSession, user_id: str) -> list[dict]:
    result = await db.execute(
        select(Goal)
        .where(Goal.user_id == user_id)
        .order_by(Goal.created_at.desc())
    )
    goals = result.scalars().all()
    return [_goal_to_dict(g) for g in goals]


async def create_goal(db: AsyncSession, user_id: str, data: dict) -> dict:
    goal = Goal(
        id=uuid.uuid4(),
        user_id=user_id,
        title=data["title"],
        goal_type=GoalType(data.get("goal_type", "other")),
        target_value=data.get("target_value", 1),
        current_value=data.get("current_value", 0),
        deadline=_parse_date(data.get("deadline")),
    )
    db.add(goal)
    await db.flush()
    return _goal_to_dict(goal)


async def update_goal_progress(db: AsyncSession, user_id: str, goal_id: str, current_value: int) -> dict:
    result = await db.execute(
        select(Goal).where(Goal.id == uuid.UUID(goal_id), Goal.user_id == user_id)
    )
    goal = result.scalar_one_or_none()
    if not goal:
        raise ValueError("Goal not found.")
    goal.current_value = current_value
    if goal.target_value and current_value >= goal.target_value:
        goal.is_complete = True
    await db.flush()
    return _goal_to_dict(goal)


async def delete_goal(db: AsyncSession, user_id: str, goal_id: str):
    result = await db.execute(
        select(Goal).where(Goal.id == uuid.UUID(goal_id), Goal.user_id == user_id)
    )
    goal = result.scalar_one_or_none()
    if goal:
        await db.delete(goal)


def _goal_to_dict(goal: Goal) -> dict:
    pct = 0
    if goal.target_value and goal.target_value > 0:
        pct = min(100, int((goal.current_value or 0) / goal.target_value * 100))
    return {
        "id":            str(goal.id),
        "title":         goal.title,
        "goal_type":     goal.goal_type.value,
        "target_value":  goal.target_value,
        "current_value": goal.current_value or 0,
        "progress_pct":  pct,
        "is_complete":   goal.is_complete,
        "deadline":      goal.deadline.isoformat() if goal.deadline else None,
        "created_at":    goal.created_at.isoformat(),
    }


# ════════════════════════════════════════════════════════════════
#  TODOS
# ════════════════════════════════════════════════════════════════

async def get_todos(db: AsyncSession, user_id: str) -> list[dict]:
    result = await db.execute(
        select(Todo)
        .where(Todo.user_id == user_id)
        .order_by(Todo.priority.asc(), Todo.due_date.asc())
    )
    todos = result.scalars().all()
    return [_todo_to_dict(t) for t in todos]


async def create_todo(db: AsyncSession, user_id: str, data: dict) -> dict:
    todo = Todo(
        id=uuid.uuid4(),
        user_id=user_id,
        title=data["title"],
        due_date=_parse_date(data.get("due_date")),
        priority=data.get("priority", 2),
    )
    db.add(todo)
    await db.flush()
    return _todo_to_dict(todo)


async def toggle_todo(db: AsyncSession, user_id: str, todo_id: str) -> dict:
    result = await db.execute(
        select(Todo).where(Todo.id == uuid.UUID(todo_id), Todo.user_id == user_id)
    )
    todo = result.scalar_one_or_none()
    if not todo:
        raise ValueError("Todo not found.")
    todo.is_done = not todo.is_done
    await db.flush()
    return _todo_to_dict(todo)


async def delete_todo(db: AsyncSession, user_id: str, todo_id: str):
    result = await db.execute(
        select(Todo).where(Todo.id == uuid.UUID(todo_id), Todo.user_id == user_id)
    )
    todo = result.scalar_one_or_none()
    if todo:
        await db.delete(todo)


def _todo_to_dict(todo: Todo) -> dict:
    return {
        "id":       str(todo.id),
        "title":    todo.title,
        "is_done":  todo.is_done,
        "priority": todo.priority,
        "due_date": todo.due_date.isoformat() if todo.due_date else None,
    }


# ════════════════════════════════════════════════════════════════
#  PROGRESS STATS — Dashboard
# ════════════════════════════════════════════════════════════════

async def get_progress_stats(db: AsyncSession, user_id: str) -> dict:
    # Applications by status
    apps_result = await db.execute(
        select(Application).where(Application.user_id == user_id)
    )
    apps = apps_result.scalars().all()

    status_counts = {s.value: 0 for s in ApplicationStatus}
    for app in apps:
        status_counts[app.status.value] += 1

    # Goals
    goals_result = await db.execute(
        select(Goal).where(Goal.user_id == user_id)
    )
    goals = goals_result.scalars().all()
    completed_goals = sum(1 for g in goals if g.is_complete)

    # Todos
    todos_result = await db.execute(
        select(Todo).where(Todo.user_id == user_id)
    )
    todos = todos_result.scalars().all()
    done_todos = sum(1 for t in todos if t.is_done)

    # CV uploaded?
    cv_result = await db.execute(
        select(CVDocument).where(
            CVDocument.user_id == user_id,
            CVDocument.is_active == True,
        )
    )
    has_cv = cv_result.scalar_one_or_none() is not None

    # Overall progress %
    total_apps = len(apps)
    overall = 0
    if has_cv:
        overall += 20
    if total_apps >= 1:
        overall += min(30, total_apps * 5)
    if status_counts.get("interviewing", 0) > 0:
        overall += 20
    if status_counts.get("offer", 0) > 0:
        overall += 30

    return {
        "applications": {
            "total":        total_apps,
            "saved":        status_counts.get("saved", 0),
            "applied":      status_counts.get("applied", 0),
            "interviewing": status_counts.get("interviewing", 0),
            "offer":        status_counts.get("offer", 0),
            "rejected":     status_counts.get("rejected", 0),
        },
        "goals": {
            "total":     len(goals),
            "completed": completed_goals,
        },
        "todos": {
            "total": len(todos),
            "done":  done_todos,
        },
        "has_cv":          has_cv,
        "overall_progress": overall,
    }


# ── Helper ──────────────────────────────────────────────────────
def _parse_date(s: str | None):
    if not s:
        return None
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00"))
    except Exception:
        return None
