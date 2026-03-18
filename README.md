# VHack 2026: Case Study 2 - Digital Trust (Transaction Fraud)

**Project Name:** FraudShield v2.0
**Track:** Case Study 2 – Digital Trust: Real-Time Fraud Shield for the Unbanked

## Overview

FraudShield is a real-time, AI-powered fraud detection system designed specifically for digital wallets in the ASEAN region. It addresses the critical challenge of protecting unbanked populations from sophisticated financial crimes while ensuring low friction for legitimate users.

### Key Features (v2.0 Upgrade)

- **Real-Time Streaming Architecture:** Built on FastAPI and WebSockets, ensuring sub-50ms latency for transaction scoring and instant dashboard updates.
- **Advanced Machine Learning Pipeline:** Utilises an optimized `XGBClassifier` trained on synthetically balanced data (using SMOTE) to detect anomalous behavioural patterns.
- **Contextual Enrichment:** Integrates a simulated Threat Intelligence module to evaluate IP reputation, adjusting risk scores dynamically.
- **Privacy-First Design:** Implements one-way hashing and masking for Personally Identifiable Information (PII) before data reaches the dashboard, ensuring compliance with data protection standards.
- **Dynamic Decision Thresholds:** Features a reinforcement feedback loop. Security analysts can review flagged transactions on the dashboard, and their feedback (True/False Positives) automatically nudges the decision thresholds (Approve/OTP/Block).
- **Explainable AI (XAI):** Translates complex feature contributions into human-readable explanations (e.g., "Transaction location is far from your previous activity"), building trust with both users and analysts.
- **Interactive Dashboard:** A React-based frontend featuring live transaction feeds, interactive risk distribution charts, and a geospatial fraud map covering the ASEAN region.

## Project Structure

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
|   |   |-- ip_reputation.py
|   |   |-- privacy.py
|   |   `-- simulator.py
|   |-- requirements.txt
|   `-- train_model.py
|-- frontend/
|   |-- src/
|   |   |-- App.jsx
|   |   |-- api.js
|   |   |-- main.jsx
|   |   |-- styles.css
|   |   `-- components/
|   |       |-- DashboardStats.jsx
|   |       |-- FraudMap.jsx
|   |       |-- TransactionSimulator.jsx
|   |       `-- TransactionTable.jsx
|   |-- package.json
|   `-- vite.config.js
`-- docs/
    |-- API_CONTRACTS.md
    `-- INTERACTION_FLOW.md
```

## Setup Instructions

### 1. Backend (Python 3.11+)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Train the model (generates synthetic data and saves the artifact)
python train_model.py

# Start the API server
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend (Node.js)

```bash
cd frontend
npm install
npm run dev
```

### 3. Simulation

You can generate live traffic using the built-in simulator on the frontend dashboard, or run the headless script:

```bash
cd backend
source .venv/bin/activate
python -m app.simulator
```

## Technical Alignment with Case Study

- **Low Latency:** Asynchronous FastAPI endpoints and optimized feature engineering ensure lightning-fast responses.
- **Handling Imbalanced Data:** The training pipeline explicitly uses SMOTE to balance the extreme rarity of fraud cases.
- **False Positive Control:** The analyst feedback loop dynamically adjusts thresholds, ensuring the system adapts to prevent blocking legitimate unbanked users.
- **Privacy-First:** User IDs are cryptographically masked before transmission to any monitoring interface.
