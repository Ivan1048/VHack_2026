import { useParams, Link } from "react-router-dom";
import { useMemo } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

export default function TransactionDetail({ transactions }) {
  const { id } = useParams();

  const txn = useMemo(
    () => transactions.find((t) => t.txn_id === id),
    [transactions, id]
  );

  if (!txn) {
    return (
      <div className="txn-detail-empty">
        <h2>Transaction Not Found</h2>
        <p>
          The transaction <code>{id}</code> is not in the current feed. It may
          have rotated out.
        </p>
        <Link to="/dashboard" className="btn btn-primary">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  /* Build radar data from feature contributions (simulated) */
  const radarData = useMemo(() => {
    const score = txn.risk_score || 0;
    const reasons = txn.reasons || [];
    return [
      {
        feature: "Amount",
        value: reasons.includes("Unusual transaction amount")
          ? Math.min(score * 1.2, 100) : Math.max(score * 0.3, 5),
      },
      {
        feature: "Device",
        value: reasons.includes("New device detected")
          ? Math.min(score * 1.1, 100) : Math.max(score * 0.2, 5),
      },
      {
        feature: "Location",
        value: reasons.includes("Location anomaly")
          ? Math.min(score * 1.0, 100) : Math.max(score * 0.25, 5),
      },
      {
        feature: "Velocity",
        value: reasons.includes("High transaction frequency")
          ? Math.min(score * 1.1, 100) : Math.max(score * 0.15, 5),
      },
      {
        feature: "Time",
        value: reasons.includes("Unusual transaction time")
          ? Math.min(score * 1.0, 100) : Math.max(score * 0.2, 5),
      },
      {
        feature: "Merchant",
        value: Math.max(score * 0.2, 5),
      },
    ];
  }, [txn]);

  const riskClass =
    txn.risk_score >= 70 ? "high" : txn.risk_score >= 40 ? "medium" : "low";

  return (
    <div className="txn-detail">
      {/* Back link */}
      <Link to="/dashboard" className="txn-detail-back">
        ← Back to Dashboard
      </Link>

      <header className="txn-detail-header">
        <div>
          <h1>Transaction {txn.txn_id}</h1>
          <p className="txn-detail-ts">
            {new Date(txn.timestamp).toLocaleString()}
          </p>
        </div>
        <div className={`txn-detail-badge risk-badge-${riskClass}`}>
          <span className="badge-score">{txn.risk_score}</span>
          <span className="badge-label">Risk Score</span>
        </div>
      </header>

      <div className="txn-detail-grid">
        {/* Left: Info */}
        <section className="card txn-info-card">
          <h2>Transaction Details</h2>
          <dl className="txn-dl">
            <dt>User ID</dt>
            <dd>
              <Link to={`/user-profile?user=${txn.user_id}`}>
                {txn.user_id}
              </Link>
            </dd>
            <dt>Amount</dt>
            <dd>${Number(txn.amount).toFixed(2)}</dd>
            <dt>Location</dt>
            <dd>{txn.location || "Online"}</dd>
            <dt>Device</dt>
            <dd>{txn.device_type || "Unknown"}</dd>
            <dt>Merchant</dt>
            <dd>{txn.merchant_category || "N/A"}</dd>
            <dt>Decision</dt>
            <dd>
              <span className={`decision-badge decision-${txn.decision?.toLowerCase().replace(/\s+/g, "-")}`}>
                {txn.decision}
              </span>
            </dd>
          </dl>
        </section>

        {/* Right: Radar */}
        <section className="card">
          <h2>Risk Factor Breakdown</h2>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="feature" tick={{ fontSize: 12 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Radar
                dataKey="value"
                stroke="#ef4444"
                fill="#ef4444"
                fillOpacity={0.25}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </section>
      </div>

      {/* Explainability section */}
      <section className="card txn-reasons-card">
        <h2>🔍 Why This Was{" "}
          {txn.decision === "Approved" ? "Approved" : "Flagged"}
        </h2>
        {txn.reasons && txn.reasons.length > 0 ? (
          <ul className="txn-reasons-list">
            {txn.reasons.map((r, i) => (
              <li key={i} className="reason-item">
                <span className="reason-dot" />
                {r}
              </li>
            ))}
          </ul>
        ) : (
          <p className="reason-none">
            ✅ Transaction behaviour matched the user's historical pattern. No
            anomalies detected.
          </p>
        )}
      </section>

      {/* Mock User Actions */}
      <section className="card txn-actions-card">
        <h2>Operator Actions</h2>
        <p>If this is a false positive or confirmed fraud, take action:</p>
        <div className="txn-actions-row">
          <button className="btn btn-primary" onClick={() => alert("Marked as legitimate (mock)")}>
            ✅ Confirm Legitimate
          </button>
          <button className="btn btn-danger" onClick={() => alert("Reported as fraud (mock)")}>
            🚨 Report as Fraud
          </button>
          <button className="btn btn-secondary" onClick={() => alert("Escalated for review (mock)")}>
            📋 Escalate for Review
          </button>
        </div>
      </section>
    </div>
  );
}
