import { useState, useEffect, useRef } from "react";
import { predictTransaction } from "../api";

const LOCATIONS = {
  "Kuala Lumpur": { lat: 3.139,   lng: 101.6869 },
  Singapore:      { lat: 1.3521,  lng: 103.8198 },
  Jakarta:        { lat: -6.2088, lng: 106.8456 },
  Bangkok:        { lat: 13.7563, lng: 100.5018 },
  Manila:         { lat: 14.5995, lng: 120.9842 },
  // Anomalous locations for fraud simulation
  Tokyo:          { lat: 35.6762, lng: 139.6503 },
  London:         { lat: 51.5074, lng: -0.1278  },
};

const DEVICES = ["iPhone-KL", "Android-SG", "Desktop-JK", "Unknown-Device-9999"];
const MERCHANTS = ["groceries", "food_delivery", "rideshare", "utilities", "electronics", "crypto", "jewelry", "transfer"];
const IP_POOLS = {
  clean:       ["172.16.5.10", "192.168.1.22", "10.0.0.55"],
  suspicious:  ["198.51.100.5", "203.0.113.10"],
  blacklisted: ["10.66.1.50", "10.66.2.100"],
};

let _txnCounter = 1;

function buildPayload({ userId, amount, location, device, merchant, ipType }) {
  const coords = LOCATIONS[location] || LOCATIONS["Kuala Lumpur"];
  const ipList = IP_POOLS[ipType] || IP_POOLS.clean;
  const ip = ipList[Math.floor(Math.random() * ipList.length)];
  const now = new Date().toISOString();

  return {
    txn_id: `sim-${Date.now()}-${_txnCounter++}`,
    user_id: userId,
    amount: Number(amount),
    currency: "MYR",
    timestamp: now,
    latitude: coords.lat + (Math.random() - 0.5) * 0.02,
    longitude: coords.lng + (Math.random() - 0.5) * 0.02,
    device_id: device,
    ip_address: ip,
    merchant_category: merchant,
    channel: "wallet_app",
  };
}

export function TransactionSimulator({ onSimulate }) {
  const [userId, setUserId]   = useState("user-demo");
  const [amount, setAmount]   = useState(50);
  const [location, setLocation] = useState("Kuala Lumpur");
  const [device, setDevice]   = useState("iPhone-KL");
  const [merchant, setMerchant] = useState("groceries");
  const [ipType, setIpType]   = useState("clean");
  const [loading, setLoading] = useState(false);
  const [autoRunning, setAutoRunning] = useState(false);
  const autoRef = useRef(null);

  const simulate = async (overrides = {}) => {
    const payload = buildPayload({
      userId, amount, location, device, merchant, ipType, ...overrides,
    });
    setLoading(true);
    try {
      const result = await predictTransaction(payload);
      // Merge location coords for the map
      const coords = LOCATIONS[location] || LOCATIONS["Kuala Lumpur"];
      onSimulate({
        ...result,
        location_coords: { lat: payload.latitude, lng: payload.longitude },
        merchant_category: payload.merchant_category,
        timestamp: payload.timestamp,
      });
    } catch (err) {
      console.error("Simulation error:", err);
    } finally {
      setLoading(false);
    }
  };

  const randomSimulate = () => {
    const locationKeys = Object.keys(LOCATIONS);
    simulate({
      userId: `user-${Math.floor(Math.random() * 50) + 1}`,
      amount: Math.random() > 0.85 ? (Math.random() * 2000 + 500).toFixed(2) : (Math.random() * 200 + 10).toFixed(2),
      location: locationKeys[Math.floor(Math.random() * locationKeys.length)],
      device: DEVICES[Math.floor(Math.random() * DEVICES.length)],
      merchant: MERCHANTS[Math.floor(Math.random() * MERCHANTS.length)],
      ipType: Math.random() > 0.85 ? "blacklisted" : Math.random() > 0.75 ? "suspicious" : "clean",
    });
  };

  useEffect(() => {
    if (autoRunning) {
      autoRef.current = setInterval(randomSimulate, 2000);
    } else {
      clearInterval(autoRef.current);
    }
    return () => clearInterval(autoRef.current);
  }, [autoRunning]);

  return (
    <article className="card simulator-card">
      <h2>Transaction Simulator</h2>
      <p className="sim-note">Calls the live backend API — results reflect the real ML model.</p>

      <div className="form-grid">
        <Field label="User ID">
          <input value={userId} onChange={(e) => setUserId(e.target.value)} />
        </Field>
        <Field label="Amount (MYR)">
          <input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <Field label="Location">
          <select value={location} onChange={(e) => setLocation(e.target.value)}>
            {Object.keys(LOCATIONS).map((l) => <option key={l}>{l}</option>)}
          </select>
        </Field>
        <Field label="Device">
          <select value={device} onChange={(e) => setDevice(e.target.value)}>
            {DEVICES.map((d) => <option key={d}>{d}</option>)}
          </select>
        </Field>
        <Field label="Merchant Category">
          <select value={merchant} onChange={(e) => setMerchant(e.target.value)}>
            {MERCHANTS.map((m) => <option key={m}>{m}</option>)}
          </select>
        </Field>
        <Field label="IP Reputation">
          <select value={ipType} onChange={(e) => setIpType(e.target.value)}>
            <option value="clean">Clean</option>
            <option value="suspicious">Suspicious</option>
            <option value="blacklisted">Blacklisted</option>
          </select>
        </Field>
      </div>

      <div className="simulator-actions">
        <button className="btn btn-primary" onClick={() => simulate()} disabled={loading || autoRunning}>
          {loading ? "Scoring…" : "Simulate Transaction"}
        </button>
        <button
          className={`btn ${autoRunning ? "btn-danger" : "btn-secondary"}`}
          onClick={() => setAutoRunning((v) => !v)}
        >
          {autoRunning ? "⏹ Stop Auto" : "▶ Auto Simulate"}
        </button>
      </div>
    </article>
  );
}

function Field({ label, children }) {
  return (
    <div className="form-field">
      <label>{label}</label>
      {children}
    </div>
  );
}
