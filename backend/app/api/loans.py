from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Any, List, Optional
import json

from app.core.database import get_db
from app.api.deps import get_current_user, get_current_user_optional
from app.models.application import LoanApplication
from app.models.user import User
from app.schemas.application import (
    LoanApplicationCreate, LoanApplicationOut, PredictSandboxOut
)
from app.utils.prediction_helpers import predict_eligibility
from app.utils.chatbot import generate_bot_response

router = APIRouter()


def _build_app_out(app: LoanApplication, extra: dict = None) -> dict:
    """Helper to serialize a LoanApplication DB record to response dict."""
    reasons = None
    recommendations = None
    if app.rejection_reasons:
        try:
            parsed = json.loads(app.rejection_reasons)
            if isinstance(parsed, dict):
                reasons = parsed.get("reasons")
                recommendations = parsed.get("recommendations")
            elif isinstance(parsed, list):
                reasons = parsed
        except Exception:
            pass

    result = {
        "id": app.id,
        "user_id": app.user_id,
        "gender": app.gender,
        "married": app.married,
        "dependents": app.dependents,
        "education": app.education,
        "self_employed": app.self_employed,
        "applicant_income": app.applicant_income,
        "coapplicant_income": app.coapplicant_income,
        "loan_amount": app.loan_amount,
        "loan_amount_term": app.loan_amount_term,
        "credit_history": app.credit_history,
        "property_area": app.property_area,
        "prediction": app.prediction,
        "confidence_score": app.confidence_score,
        "prob_approved": app.prob_approved,
        "prob_rejected": app.prob_rejected,
        "rejection_reasons": app.rejection_reasons,
        "reasons": reasons,
        "recommendations": recommendations,
        "computed_features": None,
        "status": app.status,
        "created_at": app.created_at,
    }
    if extra:
        result.update(extra)
    return result


# ─────────────────────────────────────────
# POST /api/loans/predict  — Sandbox (no save)
# ─────────────────────────────────────────
@router.post("/predict", response_model=PredictSandboxOut)
def sandbox_predict(
    application_in: LoanApplicationCreate,
    current_user: Any = Depends(get_current_user_optional),
) -> Any:
    """Sandbox endpoint: run model inference without saving record."""
    try:
        data_dict = application_in.model_dump()
        result = predict_eligibility(data_dict)
    except FileNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Prediction error: {str(e)}")

    return {
        "prediction": result["prediction"],
        "confidence_score": result["confidence_score"],
        "prob_approved": result["prob_approved"],
        "prob_rejected": result["prob_rejected"],
        "reasons": result["reasons"],
        "recommendations": result["recommendations"],
        "computed_features": result["features"],
    }


# ─────────────────────────────────────────
# POST /api/loans/applications  — Submit & Save
# ─────────────────────────────────────────
@router.post("/applications", status_code=status.HTTP_201_CREATED)
def create_application(
    application_in: LoanApplicationCreate,
    current_user: Any = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
) -> Any:
    """Submit a loan application, run prediction, and save to database."""
    try:
        data_dict = application_in.model_dump()
        prediction_result = predict_eligibility(data_dict)
    except FileNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Prediction error: {str(e)}")

    # Serialize XAI data for storage
    xai_payload = json.dumps({
        "reasons": prediction_result["reasons"],
        "recommendations": prediction_result["recommendations"],
    })

    db_application = LoanApplication(
        user_id=current_user.id if current_user else None,
        gender=application_in.gender,
        married=application_in.married,
        dependents=application_in.dependents,
        education=application_in.education,
        self_employed=application_in.self_employed,
        applicant_income=application_in.applicant_income,
        coapplicant_income=application_in.coapplicant_income,
        loan_amount=application_in.loan_amount,
        loan_amount_term=application_in.loan_amount_term,
        credit_history=application_in.credit_history,
        property_area=application_in.property_area,
        prediction=prediction_result["prediction"],
        confidence_score=prediction_result["confidence_score"],
        prob_approved=prediction_result["prob_approved"],
        prob_rejected=prediction_result["prob_rejected"],
        status=prediction_result["prediction"],  # Initial status = model prediction
        rejection_reasons=xai_payload,
    )
    db.add(db_application)
    db.commit()
    db.refresh(db_application)

    return {
        **_build_app_out(db_application),
        "reasons": prediction_result["reasons"],
        "recommendations": prediction_result["recommendations"],
        "computed_features": prediction_result["features"],
    }


# ─────────────────────────────────────────
# GET /api/loans/applications  — User's history
# ─────────────────────────────────────────
@router.get("/applications")
def read_applications(
    current_user: Any = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Any:
    apps = (
        db.query(LoanApplication)
        .filter(LoanApplication.user_id == current_user.id)
        .order_by(LoanApplication.created_at.desc())
        .all()
    )
    return [_build_app_out(a) for a in apps]


# ─────────────────────────────────────────
# GET /api/loans/applications/{id}
# ─────────────────────────────────────────
@router.get("/applications/{app_id}")
def read_application_by_id(
    app_id: int,
    current_user: Any = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Any:
    application = db.query(LoanApplication).filter(
        LoanApplication.id == app_id,
        LoanApplication.user_id == current_user.id,
    ).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found or unauthorized")
    return _build_app_out(application)


# ─────────────────────────────────────────
# DELETE /api/loans/applications/{id}
# ─────────────────────────────────────────
@router.delete("/applications/{app_id}")
def delete_application(
    app_id: int,
    current_user: Any = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Any:
    application = db.query(LoanApplication).filter(
        LoanApplication.id == app_id,
        LoanApplication.user_id == current_user.id,
    ).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found or unauthorized")
    db.delete(application)
    db.commit()
    return {"message": "Application deleted successfully"}


# ─────────────────────────────────────────
# GET /api/loans/dashboard  — User dashboard stats
# ─────────────────────────────────────────
@router.get("/dashboard")
def get_user_dashboard(
    current_user: Any = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Any:
    apps = db.query(LoanApplication).filter(LoanApplication.user_id == current_user.id).all()

    total = len(apps)
    approved = sum(1 for a in apps if a.status == "Approved")
    rejected = sum(1 for a in apps if a.status == "Rejected")
    pending = sum(1 for a in apps if a.status == "Pending")
    approval_rate = (approved / total * 100) if total > 0 else 0

    # Recent applications (last 6)
    recent = (
        db.query(LoanApplication)
        .filter(LoanApplication.user_id == current_user.id)
        .order_by(LoanApplication.created_at.desc())
        .limit(6)
        .all()
    )
    recent_out = [
        {
            "id": r.id,
            "loan_amount": r.loan_amount,
            "prediction": r.prediction,
            "confidence_score": r.confidence_score,
            "status": r.status,
            "property_area": r.property_area,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in recent
    ]

    # Credit History impact chart
    credit_good_approved = sum(1 for a in apps if a.credit_history == 1.0 and a.status == "Approved")
    credit_good_rejected = sum(1 for a in apps if a.credit_history == 1.0 and a.status == "Rejected")
    credit_bad_approved = sum(1 for a in apps if a.credit_history == 0.0 and a.status == "Approved")
    credit_bad_rejected = sum(1 for a in apps if a.credit_history == 0.0 and a.status == "Rejected")

    # Property area distribution
    property_distribution = {
        "Urban": sum(1 for a in apps if a.property_area == "Urban"),
        "Semiurban": sum(1 for a in apps if a.property_area == "Semiurban"),
        "Rural": sum(1 for a in apps if a.property_area == "Rural"),
    }

    # Monthly trends
    monthly_data = {}
    for a in apps:
        month_str = a.created_at.strftime("%b %Y") if a.created_at else "Unknown"
        if month_str not in monthly_data:
            monthly_data[month_str] = {"month": month_str, "Approved": 0, "Rejected": 0, "Total": 0}
        monthly_data[month_str]["Total"] += 1
        if a.status == "Approved":
            monthly_data[month_str]["Approved"] += 1
        elif a.status == "Rejected":
            monthly_data[month_str]["Rejected"] += 1

    # Sort months chronologically
    from datetime import datetime
    def parse_month(m):
        try:
            return datetime.strptime(m, "%b %Y")
        except Exception:
            return datetime.min
    monthly_trends = sorted(monthly_data.values(), key=lambda x: parse_month(x["month"]))

    return {
        "summary": {
            "total": total,
            "approved": approved,
            "rejected": rejected,
            "pending": pending,
            "approval_rate": round(approval_rate, 1),
        },
        "recent_applications": recent_out,
        "charts": {
            "credit_history": [
                {"name": "Good Credit – Approved", "value": credit_good_approved, "fill": "#22c55e"},
                {"name": "Good Credit – Rejected", "value": credit_good_rejected, "fill": "#f87171"},
                {"name": "Bad Credit – Approved", "value": credit_bad_approved, "fill": "#86efac"},
                {"name": "Bad Credit – Rejected", "value": credit_bad_rejected, "fill": "#ef4444"},
            ],
            "property_area": [
                {"name": "Urban", "value": property_distribution["Urban"]},
                {"name": "Semiurban", "value": property_distribution["Semiurban"]},
                {"name": "Rural", "value": property_distribution["Rural"]},
            ],
            "monthly_trends": monthly_trends,
        },
    }


# ─────────────────────────────────────────
# POST /api/loans/chat  — AI Chatbot
# ─────────────────────────────────────────
@router.post("/chat")
def chatbot_interaction(
    payload: dict,
    current_user: Any = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
) -> Any:
    message = payload.get("message", "").strip()
    if not message:
        raise HTTPException(status_code=400, detail="Message field is required")
    bot_reply = generate_bot_response(message, current_user, db)
    return {"reply": bot_reply}
