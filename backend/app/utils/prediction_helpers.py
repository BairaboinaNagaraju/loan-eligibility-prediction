import os
import joblib
import pandas as pd
import numpy as np

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODEL_PATH = os.path.join(BASE_DIR, "models", "best_loan_model.joblib")

_model_bundle = None


def reload_model():
    """Force reload the model bundle from disk (used after retraining)."""
    global _model_bundle
    if os.path.exists(MODEL_PATH):
        _model_bundle = joblib.load(MODEL_PATH)
        return True
    return False


def get_model_bundle():
    global _model_bundle
    if _model_bundle is None:
        if os.path.exists(MODEL_PATH):
            _model_bundle = joblib.load(MODEL_PATH)
        else:
            raise FileNotFoundError(
                f"Model bundle not found at {MODEL_PATH}. "
                "Please run 'python backend/scripts/train.py' first to train the ML models."
            )
    return _model_bundle


def predict_eligibility(data: dict) -> dict:
    """
    Takes raw application features as a dictionary and returns:
    - prediction: 'Approved' or 'Rejected'
    - confidence_score: float (0.0 to 1.0)
    - reasons: list of factors (positive + negative)
    - recommendations: list of actionable improvement tips
    - features: computed feature values (TotalIncome, EMI, IncomeToEMI_Ratio)
    """
    bundle = get_model_bundle()
    model = bundle["model"]
    scaler = bundle["scaler"]
    feature_cols = bundle["feature_cols"]
    numerical_cols = bundle["numerical_cols"]
    mappings = bundle["feature_mappings"]

    # 1. Handle Missing Values using training modes/medians
    gender = data.get("gender") or bundle["imputation_values"]["Gender"]
    married = data.get("married") or bundle["imputation_values"]["Married"]
    dependents = data.get("dependents") or bundle["imputation_values"]["Dependents"]
    education = data.get("education") or "Graduate"
    self_employed = data.get("self_employed") or bundle["imputation_values"]["Self_Employed"]

    applicant_income = float(data.get("applicant_income", 0))
    coapplicant_income = float(data.get("coapplicant_income", 0))
    loan_amount = float(data.get("loan_amount", 0))
    loan_amount_term = float(data.get("loan_amount_term", 360.0))
    credit_history = float(data.get("credit_history", 1.0))
    property_area = data.get("property_area", "Urban")

    # 2. Map Categoricals to Numeric
    gender_enc = mappings["Gender"].get(gender, 1)
    married_enc = mappings["Married"].get(married, 1)
    dependents_enc = mappings["Dependents"].get(str(dependents), 0)
    education_enc = mappings["Education"].get(education, 1)
    self_employed_enc = mappings["Self_Employed"].get(self_employed, 0)
    property_area_enc = mappings["Property_Area"].get(property_area, 2)

    # 3. Feature Engineering
    total_income = applicant_income + coapplicant_income
    emi = (loan_amount * 1000) / loan_amount_term if loan_amount_term > 0 else 0
    income_to_emi = total_income / (emi + 1e-5)

    # Create input DataFrame matching training columns
    input_df = pd.DataFrame([{
        "Gender": gender_enc,
        "Married": married_enc,
        "Dependents": dependents_enc,
        "Education": education_enc,
        "Self_Employed": self_employed_enc,
        "ApplicantIncome": applicant_income,
        "CoapplicantIncome": coapplicant_income,
        "LoanAmount": loan_amount,
        "Loan_Amount_Term": loan_amount_term,
        "Credit_History": credit_history,
        "Property_Area": property_area_enc,
        "TotalIncome": total_income,
        "EMI": emi,
        "IncomeToEMI_Ratio": income_to_emi
    }])

    # Reorder columns to match training feature order
    input_df = input_df[feature_cols]

    # Scale numerical features
    input_scaled = input_df.copy()
    input_scaled[numerical_cols] = scaler.transform(input_df[numerical_cols])

    # Run prediction
    pred_class = int(model.predict(input_scaled)[0])
    pred_prob = model.predict_proba(input_scaled)[0]

    prob_approved = float(pred_prob[1])
    prob_rejected = float(pred_prob[0])

    decision = "Approved" if pred_class == 1 else "Rejected"
    confidence = prob_approved if pred_class == 1 else prob_rejected

    # 4. Explainable AI Factors
    reasons = []
    recommendations = []

    # — Credit History (strongest factor)
    if credit_history == 1.0:
        reasons.append({
            "factor": "Credit History",
            "impact": "positive",
            "detail": "Excellent credit history: Proven track record of timely credit repayments significantly boosts approval."
        })
    else:
        reasons.append({
            "factor": "Credit History",
            "impact": "negative",
            "detail": "Poor/no credit history: Lack of positive credit history or outstanding defaults is the primary rejection driver."
        })
        recommendations.append(
            "Improve Credit History: Prioritize resolving outstanding loans, pay all bills on time, and avoid multiple hard credit inquiries."
        )

    # — Income Profile
    if total_income >= 6500:
        reasons.append({
            "factor": "Combined Income",
            "impact": "positive",
            "detail": f"Strong combined income of ${total_income:,.0f}/month provides excellent debt-service coverage."
        })
    elif total_income < 3500:
        reasons.append({
            "factor": "Combined Income",
            "impact": "negative",
            "detail": f"Low combined income of ${total_income:,.0f}/month is considered high-risk for the requested loan amount."
        })
        recommendations.append(
            "Increase Combined Income: Add a co-applicant with a stable income source or consider supplemental income streams."
        )
    else:
        reasons.append({
            "factor": "Combined Income",
            "impact": "neutral",
            "detail": f"Moderate combined income of ${total_income:,.0f}/month meets minimum thresholds."
        })

    # — Debt-to-Income (EMI Burden)
    if emi > 0:
        if income_to_emi >= 20.0:
            reasons.append({
                "factor": "Debt-to-Income Ratio",
                "impact": "positive",
                "detail": f"Excellent DTI: Monthly income is {income_to_emi:.1f}x your estimated EMI of ${emi:.0f} — very low payment burden."
            })
        elif income_to_emi < 10.0:
            reasons.append({
                "factor": "Debt-to-Income Ratio",
                "impact": "negative",
                "detail": f"High debt burden: EMI of ${emi:.0f}/month represents a heavy portion of combined income (${total_income:.0f})."
            })
            max_rec_loan = (total_income * 0.4 * loan_amount_term) / 1000
            recommendations.append(
                f"Reduce Loan Amount: Lower your requested principal to approximately ${max_rec_loan:.0f}k to meet standard affordability guidelines (40% DTI rule)."
            )
            recommendations.append(
                "Extend Loan Term: Choose a longer amortization period (e.g., 360 months) to reduce individual monthly payments."
            )

    # — Education
    if education == "Graduate":
        reasons.append({
            "factor": "Education Level",
            "impact": "positive",
            "detail": "Graduate status: Higher education is statistically correlated with increased employment stability."
        })
    else:
        reasons.append({
            "factor": "Education Level",
            "impact": "neutral",
            "detail": "Non-graduate status: Education is a lower-weight factor, but graduates statistically see slightly higher approval rates."
        })

    # — Property Area
    if property_area == "Semiurban":
        reasons.append({
            "factor": "Property Location",
            "impact": "positive",
            "detail": "Semiurban property: Optimal risk-return profile — highest approval rates in training data."
        })
    elif property_area == "Rural":
        reasons.append({
            "factor": "Property Location",
            "impact": "neutral",
            "detail": "Rural property: Slightly higher valuation volatility compared to urban/semiurban areas."
        })
        recommendations.append(
            "Consider Semiurban Properties: If flexible, properties in Semiurban zones demonstrate the best loan-to-value ratios in historical data."
        )
    else:
        reasons.append({
            "factor": "Property Location",
            "impact": "neutral",
            "detail": "Urban property: Standard risk profile with good market liquidity."
        })

    # — Self Employment
    if self_employed == "Yes":
        reasons.append({
            "factor": "Employment Type",
            "impact": "neutral",
            "detail": "Self-employed: Income verification may require additional documentation. Lenders prefer consistent income proof over 2+ years."
        })
        if decision == "Rejected":
            recommendations.append(
                "Provide Stronger Income Documentation: As a self-employed applicant, 2+ years of tax returns and business statements strengthen your profile."
            )

    # Additional fallback for approved/rejected
    if decision == "Approved" and len(reasons) < 2:
        reasons.append({
            "factor": "Overall Profile",
            "impact": "positive",
            "detail": "Favorable overall financial and demographic profile meets lending criteria."
        })
    elif decision == "Rejected" and not recommendations:
        recommendations.append(
            "Consolidate Existing Debts: Reducing active debts lowers your overall debt-servicing obligations."
        )
        recommendations.append(
            "Maintain Healthy Bank Balance: Keep a consistent average balance for at least 6 months to demonstrate financial stability."
        )

    return {
        "prediction": decision,
        "confidence_score": confidence,
        "prob_approved": prob_approved,
        "prob_rejected": prob_rejected,
        "reasons": reasons,
        "recommendations": recommendations,
        "features": {
            "TotalIncome": round(total_income, 2),
            "EMI": round(emi, 2),
            "IncomeToEMI_Ratio": round(income_to_emi, 2),
            "LoanAmount": loan_amount,
            "ApplicantIncome": applicant_income,
            "CoapplicantIncome": coapplicant_income,
            "CreditHistory": credit_history,
            "PropertyArea": property_area,
            "Education": education,
        }
    }
