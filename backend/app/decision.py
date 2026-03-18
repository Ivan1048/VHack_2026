from __future__ import annotations

# ---------------------------------------------------------------------------
# Dynamic Decision Thresholds
# ---------------------------------------------------------------------------
# These thresholds start at the defaults from the original design but are
# updated in real-time by the analyst feedback loop.  When analysts mark a
# flagged transaction as a false positive the OTP threshold is nudged upward
# (making the system less aggressive); when they confirm a true positive the
# block threshold is nudged downward (making the system more aggressive).

_thresholds: dict[str, int] = {
    "otp": 40,    # risk_score >= otp   -> require OTP challenge
    "block": 70,  # risk_score >= block -> block transaction outright
}

# Bounds to prevent runaway drift
_MIN_OTP = 25
_MAX_OTP = 60
_MIN_BLOCK = 50
_MAX_BLOCK = 90


def get_thresholds() -> dict[str, int]:
    return dict(_thresholds)


def adjust_thresholds(label: str) -> None:
    """
    Nudge thresholds based on analyst feedback.

    - 'false_positive': the system was too aggressive; relax thresholds by 1.
    - 'true_positive':  the system was correct; tighten thresholds by 1.
    """
    if label == "false_positive":
        _thresholds["otp"] = min(_thresholds["otp"] + 1, _MAX_OTP)
        _thresholds["block"] = min(_thresholds["block"] + 1, _MAX_BLOCK)
    elif label == "true_positive":
        _thresholds["otp"] = max(_thresholds["otp"] - 1, _MIN_OTP)
        _thresholds["block"] = max(_thresholds["block"] - 1, _MIN_BLOCK)


def decide_action(risk_score: int) -> tuple[str, bool]:
    """
    Map a 0-100 risk score to a decision and fraud flag using the current
    dynamic thresholds.

    Returns:
        (decision, fraud_flag)
        decision: 'approve' | 'otp' | 'block'
        fraud_flag: True only when the transaction is blocked
    """
    if risk_score >= _thresholds["block"]:
        return "block", True
    if risk_score >= _thresholds["otp"]:
        return "otp", False
    return "approve", False
