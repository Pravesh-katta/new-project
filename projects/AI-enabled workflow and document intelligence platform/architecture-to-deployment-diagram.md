# AI-enabled Workflow and Document Intelligence Platform

## Architecture Diagram
```mermaid
flowchart LR
    U[Business User] --> UI[Angular Frontend]
    UI --> GW[API Gateway / ALB]
    GW --> AUTH[OAuth2 / JWT Auth Layer]
    AUTH --> API[FastAPI / Flask Services]
    API --> ORM[SQLAlchemy ORM]
    ORM --> DB[(PostgreSQL / MySQL)]
    API --> META[(DynamoDB)]
    API --> OBJ[(S3 Document Store)]
    API --> CACHE[Redis Cache]
    API --> Q[Celery + Redis Queue]
    Q --> W[Worker Services]
    W --> IDX[(OpenSearch Index)]
    W --> OBJ
    API --> LLM[LLM / RAG Service]
    LLM --> IDX
    API --> IDX
```

## Deployment Diagram
```mermaid
flowchart TB
    DEV[Developer] --> GIT[Git Repository]
    GIT --> CI[Jenkins + CodePipeline]
    CI --> TEST[Automated Tests - PyTest]
    TEST --> IMG[Build Docker Image]
    IMG --> ECR[AWS ECR Registry]

    subgraph ENV[Environment Promotion]
        DEV_ENV[Dev] --> STG[Staging] --> PROD[Production]
    end

    ECR --> ENV

    subgraph VPC[AWS VPC]
        subgraph PUB[Public Subnet]
            R53[Route53 DNS] --> ALB[Application Load Balancer]
        end
        subgraph PRIV[Private Subnet]
            ECS[ECS / Fargate Services]
            RDS[(RDS - PostgreSQL/MySQL)]
            DYNAMO[(DynamoDB)]
            S3[(S3 Storage)]
            REDIS[ElastiCache Redis]
            OS[(OpenSearch)]
        end
        ALB --> ECS
        ECS --> RDS
        ECS --> DYNAMO
        ECS --> S3
        ECS --> REDIS
        ECS --> OS
    end

    ECS --> SM[AWS Secrets Manager]
    ECS --> CW[CloudWatch + X-Ray]
    ALB --> USER[End Users]
```

## Server Build Path
- Build container images in CI with automated test gates.
- Push images to AWS ECR.
- Promote through Dev → Staging → Production environments.
- Deploy backend services to ECS/Fargate within a VPC (private subnets).
- Configure Route53 DNS to point to ALB (public subnet).
- Store secrets (DB credentials, API keys, JWT signing keys) in AWS Secrets Manager.
- Use ElastiCache Redis for caching and Celery task queues.
- Use CloudWatch/X-Ray for health monitoring, logging, and distributed tracing.
