import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { ASEAN_LOCATIONS } from "./TransactionSimulator";

// ── Risk styling ─────────────────────────────────────────────────────────────
const RISK_COLORS = {
  low:    "#16a34a",
  medium: "#d97706",
  high:   "#dc2626",
};

function riskClass(score) {
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

// ── Capital / reference pins for all ASEAN countries ─────────────────────────
// These are displayed as small grey dots so the map always shows the full
// ASEAN region even when no transactions have been simulated yet.
const ASEAN_CAPITALS = [
  { name: "Kuala Lumpur",        country: "Malaysia",      lat: 3.1390,  lng: 101.6869 },
  { name: "Singapore",           country: "Singapore",     lat: 1.3521,  lng: 103.8198 },
  { name: "Jakarta",             country: "Indonesia",     lat: -6.2088, lng: 106.8456 },
  { name: "Bangkok",             country: "Thailand",      lat: 13.7563, lng: 100.5018 },
  { name: "Manila",              country: "Philippines",   lat: 14.5995, lng: 120.9842 },
  { name: "Hanoi",               country: "Vietnam",       lat: 21.0278, lng: 105.8342 },
  { name: "Naypyidaw",           country: "Myanmar",       lat: 19.7633, lng: 96.0785  },
  { name: "Phnom Penh",          country: "Cambodia",      lat: 11.5564, lng: 104.9282 },
  { name: "Vientiane",           country: "Laos",          lat: 17.9757, lng: 102.6331 },
  { name: "Bandar Seri Begawan", country: "Brunei",        lat: 4.9031,  lng: 114.9398 },
  { name: "Dili",                country: "Timor-Leste",   lat: -8.5569, lng: 125.5789 },
];

// ── Component ─────────────────────────────────────────────────────────────────
const FraudMap = ({ transactions }) => {
  // Centre on ASEAN — slightly north of equator, middle of the archipelago
  const center = [6.0, 113.0];

  return (
    <div style={{ height: "440px", width: "100%", borderRadius: "12px", overflow: "hidden" }}>
      <MapContainer
        center={center}
        zoom={4}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        {/* ── Static capital reference markers ─────────────────────────── */}
        {ASEAN_CAPITALS.map((cap) => (
          <CircleMarker
            key={`cap-${cap.name}`}
            center={[cap.lat, cap.lng]}
            radius={4}
            pathOptions={{
              fillColor: "#94a3b8",
              color: "#64748b",
              fillOpacity: 0.5,
              weight: 1,
            }}
          >
            <Tooltip direction="top" offset={[0, -4]} opacity={0.9}>
              <span style={{ fontSize: "0.78rem" }}>
                <strong>{cap.name}</strong><br />{cap.country}
              </span>
            </Tooltip>
          </CircleMarker>
        ))}

        {/* ── Live transaction markers ──────────────────────────────────── */}
        {transactions?.map((txn, idx) => {
          const lat = txn.location_coords?.lat ?? txn.latitude ?? txn.transaction?.latitude;
          const lng = txn.location_coords?.lng ?? txn.longitude ?? txn.transaction?.longitude;
          if (lat == null || lng == null) return null;

          const score  = txn.risk_score ?? 0;
          const cls    = riskClass(score);
          const color  = RISK_COLORS[cls];
          const radius = cls === "high" ? 11 : cls === "medium" ? 8 : 5;

          return (
            <CircleMarker
              key={txn.txn_id || idx}
              center={[lat, lng]}
              radius={radius}
              pathOptions={{
                fillColor: color,
                color: color,
                fillOpacity: 0.78,
                weight: 2,
              }}
            >
              <Popup>
                <div style={{ minWidth: "200px", fontSize: "0.83rem", lineHeight: 1.6 }}>
                  <strong style={{ fontSize: "0.9rem" }}>
                    {txn.decision === "block" ? "🚨" : txn.decision === "otp" ? "⚠️" : "✅"}
                    &nbsp;{(txn.decision || "").toUpperCase()}
                  </strong>
                  <hr style={{ margin: "4px 0" }} />
                  <strong>Txn ID:</strong> {txn.txn_id}<br />
                  <strong>User:</strong> {txn.masked_user_id || txn.user_id}<br />
                  <strong>Amount:</strong> MYR {Number(txn.amount ?? 0).toFixed(2)}<br />
                  <strong>Merchant:</strong> {txn.merchant_category || "—"}<br />
                  <strong>Risk Score:</strong>{" "}
                  <span style={{ color, fontWeight: 700 }}>{score}</span><br />
                  <strong>IP Risk:</strong> {txn.ip_risk || "—"}<br />
                  {txn.reasons?.length > 0 && (
                    <>
                      <strong>Reasons:</strong>
                      <ul style={{ margin: "4px 0 0 14px", padding: 0 }}>
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
