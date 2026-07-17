from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class XAIReason(BaseModel):
    factor: str
    impact: str  # 'positive', 'negative', 'neutral'
    detail: str


class LoanApplicationBase(BaseModel):
    gender: Optional[str] = Field(None, description="Gender (Male, Female)")
    married: Optional[str] = Field(None, description="Married status (Yes, No)")
    dependents: Optional[str] = Field("0", description="Number of dependents (0, 1, 2, 3+)")
    education: Optional[str] = Field("Graduate", description="Education level (Graduate, Not Graduate)")
    self_employed: Optional[str] = Field("No", description="Self-employed status (Yes, No)")
    applicant_income: float = Field(..., ge=0, description="Applicant monthly income in USD")
    coapplicant_income: float = Field(0.0, ge=0, description="Co-applicant monthly income in USD")
    loan_amount: float = Field(..., gt=0, description="Loan amount in thousands (e.g., 100 = $100k)")
    loan_amount_term: float = Field(360.0, gt=0, description="Loan amortization term in months")
    credit_history: float = Field(1.0, description="Credit history (1.0 = Good, 0.0 = Bad)")
    property_area: str = Field(..., description="Property location (Urban, Semiurban, Rural)")


class LoanApplicationCreate(LoanApplicationBase):
    pass


class LoanApplicationOut(LoanApplicationBase):
    id: int
    user_id: Optional[int] = None
    prediction: str
    confidence_score: float
    prob_approved: Optional[float] = None
    prob_rejected: Optional[float] = None
    rejection_reasons: Optional[str] = None  # JSON string for DB storage
    reasons: Optional[List[Dict[str, Any]]] = None  # Parsed XAI reasons for API response
    recommendations: Optional[List[str]] = None     # Parsed recommendations for API response
    computed_features: Optional[Dict[str, Any]] = None  # Engineered features for display
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class ApplicationUpdateStatus(BaseModel):
    status: str = Field(..., description="New status (Approved, Rejected, Pending)")


class PredictSandboxOut(BaseModel):
    """Sandbox prediction response — does not save to DB."""
    prediction: str
    confidence_score: float
    prob_approved: float
    prob_rejected: float
    reasons: List[Dict[str, Any]]
    recommendations: List[str]
    computed_features: Dict[str, Any]
