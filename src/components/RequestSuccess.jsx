// RequestSuccess.jsx
import { Link, useLocation, Navigate } from "react-router-dom";
import { container } from "./styles";
import { useProperties } from "../utils/useProperties";

export default function RequestSuccess() {
  const [properties] = useProperties();
  const { state } = useLocation();

  // Optional guard: only allow access after a successful submit
  if (!state?.fromSubmit) return <Navigate to="/request" replace />;

  return (
    <div style={{ ...container, padding: "48px 0" }}>
      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
          background: "rgba(255,255,255,0.85)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          padding: 24,
          backdropFilter: "blur(10px)",
        }}
      >
        <div style={{ fontSize: 22, fontWeight: 900 }}>
          {properties?.requestSuccess?.title || "✅ Request received"}
        </div>
        <div style={{ marginTop: 10, opacity: 0.9, lineHeight: 1.5 }}>
          {properties?.requestSuccess?.message || "Thanks! We'll be in contact shortly with availability and next steps."}
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
          <Link to="/" className="button">
            {properties?.requestSuccess?.backToHome || properties?.common?.buttons?.backToHome || "Back to Home"}
          </Link>

          <Link to="/request" className="button button-secondary">
            {properties?.requestSuccess?.makeAnother || "Make another request"}
          </Link>
        </div>
      </div>
    </div>
  );
}
