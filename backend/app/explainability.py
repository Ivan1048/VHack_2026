from collections.abc import Mapping


_REASON_MAP = {
    "amount_ratio": "Unusual transaction amount",
    "is_new_device": "New device detected",
    "distance_from_last_km": "Location anomaly",
    "txn_count_1h": "High transaction frequency",
    "is_night_transaction": "Unusual transaction time",
}


def build_reasons(contributions: Mapping[str, float], top_k: int = 3) -> list[str]:
    sorted_items = sorted(contributions.items(), key=lambda item: item[1], reverse=True)
    reasons: list[str] = []

    for feature_name, value in sorted_items:
        if value <= 0:
            continue
        reason = _REASON_MAP.get(feature_name)
        if reason:
            reasons.append(reason)
        if len(reasons) >= top_k:
            break

    if not reasons:
        reasons = ["Behavior aligns with historical pattern"]

    return reasons
