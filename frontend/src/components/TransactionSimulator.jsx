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

const FraudMap = ({ transactions }) => {
  useEffect(() => {
    const map = L.map("fraud-map").setView([3.139, 101.6869], 5);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    transactions.forEach((txn) => {
      if (txn.location_coords) {
        // Pick icon based on decision
        let icon = greenIcon;
        if (txn.decision === "Requires Review") {
          icon = orangeIcon;
        } else if (txn.decision === "Declined") {
          icon = redIcon;
        }

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
    <div id="fraud-map" style={{ height: "400px", width: "100%" }}></div>
  );
};

export default FraudMap;

