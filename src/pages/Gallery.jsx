// src/pages/Gallery.jsx
import { useMemo } from "react";
import galleryCars from "../data/gallery-cars.json";

const imageModules = import.meta.glob("../assets/gallery/*.{jpg,jpeg,png,webp}", {
  eager: true,
  import: "default",
});

export default function Gallery() {
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
    <div style={{ width: "min(1100px, 92%)", margin: "0 auto", padding: "28px 0 60px" }}>
      <h1 style={{ fontSize: "34px", marginBottom: 16 }}>Gallery</h1>

      {photosWithData.length === 0 ? (
        <p style={{ opacity: 0.7 }}>No photos available.</p>
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
            const altText = carInfo || `Gallery ${i + 1}`;
            
            return (
              <div key={i} style={{ position: "relative" }}>
                <img
                  src={photo.src}
                  alt={altText}
                  className="gallery-img"
                  loading="lazy"
                />
                {(photo.year || photo.make || photo.model || photo.license) && (
                  <div style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)",
                    padding: "12px",
                    borderRadius: "0 0 16px 16px",
                    color: "white",
                    fontSize: "13px",
                    fontWeight: 600
                  }}>
                    {carInfo}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
