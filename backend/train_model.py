from __future__ import annotations

from pathlib import Path

import joblib
import numpy as np
from imblearn.over_sampling import SMOTE
from sklearn.metrics import average_precision_score, classification_report, roc_auc_score
from sklearn.model_selection import train_test_split
from xgboost import XGBClassifier

# Must stay in sync with FEATURE_ORDER in app/feature_engineering.py
FEATURE_ORDER = [
    "amount",
    "avg_spend",
    "amount_ratio",
    "txn_count_1h",
    "txn_count_24h",
    "is_new_device",
    "distance_from_last_km",
    "is_night_transaction",
    "is_weekend",
    "merchant_risk_score",
]


def _build_synthetic_dataset(
    size: int = 8_000,
    fraud_ratio: float = 0.08,
) -> tuple[np.ndarray, np.ndarray]:
    """
    Generate a synthetic labelled dataset that mimics realistic ASEAN digital
    wallet transaction patterns.  Fraud samples are injected with exaggerated
    feature values to give the model a meaningful signal to learn from.
    """
    rng = np.random.default_rng(42)
    y = (rng.random(size) < fraud_ratio).astype(int)

    # --- Normal transaction distributions ---
    amount = rng.gamma(shape=2.0, scale=30.0, size=size)          # MYR 0–300 typical
    avg_spend = rng.gamma(shape=2.2, scale=25.0, size=size)
    amount_ratio = amount / np.clip(avg_spend, 1.0, None)
    txn_count_1h = rng.poisson(lam=2.0, size=size)
    txn_count_24h = rng.poisson(lam=8.0, size=size)
    is_new_device = rng.binomial(1, p=0.05, size=size)
    distance_from_last_km = np.abs(rng.normal(loc=5.0, scale=4.0, size=size))
    is_night_transaction = rng.binomial(1, p=0.15, size=size)
    is_weekend = rng.binomial(1, p=0.28, size=size)
    merchant_risk_score = rng.choice(
        [0.05, 0.1, 0.15, 0.3, 0.5, 0.75, 0.85, 0.9],
        p=[0.20, 0.20, 0.15, 0.15, 0.10, 0.10, 0.05, 0.05],
        size=size,
    )

    # --- Inject fraud signal ---
    fi = y == 1
    n_fraud = fi.sum()
    amount[fi] *= rng.uniform(2.5, 6.0, size=n_fraud)
    amount_ratio[fi] *= rng.uniform(2.0, 5.0, size=n_fraud)
    txn_count_1h[fi] += rng.integers(4, 15, size=n_fraud)
    txn_count_24h[fi] += rng.integers(10, 40, size=n_fraud)
    is_new_device[fi] = rng.binomial(1, p=0.75, size=n_fraud)
    distance_from_last_km[fi] += rng.uniform(40.0, 250.0, size=n_fraud)
    is_night_transaction[fi] = rng.binomial(1, p=0.55, size=n_fraud)
    merchant_risk_score[fi] = rng.choice(
        [0.75, 0.85, 0.9], p=[0.3, 0.4, 0.3], size=n_fraud
    )

    X = np.column_stack([
        amount, avg_spend, amount_ratio,
        txn_count_1h, txn_count_24h,
        is_new_device, distance_from_last_km,
        is_night_transaction, is_weekend,
        merchant_risk_score,
    ])
    return X, y


def train_and_save(output_path: str = "models/fraud_model.joblib") -> None:
    print("Building synthetic training dataset …")
    X, y = _build_synthetic_dataset()
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, stratify=y, random_state=42
    )

    # --- Handle class imbalance with SMOTE ---
    print(f"Pre-SMOTE  – train size: {X_train.shape[0]}, fraud: {y_train.sum()}")
    smote = SMOTE(random_state=42)
    X_train_res, y_train_res = smote.fit_resample(X_train, y_train)
    print(f"Post-SMOTE – train size: {X_train_res.shape[0]}, fraud: {y_train_res.sum()}")

    # --- Train XGBoost (recommended by case study) ---
    model = XGBClassifier(
        n_estimators=200,
        max_depth=5,
        learning_rate=0.08,
        subsample=0.8,
        colsample_bytree=0.8,
        eval_metric="logloss",
        random_state=42,
        use_label_encoder=False,
    )
    model.fit(X_train_res, y_train_res)

    # --- Evaluate ---
    probs = model.predict_proba(X_test)[:, 1]
    preds = (probs >= 0.5).astype(int)

    metrics = {
        "roc_auc": float(roc_auc_score(y_test, probs)),
        "pr_auc": float(average_precision_score(y_test, probs)),
    }
    print("\nModel Metrics:", metrics)
    print(classification_report(y_test, preds, digits=4))

    # --- Persist ---
    target = Path(output_path)
    target.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(
        {"model": model, "feature_order": FEATURE_ORDER, "metrics": metrics},
        target,
    )
    print(f"\nModel artifact saved to: {target}")


if __name__ == "__main__":
    train_and_save()
