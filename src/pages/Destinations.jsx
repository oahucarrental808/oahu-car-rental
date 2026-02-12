import { useProperties } from "../utils/useProperties";
import SEO from "../components/SEO";
import heroImg from "../assets/hero.jpg";
import { container } from "../components/styles";

// Helper function to generate Google Maps URL
const getGoogleMapsUrl = (query) => {
  const encoded = encodeURIComponent(`${query}, Oahu, Hawaii`);
  return `https://www.google.com/maps/search/?api=1&query=${encoded}`;
};

// Mapping of locations to Google Maps URLs
const locationMaps = {
  // Beaches
  "Kailua": "https://www.google.com/maps/search/?api=1&query=Kailua+Beach+Park,+Oahu,+Hawaii",
  "Waimanalo": "https://www.google.com/maps/search/?api=1&query=Waimanalo+Beach+Park,+Oahu,+Hawaii",
  "Lanikai": "https://www.google.com/maps/search/?api=1&query=Lanikai+Beach,+Oahu,+Hawaii",
  "Waimea Bay": "https://www.google.com/maps/search/?api=1&query=Waimea+Bay+Beach+Park,+Oahu,+Hawaii",
  "Sand Bar - Kaneohe Bay": "https://www.google.com/maps/search/?api=1&query=Sandbar+Kaneohe+Bay,+Hawaii",
  
  // Hikes
  "Olomana": "https://www.google.com/maps/search/?api=1&query=Olomana+Trail,+Oahu,+Hawaii",
  "Koko Head Stairs": "https://www.google.com/maps/search/?api=1&query=Koko+Head+Stairs,+Oahu,+Hawaii",
  "Makapu'u Lighthouse": "https://www.google.com/maps/search/?api=1&query=Makapu%27u+Lighthouse+Trail,+Oahu,+Hawaii",
  "Lainkai Pillboxes": "https://www.google.com/maps/search/?api=1&query=Lanikai+Pillboxes+Trail,+Oahu,+Hawaii",
  "Manaowili Falls": "https://www.google.com/maps/search/?api=1&query=Manaowili+Falls,+Oahu,+Hawaii",
  "Waimea Valley Falls": "https://www.google.com/maps/search/?api=1&query=Waimea+Valley,+Oahu,+Hawaii",
  "Swike (swim hike) Chinaman's Hat": "https://www.google.com/maps/search/?api=1&query=Chinaman%27s+Hat,+Oahu,+Hawaii",
  
  // Eating
  "Cinnamons at the Ilikai": "https://www.google.com/maps/search/?api=1&query=Cinnamons+at+the+Ilikai,+Honolulu,+Hawaii",
  "Dukes": "https://www.google.com/maps/search/?api=1&query=Dukes+Waikiki,+Honolulu,+Hawaii",
  "Tikis": "https://www.google.com/maps/search/?api=1&query=Tikis+Grill+and+Bar,+Waikiki,+Hawaii",
  "Tommy Bahamas": "https://www.google.com/maps/search/?api=1&query=Tommy+Bahama+Waikiki,+Honolulu,+Hawaii",
  "Signatures Steak House": "https://www.google.com/maps/search/?api=1&query=Signatures+Steak+House,+Honolulu,+Hawaii",
  "604 at Rainbow Marina": "https://www.google.com/maps/search/?api=1&query=604+at+Rainbow+Marina,+Pearl+Harbor,+Hawaii",
  "Magiamo": "https://www.google.com/maps/search/?api=1&query=Magiamo+Navy+Marine+Corps+Golf+Course,+Hawaii",
  "Nicos - Pier 38": "https://www.google.com/maps/search/?api=1&query=Nicos+Pier+38,+Honolulu,+Hawaii",
  "Nicos - Kailua": "https://www.google.com/maps/search/?api=1&query=Nicos+Kailua,+Hawaii",
  "Buzz's - Kailua": "https://www.google.com/maps/search/?api=1&query=Buzz%27s+Steakhouse+Kailua,+Hawaii",
  "Bacci Bistro - Kailua": "https://www.google.com/maps/search/?api=1&query=Bacci+Bistro+Kailua,+Hawaii",
  "Assagios - Kailua": "https://www.google.com/maps/search/?api=1&query=Assagios+Kailua,+Hawaii",
  "Halaewa Joes - Kaneohe": "https://www.google.com/maps/search/?api=1&query=Haleiwa+Joes+Kaneohe,+Hawaii",
  "Halaewa Joes - Halaewa": "https://www.google.com/maps/search/?api=1&query=Haleiwa+Joes+Haleiwa,+Hawaii",
  "Shrimp trucks": "https://www.google.com/maps/search/?api=1&query=North+Shore+Shrimp+Trucks,+Haleiwa,+Hawaii",
  "Sharks Cove": "https://www.google.com/maps/place/Shark%27s+Cove/@21.6419444,-158.0666667,15z",
  "Monkey Pod - Ko Olina": "https://www.google.com/maps/search/?api=1&query=Monkeypod+Kitchen+Ko+Olina,+Hawaii",
  "Kona Brewing - Hawaii Kai": "https://www.google.com/maps/search/?api=1&query=Kona+Brewing+Company+Hawaii+Kai,+Hawaii",
  "La Mariana": "https://www.google.com/maps/search/?api=1&query=La+Mariana+Sailing+Club,+Honolulu,+Hawaii",
  
  // Other
  "Kailua Farmer's Market": "https://www.google.com/maps/search/?api=1&query=Kailua+Farmer%27s+Market,+Hawaii",
  "Swap Meet - Oahu Stadium": "https://www.google.com/maps/search/?api=1&query=Aloha+Stadium+Swap+Meet,+Honolulu,+Hawaii",
  "Catamaran Cruise - Waikiki Beach": "https://www.google.com/maps/search/?api=1&query=Catamaran+Cruise+Waikiki+Beach,+Honolulu,+Hawaii",
  "Poke from Tamura's": "https://www.google.com/maps/search/?api=1&query=Tamura%27s+Fine+Wine+and+Liquors,+Hawaii",
  "Aviation Museum - Ford Island": "https://www.google.com/maps/search/?api=1&query=Pacific+Aviation+Museum+Ford+Island,+Oahu,+Hawaii",
  "Missouri - Ford Island": "https://www.google.com/maps/search/?api=1&query=USS+Missouri+Memorial,+Ford+Island,+Oahu,+Hawaii",
  "Arizona Memorial - Pearl Harbor": "https://www.google.com/maps/search/?api=1&query=USS+Arizona+Memorial,+Pearl+Harbor,+Oahu,+Hawaii",
  "Iolani Palace": "https://www.google.com/maps/search/?api=1&query=Iolani+Palace,+Honolulu,+Oahu,+Hawaii",
  "Bishop Museum": "https://www.google.com/maps/search/?api=1&query=Bishop+Museum,+Honolulu,+Oahu,+Hawaii",
  "UH sports": "https://www.google.com/maps/search/?api=1&query=University+of+Hawaii+Sports,+Honolulu,+Hawaii",
  "Wet and Wild water park": "https://www.google.com/maps/search/?api=1&query=Wet+n+Wild+Hawaii,+Kapolei,+Hawaii",
  "Kayak to the Mokes - Kailua": "https://www.google.com/maps/search/?api=1&query=Mokulua+Islands+Kailua,+Hawaii"
};

const destinations = {
  beaches: [
    "Kailua",
    "Waimanalo",
    "Lanikai",
    "Waimea Bay",
    "Sand Bar - Kaneohe Bay"
  ],
  hikes: [
    "Olomana",
    "Koko Head Stairs",
    "Makapu'u Lighthouse",
    "Lainkai Pillboxes",
    "Manaowili Falls",
    "Waimea Valley Falls",
    "Swike (swim hike) Chinaman's Hat"
  ],
  eating: [
    { name: "Cinnamons at the Ilikai", description: "Great breakfast and cocktails, overlooks the marina" },
    { name: "Dukes", description: "Great live music venue on Sundays" },
    { name: "Tikis", description: "Great outdoor dining views" },
    { name: "Tommy Bahamas", description: "Top floor open air feet in the sand" },
    { name: "Signatures Steak House", description: "" },
    { name: "604 at Rainbow Marina", description: "Near Pearl Harbor" },
    { name: "Magiamo", description: "At the Navy Marine Corps Golf Course" },
    { name: "Nicos - Pier 38", description: "HNL" },
    { name: "Nicos - Kailua", description: "" },
    { name: "Buzz's - Kailua", description: "" },
    { name: "Bacci Bistro - Kailua", description: "" },
    { name: "Assagios - Kailua", description: "" },
    { name: "Halaewa Joes - Kaneohe", description: "" },
    { name: "Halaewa Joes - Halaewa", description: "" },
    { name: "Shrimp trucks", description: "North shore" },
    { name: "Sharks Cove", description: "Food trucks" },
    { name: "Monkey Pod - Ko Olina", description: "" },
    { name: "Kona Brewing - Hawaii Kai", description: "" },
    { name: "La Mariana", description: "Tiki Bar" }
  ],
  other: [
    "Kailua Farmer's Market",
    "Swap Meet - Oahu Stadium",
    "Catamaran Cruise - Waikiki Beach",
    "Poke from Tamura's",
    "Aviation Museum - Ford Island",
    "Missouri - Ford Island",
    "Arizona Memorial - Pearl Harbor",
    "Iolani Palace",
    "Bishop Museum",
    "UH sports",
    "Wet and Wild water park",
    "Kayak to the Mokes - Kailua"
  ]
};

export default function Destinations() {
  const [properties] = useProperties();
  
  return (
    <>
      <SEO
        title={`${properties?.destinations?.title || "Destinations"} - ${properties?.brand?.name || "Oahu Car Rentals"} | Things to Do on Oahu`}
        description="Discover the best beaches, hikes, restaurants, and attractions on Oʻahu. Our favorite spots to visit while exploring the island with your rental car."
        keywords="Oahu destinations, things to do Oahu, Oahu beaches, Oahu hikes, Oahu restaurants, Honolulu attractions, Oahu travel guide, what to do in Oahu"
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
            {properties?.destinations?.title || "Some of our favorite spots while visiting Oahu"}
          </h1>
        </div>
      </header>
      <div style={{ width: "min(900px, 92%)", margin: "0 auto", padding: "28px 0 60px" }}>
      
      <p style={{ opacity: 0.9, lineHeight: 1.7, marginBottom: "32px", fontSize: "14px", fontWeight: 600 }}>
        ⚠️ Tourism is picking up — better make reservations well in advance.
      </p>

      {/* Beaches Section */}
      <section style={{ marginBottom: "40px" }}>
        <h2 style={{ 
          fontSize: "24px", 
          margin: "0 0 16px",
          color: "var(--primary)",
          fontWeight: 800
        }}>
          Beaches
        </h2>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "12px"
        }}>
          {destinations.beaches.map((beach, idx) => {
            const mapsUrl = locationMaps[beach] || getGoogleMapsUrl(beach);
            return (
              <div
                key={idx}
                style={{
                  background: "var(--panel)",
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                  padding: "14px",
                  boxShadow: "var(--shadow)"
                }}
              >
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontWeight: 600,
                    fontSize: "15px",
                    color: "var(--primary)",
                    textDecoration: "none",
                    display: "block",
                    cursor: "pointer"
                  }}
                  onMouseEnter={(e) => e.target.style.textDecoration = "underline"}
                  onMouseLeave={(e) => e.target.style.textDecoration = "none"}
                >
                  {beach} 🗺️
                </a>
              </div>
            );
          })}
        </div>
      </section>

      {/* Hikes Section */}
      <section style={{ marginBottom: "40px" }}>
        <h2 style={{ 
          fontSize: "24px", 
          margin: "0 0 16px",
          color: "var(--primary)",
          fontWeight: 800
        }}>
          Hikes
        </h2>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "12px"
        }}>
          {destinations.hikes.map((hike, idx) => {
            const mapsUrl = locationMaps[hike] || getGoogleMapsUrl(hike);
            return (
              <div
                key={idx}
                style={{
                  background: "var(--panel)",
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                  padding: "14px",
                  boxShadow: "var(--shadow)"
                }}
              >
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontWeight: 600,
                    fontSize: "15px",
                    color: "var(--primary)",
                    textDecoration: "none",
                    display: "block",
                    cursor: "pointer"
                  }}
                  onMouseEnter={(e) => e.target.style.textDecoration = "underline"}
                  onMouseLeave={(e) => e.target.style.textDecoration = "none"}
                >
                  {hike} 🗺️
                </a>
              </div>
            );
          })}
        </div>
      </section>

      {/* Eating Section */}
      <section style={{ marginBottom: "40px" }}>
        <h2 style={{ 
          fontSize: "24px", 
          margin: "0 0 16px",
          color: "var(--primary)",
          fontWeight: 800
        }}>
          Eating on Oahu
        </h2>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "14px"
        }}>
          {destinations.eating.map((place, idx) => {
            const mapsUrl = locationMaps[place.name] || getGoogleMapsUrl(place.name);
            return (
              <div
                key={idx}
                style={{
                  background: "var(--panel)",
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                  padding: "16px",
                  boxShadow: "var(--shadow)"
                }}
              >
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontWeight: 600,
                    fontSize: "15px",
                    marginBottom: place.description ? "6px" : "0",
                    color: "var(--primary)",
                    textDecoration: "none",
                    display: "block",
                    cursor: "pointer"
                  }}
                  onMouseEnter={(e) => e.target.style.textDecoration = "underline"}
                  onMouseLeave={(e) => e.target.style.textDecoration = "none"}
                >
                  {place.name} 🗺️
                </a>
                {place.description && (
                  <div style={{ fontSize: "13px", opacity: 0.8, lineHeight: 1.5, marginTop: "4px" }}>
                    {place.description}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Other Section */}
      <section style={{ marginBottom: "40px" }}>
        <h2 style={{ 
          fontSize: "24px", 
          margin: "0 0 16px",
          color: "var(--primary)",
          fontWeight: 800
        }}>
          Other
        </h2>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "12px"
        }}>
          {destinations.other.map((item, idx) => {
            const mapsUrl = locationMaps[item] || getGoogleMapsUrl(item);
            return (
              <div
                key={idx}
                style={{
                  background: "var(--panel)",
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                  padding: "14px",
                  boxShadow: "var(--shadow)"
                }}
              >
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontWeight: 600,
                    fontSize: "15px",
                    color: "var(--primary)",
                    textDecoration: "none",
                    display: "block",
                    cursor: "pointer"
                  }}
                  onMouseEnter={(e) => e.target.style.textDecoration = "underline"}
                  onMouseLeave={(e) => e.target.style.textDecoration = "none"}
                >
                  {item} 🗺️
                </a>
              </div>
            );
          })}
        </div>
      </section>
      </div>
    </>
  );
}
