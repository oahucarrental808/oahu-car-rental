import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div style={{ width: "min(900px, 92%)", margin: "0 auto", padding: "28px 0 60px" }}>
      <h1 style={{ fontSize: "34px", margin: 0 }}>Page not found</h1>
      <p style={{ opacity: 0.9 }}>
        Go back <Link to="/" style={{ color: "white" }}>home</Link>.
      </p>
    </div>
  );
}

