# Reflect

Your journal remembers what you forget.

An AI‑powered journaling app that spots patterns, tracks emotions, and surfaces practical lessons.

## Tech Stack
- Frontend: React + Vite
- Auth & Storage: Local FastAPI + SQLite + JWT (custom)
- Analysis Engine: Claude API
- Charts: Recharts (visualizations for tone, mood, relationships)
- AI Processing: FastAPI endpoints
- Emails: Resend

## Running locally
```bash
# Backend
env FASTAPI_TITLE="Reflect API"
uvicorn backend.main:app --reload

# Frontend
npm install
npm run dev
```
