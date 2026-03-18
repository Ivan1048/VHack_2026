import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div className="landing">
      {/* ── Hero ── */}
      <section className="landing-hero">
        <div className="landing-hero-glow" />
        <h1 className="landing-title">
          <span className="landing-shield-icon">🛡️</span> FraudShield
        </h1>
        <p className="landing-subtitle">
          Real-Time AI Fraud Detection for <em>Digital Wallets</em> — protecting
          the unbanked across Southeast Asia.
        </p>
        <div className="landing-cta-row">
          <Link to="/dashboard" className="btn btn-primary btn-lg">
            Open Dashboard
          </Link>
          <Link to="/analytics" className="btn btn-outline btn-lg">
            View Analytics
          </Link>
        </div>
      </section>

      {/* ── Impact Stats ── */}
      <section className="landing-stats">
        <div className="landing-stat-card">
          <h3>&lt; 50 ms</h3>
          <p>Scoring Latency</p>
        </div>
        <div className="landing-stat-card">
          <h3>97%+</h3>
          <p>Detection Accuracy</p>
        </div>
        <div className="landing-stat-card">
          <h3>&lt; 1%</h3>
          <p>False Positive Rate</p>
        </div>
        <div className="landing-stat-card">
          <h3>680M+</h3>
          <p>Unbanked in ASEAN</p>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="landing-section">
        <h2 className="landing-section-title">How It Works</h2>
        <div className="landing-steps">
          <div className="landing-step">
            <div className="step-number">1</div>
            <h3>Transaction Received</h3>
            <p>
              A digital-wallet payment arrives at the FraudShield API in
              real&nbsp;time.
            </p>
          </div>
          <div className="landing-step-arrow">→</div>
          <div className="landing-step">
            <div className="step-number">2</div>
            <h3>Behavioral Analysis</h3>
            <p>
              12 engineered features — velocity, device fingerprint, location,
              time — are computed instantly.
            </p>
          </div>
          <div className="landing-step-arrow">→</div>
          <div className="landing-step">
            <div className="step-number">3</div>
            <h3>Risk Decision</h3>
            <p>
              The ML model scores the transaction and returns{" "}
              <strong>Approve</strong>, <strong>OTP</strong>, or{" "}
              <strong>Block</strong>.
            </p>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="landing-section">
        <h2 className="landing-section-title">Key Capabilities</h2>
        <div className="landing-features">
          <div className="landing-feature-card">
            <div className="feature-icon">🧠</div>
            <h3>ML-Powered Detection</h3>
            <p>
              Random Forest classifier with balanced class weights, trained on
              50 000+ synthetic transactions for high recall on rare fraud
              events.
            </p>
          </div>
          <div className="landing-feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Real-Time Scoring</h3>
            <p>
              Sub-50 ms prediction latency via FastAPI with WebSocket streaming
              to the live dashboard — no batch delays.
            </p>
          </div>
          <div className="landing-feature-card">
            <div className="feature-icon">🔍</div>
            <h3>Explainable Decisions</h3>
            <p>
              Every flagged transaction includes human-readable reasons such as
              &ldquo;New device detected&rdquo; or &ldquo;Unusual amount&rdquo;.
            </p>
          </div>
          <div className="landing-feature-card">
            <div className="feature-icon">🗺️</div>
            <h3>Geo-Fraud Mapping</h3>
            <p>
              Interactive Leaflet map with colour-coded markers so operators can
              spot regional fraud clusters at a glance.
            </p>
          </div>
          <div className="landing-feature-card">
            <div className="feature-icon">📱</div>
            <h3>Contextual Signals</h3>
            <p>
              Device fingerprint, merchant frequency, and location novelty are
              woven into every prediction for richer context.
            </p>
          </div>
          <div className="landing-feature-card">
            <div className="feature-icon">🔒</div>
            <h3>Privacy-First Design</h3>
            <p>
              Sensitive data is processed in-memory with no PII logging.
              Compliant with ASEAN data-protection principles.
            </p>
          </div>
        </div>
      </section>

      {/* ── SDG 8 ── */}
      <section className="landing-section landing-sdg">
        <div className="sdg-content">
          <img
            src="https://sdgs.un.org/sites/default/files/goals/E_SDG_Icons-08.jpg"
            alt="SDG 8 icon"
            className="sdg-icon-large"
          />
          <div>
            <h2>SDG 8 — Decent Work &amp; Economic Growth</h2>
            <p>
              <strong>Target 8.10:</strong> Strengthen the capacity of domestic
              financial institutions to encourage and expand access to banking,
              insurance and financial services for all.
            </p>
            <p>
              FraudShield directly supports this target by protecting new
              digital-wallet users — gig workers, rural merchants, and the
              unbanked — from losing their funds to fraud. When users{" "}
              <em>trust</em> digital payments, financial inclusion accelerates.
            </p>
          </div>
        </div>
      </section>

      {/* ── Tech Stack ── */}
      <section className="landing-section">
        <h2 className="landing-section-title">Technology Stack</h2>
        <div className="landing-tech-row">
          {[
            { name: "Python", tag: "Backend" },
            { name: "FastAPI", tag: "API" },
            { name: "scikit-learn", tag: "ML" },
            { name: "React", tag: "Frontend" },
            { name: "Recharts", tag: "Charts" },
            { name: "Leaflet", tag: "Maps" },
            { name: "WebSocket", tag: "Real-Time" },
          ].map((t) => (
            <div className="tech-chip" key={t.name}>
              <span className="tech-chip-tag">{t.tag}</span>
              <span>{t.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <p>
          Built for <strong>VHack 2026</strong> — Digital Trust Track
        </p>
      </footer>
    </div>
  );
}
