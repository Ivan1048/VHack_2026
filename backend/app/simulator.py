from __future__ import annotations

import random
import time
from datetime import datetime, timedelta, timezone

import requests

API_URL = "http://localhost:8000/predict"

MCC = ["groceries", "rideshare", "food_delivery", "gaming", "utilities", "electronics"]
CITIES = {
    "sg": (1.3521, 103.8198),
    "jakarta": (-6.2088, 106.8456),
    "bangkok": (13.7563, 100.5018),
    "manila": (14.5995, 120.9842),
    "hanoi": (21.0278, 105.8342),
}


def _jitter(lat: float, lon: float) -> tuple[float, float]:
    return lat + random.uniform(-0.02, 0.02), lon + random.uniform(-0.02, 0.02)


def _build_transaction(user_id: str, idx: int, fraud_ratio: float) -> dict:
    is_fraud = random.random() < fraud_ratio
    city = random.choice(list(CITIES.keys()))
    base_lat, base_lon = CITIES[city]
    lat, lon = _jitter(base_lat, base_lon)

    amount = random.uniform(3, 120)
    device_id = f"device-{random.randint(1, 3)}"
    txn_time = datetime.now(timezone.utc)

    if is_fraud:
        amount = random.uniform(250, 2000)
        device_id = f"device-fraud-{random.randint(100, 999)}"
        lat, lon = _jitter(35.6762, 139.6503)
        txn_time = datetime.now(timezone.utc) - timedelta(hours=random.randint(0, 4))

    return {
        "txn_id": f"txn-{user_id}-{idx}",
        "user_id": user_id,
        "amount": round(amount, 2),
        "currency": "USD",
        "timestamp": txn_time.isoformat(),
        "latitude": lat,
        "longitude": lon,
        "device_id": device_id,
        "merchant_category": random.choice(MCC),
        "channel": "wallet_app",
    }


def run(total: int = 100, users: int = 10, fraud_ratio: float = 0.12, sleep_sec: float = 0.2) -> None:
    user_ids = [f"user-{idx}" for idx in range(1, users + 1)]

    for idx in range(total):
        payload = _build_transaction(random.choice(user_ids), idx, fraud_ratio)
        response = requests.post(API_URL, json=payload, timeout=3)
        print(f"[{idx+1}/{total}] {payload['txn_id']} => {response.status_code} {response.text[:120]}")
        time.sleep(sleep_sec)


if __name__ == "__main__":
    run()
