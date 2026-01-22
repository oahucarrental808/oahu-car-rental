import { Link } from "react-router-dom";
import { useProperties } from "../utils/useProperties";

export default function NotFound() {
  const [properties] = useProperties();
  
  return (
    <div style={{ width: "min(900px, 92%)", margin: "0 auto", padding: "28px 0 60px" }}>
      <h1 style={{ fontSize: "34px", margin: 0 }}>
        {properties?.notFound?.title || "Page not found"}
      </h1>
      <p style={{ opacity: 0.9 }}>
        {properties?.notFound?.message || "Go back"} <Link to="/" style={{ color: "white" }}>
          {properties?.notFound?.homeLink || "home"}
        </Link>.
      </p>
    </div>
  );
}

