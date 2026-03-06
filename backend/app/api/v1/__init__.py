from fastapi import APIRouter
from app.api.v1.endpoints import detection, ws, webhooks, feedback

api_router = APIRouter()

@api_router.get("/test")
def test_endpoint():
    return {"message": "API v1 is working"}

api_router.include_router(detection.router, tags=["detection"])

api_router.include_router(ws.router, tags=["websocket"])

api_router.include_router(webhooks.router, prefix="/webhooks", tags=["webhooks"])

api_router.include_router(feedback.router, prefix="/feedback", tags=["feedback"])
