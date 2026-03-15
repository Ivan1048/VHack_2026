export function TransactionTable({ transactions }) {
  return (
    <section className="card">
      <h2>Live Transaction Feed</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Txn ID</th>
              <th>User</th>
              <th>Amount</th>
              <th>Risk</th>
              <th>Decision</th>
              <th>Reasons</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((txn) => (
              <tr key={txn.txn_id}>
                <td>{txn.txn_id}</td>
                <td>{txn.user_id}</td>
                <td>${Number(txn.amount).toFixed(2)}</td>
                <td>
                  <span className={`risk risk-${bucketClass(txn.risk_score)}`}>
                    {txn.risk_score}
                  </span>
                </td>
                <td>{txn.decision}</td>
                <td>{(txn.reasons || []).join(", ")}</td>
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
