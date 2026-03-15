from __future__ import annotations

from datetime import datetime, timedelta
from math import asin, cos, radians, sin, sqrt

from .schemas import TransactionIn


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    d_lat = radians(lat2 - lat1)
    d_lon = radians(lon2 - lon1)
    a = sin(d_lat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(d_lon / 2) ** 2
    return 6371.0 * 2 * asin(sqrt(a))


def build_features(transaction: TransactionIn, user_history: list[TransactionIn]) -> dict[str, float | int]:
    if not user_history:
        return {
            "amount": transaction.amount,
            "avg_spend": transaction.amount,
            "amount_ratio": 1.0,
            "txn_count_1h": 1,
            "is_new_device": 1,
            "distance_from_last_km": 0.0,
            "is_night_transaction": int(transaction.timestamp.hour in {0, 1, 2, 3, 4, 5}),
        }

    avg_spend = sum(item.amount for item in user_history) / max(len(user_history), 1)
    amount_ratio = transaction.amount / max(avg_spend, 1.0)

    one_hour_ago = transaction.timestamp - timedelta(hours=1)
    txn_count_1h = sum(1 for item in user_history if item.timestamp >= one_hour_ago) + 1

    last_txn = max(user_history, key=lambda item: item.timestamp)
    distance_from_last_km = _haversine_km(
        transaction.latitude,
        transaction.longitude,
        last_txn.latitude,
        last_txn.longitude,
    )

    known_devices = {item.device_id for item in user_history}
    is_new_device = int(transaction.device_id not in known_devices)

    return {
        "amount": transaction.amount,
        "avg_spend": avg_spend,
        "amount_ratio": amount_ratio,
        "txn_count_1h": txn_count_1h,
        "is_new_device": is_new_device,
        "distance_from_last_km": distance_from_last_km,
        "is_night_transaction": int(transaction.timestamp.hour in {0, 1, 2, 3, 4, 5}),
    }
