import { useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const FraudMap = ({ transactions }) => {
  useEffect(() => {
    // Initialize map
    const map = L.map("fraud-map").setView([3.139, 101.6869], 6); // Default: Kuala Lumpur

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors"
    }).addTo(map);

    // Plot transactions
    transactions.forEach(txn => {
      if (txn.location_coords) {
        const marker = L.marker([txn.location_coords.lat, txn.location_coords.lng]).addTo(map);
        marker.bindPopup(`
          <b>User:</b> ${txn.user_id || txn.user}<br/>
          <b>Amount:</b> $${txn.amount}<br/>
          <b>Risk:</b> ${txn.risk_score || txn.risk}<br/>
          <b>Decision:</b> ${txn.decision}
        `);
      }
    });

    return () => map.remove(); // Cleanup
  }, [transactions]);

  return <div id="fraud-map" style={{ height: "400px", width: "100%" }}></div>;
};

export default FraudMap;
