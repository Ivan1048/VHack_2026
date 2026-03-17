import { useState } from "react";
import { submitFeedback } from "../api";

export function TransactionTable({ transactions, onFeedback }) {
  const [feedbackState, setFeedbackState] = useState({});

  const handleFeedback = async (txn_id, label) => {
    try {
      const result = await submitFeedback(txn_id, label);
      setFeedbackState((prev) => ({ ...prev, [txn_id]: label }));
      if (onFeedback) onFeedback(result);
    } catch (err) {
      console.error("Feedback error:", err);
    }
  };

  return (
    <section className="card">
      <h2>Live Transaction Feed</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Txn ID</th>
              <th>Time</th>
              <th>User</th>
              <th>Amount</th>
              <th>Merchant</th>
              <th>IP Risk</th>
              <th>Risk Score</th>
              <th>Decision</th>
              <th>Reasons</th>
              <th>Analyst Action</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((txn) => {
              const txnId = txn.txn_id || txn.transaction?.txn_id;
              const userId = txn.masked_user_id || txn.user_id || txn.transaction?.user_id;
              const amount = txn.amount ?? txn.transaction?.amount ?? 0;
              const merchant = txn.merchant_category || txn.transaction?.merchant_category || "—";
              const timestamp = txn.timestamp || txn.transaction?.timestamp;
              const fb = feedbackState[txnId];

              return (
                <tr key={txnId} className={txn.fraud ? "row-fraud" : ""}>
                  <td className="mono">{txnId}</td>
                  <td>{timestamp ? new Date(timestamp).toLocaleTimeString() : "—"}</td>
                  <td className="mono">{userId}</td>
                  <td>MYR {Number(amount).toFixed(2)}</td>
                  <td>{merchant}</td>
                  <td><IpBadge level={txn.ip_risk} /></td>
                  <td>
                    <span className={`risk risk-${bucketClass(txn.risk_score)}`}>
                      {txn.risk_score}
                    </span>
                  </td>
                  <td><DecisionBadge decision={txn.decision} /></td>
                  <td className="reasons-cell">{(txn.reasons || []).join(" · ")}</td>
                  <td>
                    {txn.fraud && !fb && (
                      <div className="feedback-btns">
                        <button
                          className="btn-feedback btn-tp"
                          title="Confirm fraud (True Positive)"
                          onClick={() => handleFeedback(txnId, "true_positive")}
                        >✓ TP</button>
                        <button
                          className="btn-feedback btn-fp"
                          title="Mark as False Positive"
                          onClick={() => handleFeedback(txnId, "false_positive")}
                        >✗ FP</button>
                      </div>
                    )}
                    {fb && (
                      <span className={`feedback-label ${fb === "true_positive" ? "fb-tp" : "fb-fp"}`}>
                        {fb === "true_positive" ? "✓ Confirmed" : "✗ False Positive"}
                      </span>
                    )}
                    {!txn.fraud && <span className="feedback-label fb-ok">— Approved</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function bucketClass(score) {
  if (score < 40) return "low";
  if (score < 70) return "medium";
  return "high";
}

function DecisionBadge({ decision }) {
  const map = {
    approve: { cls: "badge-approve", label: "Approved" },
    otp:     { cls: "badge-otp",     label: "OTP Required" },
    block:   { cls: "badge-block",   label: "Blocked" },
    // Legacy labels from simulator
    Approved:        { cls: "badge-approve", label: "Approved" },
    "Requires Review": { cls: "badge-otp",  label: "OTP Required" },
    Declined:        { cls: "badge-block",   label: "Blocked" },
  };
  const { cls, label } = map[decision] || { cls: "badge-approve", label: decision };
  return <span className={`badge ${cls}`}>{label}</span>;
}

function IpBadge({ level }) {
  const map = {
    clean:       { cls: "ip-clean",       label: "Clean" },
    suspicious:  { cls: "ip-suspicious",  label: "Suspicious" },
    blacklisted: { cls: "ip-blacklisted", label: "Blacklisted" },
  };
  const { cls, label } = map[level] || { cls: "ip-clean", label: "—" };
  return <span className={`badge ${cls}`}>{label}</span>;
}
