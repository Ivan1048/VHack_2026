from __future__ import annotations

from pathlib import Path
from typing import Any

import joblib
import numpy as np

from .feature_engineering import FEATURE_ORDER

# Optional SHAP import – gracefully degrade if not installed
try:
    import shap as _shap
    _SHAP_AVAILABLE = True
except ImportError:
    _SHAP_AVAILABLE = False


class ModelService:
    """
    Wraps the trained XGBoost fraud detection model and exposes a single
    ``predict`` method that returns both a fraud probability and per-feature
    contribution scores for explainability.

    Falls back to a deterministic heuristic scorer when no trained model
    artifact is found, so the API remains functional during development.
    """

    def __init__(self, model_path: str = "models/fraud_model.joblib") -> None:
        self._model = None
        self._explainer = None
        path = Path(model_path)
        if path.exists():
            payload: dict[str, Any] = joblib.load(path)
            self._model = payload.get("model")
            # Build a SHAP TreeExplainer once at startup for fast inference
            if _SHAP_AVAILABLE and self._model is not None:
                try:
                    self._explainer = _shap.TreeExplainer(self._model)
                except Exception:
                    self._explainer = None

    # ------------------------------------------------------------------
    # Public interface
    # ------------------------------------------------------------------

    def predict(self, features: dict[str, float | int]) -> tuple[float, dict[str, float]]:
        """
        Score a feature vector.

        Returns:
            probability  – fraud probability in [0, 1]
            contributions – per-feature importance scores (non-negative floats)
        """
        if self._model is not None:
            return self._model_predict(features)
        return self._heuristic_predict(features)

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _model_predict(self, features: dict[str, float | int]) -> tuple[float, dict[str, float]]:
        vector = np.array([[float(features.get(name, 0.0)) for name in FEATURE_ORDER]])
        probability = float(self._model.predict_proba(vector)[0][1])

        if self._explainer is not None:
            try:
                shap_values = self._explainer.shap_values(vector)
                # For binary classifiers shap_values may be a list [neg, pos]
                if isinstance(shap_values, list):
                    shap_row = shap_values[1][0]
                else:
                    shap_row = shap_values[0]
                contributions = {
                    name: max(float(val), 0.0)
                    for name, val in zip(FEATURE_ORDER, shap_row)
                }
                return probability, contributions
            except Exception:
                pass  # Fall through to manual attribution below

        # Lightweight manual attribution when SHAP is unavailable
        contributions = {
            "amount_ratio": min(float(features.get("amount_ratio", 1.0)) / 10.0, 0.35),
            "is_new_device": 0.2 * int(features.get("is_new_device", 0)),
            "distance_from_last_km": min(float(features.get("distance_from_last_km", 0.0)) / 300.0, 0.2),
            "txn_count_1h": min(float(features.get("txn_count_1h", 1)) / 50.0, 0.15),
            "txn_count_24h": min(float(features.get("txn_count_24h", 1)) / 100.0, 0.1),
            "is_night_transaction": 0.1 * int(features.get("is_night_transaction", 0)),
            "merchant_risk_score": float(features.get("merchant_risk_score", 0.3)) * 0.2,
        }
        return probability, contributions

    def _heuristic_predict(self, features: dict[str, float | int]) -> tuple[float, dict[str, float]]:
        """Rule-based fallback scorer used when no model artifact is present."""
        contributions = {
            "amount_ratio": 0.35 if float(features.get("amount_ratio", 1.0)) > 3.0 else 0.0,
            "is_new_device": 0.2 if int(features.get("is_new_device", 0)) == 1 else 0.0,
            "distance_from_last_km": 0.2 if float(features.get("distance_from_last_km", 0.0)) > 50 else 0.0,
            "txn_count_1h": 0.15 if int(features.get("txn_count_1h", 1)) > 8 else 0.0,
            "is_night_transaction": 0.1 if int(features.get("is_night_transaction", 0)) == 1 else 0.0,
            "merchant_risk_score": float(features.get("merchant_risk_score", 0.3)) * 0.2,
        }
        probability = min(sum(contributions.values()), 0.99)
        return probability, contributions
