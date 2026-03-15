# Module Interaction Flow

1. `transaction-simulator` generates a transaction payload and posts it to `POST /predict`.
2. `feature_engineering` computes behavior features from current transaction plus user history.
3. `model_service` predicts fraud probability and converts to a 0-100 risk score.
4. `decision` applies policy thresholds:
   - 0-39 -> approve
   - 40-69 -> otp
   - 70-100 -> block
5. `explainability` converts feature contributions into human-readable reasons.
6. `fraud-api` persists the transaction outcome in memory store (replaceable with DB).
7. `fraud-api` broadcasts the scored transaction to dashboard clients via WebSocket.
8. React dashboard refreshes summary cards/charts and appends the live feed row.

## Offline Training Loop

1. Historical transactions + labels are assembled into a training dataset.
2. Training script handles imbalance via `class_weight='balanced'` and evaluates PR-AUC.
3. Model artifact is versioned and saved to `backend/models/fraud_model.joblib`.
4. API loads artifact at startup; if unavailable, it falls back to a heuristic scorer.
