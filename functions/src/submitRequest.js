// functions/src/submitRequest.js
import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { logger } from "firebase-functions";
import { randomUUID } from "crypto";

import { publicCors } from "./common/cors.js";
import { getSheetsClient } from "./common/google.js";
import { isValidDateString } from "./common/validate.js";
import { sendEmail } from "./common/email.js";
import { sendSMS, formatPhoneNumber } from "./common/sms.js";
import { isDebugMode } from "./common/config.js";

// ✅ Your sheet info
const SHEET_ID = "1jTbHW-j-agj00ovF4amuPpPy7ksFAirSoATWLDntR-c";
const SHEET_TAB = "Incoming Requests";

const ADMIN_EMAIL = defineSecret("ADMIN_EMAIL");
const ADMIN_NUMBER = defineSecret("ADMIN_NUMBER");
// Provider-specific secrets
const SMTP_EMAIL_GMAIL = defineSecret("SMTP_EMAIL_GMAIL");
const SMTP_PASSWORD_GMAIL = defineSecret("SMTP_PASSWORD_GMAIL");
const SMTP_EMAIL_OUTLOOK = defineSecret("SMTP_EMAIL_OUTLOOK");
const SMTP_PASSWORD_OUTLOOK = defineSecret("SMTP_PASSWORD_OUTLOOK");
// Legacy secrets (for backward compatibility)
const SMTP_EMAIL = defineSecret("SMTP_EMAIL");
const SMTP_PASSWORD = defineSecret("SMTP_PASSWORD");

export const submitRequest = onRequest(
  { 
    region: "us-central1", 
    secrets: [
      ADMIN_EMAIL, 
      ADMIN_NUMBER, 
      SMTP_EMAIL_GMAIL, 
      SMTP_PASSWORD_GMAIL, 
      SMTP_EMAIL_OUTLOOK, 
      SMTP_PASSWORD_OUTLOOK,
      SMTP_EMAIL, 
      SMTP_PASSWORD
    ] 
  },
  (req, res) =>
    publicCors(req, res, async () => {
      try {
        if (req.method === "OPTIONS") return res.status(204).send("");
        if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Use POST" });

        const body = req.body ?? {};

        const name = String(body.name ?? "").trim();
        const email = String(body.email ?? "").trim();
        const startDate = String(body.startDate ?? "").trim();
        const endDate = String(body.endDate ?? "").trim();
        const notes = String(body.notes ?? "").trim();

        const carTypes = Array.isArray(body.carTypes)
          ? body.carTypes.map((v) => String(v).trim()).filter(Boolean)
          : [];

        const minPrice = Number(body.minPrice);
        const maxPrice = Number(body.maxPrice);

        if (!name) return res.status(400).json({ ok: false, error: "name is required" });
        if (!email) return res.status(400).json({ ok: false, error: "email is required" });
        if (!isValidDateString(startDate))
          return res.status(400).json({ ok: false, error: "startDate must be YYYY-MM-DD" });
        if (!isValidDateString(endDate))
          return res.status(400).json({ ok: false, error: "endDate must be YYYY-MM-DD" });
        if (!Number.isFinite(minPrice) || !Number.isFinite(maxPrice))
          return res.status(400).json({ ok: false, error: "minPrice/maxPrice must be numbers" });

        const sheets = getSheetsClient();

        logger.info("Sheets target", { SHEET_ID, SHEET_TAB });

        const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
        logger.info("Sheets READ ok", { title: meta.data.properties?.title });

        const id = randomUUID();
        const createdAt = new Date().toISOString();

        const values = [[
          id,
          createdAt,
          name,
          email,
          startDate,
          endDate,
          carTypes.join(", "),
          minPrice,
          maxPrice,
          notes,
        ]];

        await sheets.spreadsheets.values.append({
          spreadsheetId: SHEET_ID,
          range: `${SHEET_TAB}!A1`,
          valueInputOption: "USER_ENTERED",
          insertDataOption: "INSERT_ROWS",
          requestBody: { values },
        });

        // Send email and SMS notifications to admin
        const debug = isDebugMode();
        if (debug) {
          logger.info("Debug mode enabled - skipping email and SMS notifications", {
            requestId: id,
          });
        }
        if (!debug) {
          // Send email notification
          try {
            const adminEmailAddress = ADMIN_EMAIL.value();
            if (adminEmailAddress) {
              const emailBody = [
                "New rental request received:",
                "",
                `Name: ${name}`,
                `Email: ${email}`,
                `Start Date: ${startDate}`,
                `End Date: ${endDate}`,
                `Car Types: ${carTypes.length > 0 ? carTypes.join(", ") : "Any"}`,
                `Price Range: $${minPrice} - $${maxPrice}`,
                notes ? `Notes: ${notes}` : "",
                "",
                `Request ID: ${id}`,
                `Submitted: ${createdAt}`,
                "",
                "Please review the request in Google Sheets and create a customer info link if approved.",
              ]
                .filter(Boolean) // Remove empty strings
                .join("\n");

              await sendEmail({
                to: adminEmailAddress,
                subject: `New Rental Request: ${name} - ${startDate} to ${endDate}`,
                text: emailBody,
              });

              logger.info("New request notification email sent to admin", {
                adminEmail: adminEmailAddress,
                requestId: id,
              });
            }
          } catch (emailError) {
            // Log error but don't fail the request - request was still saved
            logger.error("Failed to send new request notification email", {
              error: emailError.message,
              stack: emailError.stack,
              requestId: id,
            });
          }

          // Send SMS notification
          try {
            const adminPhoneNumber = ADMIN_NUMBER.value();
            if (!adminPhoneNumber) {
              logger.warn("SMS not sent: ADMIN_NUMBER secret is not set or empty", {
                requestId: id,
              });
            } else {
              const formattedNumber = formatPhoneNumber(adminPhoneNumber);
              if (!formattedNumber) {
                logger.error("SMS not sent: Failed to format phone number", {
                  adminPhoneNumber,
                  requestId: id,
                });
              } else {
                // Create a concise SMS message (SMS has 160 character limit, but we'll keep it brief)
                const smsMessage = [
                  `New rental request: ${name}`,
                  `${startDate} to ${endDate}`,
                  carTypes.length > 0 ? `Car: ${carTypes.join(", ")}` : "",
                  `$${minPrice}-$${maxPrice}/day`,
                  notes ? `Note: ${notes.substring(0, 50)}${notes.length > 50 ? "..." : ""}` : "",
                ]
                  .filter(Boolean)
                  .join("\n");

                await sendSMS({
                  to: formattedNumber,
                  message: smsMessage,
                });

                logger.info("New request notification SMS sent to admin", {
                  adminNumber: formattedNumber,
                  requestId: id,
                });
              }
            }
          } catch (smsError) {
            // Log error but don't fail the request - request was still saved
            logger.error("Failed to send new request notification SMS", {
              error: smsError.message,
              stack: smsError.stack,
              requestId: id,
            });
          }
        }

        return res.status(200).json({ ok: true, id });
      } catch (err) {
        logger.error("submitRequest failed", err);

        const status = err?.code || err?.response?.status || 500;
        const message = err?.message || String(err);
        const details = err?.response?.data;

        return res.status(Number(status) || 500).json({
          ok: false,
          error: message,
          status,
          details,
        });
      }
    })
);
