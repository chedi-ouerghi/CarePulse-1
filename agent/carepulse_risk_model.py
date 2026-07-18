"""
CarePulse - Diabetes Risk Screening Model
-------------------------------------------
Trains a Random Forest classifier (with a Decision Tree baseline for
comparison) on the Pima Indians Diabetes dataset to predict diabetes
risk from routine clinical measurements.

This is the screening/early-detection layer of CarePulse — separate
from the day-to-day WhatsApp coaching agents, which manage patients
already diagnosed. This model targets the "undiagnosed" half of the
problem instead.

Dataset: 768 patients, 8 features, binary outcome (0 = no diabetes,
1 = diabetes). Source: National Institute of Diabetes and Digestive
and Kidney Diseases, via jbrownlee/Datasets on GitHub:
https://raw.githubusercontent.com/jbrownlee/Datasets/master/pima-indians-diabetes.data.csv

Usage:
    python carepulse_risk_model.py --data pima.csv
"""

import argparse
import pandas as pd
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, classification_report
)

COLUMN_NAMES = [
    "Pregnancies", "Glucose", "BloodPressure", "SkinThickness",
    "Insulin", "BMI", "DiabetesPedigreeFunction", "Age", "Outcome"
]


def load_data(path):
    """Load the Pima dataset. The raw file has no header row."""
    df = pd.read_csv(path, header=None, names=COLUMN_NAMES)
    return df


def evaluate_model(name, model, X_test, y_test):
    """Print accuracy, precision, recall, F1, and ROC-AUC for a fitted model."""
    preds = model.predict(X_test)
    probs = model.predict_proba(X_test)[:, 1]

    print(f"\n{name}")
    print(f"  Accuracy : {accuracy_score(y_test, preds):.4f}")
    print(f"  Precision: {precision_score(y_test, preds):.4f}")
    print(f"  Recall   : {recall_score(y_test, preds):.4f}")
    print(f"  F1 score : {f1_score(y_test, preds):.4f}")
    print(f"  ROC-AUC  : {roc_auc_score(y_test, probs):.4f}")
    print(f"  Confusion matrix:\n{confusion_matrix(y_test, preds)}")


def main(data_path):
    df = load_data(data_path)
    print("Dataset shape:", df.shape)
    print("Class balance (0 = no diabetes, 1 = diabetes):")
    print(df["Outcome"].value_counts(normalize=True).round(3))

    X = df.drop(columns=["Outcome"])
    y = df["Outcome"]

    # Stratified split keeps the same class balance in train and test
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # --- Decision Tree baseline ---
    dt = DecisionTreeClassifier(max_depth=5, random_state=42)
    dt.fit(X_train, y_train)
    evaluate_model("Decision Tree", dt, X_test, y_test)

    # --- Random Forest (primary model) ---
    rf = RandomForestClassifier(n_estimators=300, max_depth=6, random_state=42)
    rf.fit(X_train, y_train)
    evaluate_model("Random Forest", rf, X_test, y_test)

    # --- 5-fold cross-validation ---
    # More reliable than a single train/test split on a dataset this small
    # (154 test patients is a lot of variance from one split alone).
    cv_dt = cross_val_score(
        DecisionTreeClassifier(max_depth=5, random_state=42), X, y, cv=5
    )
    cv_rf = cross_val_score(
        RandomForestClassifier(n_estimators=300, max_depth=6, random_state=42),
        X, y, cv=5
    )
    print(f"\n5-fold CV accuracy - Decision Tree : {cv_dt.mean():.4f}  (folds: {cv_dt.round(3)})")
    print(f"5-fold CV accuracy - Random Forest : {cv_rf.mean():.4f}  (folds: {cv_rf.round(3)})")

    # --- Feature importance ---
    importances = pd.Series(
        rf.feature_importances_, index=X.columns
    ).sort_values(ascending=False)
    print("\nRandom Forest feature importances:")
    print(importances.round(3))

    return rf, dt


def predict_risk(model, patient: dict):
    """
    Score a single patient dict against a trained model, e.g.:
        predict_risk(rf, {
            "Pregnancies": 2, "Glucose": 130, "BloodPressure": 70,
            "SkinThickness": 20, "Insulin": 85, "BMI": 28.5,
            "DiabetesPedigreeFunction": 0.35, "Age": 34
        })
    Returns the model's predicted probability of diabetes (0-1).
    """
    row = pd.DataFrame([patient], columns=COLUMN_NAMES[:-1])
    return model.predict_proba(row)[0][1]


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", default="pima.csv", help="Path to the Pima CSV file")
    args = parser.parse_args()

    trained_rf, trained_dt = main(args.data)

    # Example single-patient prediction
    example_patient = {
        "Pregnancies": 2, "Glucose": 130, "BloodPressure": 70,
        "SkinThickness": 20, "Insulin": 85, "BMI": 28.5,
        "DiabetesPedigreeFunction": 0.35, "Age": 34
    }
    risk = predict_risk(trained_rf, example_patient)
    print(f"\nExample patient risk score: {risk:.2%}")
