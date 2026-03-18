import { Link } from "react-router-dom";

export function TransactionTable({ transactions }) {
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
              <th>Location</th>
              <th>Device</th>
              <th>Risk</th>
              <th>Decision</th>
              <th>Reasons</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((txn) => (
              <tr key={txn.txn_id}>
                <td>
                  <Link to={`/transaction/${txn.txn_id}`} className="detail-link">
                    {txn.txn_id}
                  </Link>
                </td>
                <td>{new Date(txn.timestamp).toLocaleTimeString()}</td>
                <td>
                  <Link to={`/user-profile?user=${txn.user_id}`} className="detail-link">
                    {txn.user_id}
                  </Link>
                </td>
                <td>${Number(txn.amount).toFixed(2)}</td>
                <td>{txn.merchant_category}</td>
                <td>{txn.location}</td>
                <td>{txn.device_type}</td>
                <td>
                  <span className={`risk risk-${bucketClass(txn.risk_score)}`}>
                    {txn.risk_score}
                  </span>
                </td>
                <td>{txn.decision}</td>
                <td>{(txn.reasons || []).join(", ")}</td>
                <td>
                  <Link to={`/transaction/${txn.txn_id}`} className="detail-link">
                    View →
                  </Link>
                </td>
              </tr>
            ))}
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
