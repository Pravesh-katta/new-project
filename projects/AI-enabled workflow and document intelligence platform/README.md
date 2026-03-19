# AI-enabled Workflow and Document Intelligence Platform

Backend-first implementation aligned to the project architecture and deployment flow.

## Folder Structure
```text
AI-enabled workflow and document intelligence platform/
├── backend/                       # FastAPI + Celery backend
│   ├── app/
│   │   ├── api/                   # API endpoints (auth, workflows, documents, health)
│   │   ├── core/                  # Config and security
│   │   ├── db/                    # SQLAlchemy setup
│   │   ├── models/                # DB models
│   │   ├── schemas/               # API schemas
│   │   ├── services/              # Storage and search services
│   │   └── tasks/                 # Celery worker tasks
│   ├── tests/
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                      # Web UI connected to backend APIs
├── infra/
│   ├── docker-compose.yml         # Local stack
│   └── k8s/                       # Kubernetes manifests
├── docs/
│   ├── architecture.md
│   └── deployment.md
├── architecture-to-deployment-diagram.md
└── readable-diagram-and-explanation.md
```

## Local IP and Ports
- Frontend UI: `http://127.0.0.1:3101`
- API base URL: `http://127.0.0.1:8101`
- OpenAPI docs: `http://127.0.0.1:8101/docs`
- Postgres: `127.0.0.1:5433`
- Redis: `127.0.0.1:6379`
- OpenSearch: `http://127.0.0.1:9200`
- MinIO API: `http://127.0.0.1:9000`
- MinIO Console: `http://127.0.0.1:9001`

## Quick Start (Docker Compose)
1. Copy env template:
   - `cp infra/.env.example infra/.env`
2. Start services:
   - `cd infra && docker compose up --build`
3. Verify health:
   - `curl http://127.0.0.1:8101/api/v1/health`
4. Get auth token:
   - `curl -X POST "http://127.0.0.1:8101/api/v1/auth/token" -H "Content-Type: application/x-www-form-urlencoded" -d "username=admin@example.com&password=admin123"`
5. Open frontend:
   - `http://127.0.0.1:3101`

## Example UI Flow
1. Sign in from frontend using demo credentials.
2. Create workflow from `Workflow Management`.
3. Upload document from `Document Processing`.
4. Wait for indexing and use `Search`.

## Kubernetes Deployment (Server)
- Use files under `infra/k8s/`.
- Replace image names in deployments:
  - `your-registry/ai-workflow-api:latest`
  - `your-registry/ai-workflow-frontend:latest`
- Create real secret from `infra/k8s/secret.example.yaml`.
- Apply manifests:
  - `kubectl apply -f infra/k8s/namespace.yaml`
  - `kubectl apply -f infra/k8s/configmap.yaml`
  - `kubectl apply -f infra/k8s/secret.example.yaml`
  - `kubectl apply -f infra/k8s/api-deployment.yaml`
  - `kubectl apply -f infra/k8s/worker-deployment.yaml`
  - `kubectl apply -f infra/k8s/api-service.yaml`
  - `kubectl apply -f infra/k8s/frontend-deployment.yaml`
  - `kubectl apply -f infra/k8s/frontend-service.yaml`
  - `kubectl apply -f infra/k8s/app-ingress.yaml`
