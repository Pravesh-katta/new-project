# Healthcare Interoperability and Patient Risk Analytics Platform

## Architecture Diagram
```mermaid
flowchart LR
    CLIN[Clinical User] --> UI[Angular Dashboard]
    UI --> AUTH[RBAC + Auth Layer]
    AUTH --> API[Django / Flask Integration APIs]
    EXT[External Healthcare Systems] --> SOAP[SOAP Endpoints]
    EXT --> REST[REST Endpoints]
    SOAP --> API
    REST --> API
    API --> GOV[GDPR / NHS Governance Controls]
    GOV --> ETL[Python + Pandas/PySpark Pipelines]
    ETL --> SCHED[Celery Beat Scheduler]
    ETL --> DWH[(PostgreSQL / MySQL / Oracle)]
    ETL --> DOC[(MongoDB)]
    DWH --> ML[Scikit-learn Risk Models]
    ML --> UI
    API --> AUDIT[Audit Logging]
    API --> SEC[Data Encryption Layer]
```

## Deployment Diagram
```mermaid
flowchart TB
    DEV[Developer] --> GIT[Git Repository]
    GIT --> CI[Jenkins CI/CD]
    CI --> TEST[Automated Tests - PyTest]
    TEST --> IMG[Docker Build]
    IMG --> REG[GCP Artifact Registry]
    CI --> ANSIBLE[Ansible Configuration Management]

    subgraph ENV[Environment Promotion]
        DEV_ENV[Dev] --> STG[Staging] --> PROD[Production]
    end

    REG --> ENV

    subgraph GVPC[GCP VPC Network]
        subgraph PUB[Public Subnet]
            DNS[Cloud DNS] --> LB[GCP Load Balancer]
        end
        subgraph PRIV[Private Subnet]
            GKE[GKE Kubernetes Cluster]
            CSQL[(Cloud SQL - PostgreSQL/MySQL)]
            ORACLE[(Oracle DB - On-prem/Managed)]
            MONGO[(MongoDB Atlas)]
            GCS[(Cloud Storage)]
        end
        LB --> GKE
        GKE --> CSQL
        GKE --> ORACLE
        GKE --> MONGO
        GKE --> GCS
    end

    ANSIBLE --> GKE
    GKE --> SM[GCP Secret Manager]
    GKE --> OBS[Cloud Monitoring + Cloud Logging]
    LB --> USERS[Clinical and Operations Teams]
```

## Server Build Path
- Build API and worker containers through Jenkins with automated test gates.
- Push images to GCP Artifact Registry.
- Use Ansible for configuration management and infrastructure provisioning.
- Promote through Dev → Staging → Production environments.
- Deploy services to GKE Kubernetes cluster within GCP VPC (private subnets).
- Configure Cloud DNS to route traffic through GCP Load Balancer (public subnet).
- Store secrets (DB credentials, API keys, encryption keys) in GCP Secret Manager.
- Use Celery Beat to schedule recurring ETL and risk-scoring batch jobs.
- Enforce GDPR/NHS governance controls including data encryption, audit logging, and consent management.
- Expose both REST and SOAP endpoints for external healthcare system interoperability.
- Use Cloud Monitoring and Cloud Logging for production observability.
