import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { buttonStyle, inputStyle, labelStyle, textareaStyle } from "./styles";
import { useProperties } from "../utils/useProperties";
import { isValidDateString, isValidDateRange, isDateNotInPast } from "../utils/validation.js";


const CAR_TYPE_OPTIONS = [
  { value: "Compact", label: "Compact" },
  { value: "SUV", label: "SUV" },
  { value: "Sedan", label: "Sedan" },
  { value: "Specific car from gallery", label: "Specific car from gallery" },
  { value: "Any", label: "Any" },
];

export default function QuickRequestCard({ title = "Request", subtitle, onSuccess }) {
  const [properties] = useProperties();
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error

  // Price range state
  const PRICE_MIN = 20;
  const PRICE_MAX = 250;
  const PRICE_STEP = 5;

  const navigate = useNavigate();

  const [minPrice, setMinPrice] = useState(50);
  const [maxPrice, setMaxPrice] = useState(150);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Ensure sliders never cross
  const safeMin = useMemo(
    () => Math.min(minPrice, maxPrice - PRICE_STEP),
    [minPrice, maxPrice]
  );
  const safeMax = useMemo(
    () => Math.max(maxPrice, minPrice + PRICE_STEP),
    [minPrice, maxPrice]
  );

  async function onSubmit(e) {
    e.preventDefault();
  
    const formEl = e.currentTarget;           // ✅ capture immediately
    
    const form = new FormData(formEl);
    const formStartDate = form.get("startDate");
    const formEndDate = form.get("endDate");
    
    // Validate dates using shared validation
    if (formStartDate && !isValidDateString(formStartDate)) {
      setStatus("error");
      return;
    }
    if (formEndDate && !isValidDateString(formEndDate)) {
      setStatus("error");
      return;
    }
    if (formStartDate && formEndDate && !isValidDateRange(formStartDate, formEndDate)) {
      setStatus("error");
      return;
    }
    if (formStartDate && !isDateNotInPast(formStartDate)) {
      setStatus("error");
      return;
    }
    
    setStatus("sending");
  
    const payload = {
      name: form.get("name"),
      email: form.get("email"),
      startDate: formStartDate,
      endDate: formEndDate,
      carTypes: form.getAll("carTypes"),
      minPrice: safeMin,
      maxPrice: safeMax,
      notes: form.get("notes") || "",
    };
  
    try {
      // Use relative URL via proxy (configured in firebase.json)
      const FUNCTION_URL = "/api/submitRequest";

      const resp = await fetch(FUNCTION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
  
      // Check if response is JSON before parsing
      const contentType = resp.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await resp.text();
        console.error("Non-JSON response received:", text.substring(0, 200));
        throw new Error("Server returned an invalid response. Please try again later.");
      }

      const data = await resp.json();
      if (!resp.ok || !data.ok) throw new Error(data.error || "Request failed");
  
      setStatus("sent");
      
      // Reset immediately (before anything that might unmount/navigate)
        if (formEl && typeof formEl.reset === "function") {
            formEl.reset();
        }                        // ✅ use captured ref
  
      setMinPrice(50);
      setMaxPrice(150);
      setStartDate("");
      setEndDate("");
  
      // go to landing page
      navigate("/request/success", { state: { fromSubmit: true } });
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  }
  

  return (
    <div>
      <div className="request-card">{title}</div>
      {subtitle && (
        <div style={{ fontSize: "13px", opacity: 0.85, marginTop: "6px" }}>
          {subtitle}
        </div>
      )}

      <form onSubmit={onSubmit} style={{ display: "grid", gap: "10px", marginTop: "12px" }}>
        <label style={labelStyle}>
          {properties?.quickRequest?.labels?.name || "Name"}
          <input name="name" required placeholder={properties?.quickRequest?.placeholders?.name || "Your name"} style={inputStyle} />
        </label>

        <label style={labelStyle}>
          {properties?.quickRequest?.labels?.email || "Email"}
          <input name="email" type="email" required placeholder={properties?.quickRequest?.placeholders?.email || "you@email.com"} style={inputStyle} />
        </label>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <label style={labelStyle}>
            {properties?.quickRequest?.labels?.startDate || "Start date (Pickup)"}
            <input 
              name="startDate" 
              type="date" 
              required 
              style={inputStyle}
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                if (endDate && e.target.value >= endDate) {
                  setEndDate("");
                }
              }}
              min={new Date().toISOString().split("T")[0]}
            />
          </label>

          <label style={labelStyle}>
            {properties?.quickRequest?.labels?.endDate || "End date (Return)"}
            <input 
              name="endDate" 
              type="date" 
              required 
              style={inputStyle}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate || new Date().toISOString().split("T")[0]}
            />
          </label>
        </div>
        
        {status === "error" && startDate && endDate && new Date(endDate) <= new Date(startDate) && (
          <div style={{ fontSize: "13px", color: "crimson" }}>
            {properties?.quickRequest?.messages?.dateError || "❌ End date must be after start date."}
          </div>
        )}

        {/* Car type multi-select */}
        <label style={labelStyle}>
          {properties?.quickRequest?.labels?.carType || "Car type (select one or more)"}
          <select
            name="carTypes"
            multiple
            size={CAR_TYPE_OPTIONS.length}
            style={multiSelectStyle}
          >
            {CAR_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        {/* Price range */}
        <div style={{ display: "grid", gap: "8px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}>
            <div style={{ fontSize: "13px", opacity: 0.95 }}>
              {properties?.quickRequest?.dailyBudget || "Daily budget range"}
            </div>
            <div style={{ fontSize: "13px", fontWeight: 800 }}>
              ${safeMin} – ${safeMax}
            </div>
          </div>

          <div style={{ display: "grid", gap: "8px" }}>
            <label style={rangeLabelStyle}>
              Min
              <input
                type="range"
                min={PRICE_MIN}
                max={PRICE_MAX}
                step={PRICE_STEP}
                value={safeMin}
                onChange={(e) => setMinPrice(Number(e.target.value))}
                style={{ width: "100%" }}
              />
            </label>

            <label style={rangeLabelStyle}>
              Max
              <input
                type="range"
                min={PRICE_MIN}
                max={PRICE_MAX}
                step={PRICE_STEP}
                value={safeMax}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                style={{ width: "100%" }}
              />
            </label>
          </div>
        </div>

        <label style={labelStyle}>
          {properties?.quickRequest?.labels?.notes || "Notes (optional)"}
          <textarea
            name="notes"
            rows={3}
            placeholder={properties?.quickRequest?.placeholders?.notes || "If you selected 'Specific car from gallery', please specify which car here. Pickup location? Number of guests? Car seat needed?"}
            style={textareaStyle}
          />
        </label>

        <button type="submit" disabled={status === "sending"} style={buttonStyle}>
          {status === "sending" 
            ? (properties?.quickRequest?.buttons?.sending || properties?.common?.buttons?.sending || "Sending...")
            : (properties?.quickRequest?.buttons?.submit || "Submit Request")}
        </button>

        {status === "sent" && (
          <div style={{ fontSize: "13px" }}>
            {properties?.quickRequest?.messages?.success || "✅ Request received — we'll email you shortly."}
          </div>
        )}
        {status === "error" && (
          <div style={{ fontSize: "13px" }}>
            {properties?.quickRequest?.messages?.error || properties?.common?.messages?.somethingWentWrong || "❌ Something went wrong. Please try again."}
          </div>
        )}
      </form>
    </div>
  );
}

const multiSelectStyle = {
  ...inputStyle,
  appearance: "none",
  WebkitAppearance: "none",
  minHeight: "96px",
};

const rangeLabelStyle = {
  display: "grid",
  gap: "6px",
  fontSize: "13px",
  opacity: 0.95,
};
