from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from api.predict import router as predict_router
import os
import sys
import pandas as pd
import asyncio
import json

app = FastAPI(
    title="Real-Time Fraud Detection API",
    description="API for scoring financial transactions in real-time.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(predict_router, prefix="/api")

# Load prediction logic
from api.predict import predict_on_transaction

# Global state for dashboard
global_summary = {
    "total_transactions": 0,
    "total_flagged": 0,
    "fraud_rate_percent": 0.0,
    "risk_buckets": {
        "0-39": 0,
        "40-69": 0,
        "70-100": 0
    },
    "decision_breakdown": {
        "Approved": 0,
        "Declined": 0,
        "Requires Review": 0
    }
}
global_recent_transactions = []

@app.get("/dashboard/summary")
def get_summary():
    return global_summary

@app.get("/transactions/recent")
def get_recent(limit: int = 30):
    return global_recent_transactions[:limit]

# WebSocket manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(message))
            except:
                pass

manager = ConnectionManager()

# Background task to simulate streaming
async def simulate_streaming():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.join(current_dir, 'data', 'transactions.csv')
    if not os.path.exists(data_path):
        return
        
    df = pd.read_csv(data_path)
    
    # Process sequentially
    for _, row in df.iterrows():
        await asyncio.sleep(0.5) # Emulate incoming txns periodically
        
        tx_dict = row.to_dict()
        try:
            prediction = predict_on_transaction(tx_dict)
            
            # Format for frontend
            decision = "Declined" if prediction["is_fraud"] else ("Requires Review" if prediction["risk_score"] > 30 else "Approved")
            
            live_txn = {
                "txn_id": prediction["transaction_id"],
                "user_id": tx_dict.get("user_id", "Unknown"),
                "amount": tx_dict.get("transaction_amount", 0.0),
                "risk_score": prediction["risk_score"],
                "decision": decision,
                "fraud": prediction["is_fraud"],
                "reasons": []
            }
            if prediction["is_fraud"]:
                live_txn["reasons"].append("High Risk Score")
                
            # Update globals
            global global_summary, global_recent_transactions
            global_summary["total_transactions"] += 1
            if live_txn["fraud"]:
                global_summary["total_flagged"] += 1
            
            # buckets
            rs = live_txn["risk_score"]
            if rs < 40: global_summary["risk_buckets"]["0-39"] += 1
            elif rs < 70: global_summary["risk_buckets"]["40-69"] += 1
            else: global_summary["risk_buckets"]["70-100"] += 1
            
            # breakdown
            global_summary["decision_breakdown"][decision] += 1
            
            # fraud rate
            global_summary["fraud_rate_percent"] = round(100.0 * global_summary["total_flagged"] / global_summary["total_transactions"], 2)
            
            global_recent_transactions.insert(0, live_txn)
            if len(global_recent_transactions) > 50:
                global_recent_transactions.pop()
                
            await manager.broadcast(live_txn)
        except Exception as e:
            print("Error in simulation:", e)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(simulate_streaming())

@app.websocket("/ws/transactions")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

if __name__ == "__main__":
    current_dir = os.path.dirname(os.path.abspath(__file__))
    sys.path.append(current_dir)
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
