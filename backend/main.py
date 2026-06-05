from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from core.config import settings
from core.database import create_tables
from routers import cv, jobs, assistant, tracker, auth

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create DB tables
    await create_tables()
    yield
    # Shutdown: cleanup if needed

app = FastAPI(
    title="CareerPilot API",
    description="Agentic career co-pilot backend",
    version="1.0.0",
    lifespan=lifespan,
)

# ─── CORS ──────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ───────────────────────────────────────────
app.include_router(auth.router,      prefix="/auth",      tags=["Auth"])
app.include_router(cv.router,        prefix="/cv",        tags=["CV"])
app.include_router(jobs.router,      prefix="/jobs",      tags=["Jobs"])
app.include_router(assistant.router, prefix="/assistant", tags=["Assistant"])
app.include_router(tracker.router,   prefix="/tracker",   tags=["Tracker"])

@app.get("/health")
async def health():
    return {"status": "ok", "service": "careerpilot-api"}
