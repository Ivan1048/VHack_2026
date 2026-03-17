# FraudShield API Contracts (v2.0)

## POST `/predict`
Scores an incoming digital wallet transaction and returns risk, decision, explanations, and IP reputation.

**Request body:**

```json
{
  "txn_id": "txn-user-9-1002",
  "user_id": "user-9",
  "amount": 459.99,
  "currency": "MYR",
  "timestamp": "2026-03-08T16:21:00Z",
  "latitude": 1.3521,
  "longitude": 103.8198,
  "device_id": "device-fraud-882",
  "ip_address": "198.51.100.12",
  "merchant_category": "crypto",
  "channel": "wallet_app"
}
```

**Response body:**

```json
{
  "txn_id": "txn-user-9-1002",
  "masked_user_id": "us***-a3f1",
  "risk_score": 87,
  "fraud": true,
  "decision": "block",
  "reasons": [
    "IP address flagged by threat intelligence",
    "Merchant category is associated with elevated fraud risk",
    "Transaction amount is unusually high compared to your spending history"
  ],
  "feature_snapshot": {
    "amount": 459.99,
    "avg_spend": 61.2,
    "amount_ratio": 7.515,
    "txn_count_1h": 9,
    "txn_count_24h": 14,
    "is_new_device": 1,
    "distance_from_last_km": 128.2,
    "is_night_transaction": 0,
    "is_weekend": 1,
    "merchant_risk_score": 0.9
  },
  "ip_risk": "suspicious",
  "latency_ms": 42
}
```

---

## POST `/feedback`
Submit analyst feedback for a flagged transaction to trigger dynamic threshold adjustment.

**Request body:**

```json
{
  "txn_id": "txn-user-9-1002",
  "label": "false_positive"
}
```

**Response body:**

```json
{
  "status": "ok",
  "message": "Transaction txn-user-9-1002 marked as false_positive.",
  "new_thresholds": "{'otp': 41, 'block': 71}"
}
```

---

## GET `/dashboard/summary`
Returns aggregated statistics for dashboard cards and charts, including analyst precision metrics.

**Response body:**

```json
{
  "total_transactions": 1200,
  "total_flagged": 94,
  "fraud_rate_percent": 7.83,
  "decision_breakdown": {
    "approve": 1012,
    "otp": 112,
    "block": 76
  },
  "risk_buckets": {
    "0-39": 1012,
    "40-69": 112,
    "70-100": 76
  },
  "false_positive_count": 12,
  "true_positive_count": 45
}
```

---

## GET `/thresholds`
Returns the current dynamic decision thresholds.

**Response body:**

```json
{
  "otp": 40,
  "block": 70
}
```

---

## WS `/ws/transactions`
WebSocket endpoint that pushes each new scored transaction in JSON format for near real-time dashboard updates.
