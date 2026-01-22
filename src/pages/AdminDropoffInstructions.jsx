import { useEffect, useMemo, useState } from "react";
import AdminGate from "../components/AdminGate";
import { buttonStyle, container, inputStyle, labelStyle, textareaStyle } from "../components/styles";
import { getTokenFromUrl, formatEmailPreviewText } from "../utils/adminUtils";
import { useProperties } from "../utils/useProperties";

const DEBUG = import.meta.env.VITE_DEBUG_MODE === "true";

export default function AdminDropoffInstructions() {
  const [properties] = useProperties();
  const [token, setToken] = useState("");
  const [draft, setDraft] = useState(null);
  const [instructions, setInstructions] = useState("");
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | ready | sending | sent | error
  const [error, setError] = useState("");

  const [mileageInUrl, setMileageInUrl] = useState("");
  const [debugEmail, setDebugEmail] = useState(null);

  // Set default address when properties load
  useEffect(() => {
    if (properties?.addresses?.defaultDropoff && !address) {
      setAddress(properties.addresses.defaultDropoff);
    }
  }, [properties, address]);

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
    () => formatEmailPreviewText(DEBUG, debugEmail, "Dropoff instructions"),
    [debugEmail]
  );

  async function onSubmit(e) {
    e.preventDefault();
    if (!token) return;

    try {
      setStatus("sending");
      setError("");
      setMileageInUrl("");
      setDebugEmail(null);

      const res = await fetch(`/api/createDropoffMileageLink?t=${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instructions, address }),
      });

      if (!res.ok) throw new Error(await res.text());
      const out = await res.json();
      if (!out?.ok || !out?.mileageInUrl) throw new Error("Failed to generate dropoff link");

      setMileageInUrl(out.mileageInUrl);
      if (out?.debugEmail) setDebugEmail(out.debugEmail);
      setStatus("sent");
    } catch (e2) {
      console.error(e2);
      setStatus("error");
      setError(e2?.message || "Failed to submit.");
    }
  }

  return (
    <AdminGate title={properties?.admin?.titles?.dropoffInstructions || "Admin: Dropoff Instructions"}>
      <div style={container}>
        <h1 style={{ marginBottom: 8 }}>
          {properties?.admin?.pages?.dropoffInstructions?.title || "Dropoff Instructions"}
        </h1>

        {draft ? (
          <div style={{ marginBottom: 16, opacity: 0.9 }}>
            <div style={{ fontWeight: 800 }}>
              {properties?.admin?.pages?.pickupInstructions?.draftLabels?.vin || "VIN:"} {draft.vin}
            </div>
            <div>
              {properties?.admin?.pages?.pickupInstructions?.draftLabels?.start || "Start:"} {draft.startDate}
            </div>
            <div>
              {properties?.admin?.pages?.pickupInstructions?.draftLabels?.end || "End:"} {draft.endDate}
            </div>
            <div>
              {properties?.admin?.pages?.pickupInstructions?.draftLabels?.customer || "Customer:"} {draft.customerEmail}
            </div>
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
            {properties?.admin?.pages?.dropoffInstructions?.labels?.dropoffAddress || "Dropoff Address"}
            <input
              style={inputStyle}
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={properties?.admin?.pages?.dropoffInstructions?.placeholders?.dropoffAddress || "Dropoff address"}
            />
          </label>

          <label style={labelStyle}>
            {properties?.admin?.pages?.dropoffInstructions?.labels?.dropoffInstructions || "Dropoff instructions (optional)"}
          </label>
          <textarea
            style={textareaStyle}
            rows={7}
            placeholder={properties?.admin?.pages?.dropoffInstructions?.placeholders?.dropoffInstructions || "Where to park, what to do with keys, photos to take, etc."}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
          />

          <button
            type="submit"
            className="button"
            style={{ ...buttonStyle, width: "100%", marginTop: 14 }}
            disabled={status === "loading" || status === "sending"}
          >
            {status === "sending" 
              ? (properties?.common?.buttons?.generating || "Generating...")
              : (properties?.admin?.pages?.dropoffInstructions?.buttons?.generate || "Generate Dropoff Link")}
          </button>
        </form>

        {mileageInUrl ? (
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
            <div style={{ fontWeight: 900, marginBottom: 8 }}>
              {properties?.admin?.common?.customerReturnLink || "Customer Return Link (Mileage In)"}
            </div>
            <input readOnly value={mileageInUrl} style={inputStyle} />
            <div style={{ marginTop: 10 }}>
              <a className="button" href={mileageInUrl}>
                {properties?.mileageIn?.buttons?.openMileageIn || "Open Mileage In"}
              </a>
            </div>

            {emailPreviewText ? (
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
