// src/components/FaqItem.jsx
import { useId, useState } from "react";

export default function FaqItem({ q, a, defaultOpen = false }) {
  const [open, setOpen] = useState(!!defaultOpen);
  const contentId = useId();

  return (
    <div
      style={{
        border: "1px solid rgba(0,0,0,0.10)",
        borderRadius: 16,
        padding: 14,
        marginTop: 12,
        background: "rgba(255,255,255,0.85)",
        boxShadow: "0 12px 30px rgba(0,0,0,0.06)",
        color: "var(--text)", // ✅ force readable text on light background
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={contentId}
        style={{
          width: "100%",
          textAlign: "left",
          background: "transparent",
          border: "none",
          padding: 0,
          margin: 0,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,

          // ✅ override global button styles (which set white text)
          color: "var(--text)",
          fontWeight: 800,
        }}
      >
        <div style={{ fontWeight: 800 }}>{q}</div>

        <div
          aria-hidden="true"
          style={{
            fontWeight: 900,
            lineHeight: 1,
            opacity: 0.7,
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 160ms ease",
            color: "var(--text)",
          }}
        >
          ▾
        </div>
      </button>

      {open && (
        <div
          id={contentId}
          style={{
            opacity: 0.9,
            marginTop: "10px",
            lineHeight: 1.6,
            color: "var(--text)",
          }}
        >
          {a}
        </div>
      )}
    </div>
  );
}
