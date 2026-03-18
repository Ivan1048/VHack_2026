import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const RISK_COLORS = {
  low:    "#16a34a",  // green
  medium: "#d97706",  // amber
  high:   "#dc2626",  // red
};

function riskClass(score) {
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

const FraudMap = ({ transactions }) => {
  const center = [4.5, 108.0]; // Centre of ASEAN region

  return (
    <div style={{ height: "400px", width: "100%", borderRadius: "12px", overflow: "hidden" }}>
      <MapContainer center={center} zoom={4} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        {transactions?.map((txn, idx) => {
          const lat = txn.location_coords?.lat ?? txn.latitude ?? txn.transaction?.latitude;
          const lng = txn.location_coords?.lng ?? txn.longitude ?? txn.transaction?.longitude;
          if (!lat || !lng) return null;

          const score = txn.risk_score ?? 0;
          const cls = riskClass(score);
          const color = RISK_COLORS[cls];
          const radius = cls === "high" ? 10 : cls === "medium" ? 7 : 5;

          return (
            <CircleMarker
              key={txn.txn_id || idx}
              center={[lat, lng]}
              radius={radius}
              pathOptions={{ fillColor: color, color: color, fillOpacity: 0.75, weight: 2 }}
            >
              <Popup>
                <div style={{ minWidth: "180px", fontSize: "0.85rem" }}>
                  <strong>Txn:</strong> {txn.txn_id}<br />
                  <strong>User:</strong> {txn.masked_user_id || txn.user_id}<br />
                  <strong>Amount:</strong> MYR {Number(txn.amount ?? 0).toFixed(2)}<br />
                  <strong>Risk Score:</strong> {score}<br />
                  <strong>Decision:</strong> {txn.decision}<br />
                  <strong>IP Risk:</strong> {txn.ip_risk || "—"}<br />
                  {txn.reasons?.length > 0 && (
                    <>
                      <strong>Reasons:</strong>
                      <ul style={{ margin: "4px 0 0 12px", padding: 0 }}>
                        {txn.reasons.map((r, i) => <li key={i}>{r}</li>)}
                      </ul>
                    </>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default FraudMap;
