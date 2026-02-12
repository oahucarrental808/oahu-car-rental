import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { logger } from "firebase-functions";
import cors from "cors";
import crypto from "node:crypto";
import { sendEmail } from "./common/email.js";
import { getUrl, isDebugMode } from "./common/config.js";

const LINK_SECRET = defineSecret("LINK_SECRET");
// Provider-specific secrets
const SMTP_EMAIL_GMAIL = defineSecret("SMTP_EMAIL_GMAIL");
const SMTP_PASSWORD_GMAIL = defineSecret("SMTP_PASSWORD_GMAIL");
const SMTP_EMAIL_OUTLOOK = defineSecret("SMTP_EMAIL_OUTLOOK");
const SMTP_PASSWORD_OUTLOOK = defineSecret("SMTP_PASSWORD_OUTLOOK");
// Legacy secrets (for backward compatibility)
const SMTP_EMAIL = defineSecret("SMTP_EMAIL");
const SMTP_PASSWORD = defineSecret("SMTP_PASSWORD");

const corsHandler = cors({
  origin: true,
  methods: ["POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
});

function b64url(buf) {
  return Buffer.from(buf)
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function b64urlToBuf(s) {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = s.replaceAll("-", "+").replaceAll("_", "/") + pad;
  return Buffer.from(b64, "base64");
}

function decrypt(token, secret) {
  const [ivB64, tagB64, ctB64] = String(token).split(".");
  if (!ivB64 || !tagB64 || !ctB64) throw new Error("Bad token");

  const key = crypto.createHash("sha256").update(secret, "utf8").digest();
  const iv = b64urlToBuf(ivB64);
  const tag = b64urlToBuf(tagB64);
  const ct = b64urlToBuf(ctB64);

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);

  const plaintext = Buffer.concat([decipher.update(ct), decipher.final()]);
  return JSON.parse(plaintext.toString("utf8"));
}

function encrypt(payloadObj, secret) {
  const key = crypto.createHash("sha256").update(secret, "utf8").digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  const plaintext = Buffer.from(JSON.stringify(payloadObj), "utf8");
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${b64url(iv)}.${b64url(tag)}.${b64url(ciphertext)}`;
}

function mustString(v) {
  return String(v ?? "").trim();
}

export const createPickupMileageLink = onRequest(
  { 
    region: "us-central1", 
    secrets: [
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

        const adminToken = String(req.query.t || "");
        if (!adminToken) return res.status(400).json({ ok: false, error: "Missing token" });

        const adminDraft = decrypt(adminToken, LINK_SECRET.value());

        if (adminDraft.exp && Date.now() > adminDraft.exp) {
          return res.status(410).json({ ok: false, error: "Link expired" });
        }

        // Accept both "pickupAdmin" (legacy) and "admin_pickup" (new standard)
        if (adminDraft.phase !== "pickupAdmin" && adminDraft.phase !== "admin_pickup") {
          return res.status(400).json({ ok: false, error: "Invalid link" });
        }

        const vin = mustString(adminDraft.vin);
        const startDate = mustString(adminDraft.startDate);
        const endDate = mustString(adminDraft.endDate);
        const customerEmail = mustString(adminDraft.customerEmail);
        const folderId = mustString(adminDraft.folderId);
        if (!vin || !startDate || !folderId) {
          return res.status(400).json({ ok: false, error: "Invalid link" });
        }

        const address = mustString(req.body?.address || "");
        const instructions = mustString(req.body?.instructions || "");

        const nowIso = new Date().toISOString();
        const exp = adminDraft.exp || Date.now() + 7 * 24 * 60 * 60 * 1000;

        const mileageOutToken = encrypt(
          {
            vin,
            startDate,
            endDate,
            customerEmail,
            folderId,
            phase: "out",
            createdAt: nowIso,
            exp,
          },
          LINK_SECRET.value()
        );

        const mileageOutUrl = getUrl(`/mileage-out?t=${encodeURIComponent(
          mileageOutToken
        )}`);

        const debug = isDebugMode();

        // Build email content with all pickup information
        const emailLines = [
          "Thanks for renting with Oahu Car Rentals.",
          "",
          "PICKUP INFORMATION:",
          "",
        ];

        if (address) {
          emailLines.push(`Pickup Address: ${address}`);
          emailLines.push("");
        }

        if (instructions) {
          emailLines.push("Pickup Instructions:");
          emailLines.push(instructions);
          emailLines.push("");
        }

        emailLines.push(
          "BEFORE YOU DRIVE OFF:",
          "",
          "Please submit your pickup mileage, fuel level, and a dashboard photo using this link:",
          "",
          `Submit Pickup Information: ${mileageOutUrl}`,
          "",
          "— Oahu Car Rentals"
        );

        const emailBody = emailLines.join("\n");

        // Build HTML version of email
        const emailHtml = [
          "<p>Thanks for renting with Oahu Car Rentals.</p>",
          "<p><strong>PICKUP INFORMATION:</strong></p>",
        ];

        if (address) {
          emailHtml.push(`<p><strong>Pickup Address:</strong> ${address}</p>`);
        }

        if (instructions) {
          emailHtml.push(`<p><strong>Pickup Instructions:</strong></p>`);
          emailHtml.push(`<p>${instructions.replace(/\n/g, "<br>")}</p>`);
        }

        emailHtml.push(
          "<p><strong>BEFORE YOU DRIVE OFF:</strong></p>",
          "<p>Please submit your pickup mileage, fuel level, and a dashboard photo using this link:</p>",
          `<p><a href="${mileageOutUrl}" style="color: #1f6fc1; text-decoration: underline;">Submit Pickup Information</a></p>`,
          "<p>— Oahu Car Rentals</p>"
        );

        const emailHtmlBody = emailHtml.join("");

        if (debug) {
          return res.json({
            ok: true,
            mileageOutUrl,
            debugEmail: {
              to: customerEmail,
              subject: "Pickup Instructions - Oahu Car Rentals",
              body: emailBody,
            },
          });
        }

        // Send email to customer with all pickup information + mileageOutUrl
        try {
          await sendEmail({
            to: customerEmail,
            subject: "Pickup Instructions - Oahu Car Rentals",
            text: emailBody,
            html: emailHtmlBody,
          });
          logger.info("Pickup instructions email sent", { email: customerEmail });
        } catch (emailError) {
          // Log error but don't fail the request - link was still created
          logger.error("Failed to send pickup instructions email", {
            email: customerEmail,
            error: emailError.message,
          });
        }
        return res.json({ ok: true, mileageOutUrl });
      } catch (e) {
        logger.error(e);
        const status = e?.status || 500;
        return res.status(status).json({ ok: false, error: e?.message || "Internal Server Error" });
      }
    })
);
