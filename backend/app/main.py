from __future__ import annotations

import asyncio
import time
from collections import deque
from datetime import datetime

from fastapi import FastAPI, HTTPException, WebSocket
from fastapi.middleware.cors import CORSMiddleware

from .decision import adjust_thresholds, decide_action, get_thresholds
from .explainability import build_reasons
from .feature_engineering import build_features
from .ip_reputation import get_ip_risk, ip_risk_to_score_delta
from .model_service import ModelService
from .privacy import mask_user_id
from .schemas import (
    DashboardSummary,
    FeedbackIn,
    PredictionResponse,
    TransactionIn,
    TransactionRecord,
)

# ---------------------------------------------------------------------------
# Application bootstrap
# ---------------------------------------------------------------------------

app = FastAPI(title="FraudShield API", version="2.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model_service = ModelService()

# In-memory stores (replace with Redis/PostgreSQL in production)
transaction_store: deque[TransactionRecord] = deque(maxlen=10_000)
user_history: dict[str, list[TransactionIn]] = {}
websocket_clients: set[WebSocket] = set()


# ---------------------------------------------------------------------------
# WebSocket broadcast helper
# ---------------------------------------------------------------------------

async def _broadcast_transaction(record: TransactionRecord) -> None:
    payload = {
        "txn_id": record.transaction.txn_id,
        "masked_user_id": record.masked_user_id,
        "amount": record.transaction.amount,
        "currency": record.transaction.currency,
        "risk_score": record.risk_score,
        "fraud": record.fraud,
        "decision": record.decision,
        "timestamp": record.transaction.timestamp.isoformat(),
        "reasons": record.reasons,
        "ip_risk": record.ip_risk,
        "merchant_category": record.transaction.merchant_category,
        "latitude": record.transaction.latitude,
        "longitude": record.transaction.longitude,
    }
    stale: list[WebSocket] = []
    for client in websocket_clients:
        try:
            await client.send_json(payload)
        except Exception:
            stale.append(client)
    for client in stale:
        websocket_clients.discard(client)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat(), "version": "2.0.0"}


@app.post("/predict", response_model=PredictionResponse)
async def predict(transaction: TransactionIn) -> PredictionResponse:
    start = time.perf_counter()

    # 1. Behavioural feature engineering
    history = user_history.get(transaction.user_id, [])
    features = build_features(transaction, history)

    # 2. ML model scoring
    probability, contributions = model_service.predict(features)
    risk_score = int(round(probability * 100))

    # 3. Contextual enrichment – IP reputation
    ip_risk = get_ip_risk(transaction.ip_address)
    risk_score = min(risk_score + ip_risk_to_score_delta(ip_risk), 100)

    # 4. Dynamic threshold decision
    decision, fraud = decide_action(risk_score)

    # 5. Explainability
    reasons = build_reasons(contributions, ip_risk=ip_risk)

    # 6. Privacy masking
    masked_uid = mask_user_id(transaction.user_id)

    # 7. Persist
    record = TransactionRecord(
        transaction=transaction,
        masked_user_id=masked_uid,
        risk_score=risk_score,
        fraud=fraud,
        decision=decision,
        reasons=reasons,
        ip_risk=ip_risk,
    )
    transaction_store.append(record)
    user_history.setdefault(transaction.user_id, []).append(transaction)

    # 8. Broadcast to dashboard clients
    asyncio.create_task(_broadcast_transaction(record))

    latency_ms = int((time.perf_counter() - start) * 1000)

    feature_snapshot = {
        key: round(float(value), 4) if isinstance(value, float) else int(value)
        for key, value in features.items()
    }

    return PredictionResponse(
        txn_id=transaction.txn_id,
        masked_user_id=masked_uid,
        risk_score=risk_score,
        fraud=fraud,
        decision=decision,
        reasons=reasons,
        feature_snapshot=feature_snapshot,
        ip_risk=ip_risk,
        latency_ms=latency_ms,
    )


@app.get("/transactions/recent", response_model=list[TransactionRecord])
def recent_transactions(limit: int = 100) -> list[TransactionRecord]:
    safe_limit = max(1, min(limit, 500))
    return list(transaction_store)[-safe_limit:]


@app.get("/dashboard/summary", response_model=DashboardSummary)
def dashboard_summary() -> DashboardSummary:
    records = list(transaction_store)
    total = len(records)
    flagged = sum(1 for r in records if r.fraud)

    decision_breakdown: dict[str, int] = {"approve": 0, "otp": 0, "block": 0}
    risk_buckets: dict[str, int] = {"0-39": 0, "40-69": 0, "70-100": 0}
    fp_count = tp_count = 0

    for r in records:
        decision_breakdown[r.decision] = decision_breakdown.get(r.decision, 0) + 1
        if r.risk_score < 40:
            risk_buckets["0-39"] += 1
        elif r.risk_score < 70:
            risk_buckets["40-69"] += 1
        else:
            risk_buckets["70-100"] += 1
        if r.feedback == "false_positive":
            fp_count += 1
        elif r.feedback == "true_positive":
            tp_count += 1

    fraud_rate = round((flagged / total) * 100, 2) if total else 0.0

    return DashboardSummary(
        total_transactions=total,
        total_flagged=flagged,
        fraud_rate_percent=fraud_rate,
        decision_breakdown=decision_breakdown,
        risk_buckets=risk_buckets,
        false_positive_count=fp_count,
        true_positive_count=tp_count,
    )


@app.post("/feedback")
def submit_feedback(feedback: FeedbackIn) -> dict[str, str]:
    """
    Analyst feedback endpoint.  Marks a transaction as a true or false
    positive and nudges the dynamic decision thresholds accordingly.
    """
    for record in transaction_store:
        if record.transaction.txn_id == feedback.txn_id:
            record.feedback = feedback.label  # type: ignore[assignment]
            adjust_thresholds(feedback.label)
            return {
                "status": "ok",
                "message": f"Transaction {feedback.txn_id} marked as {feedback.label}.",
                "new_thresholds": str(get_thresholds()),
            }
    raise HTTPException(status_code=404, detail=f"Transaction {feedback.txn_id} not found.")


@app.get("/thresholds")
def current_thresholds() -> dict[str, int]:
    """Expose the current dynamic decision thresholds for the dashboard."""
    return get_thresholds()


@app.websocket("/ws/transactions")
async def ws_transactions(websocket: WebSocket) -> None:
    await websocket.accept()
    websocket_clients.add(websocket)
    try:
        while True:
            await websocket.receive_text()
    except Exception:
        websocket_clients.discard(websocket)
