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
import { Link } from "react-router-dom";
import { DashboardStats } from "../components/DashboardStats";
import { TransactionTable } from "../components/TransactionTable";
import { TransactionSimulator } from "../components/TransactionSimulator";
import FraudMap from "../components/FraudMap";

const COLORS = ["#0f766e", "#f59e0b", "#b91c1c"];

export default function DashboardPage({ summary, transactions, processNewTransaction, error }) {
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
    <>
      {error && <p className="error">{error}</p>}

      <header className="page-header">
        <h1>📊 Live Dashboard</h1>
        <p>Real-time fraud monitoring and detection.</p>
      </header>

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

      <section className="charts-grid">
        <article className="card">
          <h2>Fraud Location Map</h2>
          <FraudMap transactions={transactions} />
        </article>
      </section>

      <TransactionTable transactions={transactions} />
    </>
  );
}
