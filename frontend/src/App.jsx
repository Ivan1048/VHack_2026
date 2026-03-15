import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { createTransactionsSocket, getRecentTransactions, getSummary } from "./api";

const COLORS = ["#0f766e", "#f59e0b", "#b91c1c"];

export default function App() {
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let socket;

    async function bootstrap() {
      try {
        const [summaryData, txns] = await Promise.all([
          getSummary(),
          getRecentTransactions(30),
        ]);
        setSummary(summaryData);
        setTransactions(txns.reverse());
      } catch (err) {
        setError(err.message);
      }
    }

    bootstrap();

    socket = createTransactionsSocket((liveTxn) => {
      setTransactions((prev) => [liveTxn, ...prev].slice(0, 30));
      setSummary((prev) => {
        if (!prev) return prev;
        const next = { ...prev };
        next.total_transactions += 1;
        if (liveTxn.fraud) next.total_flagged += 1;
        next.decision_breakdown = {
          ...next.decision_breakdown,
          [liveTxn.decision]: (next.decision_breakdown[liveTxn.decision] || 0) + 1,
        };
        if (liveTxn.risk_score < 40) next.risk_buckets["0-39"] += 1;
        else if (liveTxn.risk_score < 70) next.risk_buckets["40-69"] += 1;
        else next.risk_buckets["70-100"] += 1;

        next.fraud_rate_percent = Number(
          ((next.total_flagged / next.total_transactions) * 100).toFixed(2)
        );

        return next;
      });
    });

    return () => socket?.close();
  }, []);

  const bucketData = useMemo(() => {
    if (!summary) return [];
    return Object.entries(summary.risk_buckets).map(([name, value], idx) => ({
      name,
      value,
      color: COLORS[idx],
    }));
  }, [summary]);

  const decisionData = useMemo(() => {
    if (!summary) return [];
    return Object.entries(summary.decision_breakdown).map(([name, value]) => ({
      name,
      value,
    }));
  }, [summary]);

  return (
    <div className="page">
      <header className="hero">
        <h1>Wallet Fraud Monitoring</h1>
        <p>Streaming transaction risk, alerts, and decisions in near real-time.</p>
      </header>

      {error && <p className="error">{error}</p>}

      <section className="stats-grid">
        <StatCard label="Total Transactions" value={summary?.total_transactions ?? 0} />
        <StatCard label="Flagged Fraud" value={summary?.total_flagged ?? 0} />
        <StatCard label="Fraud Rate" value={`${summary?.fraud_rate_percent ?? 0}%`} />
      </section>

      <section className="charts-grid">
        <article className="card">
          <h2>Risk Score Distribution</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={bucketData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value">
                {bucketData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </article>

        <article className="card">
          <h2>Decision Breakdown</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={decisionData} dataKey="value" nameKey="name" outerRadius={85}>
                {decisionData.map((entry, idx) => (
                  <Cell key={entry.name} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </article>
      </section>

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
    </div>
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

function bucketClass(score) {
  if (score < 40) return "low";
  if (score < 70) return "medium";
  return "high";
}
