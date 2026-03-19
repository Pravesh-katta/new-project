# Deployment Guide

## Local Deployment (Docker Compose)
Prerequisites:
- Docker Desktop with Compose support

Steps:
1. `cp infra/.env.example infra/.env`
2. `cd infra`
3. `docker compose up --build`

Validation:
- API health: `http://127.0.0.1:8101/api/v1/health`
- API docs: `http://127.0.0.1:8101/docs`
- Frontend UI: `http://127.0.0.1:3101`
- MinIO Console: `http://127.0.0.1:9001`

Stop:
- `docker compose down`

## Server Deployment (Kubernetes)
Prerequisites:
- Kubernetes cluster
- Container registry

Steps:
1. Build and push backend image:
   - `docker build -t your-registry/ai-workflow-api:latest backend`
   - `docker push your-registry/ai-workflow-api:latest`
2. Build and push frontend image:
   - `docker build -t your-registry/ai-workflow-frontend:latest frontend`
   - `docker push your-registry/ai-workflow-frontend:latest`
3. Update image names in k8s deployment manifests.
4. Create secure secret (do not apply example secret directly in production).
5. Apply manifests:
   - `kubectl apply -f infra/k8s/namespace.yaml`
   - `kubectl apply -f infra/k8s/configmap.yaml`
   - `kubectl apply -f infra/k8s/secret.example.yaml`
   - `kubectl apply -f infra/k8s/api-deployment.yaml`
   - `kubectl apply -f infra/k8s/worker-deployment.yaml`
   - `kubectl apply -f infra/k8s/api-service.yaml`
   - `kubectl apply -f infra/k8s/frontend-deployment.yaml`
   - `kubectl apply -f infra/k8s/frontend-service.yaml`
   - `kubectl apply -f infra/k8s/app-ingress.yaml`

## Production Notes
- Replace Postgres/Redis/OpenSearch/S3 endpoints with managed services.
- Rotate secrets and avoid static demo credentials.
- Enable TLS at ingress and enforce network policies.
- Add autoscaling for API and worker based on queue depth and CPU.
