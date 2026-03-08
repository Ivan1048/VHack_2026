# API Contracts

## POST /predict
Scores an incoming digital wallet transaction and returns risk, decision, and explanations.

Request body:

```json
{
  "txn_id": "txn-user-9-1002",
  "user_id": "user-9",
  "amount": 459.99,
  "currency": "USD",
  "timestamp": "2026-03-08T16:21:00Z",
  "latitude": 1.3521,
  "longitude": 103.8198,
  "device_id": "device-fraud-882",
  "merchant_category": "electronics",
  "channel": "wallet_app"
}
```

Response body:

```json
{
  "txn_id": "txn-user-9-1002",
  "risk_score": 87,
  "fraud": true,
  "decision": "block",
  "reasons": [
    "Unusual transaction amount",
    "New device detected",
    "Location anomaly"
  ],
  "feature_snapshot": {
    "amount": 459.99,
    "avg_spend": 61.2,
    "amount_ratio": 7.515,
    "txn_count_1h": 9,
    "is_new_device": 1,
    "distance_from_last_km": 128.2,
    "is_night_transaction": 0
  },
  "latency_ms": 42
}
```

## GET /dashboard/summary
Returns aggregated statistics for dashboard cards and charts.

Response body:

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
  }
}
```

## GET /transactions/recent?limit=30
Returns recent scored transactions for the live feed table.

## WS /ws/transactions
WebSocket endpoint that pushes each new scored transaction in JSON format for near real-time dashboard updates.
