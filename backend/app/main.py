from __future__ import annotations

import asyncio
import time
from collections import deque
from datetime import datetime

from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware

from .decision import decide_action
from .explainability import build_reasons
from .feature_engineering import build_features
from .model_service import ModelService
from .schemas import DashboardSummary, PredictionResponse, TransactionIn, TransactionRecord
from fraud_engine.router import router as fraud_router

app = FastAPI(title="Fraud Detection API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(fraud_router)

model_service = ModelService()
transaction_store: deque[TransactionRecord] = deque(maxlen=10000)
user_history: dict[str, list[TransactionIn]] = {}
websocket_clients: set[WebSocket] = set()


async def _broadcast_transaction(record: TransactionRecord) -> None:
    payload = {
        "txn_id": record.transaction.txn_id,
        "user_id": record.transaction.user_id,
        "amount": record.transaction.amount,
        "risk_score": record.risk_score,
        "fraud": record.fraud,
        "decision": record.decision,
        "timestamp": record.transaction.timestamp.isoformat(),
        "reasons": record.reasons,
    }
    stale_clients: list[WebSocket] = []
    for client in websocket_clients:
        try:
            await client.send_json(payload)
        except Exception:
            stale_clients.append(client)
    for client in stale_clients:
        websocket_clients.discard(client)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}


@app.post("/predict", response_model=PredictionResponse)
async def predict(transaction: TransactionIn) -> PredictionResponse:
    start = time.perf_counter()

    history = user_history.get(transaction.user_id, [])
    features = build_features(transaction, history)
    probability, contributions = model_service.predict(features)

    risk_score = int(round(probability * 100))
    decision, fraud = decide_action(risk_score)
    reasons = build_reasons(contributions)

    record = TransactionRecord(
        transaction=transaction,
        risk_score=risk_score,
        fraud=fraud,
        decision=decision,
        reasons=reasons,
    )

    transaction_store.append(record)
    user_history.setdefault(transaction.user_id, []).append(transaction)

    asyncio.create_task(_broadcast_transaction(record))

    latency_ms = int((time.perf_counter() - start) * 1000)

    feature_snapshot = {
        key: round(float(value), 4) if isinstance(value, float) else int(value)
        for key, value in features.items()
    }

    return PredictionResponse(
        txn_id=transaction.txn_id,
        risk_score=risk_score,
        fraud=fraud,
        decision=decision,
        reasons=reasons,
        feature_snapshot=feature_snapshot,
        latency_ms=latency_ms,
    )


@app.get("/transactions/recent", response_model=list[TransactionRecord])
def recent_transactions(limit: int = 100) -> list[TransactionRecord]:
    return list(transaction_store)[-max(1, min(limit, 500)) :]


@app.get("/dashboard/summary", response_model=DashboardSummary)
def dashboard_summary() -> DashboardSummary:
    records = list(transaction_store)
    total = len(records)
    flagged = sum(1 for record in records if record.fraud)

    decision_breakdown = {"approve": 0, "otp": 0, "block": 0}
    risk_buckets = {"0-39": 0, "40-69": 0, "70-100": 0}

    for record in records:
        decision_breakdown[record.decision] = decision_breakdown.get(record.decision, 0) + 1
        if record.risk_score < 40:
            risk_buckets["0-39"] += 1
        elif record.risk_score < 70:
            risk_buckets["40-69"] += 1
        else:
            risk_buckets["70-100"] += 1

    fraud_rate = round((flagged / total) * 100, 2) if total else 0.0

    return DashboardSummary(
        total_transactions=total,
        total_flagged=flagged,
        fraud_rate_percent=fraud_rate,
        decision_breakdown=decision_breakdown,
        risk_buckets=risk_buckets,
    )


@app.websocket("/ws/transactions")
async def ws_transactions(websocket: WebSocket) -> None:
    await websocket.accept()
    websocket_clients.add(websocket)
    try:
        while True:
            await websocket.receive_text()
    except Exception:
        websocket_clients.discard(websocket)
