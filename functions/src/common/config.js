// functions/src/common/config.js
import { defineString } from "firebase-functions/params";

/**
 * Environment configuration
 * Centralized configuration management for Firebase Functions
 */

// Base URL configuration
export const BASE_URL = defineString("BASE_URL", {
  default: "https://oahu-car-rentals.com",
  description: "Base URL for the application",
});

// Alternative base URL (for Firebase hosting)
export const BASE_URL_ALT = defineString("BASE_URL_ALT", {
  default: "https://oahu-car-rentals.firebaseapp.com",
  description: "Alternative base URL for the application",
});

// Environment name
export const ENVIRONMENT = defineString("ENVIRONMENT", {
  default: "production",
  description: "Environment name (development, staging, production)",
});

// Debug mode
export const DEBUG_MODE = defineString("DEBUG_MODE", {
  default: "false",
  description: "Enable debug mode (true/false)",
});

// CORS allowed origins (comma-separated)
export const ALLOWED_ORIGINS = defineString("ALLOWED_ORIGINS", {
  default: "https://oahu-car-rentals.web.app,https://oahu-car-rentals.firebaseapp.com,https://oahu-car-rentals.com",
  description: "Comma-separated list of allowed CORS origins",
});

/**
 * Get base URL for generating links
 * @returns {string} Base URL
 */
export function getBaseUrl() {
  return BASE_URL.value();
}

/**
 * Get alternative base URL
 * @returns {string} Alternative base URL
 */
export function getBaseUrlAlt() {
  return BASE_URL_ALT.value();
}

/**
 * Check if debug mode is enabled
 * @returns {boolean} True if debug mode is enabled
 */
export function isDebugMode() {
  return DEBUG_MODE.value().toLowerCase() === "true";
}

/**
 * Get environment name
 * @returns {string} Environment name
 */
export function getEnvironment() {
  return ENVIRONMENT.value();
}

/**
 * Get allowed CORS origins
 * @returns {string[]} Array of allowed origins
 */
export function getAllowedOrigins() {
  const origins = ALLOWED_ORIGINS.value();
  if (!origins) return [];
  return origins.split(",").map((o) => o.trim()).filter(Boolean);
}

/**
 * Generate full URL for a path
 * @param {string} path - Path to append to base URL
 * @returns {string} Full URL
 */
export function getUrl(path) {
  const base = getBaseUrl();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${cleanPath}`;
}
