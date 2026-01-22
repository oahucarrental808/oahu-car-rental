import { useMemo } from "react";
import FaqItem from "../components/FaqItem";
import { useProperties } from "../utils/useProperties";

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

  return (
    <div style={{ width: "min(900px, 92%)", margin: "0 auto", padding: "28px 0 60px" }}>
      <h1 style={{ fontSize: "34px", margin: "0 0 10px" }}>
        {properties?.faq?.title || "FAQ"}
      </h1>

      {faqItems.length > 0 ? (
        faqItems.map((item, index) => (
          <FaqItem key={index} q={item.question} a={item.answer} />
        ))
      ) : (
        <p style={{ opacity: 0.8 }}>No FAQ items available.</p>
      )}
    </div>
  );
}
