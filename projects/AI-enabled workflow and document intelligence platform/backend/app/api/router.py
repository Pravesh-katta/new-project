from fastapi import APIRouter

from app.api.admin import router as admin_router
from app.api.auth import router as auth_router
from app.api.change_orders import router as change_orders_router
from app.api.daily_reports import router as daily_reports_router
from app.api.documents import router as documents_router
from app.api.health import router as health_router
from app.api.llm import router as llm_router
from app.api.projects import router as projects_router
from app.api.rfis import router as rfis_router
from app.api.submittals import router as submittals_router
from app.api.workflows import router as workflows_router


api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(workflows_router)
api_router.include_router(documents_router)
api_router.include_router(llm_router)
api_router.include_router(projects_router)
api_router.include_router(rfis_router)
api_router.include_router(submittals_router)
api_router.include_router(change_orders_router)
api_router.include_router(daily_reports_router)
api_router.include_router(admin_router)
