import QuickRequestCard from "../components/QuickRequestCard";
import { useProperties } from "../utils/useProperties";

export default function Request() {
  const [properties] = useProperties();
  
  return (
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
  );
}

