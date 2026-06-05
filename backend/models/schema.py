"""
CareerPilot — Database Schema
All tables in one file for clarity.
"""

from sqlalchemy import (
    Column, String, Integer, Float, Text,
    DateTime, ForeignKey, JSON, Boolean, Enum
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from datetime import datetime, timezone
import uuid
import enum

from core.database import Base


def utcnow():
    return datetime.now(timezone.utc)


# ─────────────────────────────────────────────────────────
#  Users
# ─────────────────────────────────────────────────────────
class User(Base):
    """Mirrors Clerk user — we store extra profile data here."""
    __tablename__ = "users"

    id         = Column(String, primary_key=True)   # Clerk user_id
    email      = Column(String, unique=True, nullable=False)
    name       = Column(String)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    # Relationships
    cv_documents  = relationship("CVDocument",      back_populates="user", cascade="all, delete-orphan")
    applications  = relationship("Application",     back_populates="user", cascade="all, delete-orphan")
    goals         = relationship("Goal",            back_populates="user", cascade="all, delete-orphan")
    chat_sessions = relationship("ChatSession",     back_populates="user", cascade="all, delete-orphan")


# ─────────────────────────────────────────────────────────
#  CV & RAG
# ─────────────────────────────────────────────────────────
class CVDocument(Base):
    """Uploaded CV file metadata."""
    __tablename__ = "cv_documents"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id     = Column(String, ForeignKey("users.id"), nullable=False)
    filename    = Column(String, nullable=False)
    file_url    = Column(String)            # S3 or local path
    raw_text    = Column(Text)              # Full extracted text
    is_active   = Column(Boolean, default=True)  # Only one active CV
    created_at  = Column(DateTime(timezone=True), default=utcnow)

    user   = relationship("User", back_populates="cv_documents")
    chunks = relationship("CVChunk", back_populates="document", cascade="all, delete-orphan")


class CVChunk(Base):
    """Chunked CV sections with embeddings — the RAG store."""
    __tablename__ = "cv_chunks"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("cv_documents.id"), nullable=False)
    user_id     = Column(String, nullable=False)    # Denormalized for fast lookup
    section     = Column(String)                    # "experience", "education", "skills", "projects", "summary"
    content     = Column(Text, nullable=False)
    chunk_index = Column(Integer)
    embedding   = Column(Vector(1536))              # OpenAI ada-002 / Anthropic dims
    metadata_   = Column("metadata", JSON, default=dict)
    created_at  = Column(DateTime(timezone=True), default=utcnow)

    document = relationship("CVDocument", back_populates="chunks")


# ─────────────────────────────────────────────────────────
#  Job Applications — Kanban
# ─────────────────────────────────────────────────────────
class ApplicationStatus(str, enum.Enum):
    SAVED       = "saved"
    APPLIED     = "applied"
    INTERVIEWING= "interviewing"
    OFFER       = "offer"
    REJECTED    = "rejected"


class Application(Base):
    """Job application tracker — Kanban card."""
    __tablename__ = "applications"

    id           = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id      = Column(String, ForeignKey("users.id"), nullable=False)
    job_title    = Column(String, nullable=False)
    company      = Column(String, nullable=False)
    location     = Column(String)
    salary_range = Column(String)
    job_url      = Column(String)
    job_desc     = Column(Text)
    fit_score    = Column(Float)                    # 0-100
    fit_breakdown= Column(JSON)                     # {skills: 80, experience: 70, ...}
    status       = Column(Enum(ApplicationStatus), default=ApplicationStatus.SAVED)
    applied_date = Column(DateTime(timezone=True))
    deadline     = Column(DateTime(timezone=True))
    notes        = Column(Text)
    created_at   = Column(DateTime(timezone=True), default=utcnow)
    updated_at   = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    user = relationship("User", back_populates="applications")


# ─────────────────────────────────────────────────────────
#  Goals & To-Dos
# ─────────────────────────────────────────────────────────
class GoalType(str, enum.Enum):
    APPLY   = "apply"
    LEARN   = "learn"
    CV      = "cv"
    OTHER   = "other"


class Goal(Base):
    """User-defined career goals."""
    __tablename__ = "goals"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id     = Column(String, ForeignKey("users.id"), nullable=False)
    title       = Column(String, nullable=False)
    goal_type   = Column(Enum(GoalType), default=GoalType.OTHER)
    target_value= Column(Integer)      # e.g. 5 (apply to 5 jobs)
    current_value=Column(Integer, default=0)
    deadline    = Column(DateTime(timezone=True))
    is_complete = Column(Boolean, default=False)
    created_at  = Column(DateTime(timezone=True), default=utcnow)

    user  = relationship("User", back_populates="goals")
    todos = relationship("Todo", back_populates="goal", cascade="all, delete-orphan")


class Todo(Base):
    """Daily/weekly to-do items linked to goals."""
    __tablename__ = "todos"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    goal_id     = Column(UUID(as_uuid=True), ForeignKey("goals.id"), nullable=True)
    user_id     = Column(String, nullable=False)
    title       = Column(String, nullable=False)
    due_date    = Column(DateTime(timezone=True))
    is_done     = Column(Boolean, default=False)
    priority    = Column(Integer, default=2)    # 1=high, 2=medium, 3=low
    created_at  = Column(DateTime(timezone=True), default=utcnow)

    goal = relationship("Goal", back_populates="todos")


# ─────────────────────────────────────────────────────────
#  AI Chat Sessions
# ─────────────────────────────────────────────────────────
class ChatSession(Base):
    """Conversation sessions with the AI assistant."""
    __tablename__ = "chat_sessions"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id    = Column(String, ForeignKey("users.id"), nullable=False)
    title      = Column(String, default="New conversation")
    created_at = Column(DateTime(timezone=True), default=utcnow)

    user     = relationship("User", back_populates="chat_sessions")
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan",
                            order_by="ChatMessage.created_at")


class ChatMessage(Base):
    """Individual messages inside a chat session."""
    __tablename__ = "chat_messages"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("chat_sessions.id"), nullable=False)
    role       = Column(String, nullable=False)   # "user" | "assistant"
    content    = Column(Text, nullable=False)
    metadata_  = Column("metadata", JSON, default=dict)   # used CV chunks, fit scores, etc.
    created_at = Column(DateTime(timezone=True), default=utcnow)

    session = relationship("ChatSession", back_populates="messages")
