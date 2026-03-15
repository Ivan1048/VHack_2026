from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class TransactionIn(BaseModel):
    txn_id: str = Field(..., description="Unique transaction identifier")
    user_id: str = Field(..., description="Digital wallet user identifier")
    amount: float = Field(..., gt=0)
    currency: str = Field(default="USD")
    timestamp: datetime
    latitude: float
    longitude: float
    device_id: str
    merchant_category: str
    channel: str = Field(default="wallet_app")


class PredictionResponse(BaseModel):
    txn_id: str
    risk_score: int = Field(..., ge=0, le=100)
    fraud: bool
    decision: str
    reasons: list[str]
    feature_snapshot: dict[str, float | int]
    latency_ms: int


class TransactionRecord(BaseModel):
    transaction: TransactionIn
    risk_score: int
    fraud: bool
    decision: str
    reasons: list[str]


class DashboardSummary(BaseModel):
    total_transactions: int
    total_flagged: int
    fraud_rate_percent: float
    decision_breakdown: dict[str, int]
    risk_buckets: dict[str, int]


class TrainResult(BaseModel):
    status: str
    message: str
    metrics: dict[str, Any] = Field(default_factory=dict)
