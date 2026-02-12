import { useMemo, useState, useRef, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { buttonStyle, inputStyle } from "../components/styles";
import { useProperties } from "../utils/useProperties";

const DEBUG = import.meta.env.VITE_DEBUG_MODE === "true";

const FUEL_OPTIONS = ["E", "1/8", "1/4", "3/8", "1/2", "5/8", "3/4", "7/8", "F"];

function onlyInt(value) {
  return String(value || "").replace(/\D/g, "");
}

export default function MileageOut() {
  const [properties] = useProperties();
  const [params] = useSearchParams();
  const token = params.get("t") || "";

  const [mileageOut, setMileageOut] = useState("");
  const [fuelOut, setFuelOut] = useState("");
  const [dashboard, setDashboard] = useState(null);

  const [status, setStatus] = useState("idle"); // idle | submitting | done | error
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const cameraInputRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Detect mobile device
    const checkMobile = () => {
      if (typeof window === 'undefined' || typeof navigator === 'undefined') {
        return false;
      }
      try {
        const isTouchDevice = 'ontouchstart' in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);
        const isMobileUserAgent = navigator.userAgent && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        return isTouchDevice || isMobileUserAgent;
      } catch (e) {
        console.warn('Error detecting mobile device:', e);
        return false;
      }
    };
    setIsMobile(checkMobile());
  }, []);

  const dashboardMeta = useMemo(() => {
    if (!dashboard) return "";
    return `${dashboard.name} (${Math.round(dashboard.size / 1024)} KB)`;
  }, [dashboard]);

  const handleFileChange = (e) => {
    setDashboard(e.target.files?.[0] || null);
    // Reset the input so the same file can be selected again if needed
    e.target.value = "";
  };

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setResult(null);

    if (!token) {
      setError(properties?.mileageOut?.messages?.missingToken || properties?.common?.messages?.missingToken || "Missing token.");
      return;
    }
    if (!mileageOut) {
      setError(properties?.mileageOut?.messages?.mileageRequired || "Mileage is required.");
      return;
    }
    if (!fuelOut) {
      setError(properties?.mileageOut?.messages?.fuelRequired || "Fuel level is required.");
      return;
    }
    if (!dashboard) {
      setError(properties?.mileageOut?.messages?.dashboardRequired || "Dashboard photo is required.");
      return;
    }

    try {
      setStatus("submitting");

      const fd = new FormData();
      fd.append("mileageOut", mileageOut);
      fd.append("fuelOut", fuelOut);
      fd.append("dashboard", dashboard);

      const res = await fetch(`/api/submitMileageOut?t=${encodeURIComponent(token)}`, {
        method: "POST",
        body: fd,
      });

      if (!res.ok) throw new Error(await res.text());
      const out = await res.json();

      setResult(out);
      setStatus("done");
    } catch (err) {
      console.error(err);
      setStatus("error");
      setError(err?.message || properties?.mileageOut?.messages?.failed || properties?.common?.messages?.failed || "Failed to submit.");
    }
  }

  const debugEmailText = useMemo(() => {
    if (!DEBUG || !result?.debugEmail) return "";
    const to = result.debugEmail?.to || "CUSTOMER";
    const subject = result.debugEmail?.subject || "Return checklist";
    const body = result.debugEmail?.body || "";
    return [`To: ${to}`, `Subject: ${subject}`, ``, body].join("\n");
  }, [result]);

  return (
    <div className="intakeWrap">
      <h1 className="intakeHeader">
        {properties?.mileageOut?.title || "Mileage & Fuel (Pickup)"}
      </h1>

      <div className="intakeCard">
        <div style={{ opacity: 0.9, lineHeight: 1.5 }}>
          {properties?.mileageOut?.instructions || "Please enter the current mileage and fuel level at pickup, and upload a clear photo of the dashboard showing both."}
        </div>
      </div>

      <form className="intakeForm" onSubmit={onSubmit}>
        <section className="intakeCard">
          <h2>{properties?.mileageOut?.sectionTitle || "Pickup Details"}</h2>

          <div className="grid2">
            <div className="fieldRow">
              <div className="fieldLabel">
                {properties?.mileageOut?.labels?.mileage || "Mileage (integer)"}
              </div>
              <div className="fieldControl">
                <input
                  style={inputStyle}
                  inputMode="numeric"
                  value={mileageOut}
                  onChange={(e) => setMileageOut(onlyInt(e.target.value))}
                  placeholder={properties?.mileageOut?.placeholders?.mileage || "e.g. 58231"}
                />
              </div>
            </div>

            <div className="fieldRow">
              <div className="fieldLabel">
                {properties?.mileageOut?.labels?.fuelLevel || "Fuel Level"}
              </div>
              <div className="fieldControl">
                <select style={inputStyle} value={fuelOut} onChange={(e) => setFuelOut(e.target.value)}>
                  <option value="">{properties?.mileageOut?.placeholders?.select || "Select…"}</option>
                  {FUEL_OPTIONS.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="fieldRow" style={{ marginTop: 12 }}>
            <div className="fieldLabel">
              {properties?.mileageOut?.labels?.dashboardPhoto || "Dashboard Photo"}
            </div>
            <div className="fieldControl">
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
              <div style={{ display: "flex", gap: "10px" }}>
                {isMobile && (
                  <button
                    type="button"
                    style={{ ...buttonStyle, flex: 1 }}
                    onClick={handleCameraClick}
                  >
                    📷 Take Photo
                  </button>
                )}
                <button
                  type="button"
                  style={{ ...buttonStyle, flex: isMobile ? 1 : 1, width: isMobile ? "auto" : "100%" }}
                  onClick={handleUploadClick}
                >
                  📁 Upload File
                </button>
              </div>
              {dashboardMeta ? (
                <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>{dashboardMeta}</div>
              ) : null}
            </div>
          </div>

          {error ? (
            <div className="fieldError" style={{ marginTop: 10 }}>
              {error}
            </div>
          ) : null}

          <div style={{ marginTop: 14 }}>
            <button
              type="submit"
              style={{ ...buttonStyle, width: "100%", display: "block" }}
              disabled={status === "submitting"}
            >
              {status === "submitting" 
                ? (properties?.mileageOut?.buttons?.submitting || properties?.common?.buttons?.submitting || "Submitting...")
                : (properties?.mileageOut?.buttons?.submit || "Submit Pickup Info")}
            </button>
          </div>
        </section>

        {status === "done" ? (
          <section className="intakeCard">
            <h2>Submitted</h2>

            {DEBUG && result?.mileageInUrl ? (
              <>
                <div style={{ fontWeight: 800, marginBottom: 8 }}>
                  {properties?.mileageOut?.debug?.mileageInLink || "Debug: Mileage In Link"}
                </div>
                <input
                  readOnly
                  value={result.mileageInUrl}
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 12,
                    border: "1px solid var(--border)",
                  }}
                />
                <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <a className="button" href={result.mileageInUrl}>
                    {properties?.mileageOut?.debug?.openMileageIn || "Open Mileage In"}
                  </a>
                  <Link className="button button-secondary" to="/">
                    {properties?.common?.buttons?.backToHome || "Back to Home"}
                  </Link>
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
              </>
            ) : (
              <div style={{ opacity: 0.9, lineHeight: 1.5 }}>
                {properties?.mileageOut?.messages?.submitted || "Thanks! Your pickup mileage and fuel have been recorded."}
                <br />
                {properties?.mileageOut?.messages?.closePage || "You can close this page."}
              </div>
            )}
          </section>
        ) : null}
      </form>
    </div>
  );
}
