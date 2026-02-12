// src/pages/Gallery.jsx
import { useMemo } from "react";
import { useProperties } from "../utils/useProperties";
import SEO from "../components/SEO";
import galleryCars from "../data/gallery-cars.json";
import heroImg from "../assets/hero.jpg";
import { container } from "../components/styles";

const imageModules = import.meta.glob("../assets/gallery/*.{jpg,jpeg,png,webp}", {
  eager: true,
  import: "default",
});

export default function Gallery() {
  const [properties] = useProperties();
  
  const photosWithData = useMemo(() => {
    const imageEntries = Object.entries(imageModules);
    
    return imageEntries.map(([path, src]) => {
      // Extract filename from path (e.g., "../assets/gallery/image.jpg" -> "image.jpg")
      const filename = path.split("/").pop() || path.split("\\").pop() || "";
      
      // Find matching car data from JSON
      const carData = galleryCars.find(car => car.filename === filename) || {
        filename,
        make: "",
        model: "",
        year: "",
        license: ""
      };
      
      return {
        src,
        filename,
        make: carData.make,
        model: carData.model,
        year: carData.year,
        license: carData.license || ""
      };
    });
  }, []);

  return (
    <>
      <SEO
        title={`${properties?.gallery?.title || "Car Rental Fleet Gallery"} - ${properties?.brand?.name || "Oahu Car Rentals"} | View Our Vehicles in Honolulu, HI`}
        description={`Browse our complete fleet of rental vehicles available on Oʻahu. View photos of our clean, well-maintained cars, SUVs, and vans. Find the perfect vehicle for your Hawaii adventure.`}
        keywords="Oahu car rental fleet, Honolulu car rental vehicles, Hawaii rental car gallery, Oahu rental car photos, car rental Oahu inventory, Oahu SUV rental, Oahu van rental, rental car fleet Honolulu"
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
            {properties?.gallery?.title || "Gallery"}
          </h1>
        </div>
      </header>
    <div style={{ width: "min(1100px, 92%)", margin: "0 auto", padding: "28px 0 60px" }}>

      {photosWithData.length === 0 ? (
        <p style={{ opacity: 0.7 }}>
          {properties?.gallery?.noPhotos || "No photos available."}
        </p>
      ) : (
        <div className="gallery-grid">
          {photosWithData.map((photo, i) => {
            // Format: Year Make/Model License
            const parts = [];
            if (photo.year) parts.push(photo.year);
            if (photo.make && photo.model) {
              parts.push(`${photo.make}/${photo.model}`);
            } else if (photo.make) {
              parts.push(photo.make);
            } else if (photo.model) {
              parts.push(photo.model);
            }
            if (photo.license) parts.push(photo.license);
            
            const carInfo = parts.join(" ");
            const altText = carInfo 
              ? `${carInfo} - Oahu Car Rentals rental vehicle available for rent on Oahu`
              : `Rental vehicle ${i + 1} - Oahu Car Rentals fleet`;
            
            return (
              <div key={i} style={{ display: "flex", flexDirection: "column" }}>
                <img
                  src={photo.src}
                  alt={altText}
                  className="gallery-img"
                  loading="lazy"
                />
                <div style={{
                  marginTop: "8px",
                  padding: "8px 0",
                  color: "var(--text)",
                  fontSize: "14px",
                  fontWeight: 500,
                  lineHeight: 1.4,
                  minHeight: "20px"
                }}>
                  {carInfo || <span style={{ opacity: 0.6, fontStyle: "italic" }}>No information available</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
    </>
  );
}
