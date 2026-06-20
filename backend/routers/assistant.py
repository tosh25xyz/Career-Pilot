"""
Assistant Router
================
POST /assistant/chat          — message পাঠাও, AI reply পাও
GET  /assistant/sessions      — সব chat sessions দেখাও
GET  /assistant/sessions/{id} — একটা session এর messages দেখাও
DELETE /assistant/sessions/{id} — session delete করো
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
import uuid

from core.auth import get_current_user
from core.database import get_db
from models.schema import User, ChatSession, ChatMessage
from services.assistant_service import chat, get_user_sessions

router = APIRouter()


# ── Request/Response schemas ────────────────────────────────────
class ChatRequest(BaseModel):
    message: str
    session_id: str | None = None  # None হলে নতুন session তৈরি হবে


class ChatResponse(BaseModel):
    session_id: str
    session_title: str
    reply: str
    has_cv: bool


# ── Endpoints ───────────────────────────────────────────────────

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(
    body: ChatRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    AI Assistant এ message পাঠাও।
    - CV থাকলে RAG করে personalized reply দেবে
    - CV না থাকলে upload করতে বলবে
    - Session history maintain করবে
    """
    if not body.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    if len(body.message) > 4000:
        raise HTTPException(status_code=400, detail="Message too long. Max 4000 characters.")

    try:
        result = await chat(
            db=db,
            user_id=user.id,
            user_message=body.message.strip(),
            session_id=body.session_id,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI error: {str(e)}")


@router.get("/sessions")
async def get_sessions(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """User এর সব chat sessions দেখাও।"""
    sessions = await get_user_sessions(db, user.id)
    return {"sessions": sessions}


@router.get("/sessions/{session_id}")
async def get_session_messages(
    session_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """একটা session এর সব messages আনো।"""
    try:
        sid = uuid.UUID(session_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid session ID.")

    # Ownership চেক
    result = await db.execute(
        select(ChatSession).where(
            ChatSession.id == sid,
            ChatSession.user_id == user.id,
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")

    # Messages
    msg_result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == sid)
        .order_by(ChatMessage.created_at.asc())
    )
    messages = msg_result.scalars().all()

    return {
        "session_id": session_id,
        "title": session.title,
        "messages": [
            {
                "id": str(m.id),
                "role": m.role,
                "content": m.content,
                "created_at": m.created_at.isoformat(),
            }
            for m in messages
        ],
    }


@router.delete("/sessions/{session_id}")
async def delete_session(
    session_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Chat session delete করো।"""
    try:
        sid = uuid.UUID(session_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid session ID.")

    result = await db.execute(
        select(ChatSession).where(
            ChatSession.id == sid,
            ChatSession.user_id == user.id,
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")

    await db.delete(session)
    return {"message": "Session deleted."}
