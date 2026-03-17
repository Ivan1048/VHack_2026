import React from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Reusable component for displaying a transaction marker based on risk
const FraudMarker = ({ position, riskLevel, transaction }) => {
  // Determine color based on riskLevel or riskScore
  const getMarkerColor = (risk) => {
    if (typeof risk === "number") {
      if (risk >= 75) return "red";
      if (risk >= 40) return "#ffc107"; // Yellow
      return "green";
    }
    
    // Support string-based risk levels
    const levelText = String(risk || "").toLowerCase();
    if (levelText.includes("high") || levelText.includes("danger")) return "red";
    if (levelText.includes("medium") || levelText.includes("suspicious")) return "#ffc107"; // Yellow
    return "green"; // Default normal
  };

  const color = getMarkerColor(riskLevel);

  return (
    <CircleMarker
      center={position}
      radius={8}
      pathOptions={{ fillColor: color, color: color, fillOpacity: 0.8, weight: 2 }}
    >
      <Popup>
        <div style={{ minWidth: "150px" }}>
          <b>User:</b> {transaction.user_id || transaction.user}<br/>
          <b>Amount:</b> ${transaction.amount}<br/>
          <b>Risk:</b> {riskLevel}<br/>
          <b>Decision:</b> {transaction.decision}
        </div>
      </Popup>
    </CircleMarker>
  );
};

const FraudMap = ({ transactions }) => {
  const centerPosition = [3.139, 101.6869]; // Default: Kuala Lumpur

  return (
    <div id="fraud-map" style={{ height: "400px", width: "100%", borderRadius: "8px", overflow: "hidden" }}>
      <MapContainer center={centerPosition} zoom={6} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        
        {/* Render markers for each valid transaction */}
        {transactions?.map((txn, index) => {
          if (txn.location_coords?.lat && txn.location_coords?.lng) {
            const riskValue = txn.risk_score !== undefined ? txn.risk_score : txn.risk;
            return (
              <FraudMarker
                key={txn.transaction_id || index}
                position={[txn.location_coords.lat, txn.location_coords.lng]}
                riskLevel={riskValue}
                transaction={txn}
              />
            );
          }
          return null;
        })}
      </MapContainer>
    </div>
  );
};

export default FraudMap;
