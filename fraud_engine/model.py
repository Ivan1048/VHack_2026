import random
from .schemas import TransactionInput

def calculate_risk(transaction: TransactionInput):
    score = 0
    reasons = []

    # Rule: High amount
    if transaction.amount > 200:
        score += 30
        reasons.append("High amount")

    # Rule: Late night transaction (22:00–04:00)
    hour = int(transaction.time.split(":")[0])
    if hour >= 22 or hour < 4:
        score += 25
        reasons.append("Late night transaction")

    # Rule: Low transaction history
    if transaction.previous_transactions < 3:
        score += 20
        reasons.append("Low transaction history")

    # Rule: Mobile device
    if transaction.device.lower() == "mobile":
        score += 10
        reasons.append("Mobile device")

    # Add random noise (0–10)
    noise = random.randint(0, 10)
    score += noise

    return score, reasons