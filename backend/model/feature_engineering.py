import pandas as pd
import numpy as np

def create_features(df):
    """
    Feature engineering for transaction data.
    Takes a DataFrame with raw transaction columns and returns a DataFrame with features for the model.
    """
    df = df.copy()
    
    # 1. Direct Numeric Features
    # amount is already numeric
    
    # 2. Time-based Features
    df['transaction_time'] = pd.to_datetime(df['transaction_time'])
    df['hour'] = df['transaction_time'].dt.hour
    df['day_of_week'] = df['transaction_time'].dt.dayofweek
    df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
    df['is_night'] = ((df['hour'] < 6)).astype(int) # Unusual time
    
    # 3. Frequency / Velocity Features (calculated per user)
    # Transactions in last 24h
    df = df.sort_values(by=['user_id', 'transaction_time'])
    # This is a simplified velocity feature for the hackathon (using a rolling count would be better but requires more setup)
    # We will just compute the time since last transaction
    df['time_since_last_tx'] = df.groupby('user_id')['transaction_time'].diff().dt.total_seconds().fillna(86400 * 30) # default to 30 days
    df['is_rapid_tx'] = (df['time_since_last_tx'] < 3600).astype(int) # less than 1 hour
    
    # 4. Amount-based Velocity
    # Moving average of amount per user
    df['user_avg_amount'] = df.groupby('user_id')['transaction_amount'].transform('mean')
    df['amount_ratio_to_avg'] = df['transaction_amount'] / (df['user_avg_amount'] + 1e-5)
    
    # 5. Categorical encodings (Frequency encoding for simplicity in a hackathon)
    merchant_freq = df['merchant_category'].value_counts(normalize=True)
    df['merchant_freq'] = df['merchant_category'].map(merchant_freq)
    
    location_freq = df['location'].value_counts(normalize=True)
    df['location_freq'] = df['location'].map(location_freq)
    
    # 6. Device novelty
    df['device_usage_count'] = df.groupby(['user_id', 'device_id'])['transaction_amount'].transform('count')
    df['is_new_device'] = (df['device_usage_count'] == 1).astype(int)
    
    features = [
        'transaction_amount', 
        'hour', 
        'day_of_week', 
        'is_weekend', 
        'is_night', 
        'time_since_last_tx',
        'is_rapid_tx',
        'user_avg_amount',
        'amount_ratio_to_avg',
        'merchant_freq',
        'location_freq',
        'is_new_device'
    ]
    
    return df.sort_index()[features]

def preprocess_for_inference(transaction_dict, user_history_summary):
    """
    Process a single transaction for inference.
    user_history_summary is a dict containing 'user_avg_amount', 'last_tx_time', etc.
    """
    df = pd.DataFrame([transaction_dict])
    df['transaction_time'] = pd.to_datetime(df['transaction_time'])
    df['hour'] = df['transaction_time'].dt.hour
    df['day_of_week'] = df['transaction_time'].dt.dayofweek
    df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
    df['is_night'] = ((df['hour'] < 6)).astype(int)
    
    last_tx = user_history_summary.get('last_tx_time')
    if last_tx is None:
        last_tx = df['transaction_time'] - pd.Timedelta(days=30)
    
    df['time_since_last_tx'] = (df['transaction_time'] - pd.to_datetime(last_tx)).dt.total_seconds()
    df['is_rapid_tx'] = (df['time_since_last_tx'] < 3600).astype(int)
    
    df['user_avg_amount'] = user_history_summary.get('user_avg_amount', 50.0)
    df['amount_ratio_to_avg'] = df['transaction_amount'] / (df['user_avg_amount'] + 1e-5)
    
    # In a real system, we'd lookup these frequencies from a cache/DB. 
    # For inference, use typical defaults if unknown.
    df['merchant_freq'] = user_history_summary.get('merchant_freq', 0.05) 
    df['location_freq'] = user_history_summary.get('location_freq', 0.05)
    df['is_new_device'] = int(df['device_id'].iloc[0] != user_history_summary.get('primary_device_id', ''))
    
    features = [
        'transaction_amount', 
        'hour', 
        'day_of_week', 
        'is_weekend', 
        'is_night', 
        'time_since_last_tx',
        'is_rapid_tx',
        'user_avg_amount',
        'amount_ratio_to_avg',
        'merchant_freq',
        'location_freq',
        'is_new_device'
    ]
    
    return df[features]
