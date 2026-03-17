from __future__ import annotations

import random
import time
from datetime import datetime, timedelta, timezone

import requests

API_URL = "http://localhost:8000/predict"

MCC = [
    "groceries", "rideshare", "food_delivery", "gaming",
    "utilities", "electronics", "subscription", "transfer",
    "jewelry", "crypto",
]

CITIES = {
    "kuala_lumpur": (3.1390, 101.6869),
    "singapore":    (1.3521, 103.8198),
    "jakarta":      (-6.2088, 106.8456),
    "bangkok":      (13.7563, 100.5018),
    "manila":       (14.5995, 120.9842),
    "hanoi":        (21.0278, 105.8342),
    "ho_chi_minh":  (10.8231, 106.6297),
}

# Simulated clean IP ranges for normal users
_CLEAN_IP_PREFIXES = ["172.16.", "192.168.", "10.0.", "10.1.", "10.2."]
# Simulated suspicious/blacklisted ranges
_RISKY_IP_PREFIXES = ["10.66.", "198.51.100.", "203.0.113."]


def _jitter(lat: float, lon: float, scale: float = 0.02) -> tuple[float, float]:
    return lat + random.uniform(-scale, scale), lon + random.uniform(-scale, scale)


def _random_ip(is_fraud: bool) -> str:
    if is_fraud and random.random() < 0.4:
        prefix = random.choice(_RISKY_IP_PREFIXES)
    else:
        prefix = random.choice(_CLEAN_IP_PREFIXES)
    return f"{prefix}{random.randint(1, 254)}.{random.randint(1, 254)}"


def _build_transaction(user_id: str, idx: int, fraud_ratio: float) -> dict:
    is_fraud = random.random() < fraud_ratio
    city = random.choice(list(CITIES.keys()))
    base_lat, base_lon = CITIES[city]
    lat, lon = _jitter(base_lat, base_lon)

    amount = random.uniform(5, 150)
    device_id = f"device-{random.randint(1, 4)}"
    txn_time = datetime.now(timezone.utc)
    merchant = random.choice(MCC[:6])  # Normal merchants

    if is_fraud:
        amount = random.uniform(300, 3000)
        device_id = f"device-fraud-{random.randint(100, 999)}"
        # Teleport to a distant city
        fraud_city = random.choice(["tokyo", "london", "new_york"])
        fraud_coords = {"tokyo": (35.6762, 139.6503), "london": (51.5074, -0.1278), "new_york": (40.7128, -74.0060)}
        base_lat, base_lon = fraud_coords[fraud_city]
        lat, lon = _jitter(base_lat, base_lon, scale=0.05)
        txn_time = datetime.now(timezone.utc) - timedelta(hours=random.randint(0, 5))
        merchant = random.choice(MCC[6:])  # High-risk merchants

    return {
        "txn_id": f"txn-{user_id}-{idx}",
        "user_id": user_id,
        "amount": round(amount, 2),
        "currency": "MYR",
        "timestamp": txn_time.isoformat(),
        "latitude": lat,
        "longitude": lon,
        "device_id": device_id,
        "ip_address": _random_ip(is_fraud),
        "merchant_category": merchant,
        "channel": "wallet_app",
    }


def run(total: int = 100, users: int = 10, fraud_ratio: float = 0.12, sleep_sec: float = 0.3) -> None:
    user_ids = [f"user-{i}" for i in range(1, users + 1)]
    print(f"Starting simulation: {total} transactions, {users} users, fraud_ratio={fraud_ratio}")
    for idx in range(total):
        payload = _build_transaction(random.choice(user_ids), idx, fraud_ratio)
        try:
            response = requests.post(API_URL, json=payload, timeout=5)
            print(f"[{idx+1:>3}/{total}] {payload['txn_id']} => {response.status_code} {response.text[:140]}")
        except requests.exceptions.ConnectionError:
            print(f"[{idx+1:>3}/{total}] Could not connect to {API_URL} – is the server running?")
        time.sleep(sleep_sec)


if __name__ == "__main__":
    run()
