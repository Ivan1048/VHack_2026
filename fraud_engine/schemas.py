from pydantic import BaseModel
from typing import List

class TransactionInput(BaseModel):
    transaction_id: str
    amount: float
    time: str  # Expected format: "HH:MM"
    location: str
    device: str
    previous_transactions: int

class TransactionOutput(BaseModel):
    transaction_id: str
    risk_score: int
    decision: str
    reasons: List[str]