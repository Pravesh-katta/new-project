# Financial Transaction Processing and Compliance Analytics Platform

## Readable Architecture Diagram (ASCII)
```text
Operations/Compliance Users
           |
           v
 [Angular / React Dashboards]
           |
           v
 [OAuth2 / JWT Auth Layer]
       |            |
       v            v
  [REST APIs]   [SOAP Services]
       |            |
       v            v
 [Django / Flask APIs] <------> [Java Spring Boot Services]
      |            |
      |            +------------------------------> [Kafka / RabbitMQ]
      |                                               |
      |                                               v
      |                                      [Celery + Redis Workers]
      |                                         |             |
      |                                         v             v
      |                                    [PySpark ETL]  [Celery Beat Scheduler]
      |                                         |         (recurring jobs)
      |                                         v
      +-----> [RDS - PostgreSQL/MySQL/SQL Server]   [Snowflake]
      |                                              (compliance analytics)
      +-----> [MongoDB]
      |
      +-----> [S3 Storage]
```

## Readable Deployment Diagram (ASCII)
```text
Developer -> Git Repo -> Jenkins CI -> PyTest/JUnit (Test Gate) -> Docker Build -> AWS ECR
                                                                                    |
                                                                                    v
                                                                     [Environment Promotion]
                                                                     Dev -> Staging -> Production
                                                                                    |
                                                                                    v
                                                               +--- AWS VPC ----------------------+
                                                               |                                  |
                                                               |  Public Subnet:                  |
                                                               |    Route53 -> Ingress / LB       |
                                                               |                                  |
                                                               |  Private Subnet:                 |
                                                               |    Amazon EKS Cluster            |
                                                               |      Namespace: api-services     |
                                                               |      Namespace: worker-services  |
                                                               |      Namespace: java-services    |
                                                               |      (Deployed via Helm Charts)  |
                                                               |    RDS (PostgreSQL/MySQL/SQL Srvr)|
                                                               |    MongoDB                       |
                                                               |    ElastiCache Redis             |
                                                               |    MSK (Managed Kafka)           |
                                                               |    S3 Storage                    |
                                                               +----------------------------------+
                                                                            |
                                                             +--------------+--------------+
                                                             v                             v
                                                    AWS Secrets Manager         ELK + Prometheus + Grafana
```

## Explanation
- `Angular/React Dashboards` provide compliance alerts, transaction visibility, and operational KPIs.
- `OAuth2/JWT Auth Layer` secures all API access with role-based access controls.
- `Django/Flask` and `Spring Boot` split responsibilities between API orchestration and domain services.
- Both `REST` and `SOAP` service endpoints are exposed for integration flexibility.
- `Kafka/RabbitMQ` decouples transaction processing stages for reliability.
- `Celery/Redis` runs asynchronous reconciliation and compliance tasks.
- `Celery Beat` schedules recurring jobs like reconciliation, validation, and report generation.
- `PySpark + Snowflake` supports large-scale compliance analytics and reporting.
- `S3` is used for document storage, backups, and data exchange.
- Deployment uses Jenkins CI with automated test gates (PyTest/JUnit) pushing to AWS ECR.
- Services are promoted through Dev → Staging → Production environments.
- EKS cluster uses separate namespaces for api, worker, and java services, deployed via Helm charts.
- All services run inside a VPC with public/private subnet separation.
- `AWS Secrets Manager` stores DB credentials, Kafka configs, and API keys.
- Observability stack (ELK + Prometheus + Grafana) provides logs, metrics, and alerting.
