from __future__ import annotations

from pathlib import Path

import joblib
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import average_precision_score, classification_report, roc_auc_score
from sklearn.model_selection import train_test_split

FEATURE_ORDER = [
    "amount",
    "avg_spend",
    "amount_ratio",
    "txn_count_1h",
    "is_new_device",
    "distance_from_last_km",
    "is_night_transaction",
]


def _build_synthetic_dataset(size: int = 5000, fraud_ratio: float = 0.08) -> tuple[np.ndarray, np.ndarray]:
    rng = np.random.default_rng(42)
    y = (rng.random(size) < fraud_ratio).astype(int)

    amount = rng.gamma(shape=2.0, scale=30.0, size=size)
    avg_spend = rng.gamma(shape=2.2, scale=25.0, size=size)
    amount_ratio = amount / np.clip(avg_spend, 1.0, None)
    txn_count_1h = rng.poisson(lam=2.2, size=size)
    is_new_device = rng.binomial(1, p=0.06, size=size)
    distance_from_last_km = np.abs(rng.normal(loc=8.0, scale=6.0, size=size))
    is_night_transaction = rng.binomial(1, p=0.2, size=size)

    fraud_idx = y == 1
    amount[fraud_idx] *= rng.uniform(2.0, 5.0, size=fraud_idx.sum())
    amount_ratio[fraud_idx] *= rng.uniform(1.5, 4.0, size=fraud_idx.sum())
    txn_count_1h[fraud_idx] += rng.integers(3, 12, size=fraud_idx.sum())
    is_new_device[fraud_idx] = rng.binomial(1, p=0.65, size=fraud_idx.sum())
    distance_from_last_km[fraud_idx] += rng.uniform(30.0, 200.0, size=fraud_idx.sum())
    is_night_transaction[fraud_idx] = rng.binomial(1, p=0.45, size=fraud_idx.sum())

    x = np.column_stack(
        [
            amount,
            avg_spend,
            amount_ratio,
            txn_count_1h,
            is_new_device,
            distance_from_last_km,
            is_night_transaction,
        ]
    )
    return x, y


def train_and_save(output_path: str = "models/fraud_model.joblib") -> None:
    x, y = _build_synthetic_dataset()
    x_train, x_test, y_train, y_test = train_test_split(x, y, test_size=0.25, stratify=y, random_state=42)

    model = LogisticRegression(max_iter=400, class_weight="balanced")
    model.fit(x_train, y_train)

    probs = model.predict_proba(x_test)[:, 1]
    preds = (probs >= 0.5).astype(int)

    metrics = {
        "roc_auc": float(roc_auc_score(y_test, probs)),
        "pr_auc": float(average_precision_score(y_test, probs)),
    }

    print("Metrics:", metrics)
    print(classification_report(y_test, preds, digits=4))

    target = Path(output_path)
    target.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump({"model": model, "feature_order": FEATURE_ORDER, "metrics": metrics}, target)
    print(f"Saved model artifact to {target}")


if __name__ == "__main__":
    train_and_save()
