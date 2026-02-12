import QuickRequestCard from "../components/QuickRequestCard";
import { useProperties } from "../utils/useProperties";
import SEO from "../components/SEO";

export default function Request() {
  const [properties] = useProperties();
  
  return (
    <>
      <SEO
        title={`${properties?.request?.title || "Request a Car Rental Quote"} - ${properties?.brand?.name || "Oahu Car Rentals"} | Get Instant Pricing in Honolulu, HI`}
        description={properties?.request?.subtitle || "Get a quick car rental quote for Oʻahu. Tell us your dates and vehicle preferences, and we'll reply with availability and pricing. Fast, easy, and hassle-free."}
        keywords="Oahu car rental quote, request car rental Oahu, Honolulu car rental booking, Oahu car rental request form, get car rental quote Oahu, instant car rental pricing Honolulu"
      />
    <div style={{ width: "min(900px, 92%)", margin: "0 auto", padding: "28px 0 60px" }}>
      <h1 style={{ fontSize: "34px", margin: "0 0 10px" }}>
        {properties?.request?.title || "Request a Quote"}
      </h1>
        <div style={{ maxWidth: "560px" }}>
            <QuickRequestCard 
              title={properties?.request?.formTitle || "Request"} 
              subtitle={properties?.request?.subtitle || "Tell us what you need and we'll reply with availability + pricing."} 
            />
        </div>
    </div>
    </>
  );
}

