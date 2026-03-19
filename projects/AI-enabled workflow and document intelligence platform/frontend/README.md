# Frontend Application

Single-page frontend for:
- Authentication
- Workflow creation/listing
- Document upload and indexing status
- Search over extracted document text

## Local URL
- `http://127.0.0.1:3101`

## API Connection
- Local default: `http://127.0.0.1:8101/api/v1`.
- Non-docker mode: set `API Base URL` in the UI, for example:
  - `http://127.0.0.1:8101/api/v1`
- Production mode:
  - If frontend and API share one domain with `/api` routing, default works.
  - If API is on a separate domain, set that full API base URL in the UI.

## Run (Docker Compose)
- Start from project root:
  - `cd infra && docker compose up --build`
