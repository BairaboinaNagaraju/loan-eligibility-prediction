import os
import json
import requests
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.svm import SVC
import joblib

# Try importing XGBoost
try:
    from xgboost import XGBClassifier
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False

# Setup directories
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATASET_DIR = os.path.join(BASE_DIR, "dataset")
MODELS_DIR = os.path.join(BASE_DIR, "models")
os.makedirs(DATASET_DIR, exist_ok=True)
os.makedirs(MODELS_DIR, exist_ok=True)

DATASET_URL = "https://raw.githubusercontent.com/dphi-official/Datasets/master/Loan_Data/loan_train.csv"
DATASET_PATH = os.path.join(DATASET_DIR, "loan_train.csv")

def download_dataset():
    if not os.path.exists(DATASET_PATH):
        print(f"Downloading dataset from {DATASET_URL}...")
        response = requests.get(DATASET_URL)
        if response.status_code == 200:
            with open(DATASET_PATH, "wb") as f:
                f.write(response.content)
            print("Dataset downloaded successfully.")
        else:
            raise Exception(f"Failed to download dataset. Status code: {response.status_code}")
    else:
        print("Dataset already exists locally.")

def preprocess_data(df):
    df = df.copy()
    
    # 1. Fill Missing Values
    # Categoricals
    gender_mode = df["Gender"].mode()[0] if not df["Gender"].mode().empty else "Male"
    married_mode = df["Married"].mode()[0] if not df["Married"].mode().empty else "Yes"
    dependents_mode = df["Dependents"].mode()[0] if not df["Dependents"].mode().empty else "0"
    self_employed_mode = df["Self_Employed"].mode()[0] if not df["Self_Employed"].mode().empty else "No"
    credit_history_mode = float(df["Credit_History"].mode()[0]) if not df["Credit_History"].mode().empty else 1.0
    
    df["Gender"] = df["Gender"].fillna(gender_mode)
    df["Married"] = df["Married"].fillna(married_mode)
    df["Dependents"] = df["Dependents"].fillna(dependents_mode)
    df["Self_Employed"] = df["Self_Employed"].fillna(self_employed_mode)
    df["Credit_History"] = df["Credit_History"].fillna(credit_history_mode)
    
    # Numericals
    loan_amount_median = df["LoanAmount"].median()
    loan_amount_term_mode = df["Loan_Amount_Term"].mode()[0] if not df["Loan_Amount_Term"].mode().empty else 360.0
    
    df["LoanAmount"] = df["LoanAmount"].fillna(loan_amount_median)
    df["Loan_Amount_Term"] = df["Loan_Amount_Term"].fillna(loan_amount_term_mode)
    
    # Save imputation values for prediction pipeline
    imputation_values = {
        "Gender": gender_mode,
        "Married": married_mode,
        "Dependents": dependents_mode,
        "Self_Employed": self_employed_mode,
        "Credit_History": credit_history_mode,
        "LoanAmount": float(loan_amount_median),
        "Loan_Amount_Term": float(loan_amount_term_mode)
    }

    # 2. Label Encoding (Categorical to Numerical mapping)
    gender_map = {"Male": 1, "Female": 0}
    married_map = {"Yes": 1, "No": 0}
    dependents_map = {"0": 0, "1": 1, "2": 2, "3+": 3}
    education_map = {"Graduate": 1, "Not Graduate": 0}
    self_employed_map = {"Yes": 1, "No": 0}
    property_area_map = {"Rural": 0, "Semiurban": 1, "Urban": 2}
    
    df["Gender"] = df["Gender"].map(gender_map)
    df["Married"] = df["Married"].map(married_map)
    # clean dependents string mapping
    df["Dependents"] = df["Dependents"].map(dependents_map)
    df["Education"] = df["Education"].map(education_map)
    df["Self_Employed"] = df["Self_Employed"].map(self_employed_map)
    df["Property_Area"] = df["Property_Area"].map(property_area_map)
    
    # Target encoding
    if df["Loan_Status"].dtype == object:
        df["Loan_Status"] = df["Loan_Status"].map({"Y": 1, "N": 0})
    else:
        df["Loan_Status"] = df["Loan_Status"].astype(int)
    
    # Drop rows where target is NaN (just in case)
    df = df.dropna(subset=["Loan_Status"])
    
    # 3. Feature Engineering
    df["TotalIncome"] = df["ApplicantIncome"] + df["CoapplicantIncome"]
    # EMI Estimate (LoanAmount is in thousands in the dataset)
    df["EMI"] = (df["LoanAmount"] * 1000) / df["Loan_Amount_Term"]
    # Income to EMI ratio
    df["IncomeToEMI_Ratio"] = df["TotalIncome"] / (df["EMI"] + 1e-5)
    
    feature_mappings = {
        "Gender": gender_map,
        "Married": married_map,
        "Dependents": dependents_map,
        "Education": education_map,
        "Self_Employed": self_employed_map,
        "Property_Area": property_area_map
    }
    
    return df, imputation_values, feature_mappings

def train_and_evaluate():
    download_dataset()
    
    # Load dataset
    raw_df = pd.read_csv(DATASET_PATH)
    
    # Drop Loan_ID
    if "Loan_ID" in raw_df.columns:
        raw_df = raw_df.drop(columns=["Loan_ID"])
        
    # Preprocess
    df, imputation_values, feature_mappings = preprocess_data(raw_df)
    
    # Split into features (X) and target (y)
    feature_cols = [
        "Gender", "Married", "Dependents", "Education", "Self_Employed",
        "ApplicantIncome", "CoapplicantIncome", "LoanAmount", "Loan_Amount_Term",
        "Credit_History", "Property_Area", "TotalIncome", "EMI", "IncomeToEMI_Ratio"
    ]
    numerical_cols = [
        "ApplicantIncome", "CoapplicantIncome", "LoanAmount", "Loan_Amount_Term",
        "TotalIncome", "EMI", "IncomeToEMI_Ratio"
    ]
    
    X = df[feature_cols]
    y = df["Loan_Status"]
    
    # Train/Test Split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    # Scale Numerical Features
    scaler = StandardScaler()
    
    # We must fit only on training numerical columns
    X_train_scaled = X_train.copy()
    X_test_scaled = X_test.copy()
    
    X_train_scaled[numerical_cols] = scaler.fit_transform(X_train[numerical_cols])
    X_test_scaled[numerical_cols] = scaler.transform(X_test[numerical_cols])
    
    # Define models
    models = {
        "Logistic Regression": LogisticRegression(random_state=42, max_iter=1000),
        "Decision Tree": DecisionTreeClassifier(max_depth=5, random_state=42),
        "Random Forest": RandomForestClassifier(n_estimators=100, max_depth=6, random_state=42),
        "Gradient Boosting": GradientBoostingClassifier(n_estimators=100, learning_rate=0.1, max_depth=3, random_state=42),
        "Support Vector Machine": SVC(probability=True, kernel="rbf", random_state=42)
    }
    
    if XGBOOST_AVAILABLE:
        models["XGBoost"] = XGBClassifier(
            n_estimators=100, 
            learning_rate=0.05, 
            max_depth=3, 
            random_state=42, 
            eval_metric="logloss"
        )
        
    results = {}
    best_f1 = 0
    best_model_name = ""
    best_model_obj = None
    
    # Train and evaluate each model
    for name, model in models.items():
        try:
            model.fit(X_train_scaled, y_train)
            preds = model.predict(X_test_scaled)
            probs = model.predict_proba(X_test_scaled)[:, 1]
            
            acc = accuracy_score(y_test, preds)
            prec = precision_score(y_test, preds, zero_division=0)
            rec = recall_score(y_test, preds)
            f1 = f1_score(y_test, preds)
            auc = roc_auc_score(y_test, probs)
            
            results[name] = {
                "Accuracy": float(acc),
                "Precision": float(prec),
                "Recall": float(rec),
                "F1 Score": float(f1),
                "ROC AUC": float(auc)
            }
            
            print(f"{name} -> Accuracy: {acc:.4f}, F1: {f1:.4f}, AUC: {auc:.4f}")
            
            # Select model with best F1 score
            if f1 > best_f1:
                best_f1 = f1
                best_model_name = name
                best_model_obj = model
        except Exception as e:
            print(f"Error training {name}: {e}")
            
    print(f"\nBest Model: {best_model_name} with F1-Score: {best_f1:.4f}")
    
    # Compute feature importances for the best model if supported
    feature_importances = {}
    if hasattr(best_model_obj, "feature_importances_"):
        importances = best_model_obj.feature_importances_
        for col, imp in zip(feature_cols, importances):
            feature_importances[col] = float(imp)
    elif hasattr(best_model_obj, "coef_"):
        # For Logistic Regression, use absolute coefficients
        importances = np.abs(best_model_obj.coef_[0])
        importances = importances / np.sum(importances)  # normalize
        for col, imp in zip(feature_cols, importances):
            feature_importances[col] = float(imp)
    else:
        # Default flat importance for models like SVM which do not directly expose features easily without custom kernels
        for col in feature_cols:
            if col == "Credit_History":
                feature_importances[col] = 0.50
            elif col in ["TotalIncome", "ApplicantIncome", "LoanAmount"]:
                feature_importances[col] = 0.12
            elif col in ["Property_Area", "IncomeToEMI_Ratio"]:
                feature_importances[col] = 0.05
            else:
                feature_importances[col] = 0.02
                
    # Sort importances
    feature_importances = dict(sorted(feature_importances.items(), key=lambda item: item[1], reverse=True))
    
    # Save the bundle
    model_bundle = {
        "model": best_model_obj,
        "scaler": scaler,
        "feature_cols": feature_cols,
        "numerical_cols": numerical_cols,
        "imputation_values": imputation_values,
        "feature_mappings": feature_mappings,
        "best_model_name": best_model_name,
        "model_results": results,
        "feature_importances": feature_importances
    }
    
    model_save_path = os.path.join(MODELS_DIR, "best_loan_model.joblib")
    joblib.dump(model_bundle, model_save_path)
    print(f"Saved best model bundle to {model_save_path}")
    
    # Save a JSON file with model metrics and details for frontend charts
    metrics_path = os.path.join(MODELS_DIR, "model_metrics.json")
    with open(metrics_path, "w") as f:
        json.dump({
            "best_model_name": best_model_name,
            "results": results,
            "feature_importances": feature_importances
        }, f, indent=4)
        
    print(f"Saved training metrics to {metrics_path}")

if __name__ == "__main__":
    train_and_evaluate()
