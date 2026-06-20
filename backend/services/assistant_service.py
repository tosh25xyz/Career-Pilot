"""
AI Assistant Service
====================
Flow:
  1. User message আসে
  2. CV থেকে relevant chunks RAG করে আনা হয়
  3. System prompt এ CV context inject করা হয়
  4. Session history থেকে আগের messages যোগ করা হয়
  5. Claude API call করা হয়
  6. Response + used chunks save করা হয়
"""

import uuid
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
import anthropic

from core.config import settings
from models.schema import CVChunk, CVDocument, ChatSession, ChatMessage

client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)

# ════════════════════════════════════════════════════════════════
#  SYSTEM PROMPT — CV context inject হবে এখানে
# ════════════════════════════════════════════════════════════════

def build_system_prompt(cv_context: str, has_cv: bool) -> str:
    if not has_cv:
        return """You are CareerPilot, an AI career co-pilot.
The user has NOT uploaded their CV yet.
Politely remind them to upload their CV at /dashboard/cv to unlock personalized features.
You can still answer general career questions."""

    return f"""You are CareerPilot, a personal AI career co-pilot.
You have full context of this user's CV and background.

══ USER'S CV CONTEXT ══
{cv_context}
════════════════════════

You help with:
1. Job readiness assessment — "Am I ready for X role?"
2. Skill gap analysis — "What am I missing for Y?"
3. Learning roadmaps — "Build me a 3-month plan"
4. Cover letter drafting — always reference REAL CV experience
5. Interview prep — based on their actual background

STRICT RULES:
- NEVER invent or assume experience not in the CV
- Always cite specific CV points when making assessments
- For roadmaps, structure as Week 1, Week 2, etc.
- For cover letters, reference actual projects and roles from CV
- Be direct and actionable, not generic
- If something isn't in their CV, say so honestly

Response format:
- Use **bold** for key points
- Use bullet points for lists
- Keep responses focused and structured
- End with a clear next action when relevant"""


# ════════════════════════════════════════════════════════════════
#  RAG — CV থেকে relevant chunks আনো
# ════════════════════════════════════════════════════════════════

async def get_cv_context_for_query(
    db: AsyncSession,
    user_id: str,
    query: str,
    top_k: int = 6,
) -> tuple[str, bool]:
    """
    User এর query র সাথে সবচেয়ে relevant CV chunks খোঁজো।
    Returns: (context_string, has_cv)
    """
    # Active CV আছে কিনা চেক
    cv_result = await db.execute(
        select(CVDocument).where(
            CVDocument.user_id == user_id,
            CVDocument.is_active == True
        )
    )
    cv_doc = cv_result.scalar_one_or_none()
    if not cv_doc:
        return "", False

    # Query embed করো
    try:
        embed_resp = await client.post(
            "/v1/embeddings",
            json={"model": "voyage-3", "input": query}
        )
        query_embedding = embed_resp.json()["data"][0]["embedding"]
        embedding_str = str(query_embedding)

        # pgvector similarity search
        result = await db.execute(
            text("""
                SELECT section, content
                FROM cv_chunks
                WHERE user_id = :user_id
                ORDER BY embedding <=> CAST(:embedding AS vector)
                LIMIT :top_k
            """),
            {"user_id": user_id, "embedding": embedding_str, "top_k": top_k}
        )
        chunks = result.fetchall()

    except Exception:
        # Embedding fail করলে সব chunks নাও (fallback)
        result = await db.execute(
            select(CVChunk)
            .where(CVChunk.user_id == user_id)
            .limit(top_k)
        )
        chunks = [(c.section, c.content) for c in result.scalars().all()]

    if not chunks:
        # Raw text fallback
        context = cv_doc.raw_text[:3000] if cv_doc.raw_text else ""
        return context, True

    # Context string বানাও
    parts = []
    for section, content in chunks:
        parts.append(f"[{section.upper()}]\n{content}")
    return "\n\n---\n\n".join(parts), True


# ════════════════════════════════════════════════════════════════
#  SESSION MANAGEMENT
# ════════════════════════════════════════════════════════════════

async def get_or_create_session(
    db: AsyncSession,
    user_id: str,
    session_id: str | None,
) -> ChatSession:
    """Session খোঁজো, না থাকলে নতুন বানাও।"""
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

    # নতুন session
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
    """
    Session এর আগের messages আনো — Claude API format এ।
    Last N messages নাও (context window limit)
    """
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
    """User + Assistant দুটো message একসাথে save করো।"""
    user_msg = ChatMessage(
        id=uuid.uuid4(),
        session_id=session_id,
        role="user",
        content=user_content,
    )
    asst_msg = ChatMessage(
        id=uuid.uuid4(),
        session_id=session_id,
        role="assistant",
        content=assistant_content,
        metadata_=metadata or {},
    )
    db.add(user_msg)
    db.add(asst_msg)

    # Session title update (first message থেকে)
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
    """User এর সব chat sessions আনো।"""
    result = await db.execute(
        select(ChatSession)
        .where(ChatSession.user_id == user_id)
        .order_by(ChatSession.created_at.desc())
        .limit(limit)
    )
    sessions = result.scalars().all()
    return [
        {
            "id": str(s.id),
            "title": s.title,
            "created_at": s.created_at.isoformat(),
        }
        for s in sessions
    ]


# ════════════════════════════════════════════════════════════════
#  MAIN CHAT FUNCTION
# ════════════════════════════════════════════════════════════════

async def chat(
    db: AsyncSession,
    user_id: str,
    user_message: str,
    session_id: str | None = None,
) -> dict:
    """
    Complete AI assistant pipeline:
    1. Session get/create
    2. CV RAG
    3. History load
    4. Claude API call
    5. Save messages
    6. Return response
    """

    # Step 1: Session
    session = await get_or_create_session(db, user_id, session_id)

    # Step 2: RAG — CV context
    cv_context, has_cv = await get_cv_context_for_query(db, user_id, user_message)

    # Step 3: History
    history = await get_session_history(db, session.id)

    # Step 4: Build messages for Claude
    messages_for_claude = history + [{"role": "user", "content": user_message}]

    # Step 5: Claude API call
    system_prompt = build_system_prompt(cv_context, has_cv)

    response = await client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2048,
        system=system_prompt,
        messages=messages_for_claude,
    )

    assistant_reply = response.content[0].text

    # Step 6: Save both messages
    await save_messages(
        db, session.id,
        user_content=user_message,
        assistant_content=assistant_reply,
        metadata={"has_cv": has_cv, "rag_used": bool(cv_context)},
    )

    return {
        "session_id": str(session.id),
        "session_title": session.title,
        "reply": assistant_reply,
        "has_cv": has_cv,
    }
