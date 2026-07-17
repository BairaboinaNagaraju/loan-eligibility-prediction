"""
main.py — FastAPI ML microservice for loan prediction.
Endpoints: /predict, /risk-score, /fraud, /model-info
"""
import os
import time
import json
import numpy as np
import joblib
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

app = FastAPI(
    title="Vertex Loan AI — ML Microservice",
    description="Loan prediction, risk scoring, and fraud detection API",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Load Model ──────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "models", "best_model.joblib")
METRICS_PATH = os.path.join(BASE_DIR, "models", "metrics.json")

model_bundle = None
metrics_data = None

def load_model():
    global model_bundle, metrics_data
    if os.path.exists(MODEL_PATH):
        model_bundle = joblib.load(MODEL_PATH)
        print(f"Loaded model: {model_bundle['model_name']}")
    else:
        print("No trained model found. Run train.py first.")

    if os.path.exists(METRICS_PATH):
        with open(METRICS_PATH) as f:
            metrics_data = json.load(f)

load_model()


# ─── Schemas ─────────────────────────────────────────────────────────────────
class PredictRequest(BaseModel):
    age: int = Field(..., ge=18, le=100)
    gender: str = "male"
    married: int = Field(0, ge=0, le=1)
    dependents: int = Field(0, ge=0, le=10)
    education: str = "Graduate"
    self_employed: int = Field(0, ge=0, le=1)
    applicant_income: float
    coapplicant_income: float = 0.0
    loan_amount: float
    loan_term: int
    credit_score: int = Field(..., ge=300, le=900)
    credit_history: float = Field(1.0, ge=0.0, le=1.0)
    property_area: str = "Urban"
    annual_income: float = 0.0
    existing_loans: float = 0.0
    monthly_expenses: float = 0.0
    savings: float = 0.0
    assets: float = 0.0
    investments: float = 0.0
    job_experience: float = 0.0
    ip_address: str = ""
    same_ip_count: int = 0


def engineer_features(req: PredictRequest) -> np.ndarray:
    monthly_income = req.applicant_income + req.coapplicant_income
    annual_income = req.annual_income if req.annual_income > 0 else monthly_income * 12

    r = 0.01
    n = req.loan_term
    emi = (req.loan_amount * r * (1 + r) ** n) / ((1 + r) ** n - 1) if n > 0 else 0
    debt_to_income = (req.existing_loans / 12 + emi) / max(monthly_income, 1)
    income_to_loan = annual_income / max(req.loan_amount, 1)
    savings_ratio = req.savings / max(annual_income, 1)

    gender_enc = 1 if req.gender.lower() == 'male' else 0
    education_enc = 1 if req.education == 'Graduate' else 0
    area_map = {'Urban': 2, 'Semiurban': 1, 'Rural': 0}
    area_enc = area_map.get(req.property_area, 1)

    return np.array([[
        req.age, gender_enc, req.married, req.dependents, education_enc, req.self_employed,
        monthly_income, req.loan_amount, req.loan_term, req.credit_score, req.credit_history,
        area_enc, annual_income, req.existing_loans, req.monthly_expenses, req.savings,
        req.job_experience, emi, debt_to_income, income_to_loan, savings_ratio,
    ]])


def compute_risk_score(req: PredictRequest) -> tuple[float, str]:
    """Compute 0–100 risk score."""
    score = 0.0

    # Credit score contribution (40%)
    if req.credit_score >= 800:
        score += 0
    elif req.credit_score >= 750:
        score += 8
    elif req.credit_score >= 700:
        score += 16
    elif req.credit_score >= 650:
        score += 25
    elif req.credit_score >= 600:
        score += 35
    else:
        score += 40

    # Debt-to-income (30%)
    monthly_income = req.applicant_income + req.coapplicant_income
    r = 0.01; n = req.loan_term
    emi = (req.loan_amount * r * (1 + r) ** n) / ((1 + r) ** n - 1) if n > 0 else 0
    dti = (req.existing_loans / 12 + emi) / max(monthly_income, 1)
    score += min(dti * 60, 30)

    # Experience (15%)
    if req.job_experience >= 5:
        score += 0
    elif req.job_experience >= 3:
        score += 5
    elif req.job_experience >= 1:
        score += 10
    else:
        score += 15

    # Savings (15%)
    annual_income = req.annual_income if req.annual_income > 0 else monthly_income * 12
    savings_ratio = req.savings / max(annual_income, 1)
    score += max(0, 15 - savings_ratio * 30)

    score = min(max(score, 0), 100)

    if score <= 20: level = "Very Low Risk"
    elif score <= 40: level = "Low Risk"
    elif score <= 60: level = "Medium Risk"
    elif score <= 80: level = "High Risk"
    else: level = "Very High Risk"

    return round(score, 2), level


def detect_fraud(req: PredictRequest) -> tuple[float, list]:
    """Detect fraud indicators."""
    flags = []
    score = 0.0

    # Same IP multiple apps
    if req.same_ip_count > 3:
        flags.append(f"Multiple applications from same IP ({req.same_ip_count})")
        score += 0.25

    # Abnormal income
    if req.applicant_income > 1000000:
        flags.append("Abnormally high reported income")
        score += 0.15

    # Income vs loan mismatch
    annual_income = req.annual_income if req.annual_income > 0 else req.applicant_income * 12
    if req.loan_amount > annual_income * 10:
        flags.append("Loan amount far exceeds annual income")
        score += 0.2

    # Savings anomaly
    if req.savings > annual_income * 20:
        flags.append("Reported savings unusually high relative to income")
        score += 0.1

    # Zero expenses with high income
    if req.monthly_expenses < req.applicant_income * 0.05 and req.applicant_income > 50000:
        flags.append("Reported monthly expenses suspiciously low")
        score += 0.1

    # Young age with very high experience
    if req.age < 25 and req.job_experience > 5:
        flags.append("Job experience exceeds possible working years for given age")
        score += 0.15

    return round(min(score, 1.0), 3), flags


def generate_factors(req: PredictRequest, verdict: str, confidence: float) -> tuple[list, list, list, str]:
    """Generate positive/negative factors and improvement suggestions."""
    positives = []
    negatives = []
    improvements = []

    # Credit Score
    if req.credit_score >= 750:
        positives.append(f"Excellent Credit Score ({req.credit_score})")
    elif req.credit_score >= 650:
        positives.append(f"Good Credit Score ({req.credit_score})")
    else:
        negatives.append(f"Low Credit Score ({req.credit_score})")
        improvements.append({"action": "Improve Credit Score", "detail": f"Target 750+. Current: {req.credit_score}", "impact": "high"})

    # Income stability
    if req.job_experience >= 5:
        positives.append(f"Strong Employment History ({req.job_experience:.1f} years)")
    elif req.job_experience >= 2:
        positives.append(f"Moderate Employment History ({req.job_experience:.1f} years)")
    else:
        negatives.append(f"Short Job Experience ({req.job_experience:.1f} years)")
        improvements.append({"action": "Build Employment History", "detail": "Work for at least 2 more years before applying", "impact": "medium"})

    # Existing loans
    monthly_income = req.applicant_income + req.coapplicant_income
    if req.existing_loans < monthly_income * 3:
        positives.append("Low Existing Debt Burden")
    elif req.existing_loans < monthly_income * 6:
        negatives.append("Moderate Existing Loan Burden")
    else:
        negatives.append("High Existing Loan Burden")
        improvements.append({"action": "Reduce Existing Loans", "detail": "Pay off existing debt before applying", "impact": "high"})

    # Loan amount vs income
    annual_income = req.annual_income if req.annual_income > 0 else monthly_income * 12
    if req.loan_amount <= annual_income * 2:
        positives.append("Loan Amount is Within Affordable Range")
    elif req.loan_amount <= annual_income * 5:
        negatives.append("Loan Amount Relative to Income is High")
        improvements.append({"action": "Apply for Lower Loan Amount", "detail": f"Reduce to ₹{annual_income*2:,.0f} for better odds", "impact": "medium"})
    else:
        negatives.append("Loan Amount Significantly Exceeds Income")
        improvements.append({"action": "Reduce Loan Amount Significantly", "detail": f"Try ₹{annual_income:,.0f} max", "impact": "high"})

    # Savings
    if req.savings > annual_income * 0.5:
        positives.append("Strong Savings & Financial Cushion")
    else:
        negatives.append("Low Savings Balance")
        improvements.append({"action": "Increase Savings", "detail": "Maintain savings of at least 50% of annual income", "impact": "low"})

    # Credit history
    if req.credit_history == 1.0:
        positives.append("Clean Credit Repayment History")
    else:
        negatives.append("Poor Credit Repayment History")
        improvements.append({"action": "Build Credit History", "detail": "Pay all EMIs and credit card bills on time for 12+ months", "impact": "high"})

    # AI Summary
    verdict_text = "high approval probability" if verdict == "APPROVED" else "higher rejection probability"
    summary = (
        f"This applicant has a credit score of {req.credit_score}, {req.job_experience:.0f} years of employment, "
        f"and an annual income of ₹{annual_income:,.0f}. "
        f"The AI model predicts {verdict_text} with {confidence*100:.1f}% confidence. "
    )
    if verdict == "APPROVED":
        summary += "Strong financial profile with manageable debt levels."
    else:
        summary += "Key improvements can significantly increase approval chances."

    return positives, negatives, improvements, summary


# ─── Endpoints ───────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"service": "Vertex Loan AI — ML Service", "version": "2.0.0", "status": "running"}


@app.get("/health")
def health():
    return {"status": "healthy", "model_loaded": model_bundle is not None}


@app.get("/model-info")
def model_info():
    if not metrics_data:
        raise HTTPException(status_code=503, detail="Model not trained yet. Run train.py.")
    return {"status": "ok", "data": metrics_data}


@app.post("/predict")
def predict(req: PredictRequest):
    start = time.time()

    if not model_bundle:
        # Fallback rule-based prediction
        verdict = "APPROVED" if req.credit_score >= 700 and req.applicant_income > 30000 else "REJECTED"
        confidence = 0.75 if verdict == "APPROVED" else 0.65
    else:
        features = engineer_features(req)
        model = model_bundle['model']
        scaler = model_bundle.get('scaler')
        use_scaled = model_bundle.get('use_scaled', False)

        X = scaler.transform(features) if (use_scaled and scaler) else features
        pred = model.predict(X)[0]
        proba = model.predict_proba(X)[0]

        verdict = "APPROVED" if pred == 1 else "REJECTED"
        confidence = float(max(proba))

    risk_score, risk_level = compute_risk_score(req)
    fraud_score, fraud_flags = detect_fraud(req)
    positives, negatives, improvements, ai_summary = generate_factors(req, verdict, confidence)
    processing_ms = int((time.time() - start) * 1000)

    return {
        "verdict": verdict,
        "confidence": round(confidence, 4),
        "risk_score": risk_score,
        "risk_level": risk_level,
        "fraud_score": fraud_score,
        "fraud_flags": {"suspicious": fraud_score > 0.4, "flags": fraud_flags},
        "positive_factors": positives,
        "negative_factors": negatives,
        "improvements": improvements,
        "ai_summary": ai_summary,
        "model_used": model_bundle['model_name'] if model_bundle else "Rule-Based",
        "processing_ms": processing_ms,
    }


@app.post("/risk-score")
def risk_score(req: PredictRequest):
    score, level = compute_risk_score(req)
    return {"risk_score": score, "risk_level": level}


@app.post("/fraud")
def fraud_check(req: PredictRequest):
    score, flags = detect_fraud(req)
    return {
        "fraud_score": score,
        "suspicious": score > 0.4,
        "flags": flags,
        "risk_category": "High" if score > 0.6 else "Medium" if score > 0.3 else "Low",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
