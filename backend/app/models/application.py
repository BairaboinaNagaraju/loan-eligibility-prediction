from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class LoanApplication(Base):
    __tablename__ = "loan_applications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Nullable for anonymous predictions

    # Feature columns matching the dataset
    gender = Column(String, nullable=True)
    married = Column(String, nullable=True)
    dependents = Column(String, nullable=True)
    education = Column(String, nullable=True)
    self_employed = Column(String, nullable=True)
    applicant_income = Column(Float, nullable=False)
    coapplicant_income = Column(Float, nullable=False)
    loan_amount = Column(Float, nullable=False)
    loan_amount_term = Column(Float, nullable=False)
    credit_history = Column(Float, nullable=False)  # 1.0 = Good, 0.0 = Bad
    property_area = Column(String, nullable=False)

    # Prediction outputs
    prediction = Column(String, nullable=False)        # 'Approved' or 'Rejected'
    confidence_score = Column(Float, nullable=False)   # Model confidence (0.0–1.0)
    prob_approved = Column(Float, nullable=True)       # Raw probability of approval
    prob_rejected = Column(Float, nullable=True)       # Raw probability of rejection

    # XAI data stored as JSON string: {"reasons": [...], "recommendations": [...]}
    rejection_reasons = Column(String, nullable=True)

    # Admin-overridable status
    status = Column(String, default="Pending")  # 'Approved', 'Rejected', 'Pending'

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    user = relationship("User", back_populates="applications")
