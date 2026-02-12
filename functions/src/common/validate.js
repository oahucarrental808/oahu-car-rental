// functions/src/common/validate.js
export function isValidDateString(s) {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

export function mustString(v) {
  return String(v ?? "").trim();
}

/**
 * Validates an email address
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
export function isValidEmail(email) {
  if (typeof email !== "string") return false;
  const trimmed = email.trim();
  if (trimmed.length === 0) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(trimmed) && trimmed.length <= 254;
}

/**
 * Validates a cost per day string in format "$X/Day"
 * @param {string} costPerDay - Cost string to validate
 * @returns {boolean} True if valid
 */
export function isValidCostPerDay(costPerDay) {
  if (typeof costPerDay !== "string") return false;
  return /^\$\d+\/Day$/.test(costPerDay.trim());
}

/**
 * Validates a VIN (Vehicle Identification Number)
 * @param {string} vin - VIN to validate
 * @returns {boolean} True if valid
 */
export function isValidVIN(vin) {
  if (typeof vin !== "string") return false;
  const cleaned = vin.trim().toUpperCase();
  return /^[A-HJ-NPR-Z0-9]{17}$/.test(cleaned);
}

/**
 * Validates that end date is after start date
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {boolean} True if valid
 */
export function isValidDateRange(startDate, endDate) {
  if (!isValidDateString(startDate) || !isValidDateString(endDate)) return false;
  const start = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T00:00:00");
  return end > start;
}
