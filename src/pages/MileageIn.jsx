import { useMemo, useState, useRef, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { buttonStyle, inputStyle, textareaStyle } from "../components/styles";
import { useProperties } from "../utils/useProperties";

const DEBUG = import.meta.env.VITE_DEBUG_MODE === "true";

const FUEL_OPTIONS = ["E", "1/8", "1/4", "3/8", "1/2", "5/8", "3/4", "7/8", "F"];

function onlyInt(value) {
  return String(value || "").replace(/\D/g, "");
}

export default function MileageIn() {
  const [properties] = useProperties();
  const [params] = useSearchParams();
  const token = params.get("t") || "";

  const [mileageIn, setMileageIn] = useState("");
  const [fuelIn, setFuelIn] = useState("");
  const [dashboard, setDashboard] = useState(null);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");

  const [status, setStatus] = useState("idle"); // idle | submitting | done | error
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const dashboardMeta = useMemo(() => {
    if (!dashboard) return "";
    return `${dashboard.name} (${Math.round(dashboard.size / 1024)} KB)`;
  }, [dashboard]);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setResult(null);

    if (!token) {
      setError(properties?.mileageIn?.messages?.missingToken || properties?.common?.messages?.missingToken || "Missing token.");
      return;
    }
    if (!mileageIn) {
      setError(properties?.mileageIn?.messages?.mileageRequired || "Mileage is required.");
      return;
    }
    if (!fuelIn) {
      setError(properties?.mileageIn?.messages?.fuelRequired || "Fuel level is required.");
      return;
    }
    if (!dashboard) {
      setError(properties?.mileageIn?.messages?.dashboardRequired || "Dashboard photo is required.");
      return;
    }

    try {
      setStatus("submitting");

      const fd = new FormData();
      fd.append("mileageIn", mileageIn);
      fd.append("fuelIn", fuelIn);
      fd.append("dashboard", dashboard);
      if (rating > 0) {
        fd.append("rating", String(rating));
      }
      if (review.trim()) {
        fd.append("review", review.trim());
      }

      const res = await fetch(`/api/submitMileageIn?t=${encodeURIComponent(token)}`, {
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
      setError(err?.message || properties?.mileageIn?.messages?.failed || properties?.common?.messages?.failed || "Failed to submit.");
    }
  }

  const debugEmailText = useMemo(() => {
    if (!DEBUG || !result?.debugEmail) return "";
    const to = result.debugEmail?.to || "ADMIN";
    const subject = result.debugEmail?.subject || "Rental Completed";
    const body = result.debugEmail?.body || "";
    return [`To: ${to}`, `Subject: ${subject}`, ``, body].join("\n");
  }, [result]);

  return (
    <div className="intakeWrap">
      <h1 className="intakeHeader">
        {properties?.mileageIn?.title || "Mileage & Fuel (Return)"}
      </h1>

      <div className="intakeCard">
        <div style={{ opacity: 0.9, lineHeight: 1.5 }}>
          {properties?.mileageIn?.instructions || "Please enter the current mileage and fuel level at return, and upload a clear photo of the dashboard showing both."}
        </div>
      </div>

      <form className="intakeForm" onSubmit={onSubmit}>
        <section className="intakeCard">
          <h2>{properties?.mileageIn?.sectionTitle || "Return Details"}</h2>

          <div className="grid2">
            <div className="fieldRow">
              <div className="fieldLabel">
                {properties?.mileageIn?.labels?.mileage || "Mileage (integer)"}
              </div>
              <div className="fieldControl">
                <input
                  style={inputStyle}
                  inputMode="numeric"
                  value={mileageIn}
                  onChange={(e) => setMileageIn(onlyInt(e.target.value))}
                  placeholder={properties?.mileageIn?.placeholders?.mileage || "e.g. 59002"}
                />
              </div>
            </div>

            <div className="fieldRow">
              <div className="fieldLabel">
                {properties?.mileageIn?.labels?.fuelLevel || "Fuel Level"}
              </div>
              <div className="fieldControl">
                <select style={inputStyle} value={fuelIn} onChange={(e) => setFuelIn(e.target.value)}>
                  <option value="">{properties?.mileageIn?.placeholders?.select || "Select…"}</option>
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
              {properties?.mileageIn?.labels?.dashboardPhoto || "Dashboard Photo"}
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
        </section>

        <section className="intakeCard" style={{ marginTop: 20 }}>
          <h2>{properties?.mileageIn?.reviewSectionTitle || "Leave a Review (Optional)"}</h2>
          <div style={{ opacity: 0.9, lineHeight: 1.5, marginBottom: 16 }}>
            {properties?.mileageIn?.reviewInstructions || "We'd love to hear about your experience! Your feedback helps us improve."}
          </div>

          <div className="fieldRow">
            <div className="fieldLabel">
              {properties?.mileageIn?.labels?.rating || "Rating"}
            </div>
            <div className="fieldControl">
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      fontSize: "28px",
                      lineHeight: 1,
                      color: star <= rating ? "#FFD700" : "#ddd",
                      transition: "color 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      if (rating === 0) {
                        e.currentTarget.style.color = "#FFD700";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (rating === 0) {
                        e.currentTarget.style.color = "#ddd";
                      }
                    }}
                  >
                    ★
                  </button>
                ))}
                {rating > 0 && (
                  <span style={{ marginLeft: 8, fontSize: 14, opacity: 0.8 }}>
                    {rating} {rating === 1 
                      ? (properties?.mileageIn?.messages?.star || "star")
                      : (properties?.mileageIn?.messages?.stars || "stars")}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="fieldRow" style={{ marginTop: 12 }}>
            <div className="fieldLabel">
              {properties?.mileageIn?.labels?.review || "Your Review"}
            </div>
            <div className="fieldControl">
              <textarea
                style={{ ...textareaStyle, minHeight: "100px" }}
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder={properties?.mileageIn?.placeholders?.review || "Tell us about your experience..."}
                maxLength={1000}
              />
              <div style={{ marginTop: 6, fontSize: 12, opacity: 0.7, textAlign: "right" }}>
                {review.length}/1000 {properties?.mileageIn?.messages?.characters || "characters"}
              </div>
            </div>
          </div>
        </section>

        <section className="intakeCard" style={{ marginTop: 20 }}>
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
                ? (properties?.mileageIn?.buttons?.submitting || properties?.common?.buttons?.submitting || "Submitting...")
                : (properties?.mileageIn?.buttons?.submit || "Submit Return Info")}
            </button>
          </div>
        </section>

        {status === "done" ? (
          <section className="intakeCard">
            <h2>{properties?.mileageIn?.messages?.completed || "COMPLETED"}</h2>

            <div style={{ opacity: 0.9, lineHeight: 1.5 }}>
              {properties?.mileageIn?.messages?.thanks || "Thanks — your return mileage and fuel have been recorded."}
              <br />
              {properties?.mileageIn?.messages?.closePage || "You can close this page."}
            </div>

            {DEBUG && debugEmailText ? (
              <div style={{ marginTop: 14, textAlign: "left" }}>
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
                <div style={{ marginTop: 10 }}>
                  <Link className="button" to="/">
                    {properties?.mileageIn?.buttons?.backToHome || properties?.common?.buttons?.backToHome || "Back to Home"}
                  </Link>
                </div>
              </div>
            ) : (
              <div style={{ marginTop: 12 }}>
                <Link className="button" to="/">
                  {properties?.mileageIn?.buttons?.backToHome || properties?.common?.buttons?.backToHome || "Back to Home"}
                </Link>
              </div>
            )}
          </section>
        ) : null}
      </form>
    </div>
  );
}
