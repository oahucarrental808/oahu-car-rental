import { useEffect, useMemo, useState } from "react";
import AdminGate from "../components/AdminGate";
import { buttonStyle, container, inputStyle, labelStyle, textareaStyle } from "../components/styles";
import { getTokenFromUrl, formatEmailPreviewText } from "../utils/adminUtils";

const DEBUG = import.meta.env.VITE_DEBUG_MODE === "true";

// Default pickup address - can be overwritten by TJ
const DEFAULT_PICKUP_ADDRESS = "123 Main Street, Honolulu, HI 96815";

export default function AdminPickupInstructions() {
  const [token, setToken] = useState("");
  const [draft, setDraft] = useState(null);
  const [instructions, setInstructions] = useState("");
  const [address, setAddress] = useState(DEFAULT_PICKUP_ADDRESS);
  const [status, setStatus] = useState("idle"); // idle | loading | ready | sending | sent | error
  const [error, setError] = useState("");

  const [mileageOutUrl, setMileageOutUrl] = useState("");
  const [debugEmail, setDebugEmail] = useState(null);

  useEffect(() => {
    const t = getTokenFromUrl();
    setToken(t);

    if (!t) {
      setStatus("error");
      setError("Missing token.");
      return;
    }

    (async () => {
      try {
        setStatus("loading");
        setError("");

        const res = await fetch(`/api/decodeAdminInstructionLink?t=${encodeURIComponent(t)}`);
        if (!res.ok) throw new Error(await res.text());
        const out = await res.json();
        if (!out?.ok || !out?.draft) throw new Error("Invalid link");

        setDraft(out.draft);
        setStatus("ready");
      } catch (e) {
        console.error(e);
        setStatus("error");
        setError(e?.message || "Invalid or expired link.");
      }
    })();
  }, []);

  const emailPreviewText = useMemo(
    () => formatEmailPreviewText(DEBUG, debugEmail, "Pickup instructions"),
    [debugEmail]
  );

  async function onSubmit(e) {
    e.preventDefault();
    if (!token) return;

    try {
      setStatus("sending");
      setError("");
      setMileageOutUrl("");
      setDebugEmail(null);

      const res = await fetch(`/api/createPickupMileageLink?t=${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instructions, address }),
      });

      if (!res.ok) throw new Error(await res.text());
      const out = await res.json();
      if (!out?.ok || !out?.mileageOutUrl) throw new Error("Failed to generate pickup link");

      setMileageOutUrl(out.mileageOutUrl);
      if (out?.debugEmail) setDebugEmail(out.debugEmail);
      setStatus("sent");
    } catch (e2) {
      console.error(e2);
      setStatus("error");
      setError(e2?.message || "Failed to submit.");
    }
  }

  return (
    <AdminGate title="Admin: Pickup Instructions">
      <div style={container}>
        <h1 style={{ marginBottom: 8 }}>Pickup Instructions</h1>

        {draft ? (
          <div style={{ marginBottom: 16, opacity: 0.9 }}>
            <div style={{ fontWeight: 800 }}>VIN: {draft.vin}</div>
            <div>Start: {draft.startDate}</div>
            <div>End: {draft.endDate}</div>
            <div>Customer: {draft.customerEmail}</div>
          </div>
        ) : null}

        {error ? (
          <div
            style={{
              marginBottom: 16,
              padding: 12,
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "rgba(255,255,255,0.85)",
              color: "var(--danger)",
            }}
          >
            {error}
          </div>
        ) : null}

        <form onSubmit={onSubmit}>
          <label style={labelStyle}>
            Pickup Address
            <input
              style={inputStyle}
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Pickup address"
            />
          </label>

          <label style={labelStyle}>Pickup instructions (optional)</label>
          <textarea
            style={textareaStyle}
            rows={7}
            placeholder="Where to meet, what to bring, parking notes, etc."
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
          />

          <button
            type="submit"
            className="button"
            style={{ ...buttonStyle, width: "100%", marginTop: 14 }}
            disabled={status === "loading" || status === "sending"}
          >
            {status === "sending" ? "Generating..." : "Generate Pickup Link"}
          </button>
        </form>

        {mileageOutUrl ? (
          <div
            style={{
              marginTop: 18,
              textAlign: "left",
              padding: 14,
              borderRadius: 14,
              border: "1px solid var(--border)",
              background: "rgba(255,255,255,0.85)",
            }}
          >
            <div style={{ fontWeight: 900, marginBottom: 8 }}>Customer Pickup Link (Mileage Out)</div>
            <input readOnly value={mileageOutUrl} style={inputStyle} />
            <div style={{ marginTop: 10 }}>
              <a className="button" href={mileageOutUrl}>
                Open Mileage Out
              </a>
            </div>

            {emailPreviewText ? (
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
                  {emailPreviewText}
                </pre>
              </div>
            ) : null}

            {!DEBUG ? (
              <div style={{ marginTop: 10, opacity: 0.8 }}>
                {/* TODO (non-debug): send email to customer */}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </AdminGate>
  );
}
