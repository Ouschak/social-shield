from pydantic_settings import BaseSettings
from functools import lru_cache
from pathlib import Path

class Settings(BaseSettings):
    # App
    APP_NAME: str = "Social Shield API"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"
    
    # Database
    # Switched to sqlite for hackathon simplicity, although guide says postgres
    DATABASE_URL: str = "sqlite:///./creatorshield.db"
    
    # JWT
    SECRET_KEY: str = "CHANGE_THIS_SECRET_KEY_IN_PRODUCTION"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 1 day
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Meta API
    META_APP_ID: str = ""
    META_APP_SECRET: str = "mock-secret"
    META_VERIFY_TOKEN: str = "creator-shield-verify"
    
    # Paths
    @property
    def BASE_PATH(self):
        return Path(__file__).resolve().parent.parent.parent.parent
        
    @property
    def GENAI_PATH(self):
        return self.BASE_PATH / "Gen_AI"
        
    @property
    def MODEL_PATH(self):
        return self.GENAI_PATH / "model"
    
    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings()
