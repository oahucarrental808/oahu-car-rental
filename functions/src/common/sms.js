// functions/src/common/sms.js
import { defineSecret } from "firebase-functions/params";
import { logger } from "firebase-functions";
import { sendEmail } from "./email.js";

/**
 * Carrier email-to-SMS gateway mappings
 * Format: {phone}@{gateway}
 * Easy to update - just add/modify entries here
 */
const CARRIER_GATEWAYS = {
  "tmobile": "@tmomail.net",
  "spectrum": "@mypixmessages.com",
  "t-mobile": "@tmomail.net",
  "att": "@txt.att.net",
  "at&t": "@txt.att.net",
  "verizon": "@vtext.com",
  "sprint": "@messaging.sprintpcs.com",
  "uscellular": "@email.uscc.net",
  "us-cellular": "@email.uscc.net",
  "cricket": "@sms.cricketwireless.net",
  "boost": "@sms.myboostmobile.com",
  "boostmobile": "@sms.myboostmobile.com",
  "virgin": "@vmobl.com",
  "virginmobile": "@vmobl.com",
  "google": "@msg.fi.google.com", // Google Fi uses T-Mobile network
  "googlefi": "@msg.fi.google.com",
  "google-fi": "@msg.fi.google.com",
  "fi": "@msg.fi.google.com"
};

// Default to T-Mobile if not specified
const DEFAULT_CARRIER = "spectrum";

// Optional: override default carrier via secret
// Note: If using this secret, add ADMIN_CARRIER to the function's secrets array
// If not set, will default to T-Mobile
const ADMIN_CARRIER = defineSecret("ADMIN_CARRIER");

/**
 * Gets the email gateway for a carrier
 * @param {string} carrier - Carrier name (case-insensitive)
 * @returns {string|null} - Gateway domain or null if not found
 */
function getCarrierGateway(carrier) {
  if (!carrier) return null;
  const normalized = carrier.toLowerCase().trim();
  return CARRIER_GATEWAYS[normalized] || null;
}

/**
 * Converts phone number to email-to-SMS format
 * @param {string} phoneNumber - Phone number in E.164 format (e.g., +1234567890)
 * @param {string} carrier - Carrier name (defaults to T-Mobile)
 * @returns {string|null} - Email address for SMS gateway or null if invalid
 */
function phoneToEmail(phoneNumber, carrier = null) {
  if (!phoneNumber) return null;

  // Remove all non-digit characters except +
  let cleaned = phoneNumber.replace(/[^\d+]/g, "");

  // Extract digits only (remove + and country code)
  let digits = cleaned.replace(/^\+?1?/, ""); // Remove +1 or + or leading 1

  // Validate US phone number (10 digits)
  if (digits.length !== 10) {
    logger.warn("Invalid phone number length", { phoneNumber, digits });
    return null;
  }

  // Get carrier gateway (use secret if set, otherwise use provided or default)
  let carrierToUse = carrier || DEFAULT_CARRIER;
  try {
    const secretValue = ADMIN_CARRIER.value();
    if (secretValue) carrierToUse = secretValue;
  } catch {
    // Secret not configured, use default - that's okay
  }
  const gateway = getCarrierGateway(carrierToUse);

  if (!gateway) {
    logger.warn("Unknown carrier", { carrier: carrierToUse });
    return null;
  }

  return `${digits}${gateway}`;
}

/**
 * Sends an SMS message using email-to-SMS gateway
 * @param {Object} options - SMS options
 * @param {string} options.to - Recipient phone number (E.164 format, e.g., +1234567890)
 * @param {string} options.message - SMS message body
 * @param {string} [options.carrier] - Carrier name (optional, defaults to T-Mobile or ADMIN_CARRIER secret)
 * @returns {Promise<Object>} - Result with success status
 */
export async function sendSMS({ to, message, carrier = null }) {
  try {
    if (!to || !message) {
      throw new Error("Missing required SMS fields: to and message");
    }

    // Convert phone number to email address
    const emailAddress = phoneToEmail(to, carrier);

    if (!emailAddress) {
      throw new Error(`Invalid phone number or carrier: ${to}`);
    }

    // Send email to SMS gateway
    // Note: SMS gateways ignore subject, but sendEmail requires a non-empty subject
    const result = await sendEmail({
      to: emailAddress,
      subject: "SMS", // SMS gateways ignore subject, but required for validation
      text: message,
    });

    let carrierUsed = carrier || DEFAULT_CARRIER;
    try {
      const secretValue = ADMIN_CARRIER.value();
      if (secretValue) carrierUsed = secretValue;
    } catch {
      // Secret not configured, use default - that's okay
    }

    logger.info("SMS sent via email gateway", {
      to,
      emailAddress,
      carrier: carrierUsed,
      messageId: result.messageId,
    });

    return {
      success: true,
      messageId: result.messageId,
      emailAddress,
    };
  } catch (error) {
    logger.error("Failed to send SMS via email gateway", {
      to,
      error: error.message,
    });
    throw error;
  }
}

/**
 * Formats a phone number to E.164 format (basic validation)
 * @param {string} phoneNumber - Phone number in various formats
 * @returns {string} - Phone number in E.164 format
 */
export function formatPhoneNumber(phoneNumber) {
  if (!phoneNumber) return null;

  // Remove all non-digit characters except +
  let cleaned = phoneNumber.replace(/[^\d+]/g, "");

  // If it doesn't start with +, assume US number and add +1
  if (!cleaned.startsWith("+")) {
    // Remove leading 1 if present
    if (cleaned.startsWith("1") && cleaned.length === 11) {
      cleaned = cleaned.substring(1);
    }
    cleaned = `+1${cleaned}`;
  }

  return cleaned;
}
