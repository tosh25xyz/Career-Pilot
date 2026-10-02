from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

from core.config import settings
from core.database import create_tables
from routers import cv, jobs, assistant, tracker, auth, dashboard

@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_tables()
    yield

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

# ─── Global Error Handler — কোনো unhandled error এ 500 এর বদলে clean JSON ───
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"[GlobalError] {request.url.path}: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Something went wrong on our end. Please try again.",
            "path": str(request.url.path),
        },
    )

# ─── Routers ───────────────────────────────────────────
app.include_router(auth.router,      prefix="/auth",      tags=["Auth"])
app.include_router(cv.router,        prefix="/cv",        tags=["CV"])
app.include_router(jobs.router,      prefix="/jobs",      tags=["Jobs"])
app.include_router(assistant.router, prefix="/assistant", tags=["Assistant"])
app.include_router(tracker.router,   prefix="/tracker",   tags=["Tracker"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])

@app.get("/health")
async def health():
    return {"status": "ok", "service": "careerpilot-api"}
