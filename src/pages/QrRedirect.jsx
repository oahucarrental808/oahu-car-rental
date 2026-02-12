// src/pages/QrRedirect.jsx
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useProperties } from "../utils/useProperties";

/**
 * QR code redirect page
 * Handles QR code scans and redirects to appropriate pages
 */
export default function QrRedirect() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [properties] = useProperties();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = searchParams.get("t");
    const type = searchParams.get("type");

    if (!token) {
      setError(properties?.qrRedirect?.noToken || "No token provided");
      setLoading(false);
      return;
    }

    // Determine redirect based on type or token structure
    let redirectPath = "";

    if (type) {
      // Redirect based on explicit type parameter
      switch (type) {
        case "mileage-out":
        case "pickup":
          redirectPath = `/mileageOut?t=${encodeURIComponent(token)}`;
          break;
        case "mileage-in":
        case "dropoff":
          redirectPath = `/mileageIn?t=${encodeURIComponent(token)}`;
          break;
        case "customer-info":
          redirectPath = `/admin/customer-info?t=${encodeURIComponent(token)}`;
          break;
        case "signed-contract":
          redirectPath = `/signedContract?t=${encodeURIComponent(token)}`;
          break;
        default:
          setError(properties?.qrRedirect?.invalidType || "Invalid QR code type");
          setLoading(false);
          return;
      }
    } else {
      // Try to infer type from token or default to mileage-out
      // In a real implementation, you might decode the token to determine type
      redirectPath = `/mileageOut?t=${encodeURIComponent(token)}`;
    }

    if (redirectPath) {
      navigate(redirectPath, { replace: true });
    } else {
      setError(properties?.qrRedirect?.invalidToken || "Invalid QR code");
      setLoading(false);
    }
  }, [searchParams, navigate, properties]);

  if (loading) {
    return (
      <div
        style={{
          maxWidth: 600,
          margin: "40px auto",
          padding: 24,
          textAlign: "center",
        }}
      >
        <p>{properties?.qrRedirect?.loading || "Redirecting..."}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          maxWidth: 600,
          margin: "40px auto",
          padding: 24,
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: "24px", marginBottom: 16, color: "#d32f2f" }}>
          {properties?.qrRedirect?.errorTitle || "QR Code Error"}
        </h1>
        <p style={{ marginBottom: 24, opacity: 0.8 }}>{error}</p>
        <a href="/" className="button">
          {properties?.qrRedirect?.goHome || "Go Home"}
        </a>
      </div>
    );
  }

  return null;
}
