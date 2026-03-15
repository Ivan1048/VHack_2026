export function DashboardStats({ summary }) {
  return (
    <section className="stats-grid">
      <StatCard label="Total Transactions" value={summary?.total_transactions ?? 0} />
      <StatCard label="Flagged Fraud" value={summary?.total_flagged ?? 0} />
      <StatCard label="Fraud Rate" value={`${summary?.fraud_rate_percent ?? 0}%`} />
    </section>
  );
}

function StatCard({ label, value }) {
  return (
    <article className="card stat-card">
      <p>{label}</p>
      <h3>{value}</h3>
    </article>
  );
}
