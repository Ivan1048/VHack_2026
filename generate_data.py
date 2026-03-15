import csv
import random
from datetime import datetime, timedelta
import os

random.seed(42)

NUM_ROWS = 50000
FRAUD_RATIO = 0.015
NUM_FRAUD = int(NUM_ROWS * FRAUD_RATIO)
NUM_NORMAL = NUM_ROWS - NUM_FRAUD
NUM_USERS = 5000

user_ids = [f"U{str(i).zfill(5)}" for i in range(1, NUM_USERS + 1)]

normal_merchants = ['Groceries', 'Dining', 'Retail', 'Transportation', 'Entertainment', 'Subscription', 'Utilities']
fraud_merchants = ['Electronics', 'Jewelry', 'Crypto', 'Luxury Goods', 'Transfer']

def generate_normal_amount():
    amt = random.expovariate(1/50) + 10 # mean ~60
    return round(min(amt, 900), 2)

def generate_transaction_data():
    data = []
    
    # Generate Normal Transactions
    for _ in range(NUM_NORMAL):
        user = random.choice(user_ids)
        amount = generate_normal_amount()
        
        days_ago = random.randint(0, 30)
        hour = random.choice(range(6, 24))
        minute = random.randint(0, 59)
        timestamp = datetime.now() - timedelta(days=days_ago, hours=24-hour, minutes=minute)
        
        merchant = random.choice(normal_merchants)
        location = random.choice(['New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX', 'Phoenix, AZ'])
        device = f"DEV_{user}_1"
        
        data.append({'user_id': user, 'amount': amount, 'time': timestamp, 'merchant': merchant, 'location': location, 'device': device, 'is_fraud': 0})
        
    # Generate Fraud Transactions
    for _ in range(NUM_FRAUD):
        user = random.choice(user_ids)
        
        # Fraud pattern 1: Unusually large transactions
        amount = round(random.uniform(1000, 5000), 2)
        
        # Fraud pattern 2: Unusual times (e.g. 1 AM - 5 AM)
        days_ago = random.randint(0, 30)
        hour = random.randint(0, 5)
        minute = random.randint(0, 59)
        timestamp = datetime.now() - timedelta(days=days_ago, hours=24-hour, minutes=minute)
        
        # Fraud pattern 3: Rare/high-value merchants
        merchant = random.choice(fraud_merchants)
        
        # Fraud pattern 4: Sudden location change
        location = random.choice(['Miami, FL', 'Seattle, WA', 'International_Unknown'])
        
        # Fraud pattern 5: New device usage
        device = f"DEV_UNKNOWN_{random.randint(1000, 9999)}"
        
        data.append({'user_id': user, 'amount': amount, 'time': timestamp, 'merchant': merchant, 'location': location, 'device': device, 'is_fraud': 1})
        
    # Shuffle data
    random.shuffle(data)
    
    # Assign Tx ID and prepare rows
    rows = []
    for i, row in enumerate(data, 1):
        tx_id = f"TXN{str(i).zfill(6)}"
        rows.append([
            tx_id, 
            row['user_id'], 
            row['amount'], 
            row['time'].strftime("%Y-%m-%d %H:%M:%S"), 
            row['merchant'], 
            row['location'], 
            row['device'], 
            row['is_fraud']
        ])
        
    return rows

if __name__ == "__main__":
    print("Generating dataset without external dependencies...")
    rows = generate_transaction_data()
    
    output_dir = r"c:\USM\VHACK_2026\VHack_2026\fraud-detection-system\backend\data"
    os.makedirs(output_dir, exist_ok=True)
    
    output_file = os.path.join(output_dir, "transactions.csv")
    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['transaction_id', 'user_id', 'transaction_amount', 'transaction_time', 'merchant_category', 'location', 'device_id', 'is_fraud'])
        writer.writerows(rows)
        
    fraud_count = sum(1 for r in rows if r[8] == 1)
    
    print(f"Dataset saved to {output_file}")
    print(f"Total rows: {len(rows)}")
    print(f"Fraud ratio: {(fraud_count / len(rows)) * 100:.2f}%")
