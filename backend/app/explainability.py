from __future__ import annotations

from collections.abc import Mapping


_REASON_MAP: dict[str, str] = {
    "amount_ratio": "Transaction amount is unusually high compared to your spending history",
    "is_new_device": "Payment initiated from an unrecognised device",
    "distance_from_last_km": "Transaction location is far from your previous activity",
    "txn_count_1h": "Unusually high number of transactions in the last hour",
    "txn_count_24h": "Unusually high number of transactions in the last 24 hours",
    "is_night_transaction": "Transaction occurred during unusual hours (midnight–6 AM)",
    "is_weekend": "Weekend transaction pattern detected",
    "merchant_risk_score": "Merchant category is associated with elevated fraud risk",
    "ip_risk": "IP address flagged by threat intelligence",
}


def build_reasons(
    contributions: Mapping[str, float],
    ip_risk: str = "clean",
    top_k: int = 3,
) -> list[str]:
    """
    Convert feature contributions and contextual signals into a prioritised
    list of human-readable explanations shown to the user and analyst.
    """
    # Combine model contributions with contextual signals
    all_signals: dict[str, float] = dict(contributions)
    if ip_risk in ("suspicious", "blacklisted"):
        all_signals["ip_risk"] = 0.4 if ip_risk == "blacklisted" else 0.2

    sorted_items = sorted(all_signals.items(), key=lambda item: item[1], reverse=True)
    reasons: list[str] = []

    for feature_name, value in sorted_items:
        if value <= 0:
            continue
        reason = _REASON_MAP.get(feature_name)
        if reason:
            reasons.append(reason)
        if len(reasons) >= top_k:
            break

    return reasons if reasons else ["Transaction behaviour aligns with your historical pattern"]
