import { useProperties } from "../utils/useProperties";

export default function About() {
  const [properties] = useProperties();
  
  return (
    <div style={{ width: "min(900px, 92%)", margin: "0 auto", padding: "28px 0 60px" }}>
      <h1 style={{ fontSize: "34px", margin: "0 0 10px" }}>
        {properties?.about?.title || "About Us"}
      </h1>
      <p style={{ opacity: 0.9, lineHeight: 1.7, marginBottom: "16px" }}>
        {properties?.about?.description || "We're a local Oʻahu operation focused on clean cars, straightforward pickup, and quick responses. Our goal is to make your rental easy so you can spend more time enjoying the island."}
      </p>
      <div style={{ opacity: 0.85, fontSize: "14px", marginBottom: "20px" }}>
        <strong>{properties?.about?.establishedLabel || "Established:"}</strong> {properties?.brand?.established || "June 1st, 2020"}
      </div>
      <div style={{ opacity: 0.9, lineHeight: 1.8 }}>
        <div style={{ marginBottom: "8px" }}>
          <strong>{properties?.about?.emailLabel || "Email:"}</strong> <a href="mailto:oahucarrentals@hotmail.com" style={{ color: "var(--primary)" }}>oahucarrentals@hotmail.com</a>
        </div>
        <div>
          <strong>{properties?.about?.phoneLabel || "Phone:"}</strong> <a href="tel:+18081234567" style={{ color: "var(--primary)" }}>(808) 123-4567</a>
        </div>
      </div>
    </div>
  );
}
  
