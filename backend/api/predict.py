from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import joblib
import os
import sys

current_dir = os.path.dirname(os.path.abspath(__file__))
# Add model dir to path to import feature_engineering
model_dir = os.path.join(current_dir, '..', 'model')
sys.path.append(model_dir)

from feature_engineering import preprocess_for_inference

router = APIRouter()

class Transaction(BaseModel):
    transaction_id: str
    user_id: str
    transaction_amount: float
    transaction_time: str
    merchant_category: str
    location: str
    device_id: str

model_path = os.path.join(model_dir, 'fraud_model.pkl')
model = None

@router.on_event("startup")
def load_model():
    global model
    if os.path.exists(model_path):
        model = joblib.load(model_path)
        print("Model loaded successfully.")
    else:
        print(f"Warning: Model not found at {model_path}. Please train the model first.")

# Dummy user history - in a real app this would come from a database/cache
# We will use this to track real-time velocity
user_history_cache = {}

@router.post("/predict")
async def predict_fraud(transaction: Transaction):
    global model
    if model is None:
        raise HTTPException(status_code=503, detail="Model is not loaded or trained yet.")
        
    try:
        tx_dict = transaction.dict()
        user_id = tx_dict['user_id']
        
        # Get or init user history
        if user_id not in user_history_cache:
            user_history_cache[user_id] = {
                'user_avg_amount': tx_dict['transaction_amount'],
                'last_tx_time': None,
                'merchant_freq': 0.05,
                'location_freq': 0.05,
                'primary_device_id': tx_dict['device_id'],
                'tx_count': 0
            }
            
        history = user_history_cache[user_id]
        
        # Preprocess
        features_df = preprocess_for_inference(tx_dict, history)
        
        # Predict
        # model.predict_proba returns [[prob_normal, prob_fraud]]
        fraud_prob = model.predict_proba(features_df)[0][1]
        
        # Risk score 0-100
        risk_score = round(float(fraud_prob) * 100, 2)
        
        # Determine flag
        # We can set a threshold, e.g., > 50 is fraud
        is_fraud = bool(risk_score > 50)
        
        # Update history
        import pandas as pd_temp
        history['tx_count'] += 1
        history['last_tx_time'] = pd_temp.to_datetime(tx_dict['transaction_time'])
        # Simple moving average
        history['user_avg_amount'] = ((history['user_avg_amount'] * (history['tx_count'] - 1) + tx_dict['transaction_amount']) / history['tx_count'])
        
        return {
            "transaction_id": tx_dict['transaction_id'],
            "risk_score": risk_score,
            "is_fraud": is_fraud,
            "message": "Fraud detected!" if is_fraud else "Transaction approved."
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
