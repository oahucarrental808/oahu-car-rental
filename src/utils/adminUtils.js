/**
 * Shared utility functions for admin pages
 */

/**
 * Converts a value to a trimmed string, handling null/undefined
 * @param {any} v - Value to convert
 * @returns {string} Trimmed string
 */
export function mustString(v) {
  return String(v ?? "").trim();
}

/**
 * Extracts the token parameter from the URL query string
 * @returns {string} Token value or empty string
 */
export function getTokenFromUrl() {
  try {
    const qs = new URLSearchParams(window.location.search);
    return mustString(qs.get("t"));
  } catch {
    return "";
  }
}

/**
 * Formats debug email preview text
 * @param {boolean} isDebug - Whether debug mode is enabled
 * @param {object|null} debugEmail - Debug email object with to, subject, body
 * @param {string} defaultSubject - Default subject if not provided
 * @returns {string} Formatted email preview text
 */
export function formatEmailPreviewText(isDebug, debugEmail, defaultSubject = "") {
  if (!isDebug || !debugEmail) return "";
  const to = debugEmail?.to || "CUSTOMER";
  const subject = debugEmail?.subject || defaultSubject;
  const body = debugEmail?.body || "";
  return [`To: ${to}`, `Subject: ${subject}`, "", body].join("\n");
}
