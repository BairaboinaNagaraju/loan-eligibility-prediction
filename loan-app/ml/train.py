"""
train.py — Train loan prediction models and save the best one.
Generates synthetic data + uses feature engineering.
"""
import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.svm import SVC
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, classification_report
)
import xgboost as xgb
import warnings
warnings.filterwarnings('ignore')

np.random.seed(42)
N = 5000

def generate_dataset(n=N):
    """Generate realistic synthetic loan dataset."""
    credit_scores = np.random.normal(680, 80, n).clip(300, 900).astype(int)
    annual_income = np.random.lognormal(mean=12.5, sigma=0.6, size=n).clip(120000, 5000000)
    monthly_salary = annual_income / 12
    loan_amounts = np.random.lognormal(mean=13.0, sigma=0.7, size=n).clip(50000, 5000000)
    loan_terms = np.random.choice([12, 24, 36, 48, 60, 84, 120, 180, 240], n)
    existing_loans = np.random.exponential(scale=100000, size=n).clip(0, 1000000)
    monthly_expenses = monthly_salary * np.random.uniform(0.3, 0.8, n)
    savings = annual_income * np.random.uniform(0, 2, n)
    age = np.random.randint(21, 65, n)
    job_experience = np.random.uniform(0, np.minimum(age - 21, 30), n)  # Can't exceed working age
    dependents = np.random.randint(0, 5, n)
    gender = np.random.choice(['male', 'female'], n)
    married = np.random.choice([0, 1], n, p=[0.3, 0.7])
    education = np.random.choice(['Graduate', 'Not Graduate'], n, p=[0.7, 0.3])
    self_employed = np.random.choice([0, 1], n, p=[0.8, 0.2])
    property_area = np.random.choice(['Urban', 'Semiurban', 'Rural'], n, p=[0.4, 0.35, 0.25])

    # Feature engineering
    emi = (loan_amounts * (0.01) * (1.01 ** loan_terms)) / ((1.01 ** loan_terms) - 1)
    debt_to_income = (existing_loans / 12 + emi) / monthly_salary
    income_to_loan = annual_income / loan_amounts
    savings_ratio = savings / annual_income
    credit_history = (credit_scores >= 650).astype(int)

    # Approval logic (complex, realistic)
    approval_score = (
        (credit_scores - 300) / 600 * 35 +           # Credit score (35%)
        np.clip(income_to_loan * 5, 0, 20) +          # Income to loan ratio (20%)
        np.clip((1 - debt_to_income) * 15, 0, 15) +  # Debt burden (15%)
        job_experience / 30 * 10 +                    # Experience (10%)
        savings_ratio * 10 +                          # Savings (10%)
        credit_history * 10                           # Credit history (10%)
    )

    # Add noise and threshold
    noise = np.random.normal(0, 5, n)
    approval_score += noise
    approved = (approval_score >= 45).astype(int)

    df = pd.DataFrame({
        'age': age,
        'gender': gender,
        'married': married,
        'dependents': dependents,
        'education': education,
        'self_employed': self_employed,
        'applicant_income': monthly_salary,
        'loan_amount': loan_amounts,
        'loan_term': loan_terms,
        'credit_score': credit_scores,
        'credit_history': credit_history,
        'property_area': property_area,
        'annual_income': annual_income,
        'existing_loans': existing_loans,
        'monthly_expenses': monthly_expenses,
        'savings': savings,
        'job_experience': job_experience,
        'emi': emi,
        'debt_to_income': debt_to_income,
        'income_to_loan': income_to_loan,
        'savings_ratio': savings_ratio,
        'loan_status': approved,
    })

    return df


def preprocess(df):
    df = df.copy()
    df['gender'] = (df['gender'] == 'male').astype(int)
    df['education'] = (df['education'] == 'Graduate').astype(int)

    area_map = {'Urban': 2, 'Semiurban': 1, 'Rural': 0}
    df['property_area'] = df['property_area'].map(area_map)

    return df


def train_all_models(X_train, X_test, y_train, y_test, feature_names):
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    models = {
        'Logistic Regression': LogisticRegression(max_iter=1000, random_state=42),
        'Decision Tree': DecisionTreeClassifier(max_depth=6, random_state=42),
        'Random Forest': RandomForestClassifier(n_estimators=150, max_depth=8, random_state=42, n_jobs=-1),
        'Gradient Boosting': GradientBoostingClassifier(n_estimators=150, learning_rate=0.1, max_depth=5, random_state=42),
        'SVM': SVC(kernel='rbf', C=1.0, probability=True, random_state=42),
        'XGBoost': xgb.XGBClassifier(n_estimators=200, max_depth=6, learning_rate=0.1,
                                      subsample=0.8, colsample_bytree=0.8, random_state=42, eval_metric='logloss'),
    }

    results = {}
    best_f1 = 0
    best_name = ''
    best_model = None
    best_scaler = None
    best_scaled = False

    for name, model in models.items():
        use_scaled = name in ['Logistic Regression', 'SVM']
        Xtr = X_train_scaled if use_scaled else X_train
        Xte = X_test_scaled if use_scaled else X_test

        model.fit(Xtr, y_train)
        y_pred = model.predict(Xte)
        y_prob = model.predict_proba(Xte)[:, 1]

        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred)
        rec = recall_score(y_test, y_pred)
        f1 = f1_score(y_test, y_pred)
        roc = roc_auc_score(y_test, y_prob)
        cm = confusion_matrix(y_test, y_pred).tolist()

        results[name] = {
            'accuracy': round(acc, 4),
            'precision': round(prec, 4),
            'recall': round(rec, 4),
            'f1_score': round(f1, 4),
            'roc_auc': round(roc, 4),
            'confusion_matrix': cm,
        }

        print(f"{name:25s} | Acc: {acc:.4f} | F1: {f1:.4f} | ROC-AUC: {roc:.4f}")

        if f1 > best_f1:
            best_f1 = f1
            best_name = name
            best_model = model
            best_scaler = scaler if use_scaled else None
            best_scaled = use_scaled

    # Feature importance
    feature_importance = {}
    if hasattr(best_model, 'feature_importances_'):
        feature_importance = dict(zip(feature_names, best_model.feature_importances_.tolist()))
    elif hasattr(best_model, 'coef_'):
        feature_importance = dict(zip(feature_names, abs(best_model.coef_[0]).tolist()))

    return results, best_name, best_model, best_scaler, best_scaled, feature_importance


def main():
    print("Generating dataset...")
    df = generate_dataset(N)
    df = preprocess(df)

    feature_cols = [
        'age', 'gender', 'married', 'dependents', 'education', 'self_employed',
        'applicant_income', 'loan_amount', 'loan_term', 'credit_score', 'credit_history',
        'property_area', 'annual_income', 'existing_loans', 'monthly_expenses', 'savings',
        'job_experience', 'emi', 'debt_to_income', 'income_to_loan', 'savings_ratio',
    ]

    X = df[feature_cols].values
    y = df['loan_status'].values

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    print(f"\nDataset: {len(df)} samples | Train: {len(X_train)} | Test: {len(X_test)}")
    print(f"Approval Rate: {y.mean():.1%}\n")
    print("Training models...\n")

    results, best_name, best_model, best_scaler, best_scaled, feature_importance = train_all_models(
        X_train, X_test, y_train, y_test, feature_cols
    )

    print(f"\nBest Model: {best_name}")

    # Save artifacts
    os.makedirs('models', exist_ok=True)

    joblib.dump({
        'model': best_model,
        'scaler': best_scaler,
        'use_scaled': best_scaled,
        'feature_cols': feature_cols,
        'model_name': best_name,
    }, 'models/best_model.joblib')

    with open('models/metrics.json', 'w') as f:
        json.dump({
            'best_model': best_name,
            'results': results,
            'feature_importance': feature_importance,
            'feature_cols': feature_cols,
        }, f, indent=2)

    print("\nModel saved to models/best_model.joblib")
    print("Metrics saved to models/metrics.json")


if __name__ == '__main__':
    main()
