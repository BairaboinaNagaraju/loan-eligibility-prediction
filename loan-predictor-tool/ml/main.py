import os
import json
import time
import numpy as np
import joblib
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(
    title="AI Loan Predictor API",
    description="Microservice providing real-time loan prediction, risk scores, and recommendations",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "models", "predictor_model.joblib")
METRICS_PATH = os.path.join(BASE_DIR, "models", "metrics.json")

model_bundle = None
metrics_data = None

def load_model():
    global model_bundle, metrics_data
    if os.path.exists(MODEL_PATH):
        model_bundle = joblib.load(MODEL_PATH)
        print(f"Loaded predictor model: {model_bundle['model_name']}")
    else:
        print("Warning: Trained predictor model not found. Run train.py first.")

    if os.path.exists(METRICS_PATH):
        with open(METRICS_PATH) as f:
            metrics_data = json.load(f)

load_model()

class PredictRequest(BaseModel):
    age: int
    gender: str
    married: int
    education: str
    self_employed: int
    annual_income: float
    monthly_income: float
    monthly_expenses: float
    savings: float
    investments: float
    active_loans: int
    existing_loan_amount: float
    existing_emi: float
    credit_card_outstanding: float
    credit_score: int
    requested_loan: float
    loan_tenure: int
    interest_rate: float
    loan_purpose: str

def compute_risk_score(req: PredictRequest) -> float:
    # 0 - 100 risk score
    score = 0.0
    
    # Credit Score (40%)
    if req.credit_score >= 750:
        score += 0
    elif req.credit_score >= 680:
        score += 15
    elif req.credit_score >= 600:
        score += 28
    else:
        score += 40

    # Debt-to-Income Ratio (30%)
    total_existing_emi = req.existing_emi
    monthly_emi = (req.requested_loan * (req.interest_rate / 1200)) / (1 - (1 + (req.interest_rate / 1200))**(-req.loan_tenure)) if req.loan_tenure > 0 else 0
    total_emi = total_existing_emi + monthly_emi
    dti = total_emi / max(req.monthly_income, 1.0)
    score += min(dti * 60, 30)

    # Credit Utilization (15%)
    util = (req.credit_card_outstanding / 150000.0) * 100
    score += min((util / 100) * 15, 15)

    # Savings relative to requested loan (15%)
    savings_ratio = req.savings / max(req.requested_loan, 1.0)
    score += max(0, 15 - savings_ratio * 30)

    return round(min(max(score, 0), 100), 2)

def generate_explanations(req: PredictRequest, approved: bool, risk_score: float) -> tuple[list, list, list]:
    positives = []
    negatives = []
    recommendations = []

    # Credit score checks
    if req.credit_score >= 750:
        positives.append("Excellent Credit Score")
    elif req.credit_score >= 680:
        positives.append("Good Credit Score")
    else:
        negatives.append("Low Credit Score")
        recommendations.append("Increase credit score above 720")

    # DTI checks
    total_existing_emi = req.existing_emi
    monthly_emi = (req.requested_loan * (req.interest_rate / 1200)) / (1 - (1 + (req.interest_rate / 1200))**(-req.loan_tenure)) if req.loan_tenure > 0 else 0
    dti = (total_existing_emi + monthly_emi) / max(req.monthly_income, 1.0)
    
    if dti <= 0.35:
        positives.append("Low Debt-to-Income Ratio")
    else:
        negatives.append("High Debt-to-Income Ratio")
        recommendations.append("Reduce existing loan balance to lower monthly EMI burden")

    # Credit utilization
    util = (req.credit_card_outstanding / 150000.0) * 100
    if util <= 30:
        positives.append("Low Credit Card Utilization")
    else:
        negatives.append("High Credit Card Utilization")
        recommendations.append("Pay off credit card debt to reduce credit utilization below 30%")

    # Savings Check
    if req.savings > req.requested_loan * 0.4:
        positives.append("Healthy Financial Savings & Cushion")
    else:
        negatives.append("Insufficient Savings Cushion")
        recommendations.append("Increase your savings buffer before applying")

    # Requested loan vs annual income
    if req.requested_loan < req.annual_income * 3:
        positives.append("Requested Loan Amount is Proportionate to Income")
    else:
        negatives.append("High Loan Request relative to Annual Income")
        recommendations.append("Request a smaller loan amount or extend loan tenure")

    return positives, negatives, recommendations

@app.get("/")
def root():
    return {"service": "AI Loan Predictor ML Engine", "status": "running"}

@app.get("/health")
def health():
    return {"status": "healthy", "model_loaded": model_bundle is not None}

@app.get("/model-info")
def model_info():
    if not metrics_data:
        raise HTTPException(status_code=503, detail="Metrics not compiled. Run train.py.")
    return metrics_data

@app.post("/predict")
def predict(req: PredictRequest):
    start = time.time()
    
    # 1. Compute Risk Score & Category
    risk_score = compute_risk_score(req)
    if risk_score <= 20: risk_level = "Very Low Risk"
    elif risk_score <= 40: risk_level = "Low Risk"
    elif risk_score <= 60: risk_level = "Medium Risk"
    elif risk_score <= 80: risk_level = "High Risk"
    else: risk_level = "Very High Risk"

    # 2. Model Inference
    if model_bundle is None:
        # Fallback rule-based eligibility prediction
        approved = req.credit_score >= 680 and risk_score <= 55
        confidence = 0.85 if approved else 0.70
        model_used = "Fallback Rules Engine"
    else:
        gender_enc = 1 if req.gender.lower() == 'male' else 2 if req.gender.lower() == 'female' else 0
        edu_enc = 1 if req.education == 'Graduate' else 0
        purpose_map = {'home': 0, 'education': 1, 'personal': 2, 'business': 3, 'vehicle': 4, 'medical': 5, 'home_renovation': 6, 'other': 7}
        purpose_enc = purpose_map.get(req.loan_purpose, 7)

        # Recalculate engineered features same as train.py
        monthly_emi = (req.requested_loan * (req.interest_rate / 1200)) / (1 - (1 + (req.interest_rate / 1200))**(-req.loan_tenure)) if req.loan_tenure > 0 else 0
        total_emi = req.existing_emi + monthly_emi
        dti = total_emi / max(req.monthly_income, 1.0)
        credit_util = min(max((req.credit_card_outstanding / 150000.0) * 100, 0.0), 100.0)

        features = np.array([[
            req.age, gender_enc, req.married, edu_enc, req.self_employed,
            req.annual_income, req.monthly_income, req.monthly_expenses, req.savings, req.investments,
            req.active_loans, req.existing_loan_amount, req.existing_emi, req.credit_card_outstanding,
            req.credit_score, req.requested_loan, req.loan_tenure, req.interest_rate, purpose_enc,
            dti, credit_util
        ]])

        model = model_bundle['model']
        scaler = model_bundle.get('scaler')
        
        # Check if model is LogisticRegression or similar requiring scale
        X = scaler.transform(features) if model_bundle.get('model_name') == 'Logistic Regression' else features
        pred = model.predict(X)[0]
        prob = model.predict_proba(X)[0]
        
        approved = bool(pred == 1)
        confidence = float(prob[1] if approved else prob[0])
        model_used = model_bundle['model_name']

    # 3. Generate XAI reasons list
    positives, negatives, recommendations = generate_explanations(req, approved, risk_score)
    processing_ms = int((time.time() - start) * 1000)

    # 4. Generate visual financial health sub-scores
    scores = {
        "credit_health": min(100, max(0, int((req.credit_score - 300) / 600 * 100))),
        "income_stability": 90 if req.self_employed == 0 else 70,
        "debt_health": max(0, int(100 - (risk_score * 0.8))),
        "savings_health": min(100, int((req.savings / max(req.requested_loan, 1.0)) * 150)),
        "overall_financial_score": int(100 - risk_score)
    }

    return {
        "success": True,
        "approved": approved,
        "confidence": round(confidence, 4),
        "risk_score": risk_score,
        "risk_level": risk_level,
        "positive_factors": positives,
        "negative_factors": negatives,
        "recommendations": recommendations,
        "model_used": model_used,
        "scores": scores,
        "processing_ms": processing_ms
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8002, reload=True)
