import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, roc_auc_score, confusion_matrix
import joblib
import os
from feature_engineering import create_features

def train_model():
    print("Loading transaction data...")
    # Get current file directory
    current_dir = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.join(current_dir, '..', 'data', 'transactions.csv')
    
    if not os.path.exists(data_path):
        print(f"Data file not found at {data_path}")
        return
        
    df = pd.read_csv(data_path)
    
    print("Engineering features...")
    X = create_features(df)
    y = df['is_fraud']
    
    print("Splitting dataset...")
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    print("Training Random Forest Classifier...")
    # class_weight='balanced' handles the imbalanced 1-2% fraud ratio
    rf_model = RandomForestClassifier(n_estimators=100, class_weight='balanced', random_state=42, n_jobs=-1)
    rf_model.fit(X_train, y_train)
    
    print("Evaluating model...")
    y_pred = rf_model.predict(X_test)
    y_prob = rf_model.predict_proba(X_test)[:, 1]
    
    print("-" * 40)
    print("Classification Report:")
    print(classification_report(y_test, y_pred))
    print(f"ROC AUC Score: {roc_auc_score(y_test, y_prob):.4f}")
    
    print("Confusion Matrix:")
    print(confusion_matrix(y_test, y_pred))
    print("-" * 40)
    
    # Save the model
    model_path = os.path.join(current_dir, 'fraud_model.pkl')
    joblib.dump(rf_model, model_path)
    print(f"Model saved to {model_path}")

if __name__ == "__main__":
    train_model()
