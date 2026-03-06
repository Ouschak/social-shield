from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import api_router
from app.config.settings import get_settings
from app.db.session import engine, Base
from app.models import feedback # noqa: F401
import logging

Base.metadata.create_all(bind=engine)

# Configure logging to suppress noisy libraries
logging.getLogger("httpx").setLevel(logging.WARNING)

settings = get_settings()

app = FastAPI(title=settings.APP_NAME, version="1.0.0")

# CORS
origins = [
    "http://localhost:5173",  # Vite dev server
    "chrome-extension://*", # Extension (configured ID later)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For now allow all for ease of dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_PREFIX)

@app.get("/health")
def health_check():
    return {"status": "ok", "service": settings.APP_NAME}

main = app

