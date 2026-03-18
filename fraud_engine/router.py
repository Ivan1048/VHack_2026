from fastapi import APIRouter
from .schemas import TransactionInput, TransactionOutput
from .model import calculate_risk

router = APIRouter()

@router.post("/predict_transaction", response_model=TransactionOutput)
def predict_transaction(transaction: TransactionInput):
    score, reasons = calculate_risk(transaction)

    # Decision logic
    if score <= 30:
        decision = "APPROVE"
    elif 31 <= score <= 70:
        decision = "FLAG"
    else:
        decision = "BLOCK"

    return TransactionOutput(
        transaction_id=transaction.transaction_id,
        risk_score=score,
        decision=decision,
        reasons=reasons
    )