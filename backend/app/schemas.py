from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Inbound transaction payload
# ---------------------------------------------------------------------------

class TransactionIn(BaseModel):
    txn_id: str = Field(..., description="Unique transaction identifier")
    user_id: str = Field(..., description="Digital wallet user identifier")
    amount: float = Field(..., gt=0)
    currency: str = Field(default="MYR")
    timestamp: datetime
    latitude: float
    longitude: float
    device_id: str
    ip_address: str = Field(default="0.0.0.0", description="Client IP address for reputation check")
    merchant_category: str
    channel: str = Field(default="wallet_app")


# ---------------------------------------------------------------------------
# Prediction response
# ---------------------------------------------------------------------------

class PredictionResponse(BaseModel):
    txn_id: str
    masked_user_id: str = Field(..., description="Privacy-masked user identifier shown to frontend")
    risk_score: int = Field(..., ge=0, le=100)
    fraud: bool
    decision: Literal["approve", "otp", "block"]
    reasons: list[str]
    feature_snapshot: dict[str, float | int]
    ip_risk: str = Field(..., description="IP reputation level: clean | suspicious | blacklisted")
    latency_ms: int


# ---------------------------------------------------------------------------
# Stored transaction record
# ---------------------------------------------------------------------------

class TransactionRecord(BaseModel):
    transaction: TransactionIn
    masked_user_id: str
    risk_score: int
    fraud: bool
    decision: str
    reasons: list[str]
    ip_risk: str = "clean"
    feedback: Literal["pending", "true_positive", "false_positive"] = "pending"


# ---------------------------------------------------------------------------
# Dashboard summary
# ---------------------------------------------------------------------------

class DashboardSummary(BaseModel):
    total_transactions: int
    total_flagged: int
    fraud_rate_percent: float
    decision_breakdown: dict[str, int]
    risk_buckets: dict[str, int]
    false_positive_count: int = 0
    true_positive_count: int = 0


# ---------------------------------------------------------------------------
# Analyst feedback payload
# ---------------------------------------------------------------------------

class FeedbackIn(BaseModel):
    txn_id: str
    label: Literal["true_positive", "false_positive"]


# ---------------------------------------------------------------------------
# Training result
# ---------------------------------------------------------------------------

class TrainResult(BaseModel):
    status: str
    message: str
    metrics: dict[str, Any] = Field(default_factory=dict)
