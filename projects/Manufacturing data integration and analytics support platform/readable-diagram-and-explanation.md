# Manufacturing Data Integration and Analytics Support Platform

## Readable Architecture Diagram (ASCII)
```text
Operations Team
      |
      v
[Django / Flask REST APIs] <---------------- [Enterprise Operational Systems]
      |
      +--- [SQLAlchemy ORM] --------------> [MySQL / PostgreSQL / Oracle]
      |                                      (operations + reporting data)
      |
      v
[Python ETL Jobs] <--- [Cron / Job Scheduler]
      |                  (scheduled recurring jobs)
      v
[Pandas / NumPy Processing] ---> [Operational Reports]
      |
      v
    [AWS S3]
      
[Structured Logging] ---> [Centralized Log Monitoring]
```

## Readable Deployment Diagram (ASCII)
```text
Developer -> Git Repo -> CI Build -> PyTest/Unittest (Test Gate) -> Package/Config
                                                                        |
                                                                        v
                                                          [Environment Promotion]
                                                          Dev -> Staging -> Production
                                                                        |
                                                                        v
                                                        +--- Linux Application Server ------+
                                                        |                                   |
                                                        |  Gunicorn (WSGI Server)           |
                                                        |     |                             |
                                                        |     v                             |
                                                        |  Django / Flask Application       |
                                                        |                                   |
                                                        |  Cron Job Scheduler               |
                                                        |  (ETL + Reporting tasks)          |
                                                        |                                   |
                                                        |  Env Variables / Secrets Config   |
                                                        +-----------------------------------+
                                                                  |
                                                   +--------------+--------------+
                                                   v              |              v
                                           Nginx Reverse Proxy    |        Logs / Monitoring
                                                   |              v
                                                   v         DB Server
                                           Operations Users  (MySQL/PostgreSQL/Oracle)
                                                              + AWS S3
```

## Explanation
- This project is backend-focused: APIs + ETL + reporting support.
- `SQLAlchemy ORM` manages all database interactions for clean, maintainable data access.
- Relational databases store operational/manufacturing data.
- ETL and calculations are implemented in Python with Pandas/NumPy.
- `Cron / Job Scheduler` triggers recurring ETL scripts and report generation tasks.
- Deployment runs on Linux application servers with `Gunicorn` as the WSGI server.
- `Nginx` serves as reverse proxy, handling SSL termination and request routing.
- Services are promoted through Dev → Staging → Production environments.
- DB credentials and API keys are stored in environment variables / secrets config files.
- `Structured logging` provides visibility into application behavior for production support.
- S3 is used for files/backups required by data workflows.
