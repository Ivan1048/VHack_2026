import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/", icon: "🏠", label: "Home" },
  { to: "/dashboard", icon: "📊", label: "Dashboard" },
  { to: "/analytics", icon: "🔬", label: "Analytics" },
  { to: "/user-profile", icon: "👤", label: "User Profile" },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-logo">🛡️</span>
        <span className="sidebar-title">FraudShield</span>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `sidebar-link${isActive ? " sidebar-link--active" : ""}`
            }
          >
            <span className="sidebar-link-icon">{item.icon}</span>
            <span className="sidebar-link-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-sdg">
          <span className="sdg-badge">SDG 8</span>
          <span className="sdg-text">Decent Work &amp; Economic Growth</span>
        </div>
      </div>
    </aside>
  );
}
