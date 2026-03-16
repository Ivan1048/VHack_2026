import { useState, useEffect } from "react";

const LOCATIONS = [
  "Kuala Lumpur",
  "Singapore",
  "Jakarta",
  "Bangkok",
  "Manila",
];

const LOCATION_COORDS = {
  "Kuala Lumpur": { lat: 3.139, lng: 101.6869 },
  Singapore: { lat: 1.3521, lng: 103.8198 },
  Jakarta: { lat: -6.2088, lng: 106.8456 },
  Bangkok: { lat: 13.7563, lng: 100.5018 },
  Manila: { lat: 14.5995, lng: 120.9842 },
};

const DEVICES = ["iPhone", "Android", "Desktop", "Unknown Device"];

const MERCHANTS = ["Retail", "Food & Beverage", "Travel", "Online Subscriptions", "Electronics"];

export function TransactionSimulator({ onSimulate }) {
  const [userId, setUserId] = useState("user-100");
  const [amount, setAmount] = useState(50);
  const [location, setLocation] = useState("Kuala Lumpur");
  const [device, setDevice] = useState("iPhone");
  const [merchant, setMerchant] = useState("Retail");
  const [isAutoSimulating, setIsAutoSimulating] = useState(false);

  const calculateRisk = (txnAmount, txnDevice, txnLocation) => {
    let riskScore = 0;
    const reasons = [];

    if (txnAmount > 1000) {
      riskScore += 40;
      reasons.push("Unusual transaction amount");
    }
    if (txnDevice === "Unknown Device") {
      riskScore += 30;
      reasons.push("New device detected");
    }
    if (txnLocation !== "Kuala Lumpur") {
      riskScore += 20;
      reasons.push("Location anomaly");
    }

    // Cap at 100
    riskScore = Math.min(riskScore, 100);

    let decision = "Approved";
    if (riskScore >= 40 && riskScore <= 69) {
      decision = "Requires Review"; // Matching backend existing logic naming
    } else if (riskScore >= 70) {
      decision = "Declined"; // Matching backend existing logic naming
    }

    return {
      risk_score: riskScore,
      fraud: riskScore >= 70,
      decision,
      reasons,
    };
  };

  const handleSimulate = () => {
    const { risk_score, fraud, decision, reasons } = calculateRisk(
      Number(amount),
      device,
      location
    );

    const newTxn = {
      txn_id: `sim-${Date.now().toString().slice(-6)}`,
      user_id: userId,
      amount: Number(amount),
      location,
      location_coords: LOCATION_COORDS[location] || LOCATION_COORDS["Kuala Lumpur"],
      device_type: device,
      merchant_category: merchant,
      timestamp: new Date().toISOString(),
      risk_score,
      decision,
      fraud,
      reasons,
    };

    onSimulate(newTxn);
  };

  useEffect(() => {
    let interval;
    if (isAutoSimulating) {
      interval = setInterval(() => {
        const rawAmount =
          Math.random() > 0.8 /* 20% chance of high amount */
            ? Math.random() * 2000 + 100
            : Math.random() * 500 + 10;
        const randAmount = Number(rawAmount.toFixed(2));
        const randLocation =
          LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
        const randDevice = DEVICES[Math.floor(Math.random() * DEVICES.length)];
        const randMerchant = MERCHANTS[Math.floor(Math.random() * MERCHANTS.length)];
        const randUser = `user-${Math.floor(Math.random() * 1000)}`;

        const { risk_score, fraud, decision, reasons } = calculateRisk(
          randAmount,
          randDevice,
          randLocation
        );

        const newTxn = {
          txn_id: `auto-${Date.now().toString().slice(-6)}`,
          user_id: randUser,
          amount: randAmount,
          location: randLocation,
          location_coords: LOCATION_COORDS[randLocation],
          device_type: randDevice,
          merchant_category: randMerchant,
          timestamp: new Date().toISOString(),
          risk_score,
          decision,
          fraud,
          reasons,
        };

        onSimulate(newTxn);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isAutoSimulating, onSimulate]);

  return (
    <article className="card simulator-card">
      <h2>Transaction Simulator</h2>
      <div className="form-row">
        <div>
          <label>User ID</label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
        </div>
        <div>
          <label>Amount (USD)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
      </div>
      <div className="form-row">
        <div>
          <label>Location</label>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          >
            {LOCATIONS.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Device Type</label>
          <select value={device} onChange={(e) => setDevice(e.target.value)}>
            {DEVICES.map((dev) => (
              <option key={dev} value={dev}>
                {dev}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="form-row">
        <div>
          <label>Merchant Category</label>
          <select value={merchant} onChange={(e) => setMerchant(e.target.value)}>
            {MERCHANTS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          {/* Empty flex column for spacing parity */}
        </div>
      </div>
      <div className="simulator-actions">
        <button
          className="btn btn-primary"
          onClick={handleSimulate}
          disabled={isAutoSimulating}
        >
          Simulate Transaction
        </button>
        <button
          className={`btn ${
            isAutoSimulating ? "btn-danger" : "btn-secondary"
          }`}
          onClick={() => setIsAutoSimulating(!isAutoSimulating)}
        >
          {isAutoSimulating ? "Stop Auto Simulation" : "Start Auto Simulation"}
        </button>
      </div>
    </article>
  );
}
