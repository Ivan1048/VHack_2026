export function DashboardStats({ summary, thresholds }) {
  const fp = summary?.false_positive_count ?? 0;
  const tp = summary?.true_positive_count ?? 0;
  const reviewed = fp + tp;
  const precision = reviewed > 0 ? ((tp / reviewed) * 100).toFixed(1) : "—";

  return (
    <section className="stats-grid">
      <StatCard
        label="Total Transactions"
        value={summary?.total_transactions ?? 0}
        icon="💳"
      />
      <StatCard
        label="Flagged Fraud"
        value={summary?.total_flagged ?? 0}
        icon="🚨"
        highlight="danger"
      />
      <StatCard
        label="Fraud Rate"
        value={`${summary?.fraud_rate_percent ?? 0}%`}
        icon="📊"
        highlight={(summary?.fraud_rate_percent ?? 0) > 10 ? "danger" : "warn"}
      />
      <StatCard
        label="Analyst Precision"
        value={`${precision}%`}
        icon="🎯"
        subtitle={`${tp} TP / ${fp} FP reviewed`}
      />
      <StatCard
        label="OTP Threshold"
        value={thresholds?.otp ?? 40}
        icon="🔐"
        subtitle="Dynamic — adjusts on feedback"
      />
      <StatCard
        label="Block Threshold"
        value={thresholds?.block ?? 70}
        icon="🛑"
        subtitle="Dynamic — adjusts on feedback"
      />
    </section>
  );
}

function StatCard({ label, value, icon, subtitle, highlight }) {
  const cls = highlight === "danger"
    ? "card stat-card stat-danger"
    : highlight === "warn"
    ? "card stat-card stat-warn"
    : "card stat-card";

  return (
    <article className={cls}>
      <p className="stat-label">{icon && <span className="stat-icon">{icon}</span>} {label}</p>
      <h3 className="stat-value">{value}</h3>
      {subtitle && <p className="stat-subtitle">{subtitle}</p>}
    </article>
  );
}
