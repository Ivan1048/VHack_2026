from __future__ import annotations

from pathlib import Path
from typing import Any

import joblib
import numpy as np


class ModelService:
    def __init__(self, model_path: str = "models/fraud_model.joblib") -> None:
        self._model = None
        self._feature_order: list[str] = []
        path = Path(model_path)
        if path.exists():
            payload: dict[str, Any] = joblib.load(path)
            self._model = payload.get("model")
            self._feature_order = payload.get("feature_order", [])

    def _heuristic_probability(self, features: dict[str, float | int]) -> tuple[float, dict[str, float]]:
        contributions = {
            "amount_ratio": 0.35 if float(features["amount_ratio"]) > 3.0 else 0.0,
            "is_new_device": 0.2 if int(features["is_new_device"]) == 1 else 0.0,
            "distance_from_last_km": 0.2 if float(features["distance_from_last_km"]) > 50 else 0.0,
            "txn_count_1h": 0.15 if int(features["txn_count_1h"]) > 8 else 0.0,
            "is_night_transaction": 0.1 if int(features["is_night_transaction"]) == 1 else 0.0,
        }
        probability = min(sum(contributions.values()), 0.99)
        return probability, contributions

    def predict(self, features: dict[str, float | int]) -> tuple[float, dict[str, float]]:
        if self._model and self._feature_order:
            vector = np.array([[float(features[name]) for name in self._feature_order]])
            probability = float(self._model.predict_proba(vector)[0][1])

            # Lightweight model-agnostic attribution for demo purposes.
            contributions = {
                "amount_ratio": min(float(features["amount_ratio"]) / 10.0, 0.35),
                "is_new_device": 0.2 * int(features["is_new_device"]),
                "distance_from_last_km": min(float(features["distance_from_last_km"]) / 300.0, 0.2),
                "txn_count_1h": min(float(features["txn_count_1h"]) / 50.0, 0.15),
                "is_night_transaction": 0.1 * int(features["is_night_transaction"]),
            }
            return probability, contributions

        return self._heuristic_probability(features)
