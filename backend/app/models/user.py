from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    role = Column(String, default="user")  # 'user' or 'admin'
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship to LoanApplications
    applications = relationship("LoanApplication", back_populates="user", cascade="all, delete-orphan")
