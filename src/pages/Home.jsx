import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import QuickRequestCard from "../components/QuickRequestCard";
import { container } from "../components/styles";
import { useProperties } from "../utils/useProperties";

import reviews from "../data/reviews.json";

import heroImg from "../assets/hero.jpg";
import suvImg from "../assets/suv.jpg";


export default function Home() {
  const [properties] = useProperties();
  const navigate = useNavigate();

  // ---- rotating reviews (reads from JSON) ----
  const list = Array.isArray(reviews) ? reviews : [];
  const [reviewIdx, setReviewIdx] = useState(0);

  useEffect(() => {
    if (!list.length) return;
    const id = window.setInterval(() => {
      setReviewIdx((i) => (i + 1) % list.length);
    }, 6500);
    return () => window.clearInterval(id);
  }, [list.length]);

  const current = useMemo(() => {
    if (!list.length) return null;
    const safeIdx = Math.max(0, Math.min(reviewIdx, list.length - 1));
    return list[safeIdx];
  }, [list, reviewIdx]);

  function stars(n) {
    const x = Math.max(0, Math.min(5, Number(n) || 0));
    return "★★★★★☆☆☆☆☆".slice(5 - x, 10 - x);
  }

  return (
    <>
      {/* HERO */}
      <header className="hero">
        <div
          className="hero-bg"
          style={{ backgroundImage: `url(${heroImg})` }}
        />

        <div className="hero-content" style={{ ...container }}>
          {/* LEFT COPY */}
          <div>
            <div style={{ fontSize: "14px", letterSpacing: "0.08em", opacity: 0.9 }}>
              {properties?.brand?.name || "OAHU CAR RENTALS"}
            </div>

            <h1 style={{ fontSize: "44px", lineHeight: 1.1, margin: "10px 0 14px" }}>
              {properties?.brand?.tagline || "Simple, fast car rentals on Oʻahu"}
            </h1>

            <p style={{ fontSize: "16px", lineHeight: 1.7, maxWidth: "52ch", opacity: 0.95 }}>
              {properties?.home?.description || "Need a car for your trip? We make it easy to get a quick quote with no hassle. Choose your dates and we'll confirm availability fast. Pickup and drop-off are straightforward with local support. Clean cars, fair prices, and a smooth start to your island time."}
            </p>

            <div style={{ marginTop: 14, fontSize: 14, opacity: 0.9, maxWidth: "52ch" }}>
              {properties?.home?.referralText || properties?.faq?.answers?.referralBonuses || "We offer referral bonuses for connecting us with renters or buyers—send them our way and we'll take care of the rest."}
            </div>

            <img 
              src={suvImg} 
              alt="Jeep" 
              style={{ 
                width: "100%", 
                maxWidth: "100%",
                height: "auto", 
                borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.3)",
                display: "block",
                marginTop: "20px"
              }} 
            />

            <div style={{ fontSize: "12px", opacity: 0.85, marginTop: "8px" }}>
              Established {properties?.brand?.established || "June 1st, 2020"}
            </div>
          </div>

          {/* RIGHT FORM */}
          <div style={{ width: "100%" }}>
            <QuickRequestCard
              title={properties?.request?.formTitle || "Request"}
              subtitle={properties?.request?.subtitle || "Tell us what you need and we'll reply with availability + pricing."}
              onSuccess={() => navigate("/request")}
            />
          </div>
        </div>
      </header>

      {/* ✅ REVIEWS — LIGHT BACKGROUND */}
      <section>
        <div style={{ ...container, padding: "28px 0" }}>
          <div
            style={{
              maxWidth: 720,
              margin: "0 auto",
              background: "rgba(255,255,255,0.85)",
              border: "1px solid rgba(0,0,0,0.08)",
              borderRadius: 18,
              padding: 18,
            }}
          >
            <div style={{ fontWeight: 900, letterSpacing: "0.02em", marginBottom: 6 }}>
              {properties?.home?.reviewsTitle || "Reviews"}
            </div>

            {!current ? (
              <div style={{ opacity: 0.8, lineHeight: 1.5 }}>
                {properties?.home?.reviewsComingSoon || "Reviews coming soon."}
              </div>
            ) : (
              <>
                <div style={{ fontWeight: 800 }}>{stars(current.rating)}</div>
                <div style={{ marginTop: 6, opacity: 0.9, lineHeight: 1.6 }}>
                  “{current.text}”
                </div>
                <div style={{ marginTop: 8, fontSize: 13, opacity: 0.75 }}>
                  — {current.name}
                  {current.location ? `, ${current.location}` : ""}
                </div>
              </>
            )}
          </div>
        </div>
      </section>

    </>
  );
}
