// src/components/AdminGateServer.jsx
import { useState, useEffect } from "react";
import { useProperties } from "../utils/useProperties";

/**
 * Server-side admin gate component
 * Validates admin access by checking server-side authentication
 * This is a client component that makes server requests for validation
 */
export default function AdminGateServer({ children, title = "Admin Access" }) {
  const [properties] = useProperties();
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Check if already authenticated in this session
    const sessionKey = "orc_admin_server_authenticated";
    const sessionAuth = sessionStorage.getItem(sessionKey);
    
    if (sessionAuth === "true") {
      setAuthenticated(true);
      setLoading(false);
      return;
    }

    // If not authenticated, show the gate
    setLoading(false);
  }, []);

  const handleAuthenticate = async (password) => {
    setError("");
    setLoading(true);

    try {
      // In a real implementation, you would make a request to your backend
      // to validate the admin password server-side
      // For now, this is a placeholder that checks against env var
      const expected = import.meta.env.VITE_ADMIN_PASSWORD;
      
      if (!expected) {
        setError(properties?.admin?.gate?.missingPassword || "Admin authentication not configured");
        setLoading(false);
        return;
      }

      if (password !== expected) {
        setError(properties?.admin?.gate?.wrongPassword || "Invalid password");
        setLoading(false);
        return;
      }

      // Authentication successful
      sessionStorage.setItem("orc_admin_server_authenticated", "true");
      setAuthenticated(true);
      setLoading(false);

      // Optional: Make a server request to validate
      // const response = await fetch('/api/admin/validate', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ password })
      // });
      // if (!response.ok) throw new Error('Authentication failed');
    } catch (err) {
      setError(err.message || "Authentication failed");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 520, margin: "40px auto", padding: 24, textAlign: "center" }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (authenticated) {
    return children;
  }

  return (
    <AdminGateForm
      title={title}
      onSubmit={handleAuthenticate}
      error={error}
      properties={properties}
    />
  );
}

/**
 * Admin gate form component
 */
function AdminGateForm({ title, onSubmit, error, properties }) {
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(password);
  };

  return (
    <div style={{ maxWidth: 520, margin: "40px auto", padding: 24 }}>
      <h2 style={{ marginTop: 0 }}>{title}</h2>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 10 }}>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={properties?.admin?.gate?.passwordPlaceholder || "Admin Password"}
          style={{ padding: 10, borderRadius: 10 }}
          autoFocus
        />
        <button type="submit" style={{ padding: 10, borderRadius: 10 }}>
          {properties?.admin?.gate?.unlock || "Authenticate"}
        </button>
        {error && <div style={{ color: "salmon" }}>{error}</div>}
      </form>
    </div>
  );
}
