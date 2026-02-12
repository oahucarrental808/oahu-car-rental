import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminGate from "../components/AdminGate";
import { buttonStyle, container, inputStyle, labelStyle, textareaStyle } from "../components/styles";
import { getTokenFromUrl, formatEmailPreviewText } from "../utils/adminUtils";
import { useProperties } from "../utils/useProperties";
import { useDebugMode } from "../utils/useDebugMode";

export default function AdminDropoffInstructions() {
  const [properties] = useProperties();
  const { debug: DEBUG } = useDebugMode();
  const token = useMemo(() => getTokenFromUrl(), []);

  // Use React Query for data fetching
  const { data: draft, isLoading: isLoadingDraft, error: draftError } = useQuery({
    queryKey: ['adminInstruction', token],
    queryFn: async () => {
      if (!token) throw new Error("Missing token.");
      const res = await fetch(`/api/decodeAdminInstructionLink?t=${encodeURIComponent(token)}`);
      if (!res.ok) throw new Error(await res.text());
      const out = await res.json();
      if (!out?.ok || !out?.draft) throw new Error("Invalid link");
      return out.draft;
    },
    enabled: !!token,
    retry: 1,
  });

  // Use derived state with default values from properties
  const defaultAddress = useMemo(() => properties?.addresses?.defaultDropoff || "", [properties]);
  const defaultInstructions = useMemo(() => properties?.admin?.pages?.dropoffInstructions?.defaultInstructions || "", [properties]);
  
  const [instructions, setInstructions] = useState("");
  const [address, setAddress] = useState("");

  // Set defaults when properties load (only if field is empty)
  useEffect(() => {
    if (defaultAddress && !address) {
      setAddress(defaultAddress);
    }
  }, [defaultAddress, address]);
  
  useEffect(() => {
    if (defaultInstructions && !instructions) {
      setInstructions(defaultInstructions);
    }
  }, [defaultInstructions, instructions]);

  const status = isLoadingDraft ? "loading" : draftError ? "error" : draft ? "ready" : "idle";
  const error = draftError?.message || "";

  const [submitStatus, setSubmitStatus] = useState("idle"); // idle | sending | sent | error
  const [submitError, setSubmitError] = useState("");
  const [mileageInUrl, setMileageInUrl] = useState("");
  const [debugEmail, setDebugEmail] = useState(null);

  const emailPreviewText = useMemo(
    () => formatEmailPreviewText(DEBUG, debugEmail, "Dropoff instructions"),
    [debugEmail]
  );

  async function onSubmit(e) {
    e.preventDefault();
    if (!token) return;

    try {
      setSubmitStatus("sending");
      setSubmitError("");
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
      setSubmitStatus("sent");
    } catch (e2) {
      console.error(e2);
      setSubmitStatus("error");
      setSubmitError(e2?.message || "Failed to submit.");
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

        {(error || submitError) ? (
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
            {error || submitError}
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
            disabled={status === "loading" || submitStatus === "sending"}
          >
            {submitStatus === "sending" 
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
