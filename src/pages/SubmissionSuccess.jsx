// src/pages/SubmissionSuccess.jsx
import { Link, useLocation } from "react-router-dom";
import { useProperties } from "../utils/useProperties";
import SEO from "../components/SEO";
import heroImg from "../assets/hero.jpg";
import { container } from "../components/styles";

/**
 * Generic submission success page
 * Can be used for various form submissions
 */
export default function SubmissionSuccess() {
  const [properties] = useProperties();
  const { state } = useLocation();

  const submissionType = state?.type || "submission";
  const customMessage = state?.message;
  const customTitle = state?.title;

  const getTitle = () => {
    if (customTitle) return customTitle;
    return properties?.submissionSuccess?.title || 
           properties?.submissionSuccess?.[submissionType]?.title ||
           "Submission Successful";
  };

  const getMessage = () => {
    if (customMessage) return customMessage;
    return properties?.submissionSuccess?.message ||
           properties?.submissionSuccess?.[submissionType]?.message ||
           "Thank you! Your submission has been received successfully.";
  };

  return (
    <>
      <SEO
        title={getTitle() + " - Oahu Car Rentals"}
        description={getMessage()}
        image={heroImg}
      />
      {/* HERO */}
      <header className="hero" style={{ minHeight: "50vh" }}>
        <div
          className="hero-bg"
          style={{ backgroundImage: `url(${heroImg})` }}
          aria-label="Oahu Car Rentals - Beautiful Oahu landscape background"
        />
        <div className="hero-content" style={{ ...container, gridTemplateColumns: "1fr", textAlign: "center" }}>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <h1 style={{ fontSize: "32px", fontWeight: 900, marginBottom: 14 }}>
              {getTitle()}
            </h1>
            <p style={{ fontSize: "18px", opacity: 0.95, lineHeight: 1.6 }}>
              {getMessage()}
            </p>
          </div>
        </div>
      </header>
      <div
        style={{
          maxWidth: 700,
          margin: "0 auto",
          padding: "40px 16px",
          textAlign: "center",
        }}
      >

        {state?.additionalInfo && (
          <div
            style={{
              textAlign: "left",
              margin: "24px auto",
              maxWidth: 600,
              padding: 20,
              borderRadius: 12,
              background: "rgba(255,255,255,0.5)",
              border: "1px solid var(--border)",
            }}
          >
            {state.additionalInfo}
          </div>
        )}

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link to="/" className="button">
            {properties?.submissionSuccess?.backToHome || 
             properties?.common?.buttons?.backToHome || 
             "Back to Home"}
          </Link>
          {state?.backPath && (
            <Link to={state.backPath} className="button button-secondary">
              {state.backLabel || "Go Back"}
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
