import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { logger } from "firebase-functions";
import cors from "cors";
import crypto from "node:crypto";
import { sendEmail } from "./common/email.js";
import { getUrl, isDebugMode } from "./common/config.js";

const ADMIN_SECRET = defineSecret("ADMIN_SECRET");
const LINK_SECRET = defineSecret("LINK_SECRET");

const corsHandler = cors({
  origin: true,
  methods: ["POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "X-Admin-Secret"],
});

function requireAdminSecret(req) {
  const provided = String(req.get("X-Admin-Secret") || "");
  const expected = ADMIN_SECRET.value();
  if (!expected || provided !== expected) {
    const err = new Error("Unauthorized");
    err.status = 401;
    throw err;
  }
}

function isValidDateString(s) {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
}
function mustString(v) {
  return String(v ?? "").trim();
}

function isValidCostPerDay(s) {
  // required format: "$X/Day"
  return typeof s === "string" && /^\$\d+\/Day$/.test(s);
}

// base64url helpers
function b64url(buf) {
  return Buffer.from(buf)
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}
function unb64url(s) {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = s.replaceAll("-", "+").replaceAll("_", "/") + pad;
  return Buffer.from(b64, "base64");
}

// AES-256-GCM: token = iv.tag.ciphertext (all base64url)
function encrypt(payloadObj, secret) {
  const key = crypto.createHash("sha256").update(secret, "utf8").digest(); // 32 bytes
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  const plaintext = Buffer.from(JSON.stringify(payloadObj), "utf8");
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${b64url(iv)}.${b64url(tag)}.${b64url(ciphertext)}`;
}

// Provider-specific secrets
const SMTP_EMAIL_GMAIL = defineSecret("SMTP_EMAIL_GMAIL");
const SMTP_PASSWORD_GMAIL = defineSecret("SMTP_PASSWORD_GMAIL");
const SMTP_EMAIL_OUTLOOK = defineSecret("SMTP_EMAIL_OUTLOOK");
const SMTP_PASSWORD_OUTLOOK = defineSecret("SMTP_PASSWORD_OUTLOOK");
// Legacy secrets (for backward compatibility)
const SMTP_EMAIL = defineSecret("SMTP_EMAIL");
const SMTP_PASSWORD = defineSecret("SMTP_PASSWORD");

export const createCustomerInfoLink = onRequest(
  { 
    region: "us-central1", 
    secrets: [
      ADMIN_SECRET, 
      LINK_SECRET, 
      SMTP_EMAIL_GMAIL, 
      SMTP_PASSWORD_GMAIL, 
      SMTP_EMAIL_OUTLOOK, 
      SMTP_PASSWORD_OUTLOOK,
      SMTP_EMAIL, 
      SMTP_PASSWORD
    ] 
  },
  (req, res) =>
    corsHandler(req, res, async () => {
      try {
        if (req.method === "OPTIONS") return res.status(204).send("");
        if (req.method !== "POST") return res.status(405).send("Use POST");

        requireAdminSecret(req);

        const body = req.body ?? {};
        const draft = {
          vin: mustString(body.vin),
          color: mustString(body.color),
          make: mustString(body.make),
          model: mustString(body.model), // ✅ was year
          licensePlate: mustString(body.licensePlate), // ✅ added
          startDate: mustString(body.startDate),
          endDate: mustString(body.endDate),

          // ✅ added per new flow
          customerEmail: mustString(body.customerEmail),
          costPerDay: mustString(body.costPerDay), // required format "$X/Day"

          createdAt: new Date().toISOString(),
          // optional expiration: 7 days
          exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
        };

        if (!draft.vin) return res.status(400).send("vin required");
        if (!draft.color) return res.status(400).send("color required");
        if (!draft.make) return res.status(400).send("make required");
        if (!draft.model) return res.status(400).send("model required");
        if (!isValidDateString(draft.startDate))
          return res.status(400).send("startDate must be YYYY-MM-DD");
        if (!isValidDateString(draft.endDate))
          return res.status(400).send("endDate must be YYYY-MM-DD");

        if (!draft.customerEmail) return res.status(400).send("customerEmail required");
        if (!draft.costPerDay) return res.status(400).send("costPerDay required");
        if (!isValidCostPerDay(draft.costPerDay))
          return res.status(400).send('costPerDay must be in format "$X/Day"');

        const token = encrypt(draft, LINK_SECRET.value());

        const url = getUrl(`/admin/customer-info?t=${encodeURIComponent(
          token
        )}`);

        const debug = isDebugMode();

        const emailText = [
          "Hello,",
          "",
          "Thank you for choosing Oahu Car Rentals for your upcoming trip. We're excited to help you explore the island!",
          "",
          "To complete your reservation, please provide your driver and insurance information using the secure link below:",
          "",
          `Complete Your Rental Information: ${url}`,
          "",
          "This secure link will expire in 7 days for your protection. Please complete the form as soon as possible to ensure a smooth pickup process.",
          "",
          "If you have any questions or need assistance, please don't hesitate to reach out to us.",
          "",
          "We look forward to serving you!",
          "",
          "Best regards,",
          "Oahu Car Rentals",
        ].join("\n");

        const emailHtml = [
          "<p>Hello,</p>",
          "<p>Thank you for choosing Oahu Car Rentals for your upcoming trip. We're excited to help you explore the island!</p>",
          "<p>To complete your reservation, please provide your driver and insurance information using the secure link below:</p>",
          `<p><a href="${url}" style="color: #1f6fc1; text-decoration: underline;">Complete Your Rental Information</a></p>`,
          "<p>This secure link will expire in 7 days for your protection. Please complete the form as soon as possible to ensure a smooth pickup process.</p>",
          "<p>If you have any questions or need assistance, please don't hesitate to reach out to us.</p>",
          "<p>We look forward to serving you!</p>",
          "<p>Best regards,<br>Oahu Car Rentals</p>",
        ].join("");

        // Send email to customer with link
        if (!debug) {
          try {
            await sendEmail({
              to: draft.customerEmail,
              subject: "Complete Your Rental Information - Oahu Car Rentals",
              text: emailText,
              html: emailHtml,
            });
            logger.info("Customer info link email sent", { email: draft.customerEmail });
          } catch (emailError) {
            // Log error but don't fail the request - link was still created
            logger.error("Failed to send customer info link email", {
              email: draft.customerEmail,
              error: emailError.message,
            });
          }
        }

        const responseData = { url };
        if (debug) {
          responseData.debugEmail = {
            to: draft.customerEmail,
            subject: "Complete Your Rental Information - Oahu Car Rentals",
            body: emailText,
          };
        }
        return res.json({ ok: true, ...responseData });
      } catch (e) {
        logger.error(e);
        return res.status(e.status || 500).json({ ok: false, error: e.message || String(e) });
      }
    })
);
