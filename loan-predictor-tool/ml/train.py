import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
import xgboost as xgb
import warnings
warnings.filterwarnings('ignore')

np.random.seed(42)
N = 3000

def generate_synthetic_data(n=N):
    age = np.random.randint(18, 70, n)
    gender = np.random.choice(['male', 'female', 'other'], n)
    married = np.random.choice([0, 1], n, p=[0.4, 0.6])
    education = np.random.choice(['Graduate', 'Not Graduate'], n, p=[0.7, 0.3])
    self_employed = np.random.choice([0, 1], n, p=[0.8, 0.2])

    annual_income = np.random.lognormal(mean=12.5, sigma=0.6, size=n).clip(120000, 6000000)
    monthly_income = annual_income / 12
    monthly_expenses = monthly_income * np.random.uniform(0.2, 0.7, n)
    savings = annual_income * np.random.uniform(0.1, 1.5, n)
    investments = annual_income * np.random.uniform(0.0, 1.0, n)

    active_loans = np.random.choice([0, 1, 2, 3, 4], n, p=[0.5, 0.3, 0.12, 0.06, 0.02])
    existing_loan_amount = active_loans * np.random.exponential(scale=150000, size=n).clip(0, 2000000)
    existing_emi = active_loans * (existing_loan_amount / 36) * 0.4
    credit_card_outstanding = np.random.exponential(scale=25000, size=n).clip(0, 300000)

    credit_score = np.random.normal(670, 95, n).clip(300, 900).astype(int)

    requested_loan = np.random.lognormal(mean=13.0, sigma=0.7, size=n).clip(50000, 5000000)
    loan_tenure = np.random.choice([12, 24, 36, 60, 120, 240], n)
    interest_rate = np.random.uniform(7.5, 22.0, n)
    loan_purpose = np.random.choice(['home', 'education', 'personal', 'business', 'vehicle', 'medical', 'home_renovation', 'other'], n)

    # Engineered metrics
    monthly_emi = (requested_loan * (interest_rate / 1200)) / (1 - (1 + (interest_rate / 1200))**(-loan_tenure))
    total_monthly_emi = existing_emi + monthly_emi
    dti = total_monthly_emi / np.maximum(monthly_income, 1.0)
    credit_util = (credit_card_outstanding / 150000.0 * 100).clip(0, 100)

    # Eligibility Logic
    score = (
        ((credit_score - 300) / 600.0) * 40 +
        (1.0 - np.clip(dti, 0.0, 1.0)) * 25 +
        (np.clip(savings / np.maximum(requested_loan, 1.0), 0.0, 1.0)) * 15 +
        (1.0 - np.clip(credit_util / 100.0, 0.0, 1.0)) * 10 +
        (active_loans <= 2).astype(int) * 10
    )

    noise = np.random.normal(0, 4, n)
    score += noise
    approved = (score >= 46).astype(int)

    df = pd.DataFrame({
        'age': age,
        'gender': gender,
        'married': married,
        'education': education,
        'self_employed': self_employed,
        'annual_income': annual_income,
        'monthly_income': monthly_income,
        'monthly_expenses': monthly_expenses,
        'savings': savings,
        'investments': investments,
        'active_loans': active_loans,
        'existing_loan_amount': existing_loan_amount,
        'existing_emi': existing_emi,
        'credit_card_outstanding': credit_card_outstanding,
        'credit_score': credit_score,
        'requested_loan': requested_loan,
        'loan_tenure': loan_tenure,
        'interest_rate': interest_rate,
        'loan_purpose': loan_purpose,
        'dti': dti,
        'credit_util': credit_util,
        'approved': approved
    })
    return df

def preprocess(df):
    df = df.copy()
    df['gender'] = df['gender'].map({'male': 1, 'female': 2, 'other': 0}).fillna(0)
    df['education'] = (df['education'] == 'Graduate').astype(int)
    df['loan_purpose'] = df['loan_purpose'].map({
        'home': 0, 'education': 1, 'personal': 2, 'business': 3,
        'vehicle': 4, 'medical': 5, 'home_renovation': 6, 'other': 7
    }).fillna(7)
    return df

def main():
    print("Generating training dataset...")
    df = generate_synthetic_data()
    df_proc = preprocess(df)

    feature_cols = [
        'age', 'gender', 'married', 'education', 'self_employed',
        'annual_income', 'monthly_income', 'monthly_expenses', 'savings', 'investments',
        'active_loans', 'existing_loan_amount', 'existing_emi', 'credit_card_outstanding',
        'credit_score', 'requested_loan', 'loan_tenure', 'interest_rate', 'loan_purpose',
        'dti', 'credit_util'
    ]

    X = df_proc[feature_cols].values
    y = df_proc['approved'].values

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Models comparison
    models = {
        'Logistic Regression': LogisticRegression(max_iter=1000, random_state=42),
        'Decision Tree': DecisionTreeClassifier(max_depth=6, random_state=42),
        'Random Forest': RandomForestClassifier(n_estimators=100, max_depth=6, random_state=42),
        'Gradient Boosting': GradientBoostingClassifier(n_estimators=100, learning_rate=0.1, random_state=42),
        'XGBoost': xgb.XGBClassifier(n_estimators=100, max_depth=5, learning_rate=0.1, random_state=42, eval_metric='logloss')
    }

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    results = {}
    best_f1 = 0
    best_name = ''
    best_model = None

    for name, model in models.items():
        use_scaled = name == 'Logistic Regression'
        X_tr = X_train_scaled if use_scaled else X_train
        X_te = X_test_scaled if use_scaled else X_test

        model.fit(X_tr, y_train)
        y_pred = model.predict(X_te)
        y_prob = model.predict_proba(X_te)[:, 1]

        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred)
        rec = recall_score(y_test, y_pred)
        f1 = f1_score(y_test, y_pred)
        roc = roc_auc_score(y_test, y_prob)

        results[name] = {
            'accuracy': round(acc, 4),
            'precision': round(prec, 4),
            'recall': round(rec, 4),
            'f1_score': round(f1, 4),
            'roc_auc': round(roc, 4)
        }
        print(f"{name:25s} | Acc: {acc:.4f} | F1: {f1:.4f}")

        if f1 > best_f1:
            best_f1 = f1
            best_name = name
            best_model = model

    os.makedirs('models', exist_ok=True)
    
    # Save best bundle
    joblib.dump({
        'model': best_model,
        'scaler': scaler,
        'feature_cols': feature_cols,
        'model_name': best_name
    }, 'models/predictor_model.joblib')

    # Save metrics
    importance = {}
    if hasattr(best_model, 'feature_importances_'):
        importance = dict(zip(feature_cols, best_model.feature_importances_.tolist()))
    elif hasattr(best_model, 'coef_'):
        importance = dict(zip(feature_cols, abs(best_model.coef_[0]).tolist()))

    with open('models/metrics.json', 'w') as f:
        json.dump({
            'best_model': best_name,
            'results': results,
            'feature_importance': importance,
            'feature_cols': feature_cols
        }, f, indent=2)

    print("Model training finished. Saved best model:", best_name)

if __name__ == '__main__':
    main()
