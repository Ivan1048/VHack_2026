import { useState, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function UserProfile({ transactions }) {
  const [searchParams] = useSearchParams();
  const initialUser = searchParams.get("user") || "";
  const [userId, setUserId] = useState(initialUser);
  const [searchInput, setSearchInput] = useState(initialUser);

  /* All transactions for this user */
  const userTxns = useMemo(
    () =>
      transactions
        .filter((t) => t.user_id === userId)
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)),
    [transactions, userId]
  );

  /* Derived behavioural profile */
  const profile = useMemo(() => {
    if (userTxns.length === 0) return null;

    const amounts = userTxns.map((t) => Number(t.amount));
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const maxAmount = Math.max(...amounts);
    const locations = [...new Set(userTxns.map((t) => t.location))];
    const devices = [...new Set(userTxns.map((t) => t.device_type))];
    const merchants = [...new Set(userTxns.map((t) => t.merchant_category))];
    const fraudCount = userTxns.filter((t) => t.fraud).length;
    const avgRisk =
      userTxns.reduce((s, t) => s + (t.risk_score || 0), 0) / userTxns.length;

    return {
      totalTxns: userTxns.length,
      avgAmount: avgAmount.toFixed(2),
      maxAmount: maxAmount.toFixed(2),
      locations,
      devices,
      merchants,
      fraudCount,
      avgRisk: avgRisk.toFixed(1),
    };
  }, [userTxns]);

  /* Risk history for sparkline */
  const riskHistory = useMemo(
    () =>
      userTxns.map((t, i) => ({
        idx: i + 1,
        risk: t.risk_score || 0,
        amount: Number(t.amount),
      })),
    [userTxns]
  );

  const handleSearch = (e) => {
    e.preventDefault();
    setUserId(searchInput.trim());
  };

  /* Known simulated user IDs for quick access */
  const knownUsers = useMemo(() => {
    const ids = [...new Set(transactions.map((t) => t.user_id))];
    return ids.slice(0, 12);
  }, [transactions]);

  return (
    <div className="user-profile-page">
      <header className="page-header">
        <h1>👤 User Risk Profile</h1>
        <p>Analyze an individual user&rsquo;s behavioral baseline and risk history.</p>
      </header>

      {/* Search */}
      <section className="card user-search-card">
        <form onSubmit={handleSearch} className="user-search-form">
          <input
            type="text"
            placeholder="Enter User ID (e.g. user-100)"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="user-search-input"
          />
          <button type="submit" className="btn btn-primary">
            Search
          </button>
        </form>

        {knownUsers.length > 0 && (
          <div className="quick-users">
            <span className="quick-users-label">Recent users:</span>
            {knownUsers.map((uid) => (
              <button
                key={uid}
                className={`quick-user-chip${uid === userId ? " quick-user-chip--active" : ""}`}
                onClick={() => {
                  setUserId(uid);
                  setSearchInput(uid);
                }}
              >
                {uid}
              </button>
            ))}
          </div>
        )}
      </section>

      {!userId && (
        <div className="user-profile-empty">
          <p>Search for a user ID above to view their risk profile.</p>
        </div>
      )}

      {userId && !profile && (
        <div className="user-profile-empty">
          <p>No transactions found for <strong>{userId}</strong> in the current feed.</p>
          <p>Try running the simulator on the Dashboard first.</p>
        </div>
      )}

      {profile && (
        <>
          {/* Baseline cards */}
          <section className="user-baseline-grid">
            <div className="card user-baseline-card">
              <p className="baseline-label">Total Transactions</p>
              <h3>{profile.totalTxns}</h3>
            </div>
            <div className="card user-baseline-card">
              <p className="baseline-label">Avg Amount</p>
              <h3>${profile.avgAmount}</h3>
            </div>
            <div className="card user-baseline-card">
              <p className="baseline-label">Max Amount</p>
              <h3>${profile.maxAmount}</h3>
            </div>
            <div className="card user-baseline-card">
              <p className="baseline-label">Avg Risk Score</p>
              <h3 className={Number(profile.avgRisk) >= 40 ? "text-danger" : "text-safe"}>
                {profile.avgRisk}
              </h3>
            </div>
            <div className="card user-baseline-card">
              <p className="baseline-label">Fraud Flags</p>
              <h3 className={profile.fraudCount > 0 ? "text-danger" : "text-safe"}>
                {profile.fraudCount}
              </h3>
            </div>
          </section>

          {/* Behavioural detail */}
          <div className="user-detail-grid">
            <section className="card">
              <h2>Behavioral Baseline</h2>
              <dl className="txn-dl">
                <dt>Usual Locations</dt>
                <dd>{profile.locations.join(", ") || "—"}</dd>
                <dt>Known Devices</dt>
                <dd>{profile.devices.join(", ") || "—"}</dd>
                <dt>Frequent Merchants</dt>
                <dd>{profile.merchants.join(", ") || "—"}</dd>
              </dl>
            </section>

            <section className="card">
              <h2>Risk Score History</h2>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={riskHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="idx" label={{ value: "Transaction #", position: "insideBottom", offset: -2 }} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="risk"
                    stroke="#ef4444"
                    fill="#fecaca"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </section>
          </div>

          {/* Transaction list for this user */}
          <section className="card">
            <h2>Transaction History</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Txn ID</th>
                    <th>Time</th>
                    <th>Amount</th>
                    <th>Location</th>
                    <th>Risk</th>
                    <th>Decision</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {userTxns.map((t) => (
                    <tr key={t.txn_id}>
                      <td>{t.txn_id}</td>
                      <td>{new Date(t.timestamp).toLocaleTimeString()}</td>
                      <td>${Number(t.amount).toFixed(2)}</td>
                      <td>{t.location || "Online"}</td>
                      <td>
                        <span
                          className={`risk risk-${
                            t.risk_score < 40 ? "low" : t.risk_score < 70 ? "medium" : "high"
                          }`}
                        >
                          {t.risk_score}
                        </span>
                      </td>
                      <td>{t.decision}</td>
                      <td>
                        <Link to={`/transaction/${t.txn_id}`} className="detail-link">
                          View →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
