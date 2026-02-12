// functions/src/common/email.js
import nodemailer from "nodemailer";
import { defineSecret, defineString } from "firebase-functions/params";
import { logger } from "firebase-functions";

// Provider-specific secrets - allows switching without overwriting credentials
const SMTP_EMAIL_GMAIL = defineSecret("SMTP_EMAIL_GMAIL");
const SMTP_PASSWORD_GMAIL = defineSecret("SMTP_PASSWORD_GMAIL");
const SMTP_EMAIL_OUTLOOK = defineSecret("SMTP_EMAIL_OUTLOOK");
const SMTP_PASSWORD_OUTLOOK = defineSecret("SMTP_PASSWORD_OUTLOOK");

// Legacy secrets (for backward compatibility - will be used if provider-specific ones aren't set)
const SMTP_EMAIL = defineSecret("SMTP_EMAIL");
const SMTP_PASSWORD = defineSecret("SMTP_PASSWORD");

// Email provider selection: "gmail" (default) or "outlook"
const SMTP_PROVIDER = defineString("SMTP_PROVIDER", {
  default: "gmail",
  description: "Email provider: 'gmail' or 'outlook'",
});

// Optional SMTP configuration (non-secret). These can override provider defaults.
// If SMTP_PROVIDER is set, these are ignored unless explicitly set.
const SMTP_HOST = defineString("SMTP_HOST", {
  default: "",
  description: "SMTP host (auto-set by SMTP_PROVIDER if not specified)",
});
const SMTP_PORT = defineString("SMTP_PORT", {
  default: "",
  description: "SMTP port (auto-set by SMTP_PROVIDER if not specified)",
});
const SMTP_SECURE = defineString("SMTP_SECURE", {
  default: "",
  description: "Use SMTPS (auto-set by SMTP_PROVIDER if not specified)",
});

/**
 * Gets SMTP configuration based on provider or explicit settings
 * When provider is "gmail" or "outlook", provider settings always take precedence
 * Explicit settings are only used for custom providers
 * @returns {Object} SMTP configuration { host, port, secure }
 */
function getSMTPConfig() {
  const provider = SMTP_PROVIDER.value().toLowerCase();
  const explicitHost = SMTP_HOST.value();
  const explicitPort = SMTP_PORT.value();
  const explicitSecure = SMTP_SECURE.value();

  // For known providers, always use provider defaults (ignore explicit settings)
  if (provider === "gmail") {
    return {
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // STARTTLS
    };
  } else if (provider === "outlook") {
    return {
      host: "smtp-mail.outlook.com",
      port: 587,
      secure: false, // STARTTLS
    };
  }

  // For unknown/custom providers, use explicit settings if provided
  if (explicitHost && explicitPort) {
    logger.info("Using explicit SMTP settings for custom provider", {
      provider,
      host: explicitHost,
      port: explicitPort,
    });
    return {
      host: explicitHost,
      port: Number(explicitPort) || 587,
      secure: String(explicitSecure).toLowerCase() === "true",
    };
  }

  // Fallback to Gmail if no provider match and no explicit settings
  logger.warn(`Unknown SMTP_PROVIDER: ${provider} and no explicit settings, defaulting to Gmail`);
  return {
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
  };
}

/**
 * Gets SMTP credentials based on provider
 * @returns {Object} SMTP credentials { email, password }
 */
function getSMTPCredentials() {
  const provider = SMTP_PROVIDER.value().toLowerCase();
  
  if (provider === "gmail") {
    try {
      const email = SMTP_EMAIL_GMAIL.value();
      const password = SMTP_PASSWORD_GMAIL.value();
      if (email && password) {
        return { email, password };
      }
    } catch {
      // Provider-specific secrets not set, fall back to legacy
    }
  } else if (provider === "outlook") {
    try {
      const email = SMTP_EMAIL_OUTLOOK.value();
      const password = SMTP_PASSWORD_OUTLOOK.value();
      if (email && password) {
        return { email, password };
      }
    } catch {
      // Provider-specific secrets not set, fall back to legacy
    }
  }
  
  // Fallback to legacy secrets for backward compatibility
  try {
    return {
      email: SMTP_EMAIL.value(),
      password: SMTP_PASSWORD.value(),
    };
  } catch {
    throw new Error(
      `SMTP credentials not found. For ${provider}, set SMTP_EMAIL_${provider.toUpperCase()} and SMTP_PASSWORD_${provider.toUpperCase()}, or use legacy SMTP_EMAIL and SMTP_PASSWORD`
    );
  }
}

/**
 * Creates a nodemailer transporter configured for SMTP.
 *
 * Configuration is determined by:
 * 1. Explicit SMTP_HOST/SMTP_PORT/SMTP_SECURE settings (if provided)
 * 2. SMTP_PROVIDER setting ("gmail" or "outlook") - defaults to "gmail"
 *
 * Credentials are selected based on provider:
 * - Gmail: Uses SMTP_EMAIL_GMAIL and SMTP_PASSWORD_GMAIL (or legacy SMTP_EMAIL/SMTP_PASSWORD)
 * - Outlook: Uses SMTP_EMAIL_OUTLOOK and SMTP_PASSWORD_OUTLOOK (or legacy SMTP_EMAIL/SMTP_PASSWORD)
 *
 * Note: Both Gmail and Outlook require App Passwords if 2FA is enabled.
 * Gmail: https://myaccount.google.com/apppasswords
 * Outlook: Microsoft Account Security → App passwords
 */
function createTransporter() {
  const config = getSMTPConfig();
  const credentials = getSMTPCredentials();
  
  logger.info("Creating SMTP transporter", {
    provider: SMTP_PROVIDER.value(),
    host: config.host,
    port: config.port,
    secure: config.secure,
    email: credentials.email,
  });

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure, // true for 465, false for other ports
    auth: {
      user: credentials.email,
      pass: credentials.password,
    },
    tls: {
      rejectUnauthorized: true,
      // Use modern TLS defaults - removed insecure SSLv3 cipher
    },
  });
}

/**
 * Sends an email using configured SMTP provider (Gmail or Outlook)
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text email body
 * @param {string} [options.html] - HTML email body (optional)
 * @returns {Promise<Object>} - Result with success status
 */
export async function sendEmail({ to, subject, text, html }) {
  try {
    if (!to || !subject || (!text && !html)) {
      throw new Error("Missing required email fields: to, subject, and text/html");
    }

    const transporter = createTransporter();
    const credentials = getSMTPCredentials();

    const mailOptions = {
      from: `"Oahu Car Rentals" <${credentials.email}>`,
      to,
      subject,
      text: text || html?.replace(/<[^>]*>/g, ""), // Fallback to plain text from HTML
      html: html || text, // If HTML provided, use it; otherwise use text
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info("Email sent successfully", { to, subject, messageId: info.messageId });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error("Failed to send email", { to, subject, error: error.message });
    throw error;
  }
}

/**
 * Verifies SMTP connection (useful for testing)
 */
export async function verifyEmailConnection() {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    logger.info("SMTP connection verified");
    return true;
  } catch (error) {
    logger.error("SMTP verification failed", { error: error.message });
    throw error;
  }
}
