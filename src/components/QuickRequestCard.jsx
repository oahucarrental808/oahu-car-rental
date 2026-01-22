import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { buttonStyle, inputStyle, labelStyle, textareaStyle } from "./styles";


const CAR_TYPE_OPTIONS = [
  { value: "Compact", label: "Compact" },
  { value: "SUV", label: "SUV" },
  { value: "Van", label: "Van" },
  { value: "Any", label: "Any" },
];

export default function QuickRequestCard({ title = "Request", subtitle, onSuccess }) {
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error

  // Price range state
  const PRICE_MIN = 20;
  const PRICE_MAX = 250;
  const PRICE_STEP = 5;

  const navigate = useNavigate();

  const [minPrice, setMinPrice] = useState(50);
  const [maxPrice, setMaxPrice] = useState(150);

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
    setStatus("sending");
  
    const form = new FormData(formEl);
  
    const payload = {
      name: form.get("name"),
      email: form.get("email"),
      startDate: form.get("startDate"),
      endDate: form.get("endDate"),
      carTypes: form.getAll("carTypes"),
      minPrice: safeMin,
      maxPrice: safeMax,
      notes: form.get("notes") || "",
    };
  
    try {
      const FUNCTION_URL =
        "https://us-central1-oahu-car-rentals.cloudfunctions.net/submitRequest";
  
      const resp = await fetch(FUNCTION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
  
      const data = await resp.json();
      if (!resp.ok || !data.ok) throw new Error(data.error || "Request failed");
  
      setStatus("sent");
      
      // Reset immediately (before anything that might unmount/navigate)
        if (formEl && typeof formEl.reset === "function") {
            formEl.reset();
        }                        // ✅ use captured ref
  
      setMinPrice(50);
      setMaxPrice(150);
  
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
          Name
          <input name="name" required placeholder="Your name" style={inputStyle} />
        </label>

        <label style={labelStyle}>
          Email
          <input name="email" type="email" required placeholder="you@email.com" style={inputStyle} />
        </label>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <label style={labelStyle}>
            Start date
            <input name="startDate" type="date" required style={inputStyle} />
          </label>

          <label style={labelStyle}>
            End date
            <input name="endDate" type="date" required style={inputStyle} />
          </label>
        </div>

        {/* Car type multi-select */}
        <label style={labelStyle}>
          Car type (select one or more)
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
            <div style={{ fontSize: "13px", opacity: 0.95 }}>Daily budget range</div>
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
          Notes (optional)
          <textarea
            name="notes"
            rows={3}
            placeholder="Pickup location? Number of guests? Car seat needed?"
            style={textareaStyle}
          />
        </label>

        <button type="submit" disabled={status === "sending"} style={buttonStyle}>
          {status === "sending" ? "Sending..." : "Submit Request"}
        </button>

        {status === "sent" && (
          <div style={{ fontSize: "13px" }}>✅ Request received — we’ll email you shortly.</div>
        )}
        {status === "error" && (
          <div style={{ fontSize: "13px" }}>❌ Something went wrong. Please try again.</div>
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
