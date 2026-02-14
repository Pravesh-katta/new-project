# Manufacturing Data Integration and Analytics Support Platform

## Architecture Diagram
```mermaid
flowchart LR
    OPS[Operations Team] --> API[Django / Flask REST APIs]
    API --> ORM[SQLAlchemy ORM]
    ORM --> DB[(MySQL / PostgreSQL / Oracle)]
    API --> ETL[Python ETL Jobs]
    ETL --> CALC[Pandas / NumPy Processing]
    CALC --> REP[Operational Reports]
    API --> S3[(AWS S3 Storage)]
    ERP[Enterprise Systems] --> API
    CRON[Cron / Job Scheduler] --> ETL
    API --> LOG[Structured Logging]
    LOG --> MON[Centralized Log Monitoring]
```

## Deployment Diagram
```mermaid
flowchart TB
    DEV[Developer] --> GIT[Git Repository]
    GIT --> CI[CI Build + Test Gate]
    CI --> TEST[PyTest / Unittest]
    TEST --> PKG[Package + Config]

    subgraph ENV[Environment Promotion]
        DEV_ENV[Dev] --> STG[Staging] --> PROD[Production]
    end

    PKG --> ENV

    subgraph SERVER[Linux Application Server]
        GUNICORN[Gunicorn WSGI Server]
        APP[Django / Flask Application]
        CRON[Cron Job Scheduler]
        GUNICORN --> APP
        CRON --> APP
    end

    subgraph DATA[Data Layer]
        DB_HOST[(Database Server - MySQL/PostgreSQL/Oracle)]
        S3[(AWS S3)]
    end

    ENV --> SERVER
    SERVER --> NGINX[Nginx Reverse Proxy]
    NGINX --> USERS[Operations Users]
    SERVER --> DATA
    SERVER --> SM[Environment Variables / Secrets Config]
    SERVER --> MON[Logs + Monitoring]
```

## Server Build Path
- Run automated tests (PyTest/Unittest) as CI gate before packaging.
- Package Python services and configuration from CI.
- Promote through Dev → Staging → Production environments.
- Deploy to Linux application servers running Gunicorn as WSGI server.
- Configure Cron jobs for scheduled ETL and reporting tasks.
- Expose APIs through Nginx reverse proxy.
- Store DB credentials and API keys in environment variables / secrets config files.
- Use SQLAlchemy ORM for database interactions with MySQL/PostgreSQL/Oracle.
- Store required files/backups in AWS S3.
- Use structured logging with centralized log monitoring for production support.
