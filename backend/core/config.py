from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    DATABASE_URL: str
    CLERK_SECRET_KEY: str
    CLERK_JWKS_URL: str

    # AI Keys — Anthropic বা Gemini যেকোনো একটা
    ANTHROPIC_API_KEY: str = ""
    GEMINI_API_KEY:    str = ""   # aistudio.google.com থেকে free নাও

    # Job Search
    ADZUNA_APP_ID:  str = ""
    ADZUNA_APP_KEY: str = ""
    SERPAPI_KEY:    str = ""

    CORS_ORIGINS: List[str] = ["http://localhost:3000"]
    ENVIRONMENT: str = "development"

    class Config:
        env_file = ".env"

settings = Settings()
