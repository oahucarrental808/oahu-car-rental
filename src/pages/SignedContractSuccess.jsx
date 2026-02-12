// src/pages/SignedContractSuccess.jsx
import { Link } from "react-router-dom";
import { useProperties } from "../utils/useProperties";
import SEO from "../components/SEO";
import heroImg from "../assets/hero.jpg";
import { container } from "../components/styles";

export default function SignedContractSuccess() {
  const [properties] = useProperties();

  return (
    <>
      <SEO
        title={properties?.signedContractSuccess?.seoTitle || "Contract Submitted - Oahu Car Rentals"}
        description={properties?.signedContractSuccess?.seoDescription || "Your signed contract has been successfully submitted."}
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
              {properties?.signedContractSuccess?.title || "Contract Submitted Successfully"}
            </h1>
            <p style={{ fontSize: "18px", marginBottom: 16, lineHeight: 1.6, opacity: 0.95 }}>
              {properties?.signedContractSuccess?.message || 
                "Thank you! Your signed contract has been received. We'll review it and be in touch soon with next steps."}
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

        {properties?.signedContractSuccess?.nextSteps && (
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
            <h2 style={{ fontSize: "18px", marginTop: 0, marginBottom: 12 }}>
              {properties.signedContractSuccess.nextStepsTitle || "What's Next?"}
            </h2>
            <ul style={{ margin: 0, paddingLeft: 20, opacity: 0.9, lineHeight: 1.8 }}>
              {properties.signedContractSuccess.nextSteps.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ul>
          </div>
        )}

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link to="/" className="button">
            {properties?.signedContractSuccess?.backToHome || 
             properties?.common?.buttons?.backToHome || 
             "Back to Home"}
          </Link>
        </div>
      </div>
    </>
  );
}
