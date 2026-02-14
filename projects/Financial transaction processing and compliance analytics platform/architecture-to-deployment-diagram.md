# Financial Transaction Processing and Compliance Analytics Platform

## Architecture Diagram
```mermaid
flowchart LR
    OPS[Operations User] --> UI[Angular / React Dashboards]
    UI --> AUTH[OAuth2 / JWT Auth Layer]
    AUTH --> REST[REST API Services]
    AUTH --> SOAP[SOAP Services]
    REST --> APIS[Python Django/Flask APIs]
    SOAP --> APIS
    APIS --> JAVA[Java Spring Boot Services]
    APIS --> MQ[Kafka / RabbitMQ]
    MQ --> JOBS[Celery + Redis Workers]
    APIS --> OLTP[(RDS - PostgreSQL / MySQL / SQL Server)]
    APIS --> DOC[(MongoDB)]
    APIS --> S3[(S3 Storage)]
    JOBS --> ETL[PySpark ETL Jobs]
    JOBS --> SCHED[Celery Beat Scheduler]
    ETL --> SF[(Snowflake Analytics)]
    UI --> REP[Compliance Reports]
    SF --> REP
```

## Deployment Diagram
```mermaid
flowchart TB
    DEV[Developer] --> GIT[Git Repository]
    GIT --> CI[Jenkins Pipeline]
    CI --> TEST[Automated Tests - PyTest / JUnit]
    TEST --> IMG[Build Docker Images]
    IMG --> ECR[AWS ECR Registry]

    subgraph ENV[Environment Promotion]
        DEV_ENV[Dev] --> STG[Staging] --> PROD[Production]
    end

    ECR --> ENV

    subgraph VPC[AWS VPC]
        subgraph PUB[Public Subnet]
            R53[Route53 DNS] --> ING[Ingress / Load Balancer]
        end
        subgraph PRIV[Private Subnet]
            subgraph EKS[Amazon EKS Cluster]
                NS_API[Namespace: api-services]
                NS_WORKER[Namespace: worker-services]
                NS_JAVA[Namespace: java-services]
                HELM[Helm Charts / K8s Manifests]
            end
            RDS[(RDS - PostgreSQL/MySQL/SQL Server)]
            MONGO[(MongoDB)]
            S3[(S3 Storage)]
            REDIS[ElastiCache Redis]
            KAFKA[MSK - Kafka]
        end
        ING --> EKS
        EKS --> RDS
        EKS --> MONGO
        EKS --> S3
        EKS --> REDIS
        EKS --> KAFKA
    end

    EKS --> SM[AWS Secrets Manager]
    EKS --> MON[ELK + Prometheus + Grafana]
    ING --> USERS[Business and Compliance Teams]
```

## Server Build Path
- Build and version Python and Java service containers in Jenkins with test gates (PyTest/JUnit).
- Push images to AWS ECR.
- Promote through Dev → Staging → Production environments.
- Deploy services to Amazon EKS using Helm charts with separated namespaces (api, workers, java).
- Configure MSK (Managed Kafka) and RabbitMQ for event-driven messaging.
- Use Celery Beat as scheduler for recurring reconciliation and compliance jobs.
- Store secrets (DB credentials, Kafka configs, API keys) in AWS Secrets Manager.
- Run PySpark ETL jobs to push data to Snowflake for compliance analytics.
- Route traffic through Route53 DNS → Ingress/Load Balancer → EKS pods.
- Monitor service health and alerts via ELK/Prometheus/Grafana.
