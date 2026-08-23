from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
import os

class Settings(BaseSettings):
    app_name: str = "UrbanMind AI API"
    app_env: str = "development"
    host: str = "127.0.0.1"
    port: int = 8000
    allowed_origins: str = "http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174"
    
    mongodb_uri: str = "mongodb://127.0.0.1:27017"
    mongodb_db_name: str = "urbanmind_ai"
    
    jwt_secret_key: str = "urbanmind-development-secret-key-12345"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
