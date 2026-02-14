# Healthcare Interoperability and Patient Risk Analytics Platform

## Readable Architecture Diagram (ASCII)
```text
Clinical / Operations Users
            |
            v
     [Angular Dashboard]
            |
            v
    [RBAC + Auth Layer]
            |
            v
   [Django / Flask APIs] <--------- [External Healthcare Systems]
         |       |                        |              |
         |       |                    [REST Endpoints] [SOAP Endpoints]
         |       |
         |       v
         |  [GDPR / NHS Governance Controls]
         |       |
         |       +---> [Audit Logging]
         |       +---> [Data Encryption Layer]
         |
         v
 [Python + Pandas/PySpark ETL] <--- [Celery Beat Scheduler]
            |                        (recurring batch jobs)
            +--------------------------> [PostgreSQL / MySQL / Oracle]
            |                             (structured healthcare data)
            +--------------------------> [MongoDB]
            |                             (documents/semi-structured data)
            v
   [Scikit-learn Risk Models]
            |
            v
      [Risk Insights UI]
```

## Readable Deployment Diagram (ASCII)
```text
Developer -> Git Repo -> Jenkins CI/CD -> PyTest (Test Gate) -> Docker Build -> GCP Artifact Registry
                              |                                                        |
                              v                                                        v
                     [Ansible Config Mgmt]                              [Environment Promotion]
                              |                                       Dev -> Staging -> Production
                              v                                                        |
                     [Infrastructure Provisioning]                                     v
                                                            +--- GCP VPC Network ----------------+
                                                            |                                    |
                                                            |  Public Subnet:                    |
                                                            |    Cloud DNS -> GCP Load Balancer  |
                                                            |                                    |
                                                            |  Private Subnet:                   |
                                                            |    GKE Kubernetes Cluster           |
                                                            |    Cloud SQL (PostgreSQL/MySQL)     |
                                                            |    Oracle DB (On-prem/Managed)      |
                                                            |    MongoDB Atlas                    |
                                                            |    Cloud Storage (GCS)              |
                                                            +------------------------------------+
                                                                          |
                                                           +--------------+--------------+
                                                           v                             v
                                                   GCP Secret Manager        Cloud Monitoring / Logging
```

## Explanation
- APIs integrate healthcare data from external systems via both REST and SOAP endpoints.
- `RBAC + Auth Layer` enforces role-based access controls for all API access.
- `GDPR/NHS Governance Controls` ensure data encryption, audit logging, and consent management compliance.
- ETL normalizes/validates data before analytics and risk scoring.
- `Celery Beat` schedules recurring ETL, batch processing, and report generation jobs.
- Risk models produce insights for care and operations teams.
- `Ansible` handles infrastructure provisioning and configuration management alongside Docker/Jenkins CI/CD.
- Deployment targets GKE on GCP within a VPC with public/private subnet separation.
- `Cloud DNS` routes traffic through GCP Load Balancer to GKE services.
- `GCP Secret Manager` stores DB credentials, API keys, and encryption keys.
- `Cloud Monitoring/Logging` provides centralized observability for production support.
