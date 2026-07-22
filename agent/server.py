"""
CarePulse Risk Model - FastAPI Microservice
--------------------------------------------
Exposes the diabetes risk screening model and clinical rules engine
as an HTTP API for the NestJS backend.

Endpoints:
    GET  /health                         - Health check (both models)
    POST /predict                        - Diabetes risk screening
    POST /batch-predict                  - Batch diabetes risk screening
    POST /readmission/predict            - 30-day readmission risk
    POST /readmission/batch-predict      - Batch readmission risk
    POST /clinical-rules                 - Clinical rules engine
    POST /chat                           - Mistral AI chat bridge
"""

import json
import logging
import os
import statistics
from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Literal, Optional
from urllib import error as urllib_error, request as urllib_request

import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split

from carepulse_readmission_model import (
    fit_readmission_model,
    predict_readmission_probability,
    readmission_risk_level,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("carepulse.risk-model")

MODEL_DIR = Path(__file__).parent
DATA_PATH = MODEL_DIR / "pima.csv"


# ---------------------------------------------------------------------------
# Environment loading
# ---------------------------------------------------------------------------

def _load_env_file() -> None:
    """Load .env from agent/, project root, or cwd — first match wins."""
    env_candidates = [
        MODEL_DIR / ".env",
        Path.cwd() / ".env",
        MODEL_DIR.parent / ".env",
    ]

    for env_path in env_candidates:
        if not env_path.exists():
            continue

        for raw_line in env_path.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            if key and key not in os.environ:
                os.environ[key] = value
        break


_load_env_file()
MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY", "").strip()
MISTRAL_MODEL = os.getenv("MISTRAL_MODEL", "mistral-small-latest")

COLUMN_NAMES = [
    "Pregnancies", "Glucose", "BloodPressure", "SkinThickness",
    "Insulin", "BMI", "DiabetesPedigreeFunction", "Age", "Outcome",
]


# ---------------------------------------------------------------------------
# Global model state
# ---------------------------------------------------------------------------

rf_model: Optional[RandomForestClassifier] = None
readmission_model: Optional[RandomForestClassifier] = None
readmission_feature_columns: List[str] = []


def train_model() -> None:
    global rf_model
    logger.info("Training diabetes risk model from %s", DATA_PATH)
    df = pd.read_csv(DATA_PATH, header=None, names=COLUMN_NAMES)
    X = df.drop(columns=["Outcome"])
    y = df["Outcome"]
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y,
    )
    rf_model = RandomForestClassifier(n_estimators=300, max_depth=6, random_state=42)
    rf_model.fit(X_train, y_train)
    accuracy = rf_model.score(X_test, y_test)
    logger.info("Diabetes risk model trained. Test accuracy: %.4f", accuracy)


def train_readmission_model() -> None:
    global readmission_model, readmission_feature_columns
    logger.info("Training readmission model")
    readmission_model, readmission_feature_columns = fit_readmission_model()
    logger.info("Readmission model trained.")


@asynccontextmanager
async def lifespan(app: FastAPI):
    train_model()
    try:
        train_readmission_model()
    except Exception as exc:
        logger.warning("Readmission model initialization skipped: %s", exc)
    yield
    logger.info("Shutting down risk model service")


app = FastAPI(
    title="CarePulse Risk Model",
    description="Diabetes risk screening + clinical rules engine API",
    version="2.0.0",
    lifespan=lifespan,
)


# ===========================================================================
# Pydantic models — Diabetes screening
# ===========================================================================

class PatientFeatures(BaseModel):
    pregnancies: int = Field(..., ge=0, description="Number of pregnancies")
    glucose: int = Field(..., ge=0, description="Plasma glucose concentration (mg/dL)")
    blood_pressure: int = Field(..., ge=0, description="Diastolic blood pressure (mm Hg)")
    skin_thickness: int = Field(..., ge=0, description="Triceps skin fold thickness (mm)")
    insulin: int = Field(..., ge=0, description="2-hour serum insulin (mu U/ml)")
    bmi: float = Field(..., gt=0, description="Body mass index")
    diabetes_pedigree_function: float = Field(..., ge=0, description="Diabetes pedigree function")
    age: int = Field(..., ge=0, description="Age in years")


class PredictionResponse(BaseModel):
    risk_score: float = Field(..., ge=0, le=1, description="Probability of diabetes (0-1)")
    risk_level: str = Field(..., description="low, moderate, high, or very_high")
    model_version: str = "random_forest_v1"


class BatchPredictionRequest(BaseModel):
    patients: List[PatientFeatures]


class BatchPredictionResponse(BaseModel):
    results: List[PredictionResponse]
    count: int


# ===========================================================================
# Pydantic models — Readmission
# ===========================================================================

class ReadmissionPatientFeatures(BaseModel):
    age: Optional[int] = None
    race: Optional[str] = None
    gender: Optional[str] = None
    admission_type_id: Optional[int] = None
    discharge_disposition_id: Optional[int] = None
    admission_source_id: Optional[int] = None
    time_in_hospital: Optional[int] = None
    num_lab_procedures: Optional[int] = None
    num_procedures: Optional[int] = None
    num_medications: Optional[int] = None
    number_outpatient: Optional[int] = None
    number_emergency: Optional[int] = None
    number_inpatient: Optional[int] = None
    diag_1: Optional[str] = None
    diag_2: Optional[str] = None
    diag_3: Optional[str] = None
    number_diagnoses: Optional[int] = None
    max_glu_serum: Optional[str] = None
    a1c_result: Optional[str] = None
    metformin: Optional[str] = None
    repaglinide: Optional[str] = None
    nateglinide: Optional[str] = None
    chlorpropamide: Optional[str] = None
    glimepiride: Optional[str] = None
    acetohexamide: Optional[str] = None
    glipizide: Optional[str] = None
    glyburide: Optional[str] = None
    tolbutamide: Optional[str] = None
    pioglitazone: Optional[str] = None
    rosiglitazone: Optional[str] = None
    acarbose: Optional[str] = None
    miglitol: Optional[str] = None
    troglitazone: Optional[str] = None
    tolazamide: Optional[str] = None
    examide: Optional[str] = None
    citoglipton: Optional[str] = None
    insulin: Optional[str] = None
    glyburide_metformin: Optional[str] = None
    glipizide_metformin: Optional[str] = None
    glimepiride_pioglitazone: Optional[str] = None
    metformin_rosiglitazone: Optional[str] = None
    metformin_pioglitazone: Optional[str] = None
    change: Optional[str] = None
    diabetes_med: Optional[str] = None
    readmitted: Optional[str] = None


class ReadmissionPredictionResponse(BaseModel):
    risk_score: float = Field(..., ge=0, le=1, description="Probability of readmission within 30 days")
    risk_level: str = Field(..., description="low, moderate, high, or very_high")
    model_version: str = "readmission_rf_v1"


class ReadmissionBatchPredictionRequest(BaseModel):
    patients: List[ReadmissionPatientFeatures]


class ReadmissionBatchPredictionResponse(BaseModel):
    results: List[ReadmissionPredictionResponse]
    count: int


# ===========================================================================
# Pydantic models — Chat (Mistral bridge)
# ===========================================================================

class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"] = "user"
    content: str = ""


class ChatRequest(BaseModel):
    messages: List[ChatMessage] = Field(default_factory=list)
    system_prompt: Optional[str] = None
    model: Optional[str] = None


class ChatResponse(BaseModel):
    reply: str
    model: str
    source: Literal["mistral", "fallback"] = "mistral"


# ===========================================================================
# Pydantic models — Health
# ===========================================================================

class ModelHealth(BaseModel):
    loaded: bool
    error: Optional[str] = None


class HealthResponse(BaseModel):
    status: str
    diabetes_model: ModelHealth
    readmission_model: ModelHealth


# ===========================================================================
# Pydantic models — Clinical Rules Engine
# ===========================================================================

class Reading(BaseModel):
    value: float
    timestamp: str
    source: str = "cgm"


class Event(BaseModel):
    type: str
    timestamp: str
    metadata: Optional[Dict[str, Any]] = None


class MedicationEntry(BaseModel):
    name: str
    dosage: str


class LabResultEntry(BaseModel):
    name: str
    value: float
    unit: str


class ClinicalRulesRequest(BaseModel):
    patient_id: str
    readings: List[Reading] = []
    events: List[Event] = []
    medications: List[MedicationEntry] = []
    lab_results: List[LabResultEntry] = []


class TimelineEntry(BaseModel):
    time: str
    type: str
    value: Optional[float] = None
    detail: str = ""


class ClinicalStats(BaseModel):
    avg_glucose: float
    variance: float
    time_in_range: float
    hypo_events: int
    hyper_events: int
    meal_frequency: float
    adherence_score: float


class RiskAssessment(BaseModel):
    hyperglycemia: float
    hypoglycemia: float
    adherence: float
    lifestyle: float
    overall: str


class Alert(BaseModel):
    title: str
    message: str
    severity: str


class ClinicalRulesResponse(BaseModel):
    timeline: List[TimelineEntry]
    stats: ClinicalStats
    risk_assessment: RiskAssessment
    alerts: List[Alert]
    timeline_summary: str


# ===========================================================================
# Helpers — Diabetes screening
# ===========================================================================

def compute_risk_level(score: float) -> str:
    if score < 0.3:
        return "low"
    if score < 0.5:
        return "moderate"
    if score < 0.7:
        return "high"
    return "very_high"


def features_to_dataframe(patient: PatientFeatures) -> pd.DataFrame:
    return pd.DataFrame([{
        "Pregnancies": patient.pregnancies,
        "Glucose": patient.glucose,
        "BloodPressure": patient.blood_pressure,
        "SkinThickness": patient.skin_thickness,
        "Insulin": patient.insulin,
        "BMI": patient.bmi,
        "DiabetesPedigreeFunction": patient.diabetes_pedigree_function,
        "Age": patient.age,
    }])


# ===========================================================================
# Helpers — Mistral chat
# ===========================================================================

MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions"

_FALLBACK_REPLIES: Dict[str, str] = {
    "default": (
        "I'm sorry — the AI assistant is temporarily unavailable. "
        "Please try again later or contact your care team."
    ),
}


def _call_mistral(request: ChatRequest) -> str:
    api_key = os.getenv("MISTRAL_API_KEY", MISTRAL_API_KEY).strip()
    if not api_key:
        raise RuntimeError("MISTRAL_API_KEY is not configured")

    messages: List[Dict[str, str]] = []
    if request.system_prompt:
        messages.append({"role": "system", "content": request.system_prompt})
    for message in request.messages:
        messages.append({"role": message.role, "content": message.content})

    if not messages:
        raise RuntimeError("No messages provided")

    payload = {
        "model": request.model or MISTRAL_MODEL,
        "messages": messages,
        "temperature": 0.7,
    }

    http_request = urllib_request.Request(
        MISTRAL_API_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
        method="POST",
    )

    try:
        with urllib_request.urlopen(http_request, timeout=60) as response:
            body = json.loads(response.read().decode("utf-8"))
    except (urllib_error.HTTPError, urllib_error.URLError, TimeoutError) as exc:
        raise RuntimeError(f"Mistral AI request failed: {exc}") from exc

    try:
        return body["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError) as exc:
        raise RuntimeError("Unexpected Mistral AI response format") from exc


def _get_fallback_reply(request: ChatRequest) -> str:
    """Deterministic fallback when Mistral is unavailable."""
    return _FALLBACK_REPLIES["default"]


# ===========================================================================
# Helpers — Clinical Rules Engine
# ===========================================================================

def _parse_ts(ts_str: str) -> datetime:
    ts = ts_str.replace("Z", "+00:00")
    return datetime.fromisoformat(ts)


def _build_timeline(
    readings: List[Reading],
    events: List[Event],
    medications: List[MedicationEntry],
) -> List[TimelineEntry]:
    entries: List[TimelineEntry] = []

    for r in readings:
        entries.append(TimelineEntry(
            time=r.timestamp,
            type="glucose",
            value=r.value,
            detail=f"{r.source} reading",
        ))

    for e in events:
        entries.append(TimelineEntry(
            time=e.timestamp,
            type=e.type,
            detail=json.dumps(e.metadata) if e.metadata else "",
        ))

    for m in medications:
        entries.append(TimelineEntry(
            time="",
            type="medication",
            detail=f"{m.name} {m.dosage}",
        ))

    entries.sort(key=lambda x: x.time if x.time else "")
    return entries


def _compute_stats(
    readings: List[Reading],
    events: List[Event],
    medications: List[MedicationEntry],
) -> ClinicalStats:
    glucose_values = [r.value for r in readings]

    if glucose_values:
        avg_glucose = round(statistics.mean(glucose_values), 1)
        variance = (
            round(statistics.variance(glucose_values), 1)
            if len(glucose_values) > 1
            else 0.0
        )
        in_range = sum(1 for v in glucose_values if 70 <= v <= 180)
        time_in_range = round(in_range / len(glucose_values), 2)
        hypo_events = sum(1 for v in glucose_values if v < 70)
        hyper_events = sum(1 for v in glucose_values if v > 180)
    else:
        avg_glucose = 0.0
        variance = 0.0
        time_in_range = 0.0
        hypo_events = 0
        hyper_events = 0

    # Meal frequency
    meal_events = [e for e in events if e.type == "meal"]
    meal_frequency = 0.0
    if glucose_times := [_parse_ts(r.timestamp) for r in readings if r.timestamp]:
        if meal_events:
            try:
                meal_times = [_parse_ts(e.timestamp) for e in meal_events]
                span_days = max((max(glucose_times) - min(glucose_times)).days, 1)
                meal_frequency = round(len(meal_times) / span_days, 1)
            except (ValueError, TypeError):
                meal_frequency = 0.0

    # Adherence: data completeness (50%) + medication presence (50%)
    # 288 readings = full day of CGM (every 5 min)
    completeness = min(len(readings) / 288, 1.0)
    med_score = 1.0 if medications else 0.0
    adherence_score = round(completeness * 0.5 + med_score * 0.5, 2)

    return ClinicalStats(
        avg_glucose=avg_glucose,
        variance=variance,
        time_in_range=time_in_range,
        hypo_events=hypo_events,
        hyper_events=hyper_events,
        meal_frequency=meal_frequency,
        adherence_score=adherence_score,
    )


def _compute_risk(stats: ClinicalStats) -> RiskAssessment:
    total = stats.hyper_events + stats.hypo_events
    glucose_points = total if total > 0 else 1
    hyperglycemia = round(stats.hyper_events / glucose_points, 2)
    hypoglycemia = round(stats.hypo_events / glucose_points, 2)
    adherence = stats.adherence_score
    lifestyle = round(stats.time_in_range, 2)

    overall_score = (
        hyperglycemia * 0.3
        + hypoglycemia * 0.3
        + (1 - adherence) * 0.2
        + (1 - lifestyle) * 0.2
    )
    if overall_score < 0.3:
        overall = "low"
    elif overall_score < 0.6:
        overall = "medium"
    else:
        overall = "high"

    return RiskAssessment(
        hyperglycemia=hyperglycemia,
        hypoglycemia=hypoglycemia,
        adherence=adherence,
        lifestyle=lifestyle,
        overall=overall,
    )


def _generate_alerts(stats: ClinicalStats, risk: RiskAssessment) -> List[Alert]:
    alerts: List[Alert] = []
    if stats.hypo_events > 0:
        alerts.append(Alert(
            title="Hypoglycemic Events Detected",
            message=f"{stats.hypo_events} readings below 70 mg/dL",
            severity="high",
        ))
    if risk.hyperglycemia > 0.5:
        alerts.append(Alert(
            title="Frequent Hyperglycemia",
            message="More than 50% of readings are above 180 mg/dL",
            severity="high",
        ))
    if stats.time_in_range < 0.5:
        alerts.append(Alert(
            title="Low Time in Range",
            message=f"Time in range is {stats.time_in_range * 100:.0f}%, target is >=70%",
            severity="medium",
        ))
    if risk.overall == "high":
        alerts.append(Alert(
            title="High Overall Risk",
            message="Overall risk assessment is high. Consider clinical review.",
            severity="high",
        ))
    return alerts


def _build_summary(stats: ClinicalStats, risk: RiskAssessment) -> str:
    parts = [
        f"Over the analysis period, the patient's average glucose was {stats.avg_glucose} mg/dL "
        f"with a variance of {stats.variance}.",
        f"Time in range was {stats.time_in_range * 100:.0f}%.",
        f"{stats.hyper_events} hyperglycemic and {stats.hypo_events} hypoglycemic events were recorded.",
        f"Meal frequency: {stats.meal_frequency} meals per day.",
        f"Adherence score: {stats.adherence_score}.",
        f"Overall risk level: {risk.overall}.",
    ]
    return " ".join(parts)


# ===========================================================================
# Endpoints
# ===========================================================================

@app.get("/health", response_model=HealthResponse)
async def health():
    return HealthResponse(
        status="ok",
        diabetes_model=ModelHealth(
            loaded=rf_model is not None,
            error=None if rf_model is not None else "Model not loaded",
        ),
        readmission_model=ModelHealth(
            loaded=readmission_model is not None,
            error=None if readmission_model is not None else "Model not loaded",
        ),
    )


@app.post("/predict", response_model=PredictionResponse)
async def predict(patient: PatientFeatures):
    if rf_model is None:
        raise HTTPException(status_code=503, detail="Diabetes risk model not loaded")

    row = features_to_dataframe(patient)
    risk_score = float(rf_model.predict_proba(row)[0][1])

    return PredictionResponse(
        risk_score=round(risk_score, 4),
        risk_level=compute_risk_level(risk_score),
    )


@app.post("/batch-predict", response_model=BatchPredictionResponse)
async def batch_predict(request: BatchPredictionRequest):
    if rf_model is None:
        raise HTTPException(status_code=503, detail="Diabetes risk model not loaded")

    results = []
    for patient in request.patients:
        row = features_to_dataframe(patient)
        risk_score = float(rf_model.predict_proba(row)[0][1])
        results.append(PredictionResponse(
            risk_score=round(risk_score, 4),
            risk_level=compute_risk_level(risk_score),
        ))

    return BatchPredictionResponse(results=results, count=len(results))


@app.post("/readmission/predict", response_model=ReadmissionPredictionResponse)
async def readmission_predict(patient: ReadmissionPatientFeatures):
    if readmission_model is None:
        raise HTTPException(status_code=503, detail="Readmission model not loaded")

    row = patient.model_dump(exclude_none=True, exclude={"readmitted"})
    risk_score = predict_readmission_probability(readmission_model, row, readmission_feature_columns)
    return ReadmissionPredictionResponse(
        risk_score=round(risk_score, 4),
        risk_level=readmission_risk_level(risk_score),
    )


@app.post("/readmission/batch-predict", response_model=ReadmissionBatchPredictionResponse)
async def readmission_batch_predict(request: ReadmissionBatchPredictionRequest):
    if readmission_model is None:
        raise HTTPException(status_code=503, detail="Readmission model not loaded")

    results = []
    for patient in request.patients:
        row = patient.model_dump(exclude_none=True, exclude={"readmitted"})
        risk_score = predict_readmission_probability(readmission_model, row, readmission_feature_columns)
        results.append(ReadmissionPredictionResponse(
            risk_score=round(risk_score, 4),
            risk_level=readmission_risk_level(risk_score),
        ))

    return ReadmissionBatchPredictionResponse(results=results, count=len(results))


@app.post("/clinical-rules", response_model=ClinicalRulesResponse)
async def clinical_rules(request: ClinicalRulesRequest):
    timeline = _build_timeline(request.readings, request.events, request.medications)
    stats = _compute_stats(request.readings, request.events, request.medications)
    risk = _compute_risk(stats)
    alerts = _generate_alerts(stats, risk)
    summary = _build_summary(stats, risk)

    return ClinicalRulesResponse(
        timeline=timeline,
        stats=stats,
        risk_assessment=risk,
        alerts=alerts,
        timeline_summary=summary,
    )


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        reply = _call_mistral(request)
        return ChatResponse(reply=reply, model=request.model or MISTRAL_MODEL, source="mistral")
    except Exception as exc:
        logger.warning("Mistral call failed, using fallback: %s", exc)
        reply = _get_fallback_reply(request)
        return ChatResponse(reply=reply, model=request.model or MISTRAL_MODEL, source="fallback")


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("RISK_MODEL_PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)
