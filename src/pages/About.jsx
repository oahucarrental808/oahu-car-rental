import SEO from "../components/SEO";
import heroImg from "../assets/hero.jpg";
import { container } from "../components/styles";

export default function About() {
  return (
    <>
      <SEO
        title="About Us - Oahu Car Rentals | Local Oʻahu Car Rental Service Since 2020"
        description="We're a local Oʻahu car rental operation focused on clean cars, straightforward pickup, and quick responses. Established in 2020, our goal is to make your rental easy so you can spend more time enjoying the island."
        keywords="Oahu car rental about, Honolulu car rental company, Hawaii car rental service, local Oahu car rental, Oahu car rental established, Oahu car rental business, family owned car rental Oahu"
        image={heroImg}
      />
      {/* HERO */}
      <header className="hero">
        <div
          className="hero-bg"
          style={{ backgroundImage: `url(${heroImg})` }}
          aria-label="Oahu Car Rentals - Beautiful Oahu landscape background"
        />
        <div className="hero-content" style={{ ...container, gridTemplateColumns: "1fr", textAlign: "center" }}>
          <h1 style={{ fontSize: "44px", lineHeight: 1.1, margin: "10px 0 14px" }}>
            About Us
          </h1>
        </div>
      </header>
      <div style={{ width: "min(900px, 92%)", margin: "0 auto", padding: "28px 0 60px" }}>
        <p style={{ opacity: 0.9, lineHeight: 1.7, fontSize: "16px", marginBottom: "24px" }}>
          We're a local Oʻahu operation focused on clean cars, straightforward pickup, and quick responses. Our goal is to make your rental easy so you can spend more time enjoying the island.
        </p>
        <p style={{ opacity: 0.9, lineHeight: 1.7, fontSize: "16px", marginBottom: "24px" }}>
          As long-time Oahu residents—I'm retired military and my partner is a nurse on the island—we understand the unique needs of our community and visitors alike. Over the years, we've had the pleasure of renting cars to thousands of travel nurses and visitors, building lasting relationships with our clients. We strive to provide the best cars at a reasonable price with maximum flexibility, whether you need a vehicle for just one day or for a year or more. We welcome ride-share drivers (Uber, Lyft) and delivery drivers, and we're proud to offer personalized service with Aloha 🌺🌴🌸🌈😊
        </p>
        <div style={{ opacity: 0.85, fontSize: "14px", marginBottom: "24px" }}>
          <strong>Established:</strong> June 1st, 2020
        </div>
        <div style={{ opacity: 0.85, fontSize: "14px", marginBottom: "24px" }}>
          <strong>Email:</strong>{" "}
          <a href="mailto:oahucarrentals@hotmail.com" style={{ color: "var(--primary)" }}>
            oahucarrentals@hotmail.com
          </a>
        </div>
        <div style={{ opacity: 0.85, fontSize: "14px", marginBottom: "24px" }}>
          <strong>Phone:</strong>{" "}
          <a href="tel:8086832509" style={{ color: "var(--primary)" }}>
            (808) 683-2509
          </a>
        </div>
      </div>
    </>
  );
}
