// RequestSuccess.jsx
import { Link, useLocation, Navigate } from "react-router-dom";
import { container } from "./styles";
import { useProperties } from "../utils/useProperties";
import heroImg from "../assets/hero.jpg";

export default function RequestSuccess() {
  const [properties] = useProperties();
  const { state } = useLocation();

  // Optional guard: only allow access after a successful submit
  if (!state?.fromSubmit) return <Navigate to="/request" replace />;

  return (
    <>
      {/* HERO */}
      <header className="hero" style={{ minHeight: "50vh" }}>
        <div
          className="hero-bg"
          style={{ backgroundImage: `url(${heroImg})` }}
          aria-label="Oahu Car Rentals - Beautiful Oahu landscape background"
        />
        <div className="hero-content" style={{ ...container, gridTemplateColumns: "1fr", textAlign: "center" }}>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <div style={{ fontSize: 32, fontWeight: 900, marginBottom: 14 }}>
              {properties?.requestSuccess?.title || "✅ Request received"}
            </div>
            <div style={{ fontSize: "18px", opacity: 0.95, lineHeight: 1.6 }}>
              {properties?.requestSuccess?.message || "Thanks! We'll be in contact shortly with availability and next steps."}
            </div>
          </div>
        </div>
      </header>
      <div style={{ ...container, padding: "48px 0" }}>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <Link to="/" className="button">
            {properties?.requestSuccess?.backToHome || properties?.common?.buttons?.backToHome || "Back to Home"}
          </Link>

          <Link to="/request" className="button button-secondary">
            {properties?.requestSuccess?.makeAnother || "Make another request"}
          </Link>
        </div>
      </div>
    </>
  );
}
