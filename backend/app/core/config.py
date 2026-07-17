import os

class Settings:
    PROJECT_NAME: str = "AI Loan Eligibility Prediction System"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "supersecretkeyforloanspredictionsystem1234567890")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # SQLite Database URI (can easily be replaced with PostgreSQL URL)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./loan_prediction.db")

settings = Settings()
