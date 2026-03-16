import { useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Custom colored icons
const greenIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const orangeIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

<<<<<<< HEAD
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
=======
const redIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
>>>>>>> edward

const FraudMap = ({ transactions }) => {
  useEffect(() => {
<<<<<<< HEAD
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
=======
    const map = L.map("fraud-map").setView([3.139, 101.6869], 5);
>>>>>>> edward

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

<<<<<<< HEAD
        const newTxn = {
          txn_id: `auto-${Date.now().toString().slice(-6)}`,
          user_id: randUser,
          amount: randAmount,
          location: randLocation,
          device_type: randDevice,
          merchant_category: randMerchant,
          timestamp: new Date().toISOString(),
          risk_score,
          decision,
          fraud,
          reasons,
        };
=======
    transactions.forEach((txn) => {
      if (txn.location_coords) {
        // Pick icon based on decision
        let icon = greenIcon;
        if (txn.decision === "Requires Review") {
          icon = orangeIcon;
        } else if (txn.decision === "Declined") {
          icon = redIcon;
        }
>>>>>>> edward

        const marker = L.marker(
          [txn.location_coords.lat, txn.location_coords.lng],
          { icon }
        ).addTo(map);

        marker.bindPopup(`
          <b>User:</b> ${txn.user_id}<br/>
          <b>Amount:</b> $${txn.amount}<br/>
          <b>Risk:</b> ${txn.risk_score}<br/>
          <b>Decision:</b> ${txn.decision}<br/>
          <b>Location:</b> ${txn.location}
        `);
      }
    });

    // Add legend
    const legend = L.control({ position: "bottomright" });
    legend.onAdd = function () {
      const div = L.DomUtil.create("div", "info legend");
      div.innerHTML = `
        <h4>Risk Legend</h4>
        <i style="background:green; width:12px; height:12px; display:inline-block; margin-right:5px;"></i> Approved<br/>
        <i style="background:orange; width:12px; height:12px; display:inline-block; margin-right:5px;"></i> Requires Review<br/>
        <i style="background:red; width:12px; height:12px; display:inline-block; margin-right:5px;"></i> Declined
      `;
      return div;
    };
    legend.addTo(map);

    return () => map.remove();
  }, [transactions]);

  return (
<<<<<<< HEAD
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
=======
    <div id="fraud-map" style={{ height: "400px", width: "100%" }}></div>
>>>>>>> edward
  );
};

export default FraudMap;

