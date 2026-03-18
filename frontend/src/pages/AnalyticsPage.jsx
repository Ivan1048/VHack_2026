import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/* ── Mock model metrics (in production these come from /model/metrics) ── */
const MODEL_METRICS = {
  accuracy: 0.982,
  precision: 0.91,
  recall: 0.87,
  f1: 0.89,
  roc_auc: 0.964,
};

const CONFUSION = {
  tp: 174,
  fp: 17,
  fn: 26,
  tn: 9783,
};

const FEATURE_IMPORTANCE = [
  { feature: "transaction_amount", importance: 0.23 },
  { feature: "amount_ratio_to_avg", importance: 0.18 },
  { feature: "time_since_last_tx", importance: 0.14 },
  { feature: "is_new_device", importance: 0.11 },
  { feature: "is_night", importance: 0.09 },
  { feature: "hour", importance: 0.07 },
  { feature: "location_freq", importance: 0.06 },
  { feature: "merchant_freq", importance: 0.04 },
  { feature: "is_rapid_tx", importance: 0.03 },
  { feature: "is_weekend", importance: 0.02 },
  { feature: "day_of_week", importance: 0.02 },
  { feature: "user_avg_amount", importance: 0.01 },
];

const FRAUD_TREND = [
  { hour: "00:00", rate: 3.2 },
  { hour: "02:00", rate: 4.1 },
  { hour: "04:00", rate: 3.8 },
  { hour: "06:00", rate: 1.2 },
  { hour: "08:00", rate: 0.8 },
  { hour: "10:00", rate: 0.6 },
  { hour: "12:00", rate: 1.1 },
  { hour: "14:00", rate: 0.9 },
  { hour: "16:00", rate: 1.4 },
  { hour: "18:00", rate: 1.8 },
  { hour: "20:00", rate: 2.5 },
  { hour: "22:00", rate: 3.0 },
];

const TOP_PATTERNS = [
  {
    icon: "🌙",
    title: "Night-Time Transactions",
    desc: "Fraud is 3.4× more likely between midnight and 5 AM.",
  },
  {
    icon: "📱",
    title: "New Device Usage",
    desc: "First-time device transactions are flagged 5× more often.",
  },
  {
    icon: "💰",
    title: "High-Value Outliers",
    desc: "Transactions >3× user average have 8× higher fraud probability.",
  },
  {
    icon: "⚡",
    title: "Rapid Successive Transactions",
    desc: "Multiple transactions within 10 minutes raise risk by 2.6×.",
  },
];

const PIE_COLORS = ["#10b981", "#ef4444", "#f59e0b", "#6366f1"];

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState("overview");

  const confusionData = useMemo(
    () => [
      { name: "True Positive", value: CONFUSION.tp },
      { name: "False Positive", value: CONFUSION.fp },
      { name: "False Negative", value: CONFUSION.fn },
      { name: "True Negative", value: CONFUSION.tn },
    ],
    []
  );

  return (
    <div className="analytics-page">
      <header className="page-header">
        <h1>📊 Model Analytics & Insights</h1>
        <p>Performance metrics, feature analysis, and fraud pattern intelligence.</p>
      </header>

      {/* ── Tab Bar ── */}
      <div className="analytics-tabs">
        {[
          { key: "overview", label: "Overview" },
          { key: "features", label: "Feature Analysis" },
          { key: "patterns", label: "Fraud Patterns" },
        ].map((tab) => (
          <button
            key={tab.key}
            className={`analytics-tab${activeTab === tab.key ? " analytics-tab--active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Overview tab ── */}
      {activeTab === "overview" && (
        <>
          {/* Metric cards */}
          <section className="analytics-metrics">
            {Object.entries(MODEL_METRICS).map(([key, val]) => (
              <div className="metric-card" key={key}>
                <p className="metric-label">{key.replace("_", " ").toUpperCase()}</p>
                <h3 className="metric-value">
                  {key === "roc_auc" ? val.toFixed(3) : (val * 100).toFixed(1) + "%"}
                </h3>
                <div className="metric-bar">
                  <div
                    className="metric-bar-fill"
                    style={{ width: `${val * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </section>

          {/* Confusion Matrix */}
          <section className="charts-grid analytics-charts-row">
            <article className="card">
              <h2>Confusion Matrix</h2>
              <div className="confusion-matrix">
                <div className="cm-corner" />
                <div className="cm-header">Predicted Normal</div>
                <div className="cm-header">Predicted Fraud</div>

                <div className="cm-label">Actual Normal</div>
                <div className="cm-cell cm-tn">{CONFUSION.tn.toLocaleString()}</div>
                <div className="cm-cell cm-fp">{CONFUSION.fp}</div>

                <div className="cm-label">Actual Fraud</div>
                <div className="cm-cell cm-fn">{CONFUSION.fn}</div>
                <div className="cm-cell cm-tp">{CONFUSION.tp}</div>
              </div>
              <div className="cm-legend">
                <span className="cm-legend-item"><span className="dot dot-tp" /> True Positive</span>
                <span className="cm-legend-item"><span className="dot dot-tn" /> True Negative</span>
                <span className="cm-legend-item"><span className="dot dot-fp" /> False Positive</span>
                <span className="cm-legend-item"><span className="dot dot-fn" /> False Negative</span>
              </div>
            </article>

            <article className="card">
              <h2>Prediction Distribution</h2>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={confusionData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={80}
                    innerRadius={40}
                    paddingAngle={3}
                  >
                    {confusionData.map((entry, idx) => (
                      <Cell key={entry.name} fill={PIE_COLORS[idx]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </article>
          </section>

          {/* Fraud Trend */}
          <section className="card" style={{ marginBottom: "1rem" }}>
            <h2>Fraud Rate by Hour of Day</h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={FRAUD_TREND}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis unit="%" />
                <Tooltip formatter={(v) => `${v}%`} />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ fill: "#ef4444", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </section>
        </>
      )}

      {/* ── Features tab ── */}
      {activeTab === "features" && (
        <>
          <section className="card" style={{ marginBottom: "1rem" }}>
            <h2>Feature Importance (Random Forest)</h2>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={FEATURE_IMPORTANCE}
                layout="vertical"
                margin={{ left: 120 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 0.25]} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                <YAxis type="category" dataKey="feature" width={110} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => `${(v * 100).toFixed(1)}%`} />
                <Bar dataKey="importance" radius={[0, 6, 6, 0]}>
                  {FEATURE_IMPORTANCE.map((entry, idx) => (
                    <Cell
                      key={entry.feature}
                      fill={idx < 3 ? "#ef4444" : idx < 6 ? "#f59e0b" : "#10b981"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </section>

          <section className="analytics-feature-insights">
            <article className="card insight-card">
              <h3>🎯 Top 3 Predictors</h3>
              <ol>
                <li><strong>transaction_amount</strong> — raw dollar value is the single strongest signal.</li>
                <li><strong>amount_ratio_to_avg</strong> — how far this transaction deviates from the user's norm.</li>
                <li><strong>time_since_last_tx</strong> — velocity; rapid successive transactions indicate bot / account takeover.</li>
              </ol>
            </article>
            <article className="card insight-card">
              <h3>📉 Least Useful Features</h3>
              <ul>
                <li><strong>day_of_week</strong> &amp; <strong>is_weekend</strong> carry minimal signal in this dataset.</li>
                <li>Could be pruned to reduce model complexity without hurting recall.</li>
              </ul>
            </article>
          </section>
        </>
      )}

      {/* ── Patterns tab ── */}
      {activeTab === "patterns" && (
        <section className="analytics-patterns">
          {TOP_PATTERNS.map((p) => (
            <article className="card pattern-card" key={p.title}>
              <div className="pattern-icon">{p.icon}</div>
              <div>
                <h3>{p.title}</h3>
                <p>{p.desc}</p>
              </div>
            </article>
          ))}

          <article className="card" style={{ marginTop: "1rem" }}>
            <h2>Imbalanced-Class Strategy</h2>
            <div className="imbalance-info">
              <div className="imbalance-stat">
                <h4>1.8%</h4>
                <p>Fraud ratio in training data</p>
              </div>
              <div className="imbalance-stat">
                <h4>class_weight = 'balanced'</h4>
                <p>Scikit-learn auto-adjusts sample weights inversely proportional to class frequency</p>
              </div>
              <div className="imbalance-stat">
                <h4>Stratified Split</h4>
                <p>Train/test split preserves fraud ratio via <code>stratify=y</code></p>
              </div>
            </div>
            <p className="note">
              💡 Future improvement: apply <strong>SMOTE</strong> (Synthetic Minority Over-sampling) to
              generate synthetic fraud samples and compare recall lift vs. current approach.
            </p>
          </article>
        </section>
      )}
    </div>
  );
}
