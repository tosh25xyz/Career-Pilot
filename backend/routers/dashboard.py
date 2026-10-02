"""
Dashboard Router
================
একটা call এ সব pillar এর summary দেয় — dashboard home page এর জন্য।
এটাই "integration layer" — 4 pillar কে একসাথে জোড়া লাগায়।
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from core.auth import get_current_user
from core.database import get_db
from models.schema import User, CVDocument, Application, ApplicationStatus, ChatSession
from services.nudge_service import generate_nudges
from services.tracker_service import get_progress_stats

router = APIRouter()


@router.get("/summary")
async def dashboard_summary(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Dashboard home এর জন্য সব data একসাথে — আলাদা আলাদা API call লাগবে না।
    Frontend এ loading waterfall এড়াতে এটা একবারে সব দেয়।
    """
    try:
        # CV status
        cv_result = await db.execute(
            select(CVDocument).where(CVDocument.user_id == user.id, CVDocument.is_active == True)
        )
        cv = cv_result.scalar_one_or_none()

        # Applications
        apps_result = await db.execute(select(Application).where(Application.user_id == user.id))
        apps = apps_result.scalars().all()

        # Chat sessions count
        sessions_result = await db.execute(select(ChatSession).where(ChatSession.user_id == user.id))
        sessions = sessions_result.scalars().all()

        # Progress stats (reuse tracker service)
        stats = await get_progress_stats(db, user.id)

        # Nudges
        nudges = await generate_nudges(db, user.id)

        return {
            "has_cv":         cv is not None,
            "cv_filename":    cv.filename if cv else None,
            "total_jobs_applications": len(apps),
            "applications_by_status": {
                "saved":        sum(1 for a in apps if a.status == ApplicationStatus.SAVED),
                "applied":      sum(1 for a in apps if a.status == ApplicationStatus.APPLIED),
                "interviewing": sum(1 for a in apps if a.status == ApplicationStatus.INTERVIEWING),
                "offer":        sum(1 for a in apps if a.status == ApplicationStatus.OFFER),
                "rejected":     sum(1 for a in apps if a.status == ApplicationStatus.REJECTED),
            },
            "chat_sessions_count": len(sessions),
            "overall_progress":    stats["overall_progress"],
            "nudges":              nudges,
        }
    except Exception as e:
        # Partial failure এ পুরো dashboard crash করবে না — safe defaults দাও
        print(f"[Dashboard] Summary error: {e}")
        return {
            "has_cv": False,
            "cv_filename": None,
            "total_jobs_applications": 0,
            "applications_by_status": {"saved": 0, "applied": 0, "interviewing": 0, "offer": 0, "rejected": 0},
            "chat_sessions_count": 0,
            "overall_progress": 0,
            "nudges": [{
                "type": "critical", "icon": "upload",
                "title": "Get started with CareerPilot",
                "message": "Upload your CV to unlock all features.",
                "action_label": "Upload CV", "action_url": "/dashboard/cv", "priority": 1,
            }],
        }
