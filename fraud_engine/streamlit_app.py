import streamlit as st
import requests

st.set_page_config(page_title="Live Fraud Decision Panel", layout="centered")
st.title("Live Fraud Decision Panel")

# Input fields
transaction_id = st.text_input("Transaction ID")
amount = st.number_input("Amount", min_value=0.0, step=1.0)
time = st.text_input("Time (HH:MM)", value="12:00")
location = st.text_input("Location")
device = st.selectbox("Device", ["mobile", "web"])
previous_transactions = st.number_input("Previous Transactions", min_value=0, step=1)

if st.button("Check Fraud"):
    # Basic validation
    if not transaction_id or not time or not location:
        st.warning("Please fill in all fields.")
    else:
        payload = {
            "transaction_id": transaction_id,
            "amount": amount,
            "time": time,
            "location": location,
            "device": device,
            "previous_transactions": int(previous_transactions),
        }
        try:
            response = requests.post(
                "http://127.0.0.1:8000/predict_transaction",
                json=payload,
                timeout=5
            )
            if response.status_code == 200:
                data = response.json()
                st.markdown(f"### Risk Score: **{data.get('risk_score', 'N/A')}**")
                decision = data.get("decision", "N/A")
                color = {"APPROVE": "green", "FLAG": "orange", "BLOCK": "red"}.get(decision, "gray")
                st.markdown(
                    f"<h2 style='color:{color};'>Decision: {decision}</h2>",
                    unsafe_allow_html=True,
                )
                reasons = data.get("reasons", [])
                if reasons:
                    st.markdown("#### Reasons:")
                    for reason in reasons:
                        st.markdown(f"- {reason}")
                else:
                    st.info("No reasons provided.")
            else:
                st.error(f"Error: {response.status_code} - {response.text}")
        except Exception as e:
            st.error(f"Request failed: {e}")