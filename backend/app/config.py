import os

class Settings:
    PROJECT_NAME: str = "DukaanSaathi AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./dukaansaathi.db")
    CORS_ORIGINS: list[str] = ["*"]
    DEFAULT_CURRENCY: str = "₹"
    DEFAULT_TIMEZONE: str = "Asia/Kolkata"

settings = Settings()
