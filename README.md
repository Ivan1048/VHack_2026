# VHack_2026

Real-Time Fraud Detection System for digital wallet transactions.

## Project Layout

```text
.
|-- backend/
|   |-- app/
|   |   |-- main.py
|   |   |-- schemas.py
|   |   |-- feature_engineering.py
|   |   |-- model_service.py
|   |   |-- decision.py
|   |   |-- explainability.py
|   |   `-- simulator.py
|   |-- requirements.txt
|   `-- train_model.py
|-- frontend/
|   |-- src/
|   |   |-- App.jsx
|   |   |-- api.js
|   |   |-- main.jsx
|   |   `-- styles.css
|   |-- package.json
|   `-- vite.config.js
`-- docs/
	|-- API_CONTRACTS.md
	`-- INTERACTION_FLOW.md
```

## Architecture Summary

Online flow:
1. Transaction arrives at `POST /predict`
2. Feature Engineering computes behavioral features
3. Model Service predicts fraud probability and risk score
4. Decision Module returns `approve`, `otp`, or `block`
5. Explainability Module builds human-readable reasons
6. Result is returned to API caller and streamed to dashboard via WebSocket

Offline flow:
1. Train with imbalanced data handling using `class_weight='balanced'`
2. Save model artifact to `backend/models/fraud_model.joblib`
3. API loads model on startup (falls back to heuristics if model not found)

## Quick Start

Backend:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python train_model.py
uvicorn app.main:app --reload --port 8000
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Simulator:

```bash
cd backend
source .venv/bin/activate
python -m app.simulator
```

## API Endpoints

- `POST /predict`: score transaction and return risk + reasons
- `GET /dashboard/summary`: totals, fraud rate, risk buckets
- `GET /transactions/recent?limit=30`: recent scored transactions
- `WS /ws/transactions`: live transaction event stream
- `GET /health`: health check

See `docs/API_CONTRACTS.md` for request/response examples.

## Decision Policy

- `0-39` risk score -> `approve`
- `40-69` risk score -> `otp`
- `70-100` risk score -> `block`

## Notes for Hackathon Judges

- Real-time scoring latency is surfaced via `latency_ms` in the API response.
- Explainable output includes user-facing reasons for each flagged transaction.
- Dashboard visualizes live feed, fraud alerts, and risk score distribution.