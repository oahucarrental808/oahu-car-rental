import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useProperties } from "../utils/useProperties";
import { useDebugMode } from "../utils/useDebugMode";
import heroImg from "../assets/hero.jpg";
import { container } from "../components/styles";

export default function CustomerSuccess() {
  const [properties] = useProperties();
  const { debug: DEBUG } = useDebugMode();

  // Read from sessionStorage using useMemo (derived state)
  const { mileageOutUrl, signedContractUrl, debugEmail, debugSignedEmail } = useMemo(() => {
    if (!DEBUG) {
      return {
        mileageOutUrl: "",
        signedContractUrl: "",
        debugEmail: null,
        debugSignedEmail: null,
      };
    }

    try {
      const url = sessionStorage.getItem("debug:mileageOutUrl") || "";
      const emailRaw = sessionStorage.getItem("debug:mileageOutEmail");

      const signedUrl = sessionStorage.getItem("debug:signedContractUrl") || "";
      const signedEmailRaw = sessionStorage.getItem("debug:signedContractEmail");

      let email = null;
      if (emailRaw) {
        try {
          email = JSON.parse(emailRaw);
        } catch {
          email = null;
        }
      }

      let signedEmail = null;
      if (signedEmailRaw) {
        try {
          signedEmail = JSON.parse(signedEmailRaw);
        } catch {
          signedEmail = null;
        }
      }

      return {
        mileageOutUrl: url,
        signedContractUrl: signedUrl,
        debugEmail: email,
        debugSignedEmail: signedEmail,
      };
    } catch {
      return {
        mileageOutUrl: "",
        signedContractUrl: "",
        debugEmail: null,
        debugSignedEmail: null,
      };
    }
  }, [DEBUG]);

  const debugEmailText = useMemo(() => {
    if (!DEBUG || !debugEmail) return "";
    const to = debugEmail?.to || "CUSTOMER";
    const subject = debugEmail?.subject || "Pickup checklist";
    const body = debugEmail?.body || "";
    return [`To: ${to}`, `Subject: ${subject}`, ``, body].join("\n");
  }, [debugEmail]);

  const debugSignedEmailText = useMemo(() => {
    if (!DEBUG || !debugSignedEmail) return "";
    const to = debugSignedEmail?.to || "CUSTOMER";
    const subject = debugSignedEmail?.subject || "Upload signed contract";
    const body = debugSignedEmail?.body || "";
    return [`To: ${to}`, `Subject: ${subject}`, ``, body].join("\n");
  }, [debugSignedEmail]);

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
            <h1 style={{ fontSize: "32px", fontWeight: 900, marginBottom: 14 }}>
              {properties?.customerSuccess?.title || "Thank you!"}
            </h1>
            <p style={{ fontSize: "18px", opacity: 0.95, lineHeight: 1.6 }}>
              {properties?.customerSuccess?.message || "Your information has been submitted successfully."}
              <br />
              {properties?.customerSuccess?.contactMessage || "If you need to correct or update anything, please contact us."}
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

      {DEBUG && mileageOutUrl ? (
        <div
          style={{
            textAlign: "left",
            margin: "0 auto 22px",
            maxWidth: 680,
            padding: 14,
            borderRadius: 14,
            border: "1px solid var(--border)",
            background: "rgba(255,255,255,0.85)",
          }}
        >
          <div style={{ fontWeight: 900, marginBottom: 8 }}>
            {properties?.customerSuccess?.debug?.mileageOutLink || "Debug: Mileage Out Link"}
          </div>
          <input
            readOnly
            value={mileageOutUrl}
            style={{ width: "100%", padding: 10, borderRadius: 12, border: "1px solid var(--border)" }}
          />
          <div style={{ marginTop: 10 }}>
            <a className="button" href={mileageOutUrl}>
              {properties?.customerSuccess?.debug?.openMileageOut || "Open Mileage Out"}
            </a>
          </div>

          {debugEmailText ? (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontWeight: 900, marginBottom: 8 }}>
                {properties?.admin?.common?.debugEmailPreview || "Debug Email Preview"}
              </div>
              <pre
                style={{
                  margin: 0,
                  padding: 12,
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                  background: "rgba(255,255,255,0.9)",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {debugEmailText}
              </pre>
            </div>
          ) : null}
        </div>
      ) : null}

      {DEBUG && signedContractUrl ? (
        <div
          style={{
            textAlign: "left",
            margin: "0 auto 22px",
            maxWidth: 680,
            padding: 14,
            borderRadius: 14,
            border: "1px solid var(--border)",
            background: "rgba(255,255,255,0.85)",
          }}
        >
          <div style={{ fontWeight: 900, marginBottom: 8 }}>
            {properties?.customerSuccess?.debug?.signedContractLink || "Debug: Signed Contract Upload Link"}
          </div>
          <input
            readOnly
            value={signedContractUrl}
            style={{ width: "100%", padding: 10, borderRadius: 12, border: "1px solid var(--border)" }}
          />
          <div style={{ marginTop: 10 }}>
            <a className="button" href={signedContractUrl}>
              {properties?.customerSuccess?.debug?.uploadSignedContract || "Upload Signed Contract"}
            </a>
          </div>

          {debugSignedEmailText ? (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontWeight: 900, marginBottom: 8 }}>
                {properties?.admin?.common?.debugEmailPreview || "Debug Email Preview"}
              </div>
              <pre
                style={{
                  margin: 0,
                  padding: 12,
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                  background: "rgba(255,255,255,0.9)",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {debugSignedEmailText}
              </pre>
            </div>
          ) : null}
        </div>
      ) : null}

      <Link to="/" className="button">
        {properties?.customerSuccess?.backToHome || properties?.common?.buttons?.backToHome || "Back to Home"}
      </Link>
      </div>
    </>
  );
}
