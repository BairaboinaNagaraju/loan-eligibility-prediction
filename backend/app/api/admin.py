from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import Any, List, Optional
import io
import csv
import json
import os
import subprocess
import sys

from app.core.database import get_db
from app.api.deps import get_current_active_admin
from app.models.application import LoanApplication
from app.models.user import User
from app.schemas.application import LoanApplicationOut, ApplicationUpdateStatus
from app.schemas.user import UserOut

router = APIRouter()

# Resolve paths relative to this file for reliability
_HERE = os.path.dirname(os.path.abspath(__file__))
_BACKEND_DIR = os.path.dirname(os.path.dirname(_HERE))
_METRICS_PATH = os.path.join(_BACKEND_DIR, "models", "model_metrics.json")
_TRAIN_SCRIPT = os.path.join(_BACKEND_DIR, "scripts", "train.py")


def _load_ml_metrics() -> Optional[dict]:
    """Load model metrics JSON — path resolved relative to this file."""
    if os.path.exists(_METRICS_PATH):
        try:
            with open(_METRICS_PATH, "r") as f:
                return json.load(f)
        except Exception:
            pass
    return None


# ─────────────────────────────────────────
# GET /api/admin/dashboard
# ─────────────────────────────────────────
@router.get("/dashboard")
def get_admin_dashboard(
    current_admin: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db),
) -> Any:
    total_apps = db.query(LoanApplication).count()
    approved_apps = db.query(LoanApplication).filter(LoanApplication.status == "Approved").count()
    rejected_apps = db.query(LoanApplication).filter(LoanApplication.status == "Rejected").count()
    pending_apps = db.query(LoanApplication).filter(LoanApplication.status == "Pending").count()
    total_users = db.query(User).count()
    approval_rate = (approved_apps / total_apps * 100) if total_apps > 0 else 0

    # 1. Loan Approval Rate by Education
    grad_approved = db.query(LoanApplication).filter(LoanApplication.education == "Graduate", LoanApplication.status == "Approved").count()
    grad_total = db.query(LoanApplication).filter(LoanApplication.education == "Graduate").count()
    not_grad_approved = db.query(LoanApplication).filter(LoanApplication.education == "Not Graduate", LoanApplication.status == "Approved").count()
    not_grad_total = db.query(LoanApplication).filter(LoanApplication.education == "Not Graduate").count()

    education_stats = [
        {"category": "Graduate", "Approved": grad_approved, "Total": grad_total,
         "Rate": round((grad_approved / grad_total * 100) if grad_total > 0 else 0, 1)},
        {"category": "Undergraduate", "Approved": not_grad_approved, "Total": not_grad_total,
         "Rate": round((not_grad_approved / not_grad_total * 100) if not_grad_total > 0 else 0, 1)},
    ]

    # 2. Property Area Distribution
    property_stats = []
    for area in ["Rural", "Semiurban", "Urban"]:
        total_area = db.query(LoanApplication).filter(LoanApplication.property_area == area).count()
        approved_area = db.query(LoanApplication).filter(LoanApplication.property_area == area, LoanApplication.status == "Approved").count()
        property_stats.append({"name": area, "value": total_area, "approved": approved_area})

    # 3. Credit History Comparison
    credit_1_approved = db.query(LoanApplication).filter(LoanApplication.credit_history == 1.0, LoanApplication.status == "Approved").count()
    credit_1_total = db.query(LoanApplication).filter(LoanApplication.credit_history == 1.0).count()
    credit_0_approved = db.query(LoanApplication).filter(LoanApplication.credit_history == 0.0, LoanApplication.status == "Approved").count()
    credit_0_total = db.query(LoanApplication).filter(LoanApplication.credit_history == 0.0).count()
    credit_stats = [
        {"category": "Good Credit (1.0)", "Approved": credit_1_approved, "Total": credit_1_total,
         "Rate": round((credit_1_approved / credit_1_total * 100) if credit_1_total > 0 else 0, 1)},
        {"category": "Bad Credit (0.0)", "Approved": credit_0_approved, "Total": credit_0_total,
         "Rate": round((credit_0_approved / credit_0_total * 100) if credit_0_total > 0 else 0, 1)},
    ]

    # 4. Income Distribution Buckets
    income_buckets = [
        {"range": "0–3k", "count": 0},
        {"range": "3k–6k", "count": 0},
        {"range": "6k–10k", "count": 0},
        {"range": "10k+", "count": 0},
    ]
    all_apps = db.query(LoanApplication).all()
    for a in all_apps:
        inc = a.applicant_income
        if inc < 3000:
            income_buckets[0]["count"] += 1
        elif inc < 6000:
            income_buckets[1]["count"] += 1
        elif inc < 10000:
            income_buckets[2]["count"] += 1
        else:
            income_buckets[3]["count"] += 1

    # Load ML metrics
    ml_metrics = _load_ml_metrics()

    return {
        "summary": {
            "total_applications": total_apps,
            "approved_loans": approved_apps,
            "rejected_loans": rejected_apps,
            "pending_loans": pending_apps,
            "total_users": total_users,
            "approval_rate": round(approval_rate, 1),
            "active_model": ml_metrics.get("best_model_name") if ml_metrics else "Unknown",
            "model_accuracy": round(
                ml_metrics["results"][ml_metrics["best_model_name"]]["Accuracy"] * 100, 1
            ) if ml_metrics else 0,
        },
        "charts": {
            "education_stats": education_stats,
            "property_stats": property_stats,
            "credit_stats": credit_stats,
            "income_buckets": income_buckets,
            "ml_metrics": ml_metrics,
        },
    }


# ─────────────────────────────────────────
# GET /api/admin/applications/export  ← Must be BEFORE /{app_id} to avoid conflict
# ─────────────────────────────────────────
@router.get("/applications/export")
def export_applications_csv(
    current_admin: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db),
) -> Any:
    """Export all loan applications as a downloadable CSV file."""
    apps = db.query(LoanApplication).order_by(LoanApplication.created_at.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "ID", "Username", "Gender", "Married", "Dependents",
        "Education", "Self_Employed", "ApplicantIncome", "CoapplicantIncome",
        "LoanAmount", "Loan_Amount_Term", "Credit_History", "Property_Area",
        "Prediction", "Confidence_Score", "Prob_Approved", "Status", "Created_At"
    ])
    for app in apps:
        username = app.user.username if app.user else "Guest"
        writer.writerow([
            app.id, username, app.gender, app.married, app.dependents,
            app.education, app.self_employed, app.applicant_income, app.coapplicant_income,
            app.loan_amount, app.loan_amount_term, app.credit_history, app.property_area,
            app.prediction, round(app.confidence_score, 4),
            round(app.prob_approved, 4) if app.prob_approved else "",
            app.status, app.created_at,
        ])
    output.seek(0)

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=loan_applications_export.csv"},
    )


# ─────────────────────────────────────────
# GET /api/admin/applications  — Paginated list
# ─────────────────────────────────────────
@router.get("/applications")
def list_all_applications(
    search: Optional[str] = None,
    status_filter: Optional[str] = None,
    property_filter: Optional[str] = None,
    education_filter: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    current_admin: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db),
) -> Any:
    query = db.query(LoanApplication)
    filters = []

    if status_filter:
        filters.append(LoanApplication.status == status_filter)
    if property_filter:
        filters.append(LoanApplication.property_area == property_filter)
    if education_filter:
        filters.append(LoanApplication.education == education_filter)

    if search:
        search_pattern = f"%{search}%"
        query = query.outerjoin(User)
        filters.append(or_(
            User.username.like(search_pattern),
            User.full_name.like(search_pattern),
            LoanApplication.property_area.like(search_pattern),
            LoanApplication.education.like(search_pattern),
        ))

    if filters:
        query = query.filter(and_(*filters))

    total_count = query.count()
    offset = (page - 1) * limit
    applications = query.order_by(LoanApplication.created_at.desc()).offset(offset).limit(limit).all()

    apps_out = []
    for app in applications:
        username = app.user.username if app.user else "Guest/Anonymous"
        email = app.user.email if app.user else "N/A"
        apps_out.append({
            "id": app.id,
            "username": username,
            "email": email,
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
            "status": app.status,
            "created_at": app.created_at.isoformat() if app.created_at else None,
        })

    return {"total": total_count, "page": page, "limit": limit, "applications": apps_out}


# ─────────────────────────────────────────
# PUT /api/admin/applications/{app_id}/status
# ─────────────────────────────────────────
@router.put("/applications/{app_id}/status")
def update_application_status(
    app_id: int,
    payload: ApplicationUpdateStatus,
    current_admin: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db),
) -> Any:
    app = db.query(LoanApplication).filter(LoanApplication.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    if payload.status not in ["Approved", "Rejected", "Pending"]:
        raise HTTPException(status_code=400, detail="Invalid status. Must be Approved, Rejected, or Pending.")
    app.status = payload.status
    db.commit()
    db.refresh(app)
    return {"id": app.id, "status": app.status, "message": "Status updated successfully"}


# ─────────────────────────────────────────
# DELETE /api/admin/applications/{app_id}
# ─────────────────────────────────────────
@router.delete("/applications/{app_id}")
def delete_application_admin(
    app_id: int,
    current_admin: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db),
) -> Any:
    app = db.query(LoanApplication).filter(LoanApplication.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    db.delete(app)
    db.commit()
    return {"message": "Application deleted"}


# ─────────────────────────────────────────
# GET /api/admin/users
# ─────────────────────────────────────────
@router.get("/users", response_model=List[UserOut])
def list_all_users(
    current_admin: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db),
) -> Any:
    return db.query(User).order_by(User.created_at.desc()).all()


# ─────────────────────────────────────────
# POST /api/admin/retrain  — Hot-reload Model
# ─────────────────────────────────────────
@router.post("/retrain")
def retrain_model(
    current_admin: User = Depends(get_current_active_admin),
) -> Any:
    """
    Execute train.py as a subprocess, then hot-reload the model singleton.
    This runs synchronously and may take 10–30 seconds.
    """
    if not os.path.exists(_TRAIN_SCRIPT):
        raise HTTPException(
            status_code=503,
            detail=f"Training script not found at {_TRAIN_SCRIPT}"
        )

    try:
        result = subprocess.run(
            [sys.executable, _TRAIN_SCRIPT],
            capture_output=True,
            text=True,
            timeout=120,
            cwd=_BACKEND_DIR,
        )

        stdout = result.stdout or ""
        stderr = result.stderr or ""

        if result.returncode != 0:
            raise HTTPException(
                status_code=500,
                detail=f"Training script failed.\n\nSTDOUT:\n{stdout}\n\nSTDERR:\n{stderr}"
            )

        # Hot-reload the model singleton after successful training
        from app.utils.prediction_helpers import reload_model
        reload_model()

        # Load new metrics
        ml_metrics = _load_ml_metrics()
        best_model = ml_metrics.get("best_model_name") if ml_metrics else "Unknown"

        return {
            "status": "success",
            "message": f"Model retrained successfully! Champion model: {best_model}",
            "best_model": best_model,
            "metrics": ml_metrics,
            "training_log": stdout[-2000:],  # Last 2000 chars of training log
        }

    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=504, detail="Training script timed out after 120 seconds.")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error during retraining: {str(e)}")
