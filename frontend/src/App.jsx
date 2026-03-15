import { useEffect, useMemo, useState, useCallback } from "react";
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

import { DashboardStats } from "./components/DashboardStats";
import { TransactionTable } from "./components/TransactionTable";
import { TransactionSimulator } from "./components/TransactionSimulator";

const COLORS = ["#0f766e", "#f59e0b", "#b91c1c"];

export default function App() {
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState("");

  const processNewTransaction = useCallback((liveTxn) => {
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
  }, []);

  useEffect(() => {
    let socket;

    async function bootstrap() {
      try {
        const [summaryData, txns] = await Promise.all([
          getSummary(),
          getRecentTransactions(30),
        ]);
        setSummary(summaryData);
        
        const formattedTxns = txns.map(t => {
          if (t.transaction) {
            return {
              ...t,
              txn_id: t.transaction.txn_id,
              user_id: t.transaction.user_id,
              amount: t.transaction.amount,
            };
          }
          return t;
        });
        
        setTransactions(formattedTxns.reverse());
      } catch (err) {
        setError(err.message);
      }
    }

    bootstrap();

    socket = createTransactionsSocket(processNewTransaction);

    return () => socket?.close();
  }, [processNewTransaction]);

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

      <DashboardStats summary={summary} />

      <section className="charts-grid dashboard-top-layout">
        <TransactionSimulator onSimulate={processNewTransaction} />

        <article className="card">
          <h2>Risk Score Distribution</h2>
          <ResponsiveContainer width="100%" height={200}>
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
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={decisionData} dataKey="value" nameKey="name" outerRadius={70}>
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

      <TransactionTable transactions={transactions} />
    </div>
  );
}

