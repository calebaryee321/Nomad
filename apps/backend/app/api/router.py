from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.collections import router as collections_router
from app.api.v1.health import router as health_router
from app.api.v1.items import router as items_router
from app.api.v1.tags import router as tags_router

api_router = APIRouter(prefix="/api")
api_router.include_router(health_router, prefix="/v1", tags=["health"])
api_router.include_router(auth_router, prefix="/v1/auth", tags=["auth"])
api_router.include_router(collections_router, prefix="/v1/collections", tags=["collections"])
api_router.include_router(items_router, prefix="/v1/items", tags=["items"])
api_router.include_router(tags_router, prefix="/v1/tags", tags=["tags"])
