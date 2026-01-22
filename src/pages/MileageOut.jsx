import { useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { buttonStyle, inputStyle } from "../components/styles";

const DEBUG = import.meta.env.VITE_DEBUG_MODE === "true";

const FUEL_OPTIONS = ["E", "1/8", "1/4", "3/8", "1/2", "5/8", "3/4", "7/8", "F"];

function onlyInt(value) {
  return String(value || "").replace(/\D/g, "");
}

export default function MileageOut() {
  const [params] = useSearchParams();
  const token = params.get("t") || "";

  const [mileageOut, setMileageOut] = useState("");
  const [fuelOut, setFuelOut] = useState("");
  const [dashboard, setDashboard] = useState(null);

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
      setError("Missing token.");
      return;
    }
    if (!mileageOut) {
      setError("Mileage is required.");
      return;
    }
    if (!fuelOut) {
      setError("Fuel level is required.");
      return;
    }
    if (!dashboard) {
      setError("Dashboard photo is required.");
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
      setError(err?.message || "Failed to submit.");
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
      <h1 className="intakeHeader">Mileage & Fuel (Pickup)</h1>

      <div className="intakeCard">
        <div style={{ opacity: 0.9, lineHeight: 1.5 }}>
          Please enter the current mileage and fuel level at pickup, and upload a clear photo of the
          dashboard showing both.
        </div>
      </div>

      <form className="intakeForm" onSubmit={onSubmit}>
        <section className="intakeCard">
          <h2>Pickup Details</h2>

          <div className="grid2">
            <div className="fieldRow">
              <div className="fieldLabel">Mileage (integer)</div>
              <div className="fieldControl">
                <input
                  style={inputStyle}
                  inputMode="numeric"
                  value={mileageOut}
                  onChange={(e) => setMileageOut(onlyInt(e.target.value))}
                  placeholder="e.g. 58231"
                />
              </div>
            </div>

            <div className="fieldRow">
              <div className="fieldLabel">Fuel Level</div>
              <div className="fieldControl">
                <select style={inputStyle} value={fuelOut} onChange={(e) => setFuelOut(e.target.value)}>
                  <option value="">Select…</option>
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
            <div className="fieldLabel">Dashboard Photo</div>
            <div className="fieldControl">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setDashboard(e.target.files?.[0] || null)}
              />
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
              {status === "submitting" ? "Submitting..." : "Submit Pickup Info"}
            </button>
          </div>
        </section>

        {status === "done" ? (
          <section className="intakeCard">
            <h2>Submitted</h2>

            {DEBUG && result?.mileageInUrl ? (
              <>
                <div style={{ fontWeight: 800, marginBottom: 8 }}>Debug: Mileage In Link</div>
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
                    Open Mileage In
                  </a>
                  <Link className="button button-secondary" to="/">
                    Back to Home
                  </Link>
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
              </>
            ) : (
              <div style={{ opacity: 0.9, lineHeight: 1.5 }}>
                Thanks! Your pickup mileage and fuel have been recorded.
                <br />
                You can close this page.
              </div>
            )}
          </section>
        ) : null}
      </form>
    </div>
  );
}
