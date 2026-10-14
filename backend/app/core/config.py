from pydantic import Field, AliasChoices
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
import os

class Settings(BaseSettings):
    app_name: str = Field("UrbanMind AI API", validation_alias=AliasChoices("APP_NAME", "app_name"))
    app_env: str = Field("development", validation_alias=AliasChoices("APP_ENV", "app_env"))
    host: str = Field("127.0.0.1", validation_alias=AliasChoices("HOST", "host"))
    port: int = Field(8000, validation_alias=AliasChoices("PORT", "port"))
    allowed_origins: str = Field(
        "http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174,https://ai-urban-digital-twin.vercel.app",
        validation_alias=AliasChoices("ALLOWED_ORIGINS", "allowed_origins")
    )
    
    mongodb_uri: str = Field(
        "mongodb://127.0.0.1:27017",
        validation_alias=AliasChoices("MONGODB_URI", "MONGO_URI", "mongodb_uri")
    )
    mongodb_db_name: str = Field(
        "urbanmind_ai",
        validation_alias=AliasChoices("MONGODB_DB_NAME", "DATABASE_NAME", "mongodb_db_name")
    )
    
    jwt_secret_key: str = Field(
        "urbanmind-development-secret-key-12345",
        validation_alias=AliasChoices("JWT_SECRET_KEY", "JWT_SECRET", "jwt_secret_key")
    )
    jwt_algorithm: str = Field("HS256", validation_alias=AliasChoices("JWT_ALGORITHM", "jwt_algorithm"))
    access_token_expire_minutes: int = Field(60, validation_alias=AliasChoices("ACCESS_TOKEN_EXPIRE_MINUTES", "access_token_expire_minutes"))
    seed_demo_data: bool = Field(False, validation_alias=AliasChoices("SEED_DEMO_DATA", "seed_demo_data"))

    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
