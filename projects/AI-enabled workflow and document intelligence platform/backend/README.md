# Backend Service

FastAPI + Celery service for workflow and document intelligence.

## Local Run (Without Docker)
1. Create virtualenv and install dependencies:
   - `python3 -m venv .venv`
   - `source .venv/bin/activate`
   - `pip install -r requirements.txt`
2. Copy env and adjust values:
   - `cp .env.example .env`
3. Start API:
   - `uvicorn app.main:app --host 0.0.0.0 --port 8101 --reload`
4. Start worker (separate terminal):
   - `celery -A app.tasks.celery_app:celery_app worker -l info`

## Key Endpoints
- `GET /api/v1/health`
- `POST /api/v1/auth/token`
- `POST /api/v1/workflows`
- `POST /api/v1/documents/upload`
- `GET /api/v1/documents/search/query?query=<text>`
