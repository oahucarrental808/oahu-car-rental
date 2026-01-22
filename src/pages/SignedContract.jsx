import { useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { buttonStyle, inputStyle } from "../components/styles";

const DEBUG = import.meta.env.VITE_DEBUG_MODE === "true";

export default function SignedContract() {
  const [params] = useSearchParams();
  const token = params.get("t") || "";

  const [signedContract, setSignedContract] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | sending | done | error
  const [error, setError] = useState("");
  const [signedContractLink, setSignedContractLink] = useState("");
  const [debugEmail, setDebugEmail] = useState(null);

  const fileLabel = useMemo(() => {
    if (!signedContract) return "";
    const kb = Math.round((signedContract.size || 0) / 1024);
    return `${signedContract.name} (${kb} KB)`;
  }, [signedContract]);

  const debugEmailText = useMemo(() => {
    if (!DEBUG || !debugEmail) return "";
    const to = debugEmail?.to || "ADMIN";
    const subject = debugEmail?.subject || "Signed contract received";
    const body = debugEmail?.body || "";
    return [`To: ${to}`, `Subject: ${subject}`, ``, body].join("\n");
  }, [debugEmail]);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Missing link token.");
      return;
    }

    if (!signedContract) {
      setError("Please choose the signed contract PDF.");
      return;
    }

    setStatus("sending");

    try {
      const form = new FormData();
      form.append("signedContract", signedContract);

      const resp = await fetch(`/api/submitSignedContract?t=${encodeURIComponent(token)}`, {
        method: "POST",
        body: form,
      });

      const data = await resp.json().catch(() => ({}));
      if (!resp.ok || !data.ok) throw new Error(data.error || "Upload failed");

      setSignedContractLink(data.signedContractLink || "");
      setDebugEmail(data.debugEmail || null);
      setStatus("done");
    } catch (err) {
      console.error(err);
      setError(err?.message || "Upload failed");
      setStatus("error");
    }
  }

  return (
    <div style={{ width: "min(900px, 92%)", margin: "0 auto", padding: "28px 0 60px" }}>
      <h1 style={{ fontSize: "34px", margin: "0 0 10px" }}>Upload Signed Contract</h1>

      <div style={{ maxWidth: 680 }}>
        <p style={{ opacity: 0.9, lineHeight: 1.6, marginTop: 0 }}>
          Please upload a clear photo scan of your signed contract (PDF).
        </p>

        <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
          <label style={{ display: "grid", gap: 6, fontSize: 13, opacity: 0.95 }}>
            Signed contract (PDF)
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setSignedContract(e.target.files?.[0] || null)}
              style={inputStyle}
              required
            />
          </label>

          {fileLabel ? (
            <div style={{ fontSize: 13, opacity: 0.9 }}>Selected: {fileLabel}</div>
          ) : null}

          <button type="submit" disabled={status === "sending"} style={buttonStyle}>
            {status === "sending" ? "Uploading..." : "Upload Signed Contract"}
          </button>

          {error ? <div style={{ fontSize: 13, color: "salmon" }}>{error}</div> : null}

          {status === "done" ? (
            <div style={{ fontSize: 13, opacity: 0.95 }}>
              ✅ Signed contract uploaded.
            </div>
          ) : null}
        </form>

        {DEBUG && signedContractLink ? (
          <div
            style={{
              textAlign: "left",
              margin: "18px 0 0",
              padding: 14,
              borderRadius: 14,
              border: "1px solid var(--border)",
              background: "rgba(255,255,255,0.85)",
            }}
          >
            <div style={{ fontWeight: 900, marginBottom: 8 }}>Debug: Saved File</div>
            <input
              readOnly
              value={signedContractLink}
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 12,
                border: "1px solid var(--border)",
              }}
            />
            <div style={{ marginTop: 10 }}>
              <a className="button" href={signedContractLink} target="_blank" rel="noreferrer">
                Open in Google Drive
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

        <div style={{ marginTop: 18 }}>
          <Link to="/" className="button button-secondary">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
