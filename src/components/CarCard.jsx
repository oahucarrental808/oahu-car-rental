export default function CarCard({ src, title, subtitle }) {
    return (
      <div>
        <div style={{ aspectRatio: "16 / 10" }}>
          <img src={src} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        <div style={{ padding: "12px" }}>
          <div style={{ fontWeight: 800 }}>{title}</div>
          <div style={{ fontSize: "13px", opacity: 0.85 }}>{subtitle}</div>
        </div>
      </div>
    );
  }
  
