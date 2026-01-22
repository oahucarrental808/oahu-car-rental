import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useProperties } from "../utils/useProperties";
import suvImg from "../assets/suv.jpg";

export default function TopNav() {
  const [properties] = useProperties();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname]);

  useEffect(() => {
    function onDown(e) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setOpen(false);
    }
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, []);

  return (
    <div className="topnav">
      <div className="topnav-inner">
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <Link to="/" className="topnav-brand">
            {properties?.brand?.name || "Oahu Car Rentals"}
          </Link>
          <img 
            src={suvImg} 
            alt="Jeep" 
            style={{ 
              width: "120px", 
              height: "auto", 
              borderRadius: "8px",
              border: "1px solid var(--border)",
              display: "block"
            }} 
          />
        </div>

        <div className="topnav-right">
          <div ref={menuRef} className="topnav-menu">
            <button
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-haspopup="menu"
              aria-label="Open menu"
              className="menu-button"
              type="button"
            >
              <span className="menu-bar" />
              <span className="menu-bar" />
              <span className="menu-bar" />
              <span className="menu-text">{properties?.navigation?.menu || "Menu"}</span>
            </button>

            {open && (
              <div role="menu" className="menu-dropdown">
                <DropItem to="/" label={properties?.navigation?.home || "Home"} />
                <DropItem to="/gallery" label={properties?.navigation?.gallery || "Gallery"} />
                <DropItem to="/request" label={properties?.navigation?.request || "Request"} />
                <DropItem to="/faq" label={properties?.navigation?.faq || "FAQ"} />
                <DropItem to="/about" label={properties?.navigation?.about || "About Us"} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DropItem({ to, label }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        "menu-item" + (isActive ? " menu-item-active" : "")
      }
    >
      {label}
    </NavLink>
  );
}