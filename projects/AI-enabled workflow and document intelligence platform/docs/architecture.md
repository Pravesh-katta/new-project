# Architecture Notes

## Scope
This system supports workflow-driven document ingestion, asynchronous processing, and search with a dedicated frontend UI.

## Core Components
- `Frontend UI (HTML/CSS/JavaScript)`:
  - Authentication
  - Workflow creation/listing
  - Document upload and status monitoring
  - Search and result display
- `FastAPI API`:
  - Auth (`/auth/token`)
  - Workflows CRUD (`/workflows`)
  - Document upload/list/search (`/documents`)
  - Health (`/health`)
- `PostgreSQL/SQLite`:
  - Workflow metadata
  - Document metadata and extracted text
- `Redis + Celery`:
  - Asynchronous parse/index jobs
- `S3/MinIO or local storage fallback`:
  - Raw document object storage
- `OpenSearch or DB fallback`:
  - Search index for semantic/full-text retrieval

## Request Flow
1. User authenticates and gets JWT token.
2. Frontend calls FastAPI endpoints using the configured API base URL.
3. User creates a workflow and uploads a document.
4. API stores file (S3/MinIO/local), records metadata in DB.
5. API enqueues Celery task.
6. Worker reads object, extracts text, writes index to OpenSearch (if configured), updates DB status.
7. Search endpoint queries OpenSearch, or falls back to DB text search.

## Design Choices
- Uses defaults that run locally with minimal setup.
- Falls back gracefully when S3/OpenSearch are not configured.
- Keeps architecture aligned with deployment diagram but practical for local development.
