// functions/src/common/email.js
import nodemailer from "nodemailer";
import { defineSecret } from "firebase-functions/params";
import { logger } from "firebase-functions";

const SMTP_EMAIL = defineSecret("SMTP_EMAIL");
const SMTP_PASSWORD = defineSecret("SMTP_PASSWORD");

/**
 * Creates a nodemailer transporter configured for Hotmail/Outlook SMTP
 */
function createTransporter() {
  return nodemailer.createTransport({
    host: "smtp-mail.outlook.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: SMTP_EMAIL.value(),
      pass: SMTP_PASSWORD.value(),
    },
    tls: {
      ciphers: "SSLv3",
    },
  });
}

/**
 * Sends an email using Hotmail SMTP
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

    const mailOptions = {
      from: `"Oahu Car Rentals" <${SMTP_EMAIL.value()}>`,
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
