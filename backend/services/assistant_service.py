"""
AI Assistant Service — Gemini Version
======================================
"""

import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from google import genai

from core.config import settings
from models.schema import CVChunk, CVDocument, ChatSession, ChatMessage

# ── Gemini client setup ─────────────────────────────────────────
client = genai.Client(api_key=settings.GEMINI_API_KEY)


# ════════════════════════════════════════════════════════════════
#  SYSTEM PROMPT
# ════════════════════════════════════════════════════════════════

def build_system_prompt(cv_context: str, has_cv: bool) -> str:
    if not has_cv:
        return """You are CareerPilot, an AI career co-pilot.
The user has NOT uploaded their CV yet.
Politely remind them to upload their CV at /dashboard/cv to unlock personalized features.
You can still answer general career questions."""

    return f"""You are CareerPilot, a personal AI career co-pilot.
You have full context of this user's CV and background.

══ USER CV CONTEXT ══
{cv_context}
═════════════════════

You help with:
1. Job readiness — "Am I ready for X role?"
2. Skill gap analysis — "What am I missing for Y?"
3. Learning roadmaps — structured weekly plan
4. Cover letter drafting — use REAL CV experience only
5. Interview prep

STRICT RULES:
- NEVER invent experience not in the CV
- Always cite specific CV points
- For roadmaps: Week 1, Week 2 format
- Be direct and actionable
- If not in CV, say so honestly

Format: use **bold**, bullet points, structured responses."""


# ════════════════════════════════════════════════════════════════
#  RAG — CV chunks আনো
# ════════════════════════════════════════════════════════════════

async def get_cv_context_for_query(
    db: AsyncSession,
    user_id: str,
    query: str,
    top_k: int = 6,
) -> tuple[str, bool]:

    # Active CV চেক
    cv_result = await db.execute(
        select(CVDocument).where(
            CVDocument.user_id == user_id,
            CVDocument.is_active == True,
        )
    )
    cv_doc = cv_result.scalar_one_or_none()
    if not cv_doc:
        return "", False

    # Chunks আনো (simple — no vector search, just top chunks)
    result = await db.execute(
        select(CVChunk)
        .where(CVChunk.user_id == user_id)
        .order_by(CVChunk.chunk_index)
        .limit(top_k)
    )
    chunks = result.scalars().all()

    if chunks:
        parts = [f"[{c.section.upper()}]\n{c.content}" for c in chunks]
        return "\n\n---\n\n".join(parts), True

    # Fallback: raw text
    if cv_doc.raw_text:
        return cv_doc.raw_text[:3000], True

    return "", False


# ════════════════════════════════════════════════════════════════
#  SESSION MANAGEMENT
# ════════════════════════════════════════════════════════════════

async def get_or_create_session(
    db: AsyncSession,
    user_id: str,
    session_id: str | None,
) -> ChatSession:

    if session_id:
        result = await db.execute(
            select(ChatSession).where(
                ChatSession.id == uuid.UUID(session_id),
                ChatSession.user_id == user_id,
            )
        )
        session = result.scalar_one_or_none()
        if session:
            return session

    session = ChatSession(
        id=uuid.uuid4(),
        user_id=user_id,
        title="New conversation",
    )
    db.add(session)
    await db.flush()
    return session


async def get_session_history(
    db: AsyncSession,
    session_id: uuid.UUID,
    limit: int = 20,
) -> list[dict]:

    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.asc())
        .limit(limit)
    )
    messages = result.scalars().all()
    return [{"role": m.role, "content": m.content} for m in messages]


async def save_messages(
    db: AsyncSession,
    session_id: uuid.UUID,
    user_content: str,
    assistant_content: str,
    metadata: dict = None,
):
    db.add(ChatMessage(
        id=uuid.uuid4(),
        session_id=session_id,
        role="user",
        content=user_content,
    ))
    db.add(ChatMessage(
        id=uuid.uuid4(),
        session_id=session_id,
        role="assistant",
        content=assistant_content,
        metadata_=metadata or {},
    ))

    # Session title update
    result = await db.execute(
        select(ChatSession).where(ChatSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    if session and session.title == "New conversation":
        session.title = user_content[:60] + ("..." if len(user_content) > 60 else "")

    await db.flush()


async def get_user_sessions(
    db: AsyncSession,
    user_id: str,
    limit: int = 20,
) -> list[dict]:

    result = await db.execute(
        select(ChatSession)
        .where(ChatSession.user_id == user_id)
        .order_by(ChatSession.created_at.desc())
        .limit(limit)
    )
    sessions = result.scalars().all()
    return [
        {"id": str(s.id), "title": s.title, "created_at": s.created_at.isoformat()}
        for s in sessions
    ]


# ════════════════════════════════════════════════════════════════
#  MAIN CHAT — Gemini API
# ════════════════════════════════════════════════════════════════

async def chat(
    db: AsyncSession,
    user_id: str,
    user_message: str,
    session_id: str | None = None,
) -> dict:

    # Step 1: Session
    session = await get_or_create_session(db, user_id, session_id)

    # Step 2: CV context
    cv_context, has_cv = await get_cv_context_for_query(db, user_id, user_message)

    # Step 3: History
    history = await get_session_history(db, session.id)

    # Step 4: System prompt
    system_prompt = build_system_prompt(cv_context, has_cv)

    # Step 5: Gemini API call ─────────────────────────────────────
    model = genai.GenerativeModel(
        model_name="gemini-2.0-flash",
        system_instruction=system_prompt,
    )

    # History কে Gemini format এ convert করো
    # Gemini: role = "user" | "model" (not "assistant")
    gemini_history = []
    for msg in history:
        gemini_history.append({
            "role": "user" if msg["role"] == "user" else "model",
            "parts": [msg["content"]],
        })

    # Chat session তৈরি করো history দিয়ে
    chat_session = model.start_chat(history=gemini_history)

    # Message পাঠাও
    response = await chat_session.send_message_async(user_message)
    assistant_reply = response.text
    # ─────────────────────────────────────────────────────────────

    # Step 6: Save
    await save_messages(
        db, session.id,
        user_content=user_message,
        assistant_content=assistant_reply,
        metadata={"has_cv": has_cv, "rag_used": bool(cv_context)},
    )

    return {
        "session_id":    str(session.id),
        "session_title": session.title,
        "reply":         assistant_reply,
        "has_cv":        has_cv,
    }