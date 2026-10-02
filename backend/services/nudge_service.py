"""
AI Nudges Service
=================
সব pillar এর data দেখে proactive suggestion তৈরি করে।
Rule-based (fast, free) — কোনো AI call লাগে না, তাই always available।

Priority order:
  1. CV নেই              → upload করতে বলা (সবচেয়ে জরুরি)
  2. কোনো application নেই → job search করতে বলা
  3. এই সপ্তাহে apply করেনি → reminder
  4. Deadline কাছে        → urgent reminder
  5. Interview আসছে       → prep reminder
  6. Goal stalled         → nudge
  7. সব ঠিক আছে          → encouragement
"""

from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from models.schema import CVDocument, Application, ApplicationStatus, Goal, Todo


def utcnow():
    return datetime.now(timezone.utc)


async def generate_nudges(db: AsyncSession, user_id: str) -> list[dict]:
    """
    User এর সব data দেখে 1-3 টা relevant nudge তৈরি করো।
    প্রতিটা nudge: {type, icon, title, message, action_label, action_url, priority}
    """
    nudges = []

    # ── Data fetch করো একসাথে ──────────────────────────────────
    cv_result = await db.execute(
        select(CVDocument).where(CVDocument.user_id == user_id, CVDocument.is_active == True)
    )
    cv = cv_result.scalar_one_or_none()

    apps_result = await db.execute(select(Application).where(Application.user_id == user_id))
    apps = apps_result.scalars().all()

    goals_result = await db.execute(select(Goal).where(Goal.user_id == user_id, Goal.is_complete == False))
    goals = goals_result.scalars().all()

    todos_result = await db.execute(
        select(Todo).where(Todo.user_id == user_id, Todo.is_done == False)
    )
    todos = todos_result.scalars().all()

    now = utcnow()
    week_ago = now - timedelta(days=7)

    # ══ Priority 1: CV নেই ══
    if not cv:
        nudges.append({
            "type": "critical",
            "icon": "upload",
            "title": "Upload your CV to get started",
            "message": "Unlock job matching, fit scores, and personalized AI assistance by uploading your CV.",
            "action_label": "Upload CV",
            "action_url": "/dashboard/cv",
            "priority": 1,
        })
        return nudges[:3]  # CV ছাড়া বাকি nudge দেখানোর মানে নেই

    # ══ Priority 2: কোনো application নেই ══
    if len(apps) == 0:
        nudges.append({
            "type": "info",
            "icon": "search",
            "title": "Start your job search",
            "message": "You haven't searched for any jobs yet. Let the agent find roles matching your CV.",
            "action_label": "Search Jobs",
            "action_url": "/dashboard/jobs",
            "priority": 2,
        })

    # ══ Priority 3: এই সপ্তাহে apply করেনি ══
    applied_this_week = [
        a for a in apps
        if a.status != ApplicationStatus.SAVED and a.applied_date and a.applied_date >= week_ago
    ]
    if len(apps) > 0 and len(applied_this_week) == 0:
        nudges.append({
            "type": "warning",
            "icon": "alert",
            "title": "No applications sent this week",
            "message": f"You have {len(apps)} saved jobs but haven't applied recently. Momentum matters — pick one today.",
            "action_label": "View Tracker",
            "action_url": "/dashboard/tracker",
            "priority": 3,
        })

    # ══ Priority 4: Deadline কাছে (3 দিনের মধ্যে) ══
    urgent_deadlines = [
        a for a in apps
        if a.deadline and a.status == ApplicationStatus.SAVED
        and now <= a.deadline <= now + timedelta(days=3)
    ]
    if urgent_deadlines:
        job = urgent_deadlines[0]
        days_left = (job.deadline - now).days
        nudges.append({
            "type": "critical",
            "icon": "clock",
            "title": f"Deadline in {days_left} day{'s' if days_left != 1 else ''}!",
            "message": f"{job.job_title} at {job.company} closes soon. Don't miss it.",
            "action_label": "View Application",
            "action_url": "/dashboard/tracker",
            "priority": 1,
        })

    # ══ Priority 5: Interview আসছে ══
    interviewing = [a for a in apps if a.status == ApplicationStatus.INTERVIEWING]
    if interviewing:
        job = interviewing[0]
        nudges.append({
            "type": "info",
            "icon": "briefcase",
            "title": "Prepare for your interview",
            "message": f"You have an interview in progress for {job.job_title} at {job.company}. Ask the AI assistant for interview prep tips.",
            "action_label": "Ask AI Assistant",
            "action_url": "/dashboard/assistant",
            "priority": 2,
        })

    # ══ Priority 6: Goal stalled ══
    for goal in goals:
        if goal.target_value and goal.current_value is not None:
            pct = (goal.current_value / goal.target_value) * 100
            if pct < 50 and goal.deadline and goal.deadline <= now + timedelta(days=3):
                nudges.append({
                    "type": "warning",
                    "icon": "target",
                    "title": f"Goal behind schedule: {goal.title}",
                    "message": f"You're at {goal.current_value}/{goal.target_value} with the deadline approaching.",
                    "action_label": "View Goals",
                    "action_url": "/dashboard/progress",
                    "priority": 3,
                })
                break

    # ══ Priority 7: Overdue todos ══
    overdue_todos = [t for t in todos if t.due_date and t.due_date < now]
    if overdue_todos:
        nudges.append({
            "type": "warning",
            "icon": "clock",
            "title": f"{len(overdue_todos)} overdue task{'s' if len(overdue_todos) != 1 else ''}",
            "message": f'"{overdue_todos[0].title}" was due. Catch up on your task list.',
            "action_label": "View Tasks",
            "action_url": "/dashboard/calendar",
            "priority": 3,
        })

    # ══ Fallback: সব ঠিক আছে ══
    if not nudges:
        applied_count = sum(1 for a in apps if a.status != ApplicationStatus.SAVED)
        nudges.append({
            "type": "success",
            "icon": "check",
            "title": "You're on track! 🎉",
            "message": f"{applied_count} applications sent, {len(interviewing)} interviews in progress. Keep up the momentum.",
            "action_label": "Search More Jobs",
            "action_url": "/dashboard/jobs",
            "priority": 4,
        })

    # Priority দিয়ে sort করো, top 3 নাও
    nudges.sort(key=lambda n: n["priority"])
    return nudges[:3]
