def decide_action(risk_score: int) -> tuple[str, bool]:
    if risk_score >= 70:
        return "block", True
    if risk_score >= 40:
        return "otp", False
    return "approve", False
