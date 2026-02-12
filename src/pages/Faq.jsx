import { useMemo, useEffect } from "react";
import FaqItem from "../components/FaqItem";
import { useProperties } from "../utils/useProperties";
import SEO from "../components/SEO";
import heroImg from "../assets/hero.jpg";
import { container } from "../components/styles";

import walkAroundPdf from "../assets/X RENTAL Walk-Around Form.pdf";
import roadsidePdf from "../assets/Y RENTAL Roadside info.pdf";
import claimReportingPdf from "../assets/Z RENTAL Claim Reporting Form.pdf";

// Map PDF keys to actual PDF imports
const pdfMap = {
  walkAroundForm: walkAroundPdf,
  roadsideInfo: roadsidePdf,
  claimReportingForm: claimReportingPdf,
};

export default function Faq() {
  const [properties] = useProperties();

  // Get answer from a nested path (e.g., "home.referralText")
  const getAnswerFromPath = (path) => {
    if (!path || !properties) return "";
    const keys = path.split(".");
    let value = properties;
    for (const key of keys) {
      if (value && typeof value === "object" && key in value) {
        value = value[key];
      } else {
        return "";
      }
    }
    return value || "";
  };

  // Render FAQ items dynamically from properties
  const faqItems = useMemo(() => {
    if (!properties?.faq?.items || !Array.isArray(properties.faq.items)) {
      return [];
    }

    return properties.faq.items.map((item) => {
      let answer = item.answer || "";

      // Handle answerSource (for cross-references)
      if (item.answerSource) {
        answer = getAnswerFromPath(item.answerSource);
      }

      // Handle PDF links
      if (item.pdfLink && pdfMap[item.pdfLink]) {
        const pdfUrl = pdfMap[item.pdfLink];
        const pdfLinkText = item.pdfLinkText || properties?.faq?.pdfLinks?.[item.pdfLink] || "Open PDF";
        
        answer = (
          <>
            {answer}
            <div style={{ marginTop: 8 }}>
              <a href={pdfUrl} target="_blank" rel="noreferrer">
                {pdfLinkText}
              </a>
            </div>
          </>
        );
      }

      return {
        question: item.question || "",
        answer: answer || "",
      };
    });
  }, [properties]);

  // Add FAQ schema for rich snippets
  useEffect(() => {
    if (faqItems.length === 0) return;

    let faqSchemaScript = document.querySelector('script[type="application/ld+json"][data-faq-schema]');
    if (!faqSchemaScript) {
      faqSchemaScript = document.createElement("script");
      faqSchemaScript.setAttribute("type", "application/ld+json");
      faqSchemaScript.setAttribute("data-faq-schema", "true");
      document.head.appendChild(faqSchemaScript);
    }

    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqItems.map(item => ({
        "@type": "Question",
        "name": typeof item.question === "string" ? item.question : "",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": typeof item.answer === "string" ? item.answer : String(item.answer || "")
        }
      }))
    };

    faqSchemaScript.textContent = JSON.stringify(faqSchema);

    return () => {
      // Cleanup on unmount
      const script = document.querySelector('script[type="application/ld+json"][data-faq-schema]');
      if (script) {
        script.remove();
      }
    };
  }, [faqItems]);

  return (
    <>
      <SEO
        title={`${properties?.faq?.title || "Information"} - ${properties?.brand?.name || "Oahu Car Rentals"} | Frequently Asked Questions`}
        description="Frequently asked questions about renting a car on Oʻahu. Learn about rental requirements, pickup and drop-off locations, pricing, insurance, cancellation policies, and more."
        keywords="Oahu car rental FAQ, car rental questions, Oahu rental car requirements, Hawaii car rental policies, Oahu car rental information, car rental FAQ Honolulu, Oahu car rental help"
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
            {properties?.faq?.title || "Information"}
          </h1>
        </div>
      </header>
    <div style={{ width: "min(900px, 92%)", margin: "0 auto", padding: "28px 0 60px" }}>

      {faqItems.length > 0 ? (
        faqItems.map((item, index) => (
          <FaqItem key={index} q={item.question} a={item.answer} />
        ))
      ) : (
        <p style={{ opacity: 0.8 }}>No information items available.</p>
      )}
    </div>
    </>
  );
}
