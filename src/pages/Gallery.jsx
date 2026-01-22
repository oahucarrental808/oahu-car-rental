// src/pages/Gallery.jsx
import { useMemo } from "react";

const imageModules = import.meta.glob("../assets/gallery/*.{jpg,jpeg,png,webp}", {
  eager: true,
  import: "default",
});

export default function Gallery() {
  const photos = useMemo(() => Object.values(imageModules), []);

  return (
    <div style={{ width: "min(1100px, 92%)", margin: "0 auto", padding: "28px 0 60px" }}>
      <h1 style={{ fontSize: "34px", marginBottom: 16 }}>Gallery</h1>

      {photos.length === 0 ? (
        <p style={{ opacity: 0.7 }}>No photos available.</p>
      ) : (
        <div className="gallery-grid">
          {photos.map((src, i) => (
            <img
              key={i}
              src={src}
              alt={`Gallery ${i + 1}`}
              className="gallery-img"
              loading="lazy"
            />
          ))}
        </div>
      )}
    </div>
  );
}
