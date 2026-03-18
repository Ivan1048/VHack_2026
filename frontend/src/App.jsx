import { useEffect, useState, useCallback } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { createTransactionsSocket, getRecentTransactions, getSummary } from "./api";

import Sidebar from "./components/Sidebar";
import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/DashboardPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import TransactionDetail from "./pages/TransactionDetail";
import UserProfile from "./pages/UserProfile";

export default function App() {
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState("");
  const location = useLocation();

  const processNewTransaction = useCallback((liveTxn) => {
    setTransactions((prev) => [liveTxn, ...prev].slice(0, 50));
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

        const formattedTxns = txns.map((t) => {
          if (t.transaction) {
            return {
              ...t,
              txn_id: t.transaction.txn_id,
              user_id: t.transaction.user_id,
              amount: t.transaction.amount,
              location: t.transaction.location || "Online",
              device_type: t.transaction.device_id || "Unknown Device",
              merchant_category: t.transaction.merchant_category || "Retail",
              timestamp: t.transaction.timestamp || new Date().toISOString(),
            };
          }
          return {
            ...t,
            location: t.location || "Online",
            device_type: t.device_type || "Unknown Device",
            merchant_category: t.merchant_category || "Retail",
            timestamp: t.timestamp || new Date().toISOString(),
          };
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

  /* Landing page gets its own full-width layout (no sidebar) */
  const isLanding = location.pathname === "/";

  if (isLanding) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
      </Routes>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <Routes>
          <Route
            path="/dashboard"
            element={
              <DashboardPage
                summary={summary}
                transactions={transactions}
                processNewTransaction={processNewTransaction}
                error={error}
              />
            }
          />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route
            path="/transaction/:id"
            element={<TransactionDetail transactions={transactions} />}
          />
          <Route
            path="/user-profile"
            element={<UserProfile transactions={transactions} />}
          />
        </Routes>
      </main>
    </div>
  );
}
