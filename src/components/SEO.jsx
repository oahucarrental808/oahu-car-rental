// src/components/SEO.jsx
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * SEO Component - Updates document head with meta tags for better searchability
 * @param {Object} props
 * @param {string} props.title - Page title
 * @param {string} props.description - Meta description
 * @param {string} props.keywords - Meta keywords (comma-separated)
 * @param {string} props.image - Open Graph image URL
 * @param {string} props.type - Open Graph type (default: "website")
 * @param {boolean} props.noindex - Whether to add noindex meta tag
 * @param {string} props.url - Custom URL (optional, defaults to current page URL)
 */
export default function SEO({
  title = "Oahu Car Rentals - Simple, Fast Car Rentals on Oʻahu",
  description = "Need a car for your trip? We make it easy to get a quick quote with no hassle. Clean cars, fair prices, and a smooth start to your island time.",
  keywords = "Oahu car rental, Honolulu car rental, Hawaii car rental, car rental Oahu, rent a car Honolulu, cheap car rental Hawaii, Oahu vehicle rental, car hire Oahu",
  image = "/hero.jpg",
  type = "website",
  noindex = false,
  url = null,
}) {
  const location = useLocation();
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const currentUrl = url || `${baseUrl}${location.pathname}`;
  const fullImageUrl = image && image.startsWith("http") ? image : `${baseUrl}${image}`;

  useEffect(() => {
    // Update title
    if (title) {
      document.title = title;
    }

    // Helper function to update or create meta tag
    const updateMetaTag = (property, content, isProperty = false) => {
      if (!content) return;
      const selector = isProperty ? `meta[property="${property}"]` : `meta[name="${property}"]`;
      let meta = document.querySelector(selector);
      
      if (!meta) {
        meta = document.createElement("meta");
        if (isProperty) {
          meta.setAttribute("property", property);
        } else {
          meta.setAttribute("name", property);
        }
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", content);
    };

    // Primary Meta Tags
    updateMetaTag("description", description);
    updateMetaTag("keywords", keywords);
    updateMetaTag("author", "Oahu Car Rentals");
    updateMetaTag("robots", noindex ? "noindex, nofollow" : "index, follow");

    // Open Graph Tags
    updateMetaTag("og:type", type, true);
    updateMetaTag("og:url", currentUrl, true);
    updateMetaTag("og:title", title, true);
    updateMetaTag("og:description", description, true);
    updateMetaTag("og:image", fullImageUrl, true);
    updateMetaTag("og:site_name", "Oahu Car Rentals", true);
    updateMetaTag("og:locale", "en_US", true);

    // Twitter Card Tags
    updateMetaTag("twitter:card", "summary_large_image", true);
    updateMetaTag("twitter:url", currentUrl, true);
    updateMetaTag("twitter:title", title, true);
    updateMetaTag("twitter:description", description, true);
    updateMetaTag("twitter:image", fullImageUrl, true);

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", currentUrl);

    // Structured Data (JSON-LD) for CarRental
    let structuredDataScript = document.querySelector('script[type="application/ld+json"][data-seo]');
    if (!structuredDataScript) {
      structuredDataScript = document.createElement("script");
      structuredDataScript.setAttribute("type", "application/ld+json");
      structuredDataScript.setAttribute("data-seo", "true");
      document.head.appendChild(structuredDataScript);
    }

    const structuredData = {
      "@context": "https://schema.org",
      "@type": "CarRental",
      "name": "Oahu Car Rentals",
      "alternateName": "Oahu Car Rental Service",
      "description": description,
      "url": baseUrl,
      "logo": `${baseUrl}/vite.svg`,
      "image": fullImageUrl,
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "123 Main Street",
        "addressLocality": "Honolulu",
        "addressRegion": "HI",
        "postalCode": "96815",
        "addressCountry": "US"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": "21.3099",
        "longitude": "-157.8581"
      },
      "telephone": "+1-808-123-4567",
      "email": "oahucarrentals@hotmail.com",
      "priceRange": "$$",
      "openingHours": "Mo-Su 00:00-23:59",
      "areaServed": [
        {
          "@type": "City",
          "name": "Honolulu"
        },
        {
          "@type": "City",
          "name": "Kailua"
        },
        {
          "@type": "City",
          "name": "Kaneohe"
        },
        {
          "@type": "State",
          "name": "Hawaii"
        },
        {
          "@type": "Island",
          "name": "Oahu"
        }
      ],
      "serviceType": "Car Rental",
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "Car Rental Services",
        "itemListElement": [
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Product",
              "name": "Compact Car Rental"
            }
          },
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Product",
              "name": "SUV Rental"
            }
          },
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Product",
              "name": "Van Rental"
            }
          }
        ]
      },
      "sameAs": []
    };

    structuredDataScript.textContent = JSON.stringify(structuredData);

    // Breadcrumb Schema for better navigation understanding
    const pathSegments = location.pathname.split('/').filter(Boolean);
    if (pathSegments.length > 0) {
      let breadcrumbScript = document.querySelector('script[type="application/ld+json"][data-breadcrumb]');
      if (!breadcrumbScript) {
        breadcrumbScript = document.createElement("script");
        breadcrumbScript.setAttribute("type", "application/ld+json");
        breadcrumbScript.setAttribute("data-breadcrumb", "true");
        document.head.appendChild(breadcrumbScript);
      }

      const breadcrumbList = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": baseUrl
          },
          ...pathSegments.map((segment, index) => {
            const segmentName = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
            const segmentUrl = `${baseUrl}/${pathSegments.slice(0, index + 1).join('/')}`;
            return {
              "@type": "ListItem",
              "position": index + 2,
              "name": segmentName,
              "item": segmentUrl
            };
          })
        ]
      };

      breadcrumbScript.textContent = JSON.stringify(breadcrumbList);
    }
  }, [title, description, keywords, image, type, noindex, url, baseUrl, location.pathname, fullImageUrl, currentUrl]);

  return null; // This component doesn't render anything
}

/**
 * Hook version of SEO component
 */
export function useSEO(options) {
  useEffect(() => {
    if (options.title) {
      document.title = options.title.includes(options.siteName || "Oahu Car Rentals")
        ? options.title
        : `${options.title} | ${options.siteName || "Oahu Car Rentals"}`;
    }

    const updateMetaTag = (name, content, isProperty = false) => {
      if (!content) return;
      const attribute = isProperty ? "property" : "name";
      let element = document.querySelector(`meta[${attribute}="${name}"]`);
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      element.setAttribute("content", content);
    };

    updateMetaTag("description", options.description);
    updateMetaTag("og:title", options.title, true);
    updateMetaTag("og:description", options.description, true);
    updateMetaTag("og:image", options.image, true);
    updateMetaTag("og:url", options.url, true);
  }, [options]);
}
