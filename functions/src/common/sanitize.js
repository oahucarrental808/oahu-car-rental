// functions/src/common/sanitize.js

/**
 * Sanitizes a string by removing potentially dangerous characters
 * @param {string} input - Input string to sanitize
 * @param {Object} options - Sanitization options
 * @returns {string} Sanitized string
 */
export function sanitizeString(input, options = {}) {
  if (typeof input !== "string") {
    return "";
  }

  const {
    maxLength = 10000,
    allowNewlines = false,
    allowHTML = false,
    trim = true,
  } = options;

  let sanitized = input;

  // Trim whitespace
  if (trim) {
    sanitized = sanitized.trim();
  }

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, "");

  // Remove control characters (except newlines if allowed)
  if (allowNewlines) {
    sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "");
  } else {
    sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, "");
  }

  // Remove HTML tags if not allowed
  if (!allowHTML) {
    sanitized = sanitized.replace(/<[^>]*>/g, "");
    // Also escape HTML entities
    sanitized = sanitized
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;");
  }

  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

/**
 * Sanitizes an email address
 * @param {string} email - Email address to sanitize
 * @returns {string} Sanitized email or empty string if invalid
 */
export function sanitizeEmail(email) {
  if (typeof email !== "string") {
    return "";
  }

  const trimmed = email.trim().toLowerCase();
  
  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(trimmed)) {
    return "";
  }

  // Limit length (RFC 5321)
  if (trimmed.length > 254) {
    return "";
  }

  return trimmed;
}

/**
 * Sanitizes a URL
 * @param {string} url - URL to sanitize
 * @param {Object} options - Options
 * @returns {string} Sanitized URL or empty string if invalid
 */
export function sanitizeUrl(url, options = {}) {
  if (typeof url !== "string") {
    return "";
  }

  const { allowedProtocols = ["http:", "https:"] } = options;
  const trimmed = url.trim();

  try {
    const parsed = new URL(trimmed);
    
    // Check protocol
    if (!allowedProtocols.includes(parsed.protocol)) {
      return "";
    }

    return parsed.toString();
  } catch {
    return "";
  }
}

/**
 * Sanitizes a number
 * @param {*} value - Value to sanitize
 * @param {Object} options - Options
 * @returns {number|null} Sanitized number or null if invalid
 */
export function sanitizeNumber(value, options = {}) {
  const {
    min = -Infinity,
    max = Infinity,
    integer = false,
    defaultValue = null,
  } = options;

  const num = typeof value === "number" 
    ? value 
    : typeof value === "string" 
      ? parseFloat(value) 
      : defaultValue;

  if (!Number.isFinite(num)) {
    return defaultValue;
  }

  const result = integer ? Math.round(num) : num;

  if (result < min || result > max) {
    return defaultValue;
  }

  return result;
}

/**
 * Sanitizes an object by sanitizing all string values
 * @param {Object} obj - Object to sanitize
 * @param {Object} options - Sanitization options
 * @returns {Object} Sanitized object
 */
export function sanitizeObject(obj, options = {}) {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    return {};
  }

  const sanitized = {};
  const { deep = true, excludeKeys = [] } = options;

  for (const [key, value] of Object.entries(obj)) {
    if (excludeKeys.includes(key)) {
      sanitized[key] = value;
      continue;
    }

    if (typeof value === "string") {
      sanitized[key] = sanitizeString(value, options);
    } else if (deep && typeof value === "object" && value !== null) {
      sanitized[key] = Array.isArray(value)
        ? value.map((item) => 
            typeof item === "string" 
              ? sanitizeString(item, options)
              : deep && typeof item === "object" && item !== null
                ? sanitizeObject(item, options)
                : item
          )
        : sanitizeObject(value, options);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Sanitizes input for database storage
 * Removes null bytes and other problematic characters
 */
export function sanitizeForDatabase(input) {
  if (typeof input === "string") {
    return input.replace(/\0/g, "").replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "");
  }
  if (typeof input === "object" && input !== null) {
    return sanitizeObject(input, { deep: true });
  }
  return input;
}
