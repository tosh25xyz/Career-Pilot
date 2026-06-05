# CareerPilot 🚀
> Your Agentic Career Co-pilot | Codesprint 2026

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- Docker & Docker Compose
- Clerk account (free) → https://clerk.com

---

## 1. Clone & Setup

```bash
git clone https://github.com/yourname/careerpilot
cd careerpilot
```

---

## 2. Database (Docker)

```bash
# Start PostgreSQL with pgvector
docker-compose up db -d
```

---

## 3. Backend

```bash
cd backend
cp .env.example .env
# Fill in your keys in .env

pip install -r requirements.txt
uvicorn main:app --reload
# → http://localhost:8000
# → http://localhost:8000/docs  (Swagger UI)
```

---

## 4. Frontend

```bash
cd frontend
cp .env.local.example .env.local
# Fill in your Clerk keys

npm install
npm run dev
# → http://localhost:3000
```

---

## Environment Variables

### Frontend (`frontend/.env.local`)
| Variable | Where to get |
|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk Dashboard → API Keys |
| `CLERK_SECRET_KEY` | Clerk Dashboard → API Keys |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` for local |

### Backend (`backend/.env`)
| Variable | Where to get |
|---|---|
| `DATABASE_URL` | Your PostgreSQL connection string |
| `CLERK_SECRET_KEY` | Clerk Dashboard → API Keys |
| `CLERK_JWKS_URL` | Clerk Dashboard → your domain + `/.well-known/jwks.json` |
| `ANTHROPIC_API_KEY` | https://console.anthropic.com |
| `SERPAPI_KEY` | https://serpapi.com |

---

## Architecture

```
User Browser
    │
    ▼
Next.js (Vercel)
    │  Clerk Auth (JWT)
    ▼
FastAPI (Railway)
    │
    ├── CV Router      → PDF/DOCX → LangChain chunker → pgvector
    ├── Jobs Router    → SerpAPI → Claude fit scoring
    ├── Assistant      → RAG (pgvector) → Claude Sonnet
    └── Tracker        → PostgreSQL CRUD
```

---

## Day-by-Day Build Plan

| Day | Feature |
|-----|---------|
| 1 ✅ | Foundation: Next.js + FastAPI + DB + Auth |
| 2   | CV Pipeline: Upload → Chunk → Embed → pgvector |
| 3   | AI Assistant with RAG-grounded responses |
| 4   | Job Hunter Agent + Fit Score |
| 5   | Tracker: Kanban + Calendar + Goals |
| 6   | Polish + Integration |
| 7   | Deploy + Video |
