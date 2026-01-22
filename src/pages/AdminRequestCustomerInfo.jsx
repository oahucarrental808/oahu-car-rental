// src/pages/AdminRequestCustomerInfo.jsx
import { useMemo, useState } from "react";
import AdminGate from "../components/AdminGate";

const DEBUG = import.meta.env.VITE_DEBUG_MODE === "true";

function onlyInt(value) {
  return String(value || "").replace(/\D/g, "");
}

function formatCostPerDay(intStr) {
  const n = onlyInt(intStr);
  if (!n) return "";
  return `$${n}/Day`;
}

export default function AdminRequestCustomerInfo() {
  const [v, setV] = useState({
    vin: "",
    color: "",
    make: "",
    model: "", // ✅ was year
    licensePlate: "", // ✅ added
    startDate: "",
    endDate: "",
    customerEmail: "", // ✅ added
    costPerDay: "", // ✅ integer-only, stored raw digits; sent as "$X/Day"
  });

  const [createdLink, setCreatedLink] = useState("");
  const [status, setStatus] = useState("idle"); // idle | creating | error
  const [error, setError] = useState("");

  const set = (k, val) => setV((x) => ({ ...x, [k]: val }));

  const formattedCostPerDay = useMemo(() => formatCostPerDay(v.costPerDay), [v.costPerDay]);

  const debugEmailPreview = useMemo(() => {
    if (!DEBUG || !createdLink) return "";
    const to = (v.customerEmail || "").trim() || "CUSTOMER";
    return [
      `To: ${to}`,
      `Subject: Customer info link`,
      ``,
      `Hi,`,
      ``,
      `Please complete your customer information using the secure link below:`,
      createdLink,
      ``,
      `— Oahu Car Rentals`,
      ``,
      `TODO (non-debug): send this email on submittal + start scheduler`,
    ].join("\n");
  }, [createdLink, v.customerEmail]);

  async function onSubmit(e) {
    e.preventDefault();
    setStatus("creating");
    setError("");
    setCreatedLink("");

    // Validate dates
    if (v.startDate && v.endDate) {
      const start = new Date(v.startDate);
      const end = new Date(v.endDate);
      if (end <= start) {
        setStatus("error");
        setError("End date must be after start date.");
        return;
      }
    }

    try {
      const payload = {
        ...v,
        costPerDay: formattedCostPerDay, // send in required format "$X/Day"
      };

      const res = await fetch("/api/createCustomerInfoLink", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Secret": import.meta.env.VITE_ADMIN_SECRET || "",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(await res.text());

      const out = await res.json();
      setCreatedLink(out.url);
      setStatus("idle");

      // TODO (non-debug): send email to customerEmail with out.url and start scheduler
      // In DEBUG mode we just display debugEmailPreview below.
    } catch (err) {
      console.error(err);
      setStatus("error");
      setError(err?.message || "Failed to create link.");
    }
  }

  return (
    <AdminGate title="Admin: Request Customer Info">
      <div style={{ maxWidth: 820, margin: "0 auto", padding: 24 }}>
        <h1>Request Customer Info</h1>

        <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
          <label>
            VIN
            <input required value={v.vin} onChange={(e) => set("vin", e.target.value)} />
          </label>

          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr 1fr" }}>
            <label>
              Make
              <input required value={v.make} onChange={(e) => set("make", e.target.value)} />
            </label>
            <label>
              Color
              <input required value={v.color} onChange={(e) => set("color", e.target.value)} />
            </label>
            <label>
              Model
              <input required value={v.model} onChange={(e) => set("model", e.target.value)} />
            </label>
          </div>

          <label>
            License Plate
            <input value={v.licensePlate} onChange={(e) => set("licensePlate", e.target.value)} />
          </label>

          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
            <label>
              Start Date (Pickup)
              <input
                required
                type="date"
                value={v.startDate}
                onChange={(e) => set("startDate", e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
            </label>
            <label>
              End Date (Return)
              <input
                required
                type="date"
                value={v.endDate}
                onChange={(e) => set("endDate", e.target.value)}
                min={v.startDate || new Date().toISOString().split("T")[0]}
              />
            </label>
          </div>

          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
            <label>
              Customer Email
              <input
                required
                type="email"
                value={v.customerEmail}
                onChange={(e) => set("customerEmail", e.target.value)}
              />
            </label>

            <label>
              Cost Per Day (integer)
              <input
                required
                inputMode="numeric"
                value={v.costPerDay}
                onChange={(e) => set("costPerDay", onlyInt(e.target.value))}
                placeholder="e.g. 85"
              />
              <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
                Will be saved as <strong>{formattedCostPerDay || "$X/Day"}</strong>
              </div>
            </label>
          </div>

          <button type="submit" disabled={status === "creating"}>
            {status === "creating" ? "Creating..." : "Create Customer Info Link"}
          </button>

          {status === "error" && error ? (
            <div style={{ color: "crimson", whiteSpace: "pre-wrap" }}>{error}</div>
          ) : null}
        </form>

        {createdLink && (
          <div style={{ marginTop: 16 }}>
            <strong>✅ Link created</strong>
            <input readOnly value={createdLink} style={{ width: "100%", marginTop: 8 }} />

            {DEBUG && debugEmailPreview ? (
              <div style={{ marginTop: 12 }}>
                <strong>Debug Email Preview</strong>
                <pre
                  style={{
                    marginTop: 8,
                    padding: 12,
                    borderRadius: 10,
                    border: "1px solid var(--border)",
                    background: "rgba(255,255,255,0.85)",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {debugEmailPreview}
                </pre>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </AdminGate>
  );
}
