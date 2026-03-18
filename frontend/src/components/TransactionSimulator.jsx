import { useState, useEffect, useRef } from "react";
import { predictTransaction } from "../api";

// ---------------------------------------------------------------------------
// All 10 ASEAN countries with multiple representative cities
// Grouped by country for the <optgroup> dropdown
// ---------------------------------------------------------------------------
export const ASEAN_LOCATIONS = {
  // ── Malaysia ──────────────────────────────────────────────────────────────
  "Malaysia – Kuala Lumpur":    { lat: 3.1390,  lng: 101.6869, country: "Malaysia" },
  "Malaysia – George Town":     { lat: 5.4141,  lng: 100.3288, country: "Malaysia" },
  "Malaysia – Johor Bahru":     { lat: 1.4927,  lng: 103.7414, country: "Malaysia" },
  "Malaysia – Kota Kinabalu":   { lat: 5.9804,  lng: 116.0735, country: "Malaysia" },
  "Malaysia – Kuching":         { lat: 1.5497,  lng: 110.3592, country: "Malaysia" },

  // ── Singapore ─────────────────────────────────────────────────────────────
  "Singapore – Central":        { lat: 1.3521,  lng: 103.8198, country: "Singapore" },
  "Singapore – Jurong":         { lat: 1.3329,  lng: 103.7436, country: "Singapore" },
  "Singapore – Changi":         { lat: 1.3644,  lng: 103.9915, country: "Singapore" },

  // ── Indonesia ─────────────────────────────────────────────────────────────
  "Indonesia – Jakarta":        { lat: -6.2088, lng: 106.8456, country: "Indonesia" },
  "Indonesia – Surabaya":       { lat: -7.2575, lng: 112.7521, country: "Indonesia" },
  "Indonesia – Bandung":        { lat: -6.9175, lng: 107.6191, country: "Indonesia" },
  "Indonesia – Medan":          { lat: 3.5952,  lng: 98.6722,  country: "Indonesia" },
  "Indonesia – Bali (Denpasar)":{ lat: -8.6705, lng: 115.2126, country: "Indonesia" },
  "Indonesia – Makassar":       { lat: -5.1477, lng: 119.4327, country: "Indonesia" },

  // ── Thailand ──────────────────────────────────────────────────────────────
  "Thailand – Bangkok":         { lat: 13.7563, lng: 100.5018, country: "Thailand" },
  "Thailand – Chiang Mai":      { lat: 18.7883, lng: 98.9853,  country: "Thailand" },
  "Thailand – Phuket":          { lat: 7.8804,  lng: 98.3923,  country: "Thailand" },
  "Thailand – Pattaya":         { lat: 12.9236, lng: 100.8825, country: "Thailand" },

  // ── Philippines ───────────────────────────────────────────────────────────
  "Philippines – Manila":       { lat: 14.5995, lng: 120.9842, country: "Philippines" },
  "Philippines – Quezon City":  { lat: 14.6760, lng: 121.0437, country: "Philippines" },
  "Philippines – Cebu City":    { lat: 10.3157, lng: 123.8854, country: "Philippines" },
  "Philippines – Davao":        { lat: 7.1907,  lng: 125.4553, country: "Philippines" },

  // ── Vietnam ───────────────────────────────────────────────────────────────
  "Vietnam – Ho Chi Minh City": { lat: 10.8231, lng: 106.6297, country: "Vietnam" },
  "Vietnam – Hanoi":            { lat: 21.0278, lng: 105.8342, country: "Vietnam" },
  "Vietnam – Da Nang":          { lat: 16.0544, lng: 108.2022, country: "Vietnam" },
  "Vietnam – Can Tho":          { lat: 10.0452, lng: 105.7469, country: "Vietnam" },

  // ── Myanmar ───────────────────────────────────────────────────────────────
  "Myanmar – Yangon":           { lat: 16.8661, lng: 96.1951,  country: "Myanmar" },
  "Myanmar – Mandalay":         { lat: 21.9588, lng: 96.0891,  country: "Myanmar" },
  "Myanmar – Naypyidaw":        { lat: 19.7633, lng: 96.0785,  country: "Myanmar" },

  // ── Cambodia ──────────────────────────────────────────────────────────────
  "Cambodia – Phnom Penh":      { lat: 11.5564, lng: 104.9282, country: "Cambodia" },
  "Cambodia – Siem Reap":       { lat: 13.3671, lng: 103.8448, country: "Cambodia" },
  "Cambodia – Sihanoukville":   { lat: 10.6099, lng: 103.5296, country: "Cambodia" },

  // ── Laos ──────────────────────────────────────────────────────────────────
  "Laos – Vientiane":           { lat: 17.9757, lng: 102.6331, country: "Laos" },
  "Laos – Luang Prabang":       { lat: 19.8845, lng: 102.1348, country: "Laos" },

  // ── Brunei ────────────────────────────────────────────────────────────────
  "Brunei – Bandar Seri Begawan": { lat: 4.9031, lng: 114.9398, country: "Brunei" },
  "Brunei – Kuala Belait":        { lat: 4.5847, lng: 114.2049, country: "Brunei" },

  // ── Timor-Leste ───────────────────────────────────────────────────────────
  "Timor-Leste – Dili":         { lat: -8.5569, lng: 125.5789, country: "Timor-Leste" },
};

// Group cities by country for <optgroup> rendering
const LOCATIONS_BY_COUNTRY = Object.entries(ASEAN_LOCATIONS).reduce((acc, [city, data]) => {
  if (!acc[data.country]) acc[data.country] = [];
  acc[data.country].push(city);
  return acc;
}, {});

const ASEAN_CITY_KEYS = Object.keys(ASEAN_LOCATIONS);

const DEVICES = [
  "iPhone-MY", "Android-SG", "Android-ID", "iPhone-TH",
  "Android-PH", "Desktop-VN", "Android-MM", "iPhone-KH",
  "Desktop-LA", "Android-BN", "Unknown-Device-9999",
];

const MERCHANTS = [
  "groceries", "food_delivery", "rideshare", "utilities",
  "electronics", "gaming", "subscription", "transfer",
  "jewelry", "crypto",
];

const IP_POOLS = {
  clean:       ["172.16.5.10", "192.168.1.22", "10.0.0.55", "10.1.2.100", "10.2.3.200"],
  suspicious:  ["198.51.100.5", "203.0.113.10", "198.51.100.99"],
  blacklisted: ["10.66.1.50", "10.66.2.100", "10.66.5.77"],
};

let _txnCounter = 1;

function buildPayload({ userId, amount, location, device, merchant, ipType }) {
  const coords = ASEAN_LOCATIONS[location] || ASEAN_LOCATIONS["Malaysia – Kuala Lumpur"];
  const ipList = IP_POOLS[ipType] || IP_POOLS.clean;
  const ip = ipList[Math.floor(Math.random() * ipList.length)];
  const now = new Date().toISOString();

  return {
    txn_id: `sim-${Date.now()}-${_txnCounter++}`,
    user_id: userId,
    amount: Number(amount),
    currency: "MYR",
    timestamp: now,
    latitude:  coords.lat + (Math.random() - 0.5) * 0.02,
    longitude: coords.lng + (Math.random() - 0.5) * 0.02,
    device_id: device,
    ip_address: ip,
    merchant_category: merchant,
    channel: "wallet_app",
  };
}

export function TransactionSimulator({ onSimulate }) {
  const [userId,   setUserId]   = useState("user-demo");
  const [amount,   setAmount]   = useState(50);
  const [location, setLocation] = useState("Malaysia – Kuala Lumpur");
  const [device,   setDevice]   = useState("iPhone-MY");
  const [merchant, setMerchant] = useState("groceries");
  const [ipType,   setIpType]   = useState("clean");
  const [loading,  setLoading]  = useState(false);
  const [autoRunning, setAutoRunning] = useState(false);
  const autoRef = useRef(null);

  const simulate = async (overrides = {}) => {
    const payload = buildPayload({ userId, amount, location, device, merchant, ipType, ...overrides });
    setLoading(true);
    try {
      const result = await predictTransaction(payload);
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
    simulate({
      userId:   `user-${Math.floor(Math.random() * 50) + 1}`,
      amount:   Math.random() > 0.85
                  ? (Math.random() * 2000 + 500).toFixed(2)
                  : (Math.random() * 200 + 10).toFixed(2),
      location: ASEAN_CITY_KEYS[Math.floor(Math.random() * ASEAN_CITY_KEYS.length)],
      device:   DEVICES[Math.floor(Math.random() * DEVICES.length)],
      merchant: MERCHANTS[Math.floor(Math.random() * MERCHANTS.length)],
      ipType:   Math.random() > 0.85 ? "blacklisted"
              : Math.random() > 0.75 ? "suspicious"
              : "clean",
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
      <p className="sim-note">
        Covers all 10 ASEAN countries · Calls the live backend ML API
      </p>

      <div className="form-grid">
        <Field label="User ID">
          <input value={userId} onChange={(e) => setUserId(e.target.value)} />
        </Field>

        <Field label="Amount (MYR)">
          <input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>

        {/* Grouped location dropdown by country */}
        <Field label="Location (ASEAN)">
          <select value={location} onChange={(e) => setLocation(e.target.value)}>
            {Object.entries(LOCATIONS_BY_COUNTRY).map(([country, cities]) => (
              <optgroup key={country} label={`🌏 ${country}`}>
                {cities.map((city) => (
                  <option key={city} value={city}>{city.split(" – ")[1]}</option>
                ))}
              </optgroup>
            ))}
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
            <option value="clean">✅ Clean</option>
            <option value="suspicious">⚠️ Suspicious</option>
            <option value="blacklisted">🚫 Blacklisted</option>
          </select>
        </Field>
      </div>

      <div className="simulator-actions">
        <button
          className="btn btn-primary"
          onClick={() => simulate()}
          disabled={loading || autoRunning}
        >
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
