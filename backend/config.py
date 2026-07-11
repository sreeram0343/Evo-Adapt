import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./recode.db"
    ENVIRONMENT: str = "development"
    OPENAI_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    SECRET_KEY: str = "recode-super-secret-key-for-mvp"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
