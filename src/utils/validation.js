// src/utils/validation.js

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
 * Validates a date string in YYYY-MM-DD format
 * @param {string} dateStr - Date string to validate
 * @returns {boolean} True if valid
 */
export function isValidDateString(dateStr) {
  if (typeof dateStr !== "string") return false;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;
  
  const date = new Date(dateStr + "T00:00:00");
  return date instanceof Date && !isNaN(date) && date.toISOString().startsWith(dateStr);
}

/**
 * Validates a phone number (basic validation)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid
 */
export function isValidPhone(phone) {
  if (typeof phone !== "string") return false;
  // Remove common formatting characters
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, "");
  // Check if it's all digits and has reasonable length
  return /^\d{10,15}$/.test(cleaned);
}

/**
 * Alias for isValidPhone - validates a phone number
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid
 */
export const isValidPhoneNumber = isValidPhone;

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
  // VINs are 17 characters, alphanumeric (excluding I, O, Q)
  return /^[A-HJ-NPR-Z0-9]{17}$/.test(cleaned);
}

/**
 * Validates a license plate
 * @param {string} plate - License plate to validate
 * @returns {boolean} True if valid
 */
export function isValidLicensePlate(plate) {
  if (typeof plate !== "string") return false;
  const trimmed = plate.trim();
  // Basic validation: 2-10 alphanumeric characters
  return /^[A-Z0-9]{2,10}$/i.test(trimmed);
}

/**
 * Validates a price range
 * @param {number} minPrice - Minimum price
 * @param {number} maxPrice - Maximum price
 * @returns {boolean} True if valid
 */
export function isValidPriceRange(minPrice, maxPrice) {
  if (!Number.isFinite(minPrice) || !Number.isFinite(maxPrice)) return false;
  if (minPrice < 0 || maxPrice < 0) return false;
  if (minPrice > maxPrice) return false;
  return true;
}

/**
 * Validates that a date is in the future
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {boolean} True if date is in the future
 */
export function isFutureDate(dateStr) {
  if (!isValidDateString(dateStr)) return false;
  const date = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today;
}

/**
 * Validates that a date is not in the past (today or future)
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {boolean} True if date is today or in the future
 */
export function isDateNotInPast(dateStr) {
  if (!isValidDateString(dateStr)) return false;
  const date = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today;
}

/**
 * Validates that end date is after start date
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {boolean} True if end date is after start date
 */
export function isValidDateRange(startDate, endDate) {
  if (!isValidDateString(startDate) || !isValidDateString(endDate)) return false;
  const start = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T00:00:00");
  return end > start;
}

/**
 * Validates a required string field
 * @param {*} value - Value to validate
 * @param {number} minLength - Minimum length
 * @param {number} maxLength - Maximum length
 * @returns {boolean} True if valid
 */
export function isValidRequiredString(value, minLength = 1, maxLength = 1000) {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  return trimmed.length >= minLength && trimmed.length <= maxLength;
}

/**
 * Validates an array of car types
 * @param {*} carTypes - Car types to validate
 * @returns {boolean} True if valid
 */
export function isValidCarTypes(carTypes) {
  if (!Array.isArray(carTypes)) return false;
  if (carTypes.length === 0) return false;
  return carTypes.every((type) => typeof type === "string" && type.trim().length > 0);
}

/**
 * Gets validation error message for a field
 * @param {string} fieldName - Name of the field
 * @param {string} errorType - Type of error
 * @returns {string} Error message
 */
export function getValidationErrorMessage(fieldName, errorType) {
  const messages = {
    required: `${fieldName} is required`,
    invalid: `${fieldName} is invalid`,
    tooShort: `${fieldName} is too short`,
    tooLong: `${fieldName} is too long`,
    invalidEmail: "Please enter a valid email address",
    invalidDate: "Please enter a valid date (YYYY-MM-DD)",
    invalidDateRange: "End date must be after start date",
    invalidPriceRange: "Maximum price must be greater than or equal to minimum price",
    pastDate: "Date must be in the future",
  };

  return messages[errorType] || `${fieldName} validation failed`;
}

/**
 * Validates a rental request form
 * @param {Object} formData - Form data to validate
 * @returns {Object} { valid: boolean, errors: Object }
 */
export function validateRentalRequest(formData) {
  const errors = {};

  // Name validation
  if (!isValidRequiredString(formData.name, 2, 100)) {
    errors.name = getValidationErrorMessage("Name", "required");
  }

  // Email validation
  if (!isValidEmail(formData.email)) {
    errors.email = getValidationErrorMessage("Email", "invalidEmail");
  }

  // Date validation
  if (!isValidDateString(formData.startDate)) {
    errors.startDate = getValidationErrorMessage("Start date", "invalidDate");
  }

  if (!isValidDateString(formData.endDate)) {
    errors.endDate = getValidationErrorMessage("End date", "invalidDate");
  }

  // Date range validation
  if (isValidDateString(formData.startDate) && isValidDateString(formData.endDate)) {
    if (!isValidDateRange(formData.startDate, formData.endDate)) {
      errors.dateRange = getValidationErrorMessage("Date range", "invalidDateRange");
    }
  }

  // Price range validation
  if (!isValidPriceRange(formData.minPrice, formData.maxPrice)) {
    errors.priceRange = getValidationErrorMessage("Price range", "invalidPriceRange");
  }

  // Car types validation
  if (!isValidCarTypes(formData.carTypes)) {
    errors.carTypes = "Please select at least one car type";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
