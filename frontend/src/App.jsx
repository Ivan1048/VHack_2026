import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  createTransactionsSocket,
  getRecentTransactions,
  getSummary,
  getThresholds,
} from "./api";

import { DashboardStats } from "./components/DashboardStats";
import { TransactionTable } from "./components/TransactionTable";
import { TransactionSimulator } from "./components/TransactionSimulator";
import FraudMap from "./components/FraudMap";

const RISK_COLORS  = ["#16a34a", "#d97706", "#dc2626"];
const DECISION_COLORS = { approve: "#16a34a", otp: "#d97706", block: "#dc2626" };

// Normalise a record coming from either the REST endpoint or the WebSocket
function normalise(raw) {
  if (raw.transaction) {
    return {
      txn_id:           raw.transaction.txn_id,
      masked_user_id:   raw.masked_user_id || raw.transaction.user_id,
      amount:           raw.transaction.amount,
      currency:         raw.transaction.currency || "MYR",
      merchant_category: raw.transaction.merchant_category,
      timestamp:        raw.transaction.timestamp,
      latitude:         raw.transaction.latitude,
      longitude:        raw.transaction.longitude,
      location_coords:  { lat: raw.transaction.latitude, lng: raw.transaction.longitude },
      risk_score:       raw.risk_score,
      fraud:            raw.fraud,
      decision:         raw.decision,
      reasons:          raw.reasons || [],
      ip_risk:          raw.ip_risk || "clean",
    };
  }
  return {
    ...raw,
    location_coords: raw.location_coords || { lat: raw.latitude, lng: raw.longitude },
  };
}

export default function App() {
  const [summary, setSummary]           = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [thresholds, setThresholds]     = useState({ otp: 40, block: 70 });
  const [error, setError]               = useState("");

  // Refresh thresholds after analyst feedback
  const refreshThresholds = useCallback(async () => {
    try {
      const t = await getThresholds();
      setThresholds(t);
    } catch (_) {}
  }, []);

  const processNewTransaction = useCallback((liveTxn) => {
    const norm = normalise(liveTxn);
    setTransactions((prev) => [norm, ...prev].slice(0, 50));
    setSummary((prev) => {
      if (!prev) return prev;
      const next = { ...prev };
      next.total_transactions += 1;
      if (norm.fraud) next.total_flagged += 1;
      next.decision_breakdown = {
        ...next.decision_breakdown,
        [norm.decision]: (next.decision_breakdown[norm.decision] || 0) + 1,
      };
      if (norm.risk_score < 40)      next.risk_buckets["0-39"]   += 1;
      else if (norm.risk_score < 70) next.risk_buckets["40-69"]  += 1;
      else                           next.risk_buckets["70-100"] += 1;
      next.fraud_rate_percent = Number(
        ((next.total_flagged / next.total_transactions) * 100).toFixed(2)
      );
      return next;
    });
  }, []);

  useEffect(() => {
    async function bootstrap() {
      try {
        const [summaryData, txns, thresh] = await Promise.all([
          getSummary(),
          getRecentTransactions(50),
          getThresholds(),
        ]);
        setSummary(summaryData);
        setThresholds(thresh);
        setTransactions([...txns].reverse().map(normalise));
      } catch (err) {
        setError(err.message);
      }
    }
    bootstrap();
    const socket = createTransactionsSocket(processNewTransaction);
    return () => socket?.close();
  }, [processNewTransaction]);

  const bucketData = useMemo(() => {
    if (!summary) return [];
    return Object.entries(summary.risk_buckets).map(([name, value], idx) => ({
      name, value, color: RISK_COLORS[idx],
    }));
  }, [summary]);

  const decisionData = useMemo(() => {
    if (!summary) return [];
    return Object.entries(summary.decision_breakdown).map(([name, value]) => ({
      name, value, color: DECISION_COLORS[name] || "#6b7280",
    }));
  }, [summary]);

  return (
    <div className="page">
      <header className="hero">
        <div className="hero-title">
          <h1>🛡 FraudShield</h1>
          <span className="version-badge">v2.0</span>
        </div>
        <p>Real-time AI-powered fraud monitoring for ASEAN digital wallets.</p>
      </header>

      {error && <p className="error">⚠ {error}</p>}

      <DashboardStats summary={summary} thresholds={thresholds} />

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
              <Bar dataKey="value" name="Transactions">
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
              <Pie data={decisionData} dataKey="value" nameKey="name" outerRadius={70} label>
                {decisionData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </article>
      </section>

      <section className="charts-grid">
        <article className="card">
          <h2>Fraud Location Map — ASEAN Region</h2>
          <p className="map-note">
            🟢 Low risk &nbsp;|&nbsp; 🟡 Medium risk (OTP) &nbsp;|&nbsp; 🔴 High risk (Blocked)
          </p>
          <FraudMap transactions={transactions} />
        </article>
      </section>

      <TransactionTable
        transactions={transactions}
        onFeedback={refreshThresholds}
      />
    </div>
  );
}
