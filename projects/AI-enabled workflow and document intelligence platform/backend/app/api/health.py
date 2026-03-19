from fastapi import APIRouter

from app.core.config import get_settings
from app.services.search import SearchService
from app.services.storage import StorageService


router = APIRouter(prefix="/health", tags=["health"])


@router.get("")
def health_check() -> dict:
    settings = get_settings()
    storage = StorageService()
    search = SearchService()
    return {
        "status": "ok",
        "environment": settings.app_env,
        "services": {
            "database": "configured",
            "redis": settings.redis_url,
            "storage": "s3" if storage.uses_s3 else "local",
            "search": "opensearch" if search.enabled else "database-fallback",
        },
    }
