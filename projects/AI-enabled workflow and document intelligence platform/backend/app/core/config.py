from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "AI Workflow and Document Intelligence API"
    app_env: str = "local"
    api_v1_prefix: str = "/api/v1"

    # Auth
    jwt_secret: str = "change-me-in-prod"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    demo_user_email: str = "admin@example.com"
    demo_user_password: str = "admin123"

    # Data stores
    sqlalchemy_database_url: str = "sqlite:///./local.db"
    redis_url: str = "redis://redis:6379/0"

    # Object storage (S3/MinIO). If endpoint/bucket are blank, local filesystem is used.
    s3_endpoint_url: str = ""
    s3_access_key_id: str = ""
    s3_secret_access_key: str = ""
    s3_region: str = "us-east-1"
    s3_bucket: str = ""

    # Search (OpenSearch). If URL is blank, DB text search fallback is used.
    opensearch_url: str = ""
    opensearch_user: str = ""
    opensearch_password: str = ""
    opensearch_index: str = "documents"

    # CORS
    cors_origins: str = "http://127.0.0.1:3101,http://localhost:3101"

    # Local storage fallback directory
    local_object_storage_dir: str = "data/documents"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def local_object_storage_path(self) -> Path:
        return Path(self.local_object_storage_dir).resolve()


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
