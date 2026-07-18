"""
CarePulse - 30-Day Hospital Readmission Risk Model
-----------------------------------------------------
Predicts whether a diabetic patient will be readmitted within 30 days
of discharge using the UCI Diabetes 130-US Hospitals dataset.

This module is designed to be imported by the FastAPI service in server.py.
"""

import os
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score, roc_auc_score
from sklearn.model_selection import train_test_split


def load_via_ucimlrepo():
    """Official method: fetches the verified dataset directly from UCI."""
    try:
        from ucimlrepo import fetch_ucirepo
    except ImportError as exc:
        raise RuntimeError("Install the optional 'ucimlrepo' package to download the readmission dataset") from exc

    diabetes_130 = fetch_ucirepo(id=296)
    X_raw = diabetes_130.data.features
    y_raw = diabetes_130.data.targets
    target_col = y_raw.columns[0]
    return X_raw, y_raw[target_col]


def load_via_local_csv(path: str):
    """Fallback: load a manually downloaded diabetic_data.csv."""
    df = pd.read_csv(path)
    y_raw = df["readmitted"]
    X_raw = df.drop(columns=["readmitted"])
    return X_raw, y_raw


def preprocess(X_raw: pd.DataFrame) -> pd.DataFrame:
    df = X_raw.copy()
    df = df.replace("?", np.nan)

    drop_cols = [
        c for c in ["weight", "diag_1", "diag_2", "diag_3", "encounter_id", "patient_nbr"] if c in df.columns
    ]
    df = df.drop(columns=drop_cols)

    for c in ["race", "payer_code", "medical_specialty"]:
        if c in df.columns:
            df[c] = df[c].fillna("Unknown")

    if "age" in df.columns and df["age"].dtype == object:
        def age_midpoint(bucket):
            try:
                lo, hi = bucket.strip("[)").split("-")
                return (int(lo) + int(hi)) / 2
            except Exception:
                return np.nan

        df["age"] = df["age"].apply(age_midpoint)

    categorical_cols = df.select_dtypes(include="object").columns.tolist()
    df_encoded = pd.get_dummies(df, columns=categorical_cols, drop_first=True)
    df_encoded = df_encoded.fillna(df_encoded.median(numeric_only=True))
    return df_encoded


def fit_readmission_model(local_csv: Optional[str] = None) -> Tuple[RandomForestClassifier, List[str]]:
    """Train the readmission model and return the fitted estimator plus its column order."""
    if local_csv:
        X_raw, y_raw = load_via_local_csv(local_csv)
    else:
        configured_path = os.getenv("READMISSION_LOCAL_CSV", "").strip()
        if configured_path and os.path.exists(configured_path):
            X_raw, y_raw = load_via_local_csv(configured_path)
        else:
            X_raw, y_raw = load_via_ucimlrepo()

    y = (y_raw == "<30").astype(int)
    X = preprocess(X_raw)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    model = RandomForestClassifier(
        n_estimators=300,
        max_depth=10,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_train, y_train)

    preds = model.predict(X_test)
    probs = model.predict_proba(X_test)[:, 1]
    accuracy = accuracy_score(y_test, preds)
    precision = precision_score(y_test, preds, zero_division=0)
    recall = recall_score(y_test, preds, zero_division=0)
    f1 = f1_score(y_test, preds, zero_division=0)
    roc_auc = roc_auc_score(y_test, probs)

    print(
        f"Readmission model trained. Accuracy={accuracy:.4f}, Precision={precision:.4f}, "
        f"Recall={recall:.4f}, F1={f1:.4f}, ROC-AUC={roc_auc:.4f}"
    )
    return model, X.columns.tolist()


def transform_row_for_model(row: Dict[str, Any], feature_columns: List[str]) -> pd.DataFrame:
    """Preprocess a single patient-like payload and align it to the model's training columns."""
    df = pd.DataFrame([row])
    df = preprocess(df)

    for column in feature_columns:
        if column not in df.columns:
            df[column] = 0

    return df[feature_columns]


def predict_readmission_probability(model: RandomForestClassifier, row: Dict[str, Any], feature_columns: List[str]) -> float:
    frame = transform_row_for_model(row, feature_columns)
    return float(model.predict_proba(frame)[0][1])


def readmission_risk_level(score: float) -> str:
    if score < 0.3:
        return "low"
    if score < 0.6:
        return "moderate"
    if score < 0.8:
        return "high"
    return "very_high"
