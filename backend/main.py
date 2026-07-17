from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from backend.app.core.config import settings
from backend.app.core.database import engine, Base
from backend.app.api import auth, loans, admin

# Initialize database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Set CORS origins
# In production, specify actual frontend origins
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["authentication"])
app.include_router(loans.router, prefix=f"{settings.API_V1_STR}/loans", tags=["loans"])
app.include_router(admin.router, prefix=f"{settings.API_V1_STR}/admin", tags=["admin"])

@app.get("/")
def root():
    return {
        "message": "Welcome to the AI Loan Eligibility Prediction System API",
        "docs": "/docs",
        "status": "healthy"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
