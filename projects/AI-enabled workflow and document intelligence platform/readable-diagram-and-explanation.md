# AI-enabled Workflow and Document Intelligence Platform

## Readable Architecture Diagram (ASCII)
```text
Business Users
    |
    v
[Angular Frontend]
    |
    v
[API Gateway / ALB]
    |
    v
[OAuth2 / JWT Auth Layer]
    |
    v
[FastAPI / Flask Services] ---------+-------------------> [Redis Cache]
        |                           |
        +--- [SQLAlchemy ORM] ----> [PostgreSQL / MySQL]
        |                           (transaction data)
        +-------------------------> [DynamoDB]
        |                           (document metadata)
        +-------------------------> [S3]
        |                           (document storage)
        +-------------------------> [LLM / RAG Service] ---> [OpenSearch]
        |                                                     (semantic search)
        v
   [Celery + Redis Queue] ---> [Worker Services] ---> [OpenSearch]
                                      |
                                      v
                                    [S3]
```

## Readable Deployment Diagram (ASCII)
```text
Developer -> Git Repo -> Jenkins/CodePipeline -> PyTest (Test Gate) -> Docker Build -> AWS ECR
                                                                                        |
                                                                                        v
                                                                          [Environment Promotion]
                                                                          Dev -> Staging -> Production
                                                                                        |
                                                                                        v
                                                                    +--- AWS VPC -------------------+
                                                                    |                               |
                                                                    |  Public Subnet:               |
                                                                    |    Route53 -> ALB             |
                                                                    |                               |
                                                                    |  Private Subnet:              |
                                                                    |    ECS/Fargate Services       |
                                                                    |    RDS (PostgreSQL/MySQL)     |
                                                                    |    DynamoDB                   |
                                                                    |    ElastiCache Redis          |
                                                                    |    S3 Storage                 |
                                                                    |    OpenSearch                 |
                                                                    +-------------------------------+
                                                                                |
                                                                +---------------+---------------+
                                                                v                               v
                                                       AWS Secrets Manager            CloudWatch / X-Ray
```

## Explanation
- `Angular Frontend` is the user interface where users upload/search documents.
- `OAuth2/JWT Auth Layer` secures all API access with token-based authentication and role-based access controls.
- `FastAPI/Flask Services` handle business APIs for workflow, approval, and retrieval.
- `SQLAlchemy ORM` manages database interactions with PostgreSQL/MySQL.
- `Redis` serves dual purpose: caching for API responses and message broker for Celery task queues.
- `LLM/RAG Service` provides semantic search and contextual retrieval capabilities via OpenSearch.
- `Celery + Redis` runs long background tasks like document parsing, indexing, and retries.
- `OpenSearch` stores searchable vectors/index data for fast semantic retrieval.
- Deployment uses CI/CD with automated test gates to build containers pushed to AWS ECR.
- Services are promoted through Dev → Staging → Production environments.
- All services run inside a VPC with public/private subnet separation.
- Route53 handles DNS resolution to the ALB in the public subnet.
- `AWS Secrets Manager` stores DB credentials, API keys, and JWT signing keys.
- `CloudWatch/X-Ray` provides centralized logging, metrics, and distributed tracing.
