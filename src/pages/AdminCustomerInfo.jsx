// src/pages/AdminCustomerInfo.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { buttonStyle, inputStyle } from "../components/styles";

/* -------------------- constants -------------------- */

const DEBUG = import.meta.env.VITE_DEBUG_MODE === "true";

const TRACKER_NOTICE =
  "Each of our vehicles is equipped with GPS tracking. Any attempt to tamper with or disable the tracking device voids the rental agreement, and the vehicle may be reported stolen.";

const US_STATES = [
  { value: "AL", label: "AL — Alabama" },
  { value: "AK", label: "AK — Alaska" },
  { value: "AZ", label: "AZ — Arizona" },
  { value: "AR", label: "AR — Arkansas" },
  { value: "CA", label: "CA — California" },
  { value: "CO", label: "CO — Colorado" },
  { value: "CT", label: "CT — Connecticut" },
  { value: "DE", label: "DE — Delaware" },
  { value: "FL", label: "FL — Florida" },
  { value: "GA", label: "GA — Georgia" },
  { value: "HI", label: "HI — Hawaii" },
  { value: "ID", label: "ID — Idaho" },
  { value: "IL", label: "IL — Illinois" },
  { value: "IN", label: "IN — Indiana" },
  { value: "IA", label: "IA — Iowa" },
  { value: "KS", label: "KS — Kansas" },
  { value: "KY", label: "KY — Kentucky" },
  { value: "LA", label: "LA — Louisiana" },
  { value: "ME", label: "ME — Maine" },
  { value: "MD", label: "MD — Maryland" },
  { value: "MA", label: "MA — Massachusetts" },
  { value: "MI", label: "MI — Michigan" },
  { value: "MN", label: "MN — Minnesota" },
  { value: "MS", label: "MS — Mississippi" },
  { value: "MO", label: "MO — Missouri" },
  { value: "MT", label: "MT — Montana" },
  { value: "NE", label: "NE — Nebraska" },
  { value: "NV", label: "NV — Nevada" },
  { value: "NH", label: "NH — New Hampshire" },
  { value: "NJ", label: "NJ — New Jersey" },
  { value: "NM", label: "NM — New Mexico" },
  { value: "NY", label: "NY — New York" },
  { value: "NC", label: "NC — North Carolina" },
  { value: "ND", label: "ND — North Dakota" },
  { value: "OH", label: "OH — Ohio" },
  { value: "OK", label: "OK — Oklahoma" },
  { value: "OR", label: "OR — Oregon" },
  { value: "PA", label: "PA — Pennsylvania" },
  { value: "RI", label: "RI — Rhode Island" },
  { value: "SC", label: "SC — South Carolina" },
  { value: "SD", label: "SD — South Dakota" },
  { value: "TN", label: "TN — Tennessee" },
  { value: "TX", label: "TX — Texas" },
  { value: "UT", label: "UT — Utah" },
  { value: "VT", label: "VT — Vermont" },
  { value: "VA", label: "VA — Virginia" },
  { value: "WA", label: "WA — Washington" },
  { value: "WV", label: "WV — West Virginia" },
  { value: "WI", label: "WI — Wisconsin" },
  { value: "WY", label: "WY — Wyoming" },
];

/* -------------------- helpers -------------------- */

function digitsOnly(s) {
  return String(s || "").replace(/\D/g, "");
}

function formatPhoneInput(value) {
  const d = digitsOnly(value).slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

function requiredText(v) {
  return String(v || "").trim().length > 0;
}

function requiredDate(v) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(v || ""));
}

function fileOk(f) {
  return !!f;
}

function bytesToNice(n) {
  if (!n && n !== 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  let x = n;
  let i = 0;
  while (x >= 1024 && i < units.length - 1) {
    x /= 1024;
    i++;
  }
  return `${x.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function maskedVin(vin) {
  const s = String(vin || "");
  if (s.length <= 4) return "••••";
  return `••••${s.slice(-4)}`;
}

/* -------------------- UI bits -------------------- */

function FieldRow({ label, error, children }) {
  return (
    <div className="fieldRow compact">
      <div className="fieldLabel">{label}</div>
      <div className="fieldControl">
        {children}
        {error ? <div className="fieldError">{error}</div> : null}
      </div>
    </div>
  );
}

function FilePicker({
  label,
  file,
  onChange,
  error,
  inputId,
  accept = "image/*",
  onTouch,
}) {
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div className="previewCard">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <div style={{ fontWeight: 800 }}>{label}</div>
        {file ? (
          <button
            type="button"
            style={{ ...buttonStyle, padding: "8px 10px" }}
            onClick={() => onChange(null)}
          >
            Remove
          </button>
        ) : null}
      </div>

      {file ? (
        <>
          <img className="previewImg" src={previewUrl} alt={`${label} preview`} />
          <div className="previewMeta">
            <span title={file.name}>{file.name}</span>
            <span>{bytesToNice(file.size)}</span>
          </div>
        </>
      ) : (
        <>
          <input
            id={inputId}
            type="file"
            accept={accept}
            onClick={onTouch}
            onChange={(e) => {
              onTouch?.();
              onChange(e.target.files?.[0] || null);
            }}
          />
          {error ? <div className="fieldError">{error}</div> : null}
        </>
      )}
    </div>
  );
}

/* -------------------- page -------------------- */

export default function AdminCustomerInfo() {
  const [params] = useSearchParams();
  const token = params.get("t") || "";

  const [draft, setDraft] = useState(null);
  const [loadStatus, setLoadStatus] = useState("loading"); // loading | ready | error
  const [loadError, setLoadError] = useState("");

  const [hasSecond, setHasSecond] = useState(false);
  const [submitStatus, setSubmitStatus] = useState("idle"); // idle | submitting | done | error

  const [touched, setTouched] = useState({});
  const [formBanner, setFormBanner] = useState({ type: "", msg: "" });
  const bannerRef = useRef(null);

  const [d1, setD1] = useState({
    lastName: "",
    firstName: "",
    mi: "",
    homeAddress: "",
    city: "",
    state: "",
    zip: "",
    homePhone: "",
    businessPhone: "",
    employer: "",
    cellPhone: "",
    dob: "",
    dlNumber: "",
    dlExp: "",
    dlState: "",
    insuranceCompany: "",
    insuranceCompanyPhone: "",
    agentName: "",
    agentPhone: "",
    employerCity: "",
    employerState: "",
  });

  const [d2, setD2] = useState({
    lastName: "",
    firstName: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    dlNumber: "",
    dlExp: "",
    dlState: "",
    dob: "",
  });

  const [files, setFiles] = useState({
    d1_insurance: null,
    d1_license: null,
    d1_selfie: null,
    d2_insurance: null,
    d2_license: null,
    d2_selfie: null,
  });

  const set1 = (k, val) => setD1((x) => ({ ...x, [k]: val }));
  const set2 = (k, val) => setD2((x) => ({ ...x, [k]: val }));
  const setF = (k, val) => setFiles((x) => ({ ...x, [k]: val }));

  const markTouched = (k) => setTouched((x) => ({ ...x, [k]: true }));

  useEffect(() => {
    async function load() {
      try {
        setLoadStatus("loading");
        setLoadError("");

        const res = await fetch(`/api/decodeCustomerInfoLink?t=${encodeURIComponent(token)}`);
        if (!res.ok) throw new Error(await res.text());

        const out = await res.json();
        setDraft(out.draft);

        // determine second driver default (keep behavior)
        setHasSecond(false);

        setLoadStatus("ready");
      } catch (err) {
        console.error(err);
        setLoadStatus("error");
        setLoadError(err?.message || "Invalid link.");
      }
    }

    if (token) load();
    else {
      setLoadStatus("error");
      setLoadError("Missing token.");
    }
  }, [token]);

  const errors = useMemo(() => {
    const e = {};

    // Driver 1 required fields
    if (!requiredText(d1.lastName)) e["d1.lastName"] = "Required";
    if (!requiredText(d1.firstName)) e["d1.firstName"] = "Required";
    if (!requiredText(d1.homeAddress)) e["d1.homeAddress"] = "Required";
    if (!requiredText(d1.city)) e["d1.city"] = "Required";
    if (!requiredText(d1.state)) e["d1.state"] = "Required";
    if (!requiredText(d1.zip)) e["d1.zip"] = "Required";
    if (!requiredText(d1.cellPhone)) e["d1.cellPhone"] = "Required";
    if (!requiredDate(d1.dob)) e["d1.dob"] = "Use YYYY-MM-DD";
    if (!requiredText(d1.dlNumber)) e["d1.dlNumber"] = "Required";
    if (!requiredText(d1.dlState)) e["d1.dlState"] = "Required";
    if (!requiredDate(d1.dlExp)) e["d1.dlExp"] = "Use YYYY-MM-DD";

    if (!requiredText(d1.insuranceCompany)) e["d1.insuranceCompany"] = "Required";
    if (!requiredText(d1.insuranceCompanyPhone)) e["d1.insuranceCompanyPhone"] = "Required";
    if (!requiredText(d1.agentName)) e["d1.agentName"] = "Required";
    if (!requiredText(d1.agentPhone)) e["d1.agentPhone"] = "Required";

    // Files required
    if (!fileOk(files.d1_insurance)) e["f.d1_insurance"] = "Required";
    if (!fileOk(files.d1_license)) e["f.d1_license"] = "Required";
    if (!fileOk(files.d1_selfie)) e["f.d1_selfie"] = "Required";

    // Driver 2 required if enabled
    if (hasSecond) {
      if (!requiredText(d2.lastName)) e["d2.lastName"] = "Required";
      if (!requiredText(d2.firstName)) e["d2.firstName"] = "Required";
      if (!requiredText(d2.address)) e["d2.address"] = "Required";
      if (!requiredText(d2.city)) e["d2.city"] = "Required";
      if (!requiredText(d2.state)) e["d2.state"] = "Required";
      if (!requiredText(d2.zip)) e["d2.zip"] = "Required";
      if (!requiredText(d2.dlNumber)) e["d2.dlNumber"] = "Required";
      if (!requiredText(d2.dlState)) e["d2.dlState"] = "Required";
      if (!requiredDate(d2.dlExp)) e["d2.dlExp"] = "Use YYYY-MM-DD";
      if (!requiredDate(d2.dob)) e["d2.dob"] = "Use YYYY-MM-DD";

      if (!fileOk(files.d2_insurance)) e["f.d2_insurance"] = "Required";
      if (!fileOk(files.d2_license)) e["f.d2_license"] = "Required";
      if (!fileOk(files.d2_selfie)) e["f.d2_selfie"] = "Required";
    }

    return e;
  }, [d1, d2, files, hasSecond]);

  function scrollToBanner() {
    try {
      bannerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {
      // ignore
    }
  }

  async function submit(e) {
    e.preventDefault();

    // mark everything touched to show errors
    const touchAll = {};
    Object.keys(errors).forEach((k) => (touchAll[k] = true));
    setTouched((x) => ({ ...x, ...touchAll }));

    if (Object.keys(errors).length) {
      setFormBanner({ type: "error", msg: "Please fix the highlighted fields." });
      scrollToBanner();
      return;
    }

    try {
      setSubmitStatus("submitting");
      setFormBanner({ type: "", msg: "" });

      const fd = new FormData();
      fd.append("hasSecondDriver", hasSecond ? "true" : "false");
      fd.append("d1", JSON.stringify(d1));
      fd.append("d2", JSON.stringify(d2));

      fd.append("d1_ins", files.d1_insurance);
      fd.append("d1_lic", files.d1_license);
      fd.append("d1_self", files.d1_selfie);

      if (hasSecond) {
        fd.append("d2_ins", files.d2_insurance);
        fd.append("d2_lic", files.d2_license);
        fd.append("d2_self", files.d2_selfie);
      }

      const res = await fetch(`/api/createRentalPackage?t=${encodeURIComponent(token)}`, {
        method: "POST",
        body: fd,
      });

      if (!res.ok) throw new Error(await res.text());
      const out = await res.json();

      // ✅ DEBUG: stash admin instruction-page links for success page display
      // Admin pages will generate the customer pickup/dropoff links when submitted.
      if (DEBUG && out?.pickupInstructionsUrl && out?.dropoffInstructionsUrl) {
        try {
          sessionStorage.setItem("debug:adminPickupUrl", out.pickupInstructionsUrl);
          sessionStorage.setItem("debug:adminDropoffUrl", out.dropoffInstructionsUrl);

          if (out?.debugEmail) {
            sessionStorage.setItem("debug:adminLinksEmail", JSON.stringify(out.debugEmail));
          } else {
            sessionStorage.removeItem("debug:adminLinksEmail");
          }
        } catch {
          // ignore storage errors
        }
      } else {
        try {
          sessionStorage.removeItem("debug:adminPickupUrl");
          sessionStorage.removeItem("debug:adminDropoffUrl");
          sessionStorage.removeItem("debug:adminLinksEmail");
        } catch {
          // ignore
        }
      }

      // ✅ DEBUG: stash signed-contract upload link for success page display
      // Accept either key name from backend (keeps backward compatibility)
      const scEmail = out?.debugSignedContractEmail || out?.signedContractDebugEmail || null;

      if (DEBUG && out?.signedContractUrl) {
        try {
          sessionStorage.setItem("debug:signedContractUrl", out.signedContractUrl);
          if (scEmail) {
            sessionStorage.setItem("debug:signedContractEmail", JSON.stringify(scEmail));
          } else {
            sessionStorage.removeItem("debug:signedContractEmail");
          }
        } catch {
          // ignore storage errors
        }
      } else {
        try {
          sessionStorage.removeItem("debug:signedContractUrl");
          sessionStorage.removeItem("debug:signedContractEmail");
        } catch {
          // ignore
        }
      }

      window.location.href = "/success";
      setFormBanner({ type: "ok", msg: "Submitted successfully. You can close this page." });
    } catch (err) {
      console.error(err);
      setSubmitStatus("error");
      setFormBanner({
        type: "error",
        msg: err?.message || "Failed to submit. Please try again.",
      });
      scrollToBanner();
    }
  }

  return (
    <div className="intakeWrap">
      <h1 className="intakeHeader">Customer Info</h1>

      {loadStatus === "loading" && <div className="intakeCard">Loading link…</div>}

      {loadStatus === "error" && (
        <div className="intakeCard">
          <div style={{ fontWeight: 800, marginBottom: 6 }}>⚠️ Cannot load this link</div>
          <div className="muted">{loadError}</div>
        </div>
      )}

      {loadStatus === "ready" && draft && (
        <>
          <div className="intakeCard">
            <div className="intakeSummary">
              <div>
                <strong>Vehicle ID:</strong> {maskedVin(draft.vin)}
              </div>
              <div>
                <strong>Vehicle:</strong> {draft.make} {(draft.model || draft.year || "").trim()}{" "}
                {draft.color}
              </div>
              <div>
                <strong>Dates:</strong> {draft.startDate} → {draft.endDate}
              </div>
              {draft.costPerDay ? (
                <div>
                  <strong>Rate:</strong> {draft.costPerDay}
                </div>
              ) : null}
            </div>
          </div>

          {(formBanner.msg || submitStatus === "submitting") && (
            <div
              ref={bannerRef}
              className={"formBanner " + (formBanner.type === "error" ? "formBannerError" : "")}
              style={{ marginTop: 14 }}
            >
              {submitStatus === "submitting"
                ? "Submitting… please keep this page open."
                : formBanner.msg}
            </div>
          )}

          <form className="intakeForm" onSubmit={submit}>
            <section className="intakeCard">
              <h2>Driver 1 (Customer)</h2>

              <div className="grid3">
                <FieldRow
                  label="Last Name"
                  error={touched["d1.lastName"] ? errors["d1.lastName"] : ""}
                >
                  <input
                    style={inputStyle}
                    className={touched["d1.lastName"] && errors["d1.lastName"] ? "inputError" : ""}
                    value={d1.lastName}
                    onBlur={() => markTouched("d1.lastName")}
                    onChange={(e) => set1("lastName", e.target.value)}
                  />
                </FieldRow>

                <FieldRow
                  label="First Name"
                  error={touched["d1.firstName"] ? errors["d1.firstName"] : ""}
                >
                  <input
                    style={inputStyle}
                    className={
                      touched["d1.firstName"] && errors["d1.firstName"] ? "inputError" : ""
                    }
                    value={d1.firstName}
                    onBlur={() => markTouched("d1.firstName")}
                    onChange={(e) => set1("firstName", e.target.value)}
                  />
                </FieldRow>

                <FieldRow label="MI">
                  <input
                    style={inputStyle}
                    value={d1.mi}
                    onChange={(e) => set1("mi", e.target.value)}
                  />
                </FieldRow>
              </div>

              <FieldRow
                label="Home Address"
                error={touched["d1.homeAddress"] ? errors["d1.homeAddress"] : ""}
              >
                <input
                  style={inputStyle}
                  className={
                    touched["d1.homeAddress"] && errors["d1.homeAddress"] ? "inputError" : ""
                  }
                  value={d1.homeAddress}
                  onBlur={() => markTouched("d1.homeAddress")}
                  onChange={(e) => set1("homeAddress", e.target.value)}
                />
              </FieldRow>

              <div className="grid3">
                <FieldRow label="City" error={touched["d1.city"] ? errors["d1.city"] : ""}>
                  <input
                    style={inputStyle}
                    className={touched["d1.city"] && errors["d1.city"] ? "inputError" : ""}
                    value={d1.city}
                    onBlur={() => markTouched("d1.city")}
                    onChange={(e) => set1("city", e.target.value)}
                  />
                </FieldRow>

                <FieldRow label="State" error={touched["d1.state"] ? errors["d1.state"] : ""}>
                  <select
                    style={inputStyle}
                    className={touched["d1.state"] && errors["d1.state"] ? "inputError" : ""}
                    value={d1.state}
                    onBlur={() => markTouched("d1.state")}
                    onChange={(e) => set1("state", e.target.value)}
                  >
                    <option value="">Select…</option>
                    {US_STATES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </FieldRow>

                <FieldRow label="Zip" error={touched["d1.zip"] ? errors["d1.zip"] : ""}>
                  <input
                    style={inputStyle}
                    className={touched["d1.zip"] && errors["d1.zip"] ? "inputError" : ""}
                    value={d1.zip}
                    onBlur={() => markTouched("d1.zip")}
                    onChange={(e) => set1("zip", e.target.value)}
                  />
                </FieldRow>
              </div>

              <div className="grid3">
                <FieldRow label="Home Phone">
                  <input
                    style={inputStyle}
                    value={d1.homePhone}
                    onChange={(e) => set1("homePhone", formatPhoneInput(e.target.value))}
                  />
                </FieldRow>

                <FieldRow label="Business Phone">
                  <input
                    style={inputStyle}
                    value={d1.businessPhone}
                    onChange={(e) => set1("businessPhone", formatPhoneInput(e.target.value))}
                  />
                </FieldRow>

                <FieldRow label="Cell" error={touched["d1.cellPhone"] ? errors["d1.cellPhone"] : ""}>
                  <input
                    style={inputStyle}
                    className={
                      touched["d1.cellPhone"] && errors["d1.cellPhone"] ? "inputError" : ""
                    }
                    value={d1.cellPhone}
                    onBlur={() => markTouched("d1.cellPhone")}
                    onChange={(e) => set1("cellPhone", formatPhoneInput(e.target.value))}
                  />
                </FieldRow>
              </div>

              <div className="grid3">
                <FieldRow label="DOB" error={touched["d1.dob"] ? errors["d1.dob"] : ""}>
                  <input
                    type="date"
                    style={inputStyle}
                    className={touched["d1.dob"] && errors["d1.dob"] ? "inputError" : ""}
                    value={d1.dob}
                    onBlur={() => markTouched("d1.dob")}
                    onChange={(e) => set1("dob", e.target.value)}
                    max={new Date().toISOString().split("T")[0]}
                  />
                </FieldRow>

                <FieldRow label="DL Number" error={touched["d1.dlNumber"] ? errors["d1.dlNumber"] : ""}>
                  <input
                    style={inputStyle}
                    className={
                      touched["d1.dlNumber"] && errors["d1.dlNumber"] ? "inputError" : ""
                    }
                    value={d1.dlNumber}
                    onBlur={() => markTouched("d1.dlNumber")}
                    onChange={(e) => set1("dlNumber", e.target.value)}
                  />
                </FieldRow>

                <FieldRow label="DL State" error={touched["d1.dlState"] ? errors["d1.dlState"] : ""}>
                  <select
                    style={inputStyle}
                    className={touched["d1.dlState"] && errors["d1.dlState"] ? "inputError" : ""}
                    value={d1.dlState}
                    onBlur={() => markTouched("d1.dlState")}
                    onChange={(e) => set1("dlState", e.target.value)}
                  >
                    <option value="">Select…</option>
                    {US_STATES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </FieldRow>
              </div>

              <div className="grid2">
                <FieldRow label="DL Exp" error={touched["d1.dlExp"] ? errors["d1.dlExp"] : ""}>
                  <input
                    type="date"
                    style={inputStyle}
                    className={touched["d1.dlExp"] && errors["d1.dlExp"] ? "inputError" : ""}
                    value={d1.dlExp}
                    onBlur={() => markTouched("d1.dlExp")}
                    onChange={(e) => set1("dlExp", e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                  />
                </FieldRow>

                <FieldRow label="Employer">
                  <input
                    style={inputStyle}
                    value={d1.employer}
                    onChange={(e) => set1("employer", e.target.value)}
                  />
                </FieldRow>
              </div>

              <div className="grid2">
                <FieldRow label="Employer City">
                  <input
                    style={inputStyle}
                    value={d1.employerCity}
                    onChange={(e) => set1("employerCity", e.target.value)}
                  />
                </FieldRow>

                <FieldRow label="Employer State">
                  <select
                    style={inputStyle}
                    value={d1.employerState}
                    onChange={(e) => set1("employerState", e.target.value)}
                  >
                    <option value="">Select…</option>
                    {US_STATES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </FieldRow>
              </div>
            </section>

            <section className="intakeCard">
              <h2>Insurance</h2>

              <div className="grid2">
                <FieldRow
                  label="Insurance Company"
                  error={touched["d1.insuranceCompany"] ? errors["d1.insuranceCompany"] : ""}
                >
                  <input
                    style={inputStyle}
                    className={
                      touched["d1.insuranceCompany"] && errors["d1.insuranceCompany"]
                        ? "inputError"
                        : ""
                    }
                    value={d1.insuranceCompany}
                    onBlur={() => markTouched("d1.insuranceCompany")}
                    onChange={(e) => set1("insuranceCompany", e.target.value)}
                  />
                </FieldRow>

                <FieldRow
                  label="Company Phone"
                  error={
                    touched["d1.insuranceCompanyPhone"] ? errors["d1.insuranceCompanyPhone"] : ""
                  }
                >
                  <input
                    style={inputStyle}
                    className={
                      touched["d1.insuranceCompanyPhone"] && errors["d1.insuranceCompanyPhone"]
                        ? "inputError"
                        : ""
                    }
                    value={d1.insuranceCompanyPhone}
                    onBlur={() => markTouched("d1.insuranceCompanyPhone")}
                    onChange={(e) => set1("insuranceCompanyPhone", formatPhoneInput(e.target.value))}
                  />
                </FieldRow>
              </div>

              <div className="grid2">
                <FieldRow label="Agent Name" error={touched["d1.agentName"] ? errors["d1.agentName"] : ""}>
                  <input
                    style={inputStyle}
                    className={touched["d1.agentName"] && errors["d1.agentName"] ? "inputError" : ""}
                    value={d1.agentName}
                    onBlur={() => markTouched("d1.agentName")}
                    onChange={(e) => set1("agentName", e.target.value)}
                  />
                </FieldRow>

                <FieldRow label="Agent Phone" error={touched["d1.agentPhone"] ? errors["d1.agentPhone"] : ""}>
                  <input
                    style={inputStyle}
                    className={touched["d1.agentPhone"] && errors["d1.agentPhone"] ? "inputError" : ""}
                    value={d1.agentPhone}
                    onBlur={() => markTouched("d1.agentPhone")}
                    onChange={(e) => set1("agentPhone", formatPhoneInput(e.target.value))}
                  />
                </FieldRow>
              </div>
            </section>

            <section className="intakeCard">
              <h2>Driver 1 Photos</h2>

              <div className="fileGrid">
                <FilePicker
                  label="Insurance photo"
                  inputId="d1_ins"
                  file={files.d1_insurance}
                  onChange={(f) => setF("d1_insurance", f)}
                  onTouch={() => markTouched("f.d1_insurance")}
                  error={touched["f.d1_insurance"] ? errors["f.d1_insurance"] : ""}
                />
                <FilePicker
                  label="License close-up"
                  inputId="d1_lic"
                  file={files.d1_license}
                  onChange={(f) => setF("d1_license", f)}
                  onTouch={() => markTouched("f.d1_license")}
                  error={touched["f.d1_license"] ? errors["f.d1_license"] : ""}
                />
                <FilePicker
                  label="Selfie holding license"
                  inputId="d1_self"
                  file={files.d1_selfie}
                  onChange={(f) => setF("d1_selfie", f)}
                  onTouch={() => markTouched("f.d1_selfie")}
                  error={touched["f.d1_selfie"] ? errors["f.d1_selfie"] : ""}
                />
              </div>
            </section>

            <section className="intakeCard">
              <h2>Second Driver</h2>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input
                  id="hasSecondDriver"
                  type="checkbox"
                  checked={hasSecond}
                  onChange={(e) => setHasSecond(e.target.checked)}
                />
                <label htmlFor="hasSecondDriver" style={{ margin: 0 }}>
                  Add a second driver
                </label>
              </div>

              {hasSecond ? (
                <>
                  <h2 style={{ marginTop: 16 }}>Driver 2 (Additional Driver)</h2>

                  <div className="grid2">
                    <FieldRow
                      label="Last Name"
                      error={touched["d2.lastName"] ? errors["d2.lastName"] : ""}
                    >
                      <input
                        style={inputStyle}
                        className={touched["d2.lastName"] && errors["d2.lastName"] ? "inputError" : ""}
                        value={d2.lastName}
                        onBlur={() => markTouched("d2.lastName")}
                        onChange={(e) => set2("lastName", e.target.value)}
                      />
                    </FieldRow>

                    <FieldRow
                      label="First Name"
                      error={touched["d2.firstName"] ? errors["d2.firstName"] : ""}
                    >
                      <input
                        style={inputStyle}
                        className={touched["d2.firstName"] && errors["d2.firstName"] ? "inputError" : ""}
                        value={d2.firstName}
                        onBlur={() => markTouched("d2.firstName")}
                        onChange={(e) => set2("firstName", e.target.value)}
                      />
                    </FieldRow>
                  </div>

                  <FieldRow label="Home Address" error={touched["d2.address"] ? errors["d2.address"] : ""}>
                    <input
                      style={inputStyle}
                      className={touched["d2.address"] && errors["d2.address"] ? "inputError" : ""}
                      value={d2.address}
                      onBlur={() => markTouched("d2.address")}
                      onChange={(e) => set2("address", e.target.value)}
                    />
                  </FieldRow>

                  <div className="grid3">
                    <FieldRow label="City" error={touched["d2.city"] ? errors["d2.city"] : ""}>
                      <input
                        style={inputStyle}
                        className={touched["d2.city"] && errors["d2.city"] ? "inputError" : ""}
                        value={d2.city}
                        onBlur={() => markTouched("d2.city")}
                        onChange={(e) => set2("city", e.target.value)}
                      />
                    </FieldRow>

                    <FieldRow label="State" error={touched["d2.state"] ? errors["d2.state"] : ""}>
                      <select
                        style={inputStyle}
                        className={touched["d2.state"] && errors["d2.state"] ? "inputError" : ""}
                        value={d2.state}
                        onBlur={() => markTouched("d2.state")}
                        onChange={(e) => set2("state", e.target.value)}
                      >
                        <option value="">Select…</option>
                        {US_STATES.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </FieldRow>

                    <FieldRow label="Zip" error={touched["d2.zip"] ? errors["d2.zip"] : ""}>
                      <input
                        style={inputStyle}
                        className={touched["d2.zip"] && errors["d2.zip"] ? "inputError" : ""}
                        value={d2.zip}
                        onBlur={() => markTouched("d2.zip")}
                        onChange={(e) => set2("zip", e.target.value)}
                      />
                    </FieldRow>
                  </div>

                  <div className="grid3">
                    <FieldRow label="DOB" error={touched["d2.dob"] ? errors["d2.dob"] : ""}>
                      <input
                        type="date"
                        style={inputStyle}
                        className={touched["d2.dob"] && errors["d2.dob"] ? "inputError" : ""}
                        value={d2.dob}
                        onBlur={() => markTouched("d2.dob")}
                        onChange={(e) => set2("dob", e.target.value)}
                        max={new Date().toISOString().split("T")[0]}
                      />
                    </FieldRow>

                    <FieldRow label="DL Number" error={touched["d2.dlNumber"] ? errors["d2.dlNumber"] : ""}>
                      <input
                        style={inputStyle}
                        className={touched["d2.dlNumber"] && errors["d2.dlNumber"] ? "inputError" : ""}
                        value={d2.dlNumber}
                        onBlur={() => markTouched("d2.dlNumber")}
                        onChange={(e) => set2("dlNumber", e.target.value)}
                      />
                    </FieldRow>

                    <FieldRow label="DL State" error={touched["d2.dlState"] ? errors["d2.dlState"] : ""}>
                      <select
                        style={inputStyle}
                        className={touched["d2.dlState"] && errors["d2.dlState"] ? "inputError" : ""}
                        value={d2.dlState}
                        onBlur={() => markTouched("d2.dlState")}
                        onChange={(e) => set2("dlState", e.target.value)}
                      >
                        <option value="">Select…</option>
                        {US_STATES.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </FieldRow>
                  </div>

                  <div className="grid2">
                    <FieldRow label="DL Exp" error={touched["d2.dlExp"] ? errors["d2.dlExp"] : ""}>
                      <input
                        type="date"
                        style={inputStyle}
                        className={touched["d2.dlExp"] && errors["d2.dlExp"] ? "inputError" : ""}
                        value={d2.dlExp}
                        onBlur={() => markTouched("d2.dlExp")}
                        onChange={(e) => set2("dlExp", e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                      />
                    </FieldRow>
                  </div>

                  <h2 style={{ marginTop: 16 }}>Driver 2 Photos</h2>

                  <div className="fileGrid">
                    <FilePicker
                      label="Insurance photo"
                      inputId="d2_ins"
                      file={files.d2_insurance}
                      onChange={(f) => setF("d2_insurance", f)}
                      onTouch={() => markTouched("f.d2_insurance")}
                      error={touched["f.d2_insurance"] ? errors["f.d2_insurance"] : ""}
                    />
                    <FilePicker
                      label="License close-up"
                      inputId="d2_lic"
                      file={files.d2_license}
                      onChange={(f) => setF("d2_license", f)}
                      onTouch={() => markTouched("f.d2_license")}
                      error={touched["f.d2_license"] ? errors["f.d2_license"] : ""}
                    />
                    <FilePicker
                      label="Selfie holding license"
                      inputId="d2_self"
                      file={files.d2_selfie}
                      onChange={(f) => setF("d2_selfie", f)}
                      onTouch={() => markTouched("f.d2_selfie")}
                      error={touched["f.d2_selfie"] ? errors["f.d2_selfie"] : ""}
                    />
                  </div>
                </>
              ) : null}
            </section>

            {/* ✅ Full-width bottom submit across entire form */}
            <div style={{ margin: "14px 0 10px" }}>
              <button
                type="submit"
                style={{ ...buttonStyle, width: "100%", display: "block" }}
                disabled={submitStatus === "submitting"}
              >
                {submitStatus === "submitting" ? "Submitting..." : "Submit"}
              </button>
            </div>

            {/* ✅ Tracker notice BELOW submit button */}
            <div
              className="intakeCard"
              style={{
                padding: 12,
                borderRadius: 16,
                background: "rgba(255,255,255,0.85)",
              }}
            >
              <div style={{ fontWeight: 800, marginBottom: 6 }}>Vehicle Tracking Notice</div>
              <div style={{ opacity: 0.9, lineHeight: 1.45 }}>{TRACKER_NOTICE}</div>
            </div>

            <div style={{ height: 8 }} />
          </form>
        </>
      )}
    </div>
  );
}
