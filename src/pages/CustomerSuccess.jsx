import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const DEBUG = import.meta.env.VITE_DEBUG_MODE === "true";

export default function CustomerSuccess() {
  const [mileageOutUrl, setMileageOutUrl] = useState("");
  const [signedContractUrl, setSignedContractUrl] = useState("");
  const [debugEmail, setDebugEmail] = useState(null);
  const [debugSignedEmail, setDebugSignedEmail] = useState(null);

  useEffect(() => {
    if (!DEBUG) return;

    try {
      const url = sessionStorage.getItem("debug:mileageOutUrl") || "";
      const emailRaw = sessionStorage.getItem("debug:mileageOutEmail");

      const signedUrl = sessionStorage.getItem("debug:signedContractUrl") || "";
      const signedEmailRaw = sessionStorage.getItem("debug:signedContractEmail");

      setMileageOutUrl(url);
      setSignedContractUrl(signedUrl);

      if (emailRaw) {
        try {
          setDebugEmail(JSON.parse(emailRaw));
        } catch {
          setDebugEmail(null);
        }
      } else {
        setDebugEmail(null);
      }

      if (signedEmailRaw) {
        try {
          setDebugSignedEmail(JSON.parse(signedEmailRaw));
        } catch {
          setDebugSignedEmail(null);
        }
      } else {
        setDebugSignedEmail(null);
      }
    } catch {
      // ignore
    }
  }, []);

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
    <div
      style={{
        maxWidth: 700,
        margin: "0 auto",
        padding: "40px 16px",
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: "1.8rem", marginBottom: 16 }}>Thank you!</h1>
      <p style={{ marginBottom: 24 }}>
        Your information has been submitted successfully.
        <br />
        If you need to correct or update anything, please contact us.
      </p>

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
          <div style={{ fontWeight: 900, marginBottom: 8 }}>Debug: Mileage Out Link</div>
          <input
            readOnly
            value={mileageOutUrl}
            style={{ width: "100%", padding: 10, borderRadius: 12, border: "1px solid var(--border)" }}
          />
          <div style={{ marginTop: 10 }}>
            <a className="button" href={mileageOutUrl}>
              Open Mileage Out
            </a>
          </div>

          {debugEmailText ? (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontWeight: 900, marginBottom: 8 }}>Debug Email Preview</div>
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
          <div style={{ fontWeight: 900, marginBottom: 8 }}>Debug: Signed Contract Upload Link</div>
          <input
            readOnly
            value={signedContractUrl}
            style={{ width: "100%", padding: 10, borderRadius: 12, border: "1px solid var(--border)" }}
          />
          <div style={{ marginTop: 10 }}>
            <a className="button" href={signedContractUrl}>
              Upload Signed Contract
            </a>
          </div>

          {debugSignedEmailText ? (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontWeight: 900, marginBottom: 8 }}>Debug Email Preview</div>
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
        Back to Home
      </Link>
    </div>
  );
}
