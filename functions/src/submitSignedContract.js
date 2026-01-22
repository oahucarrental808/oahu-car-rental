import { onRequest } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import { defineSecret } from "firebase-functions/params";
import cors from "cors";
import { Busboy } from "@fastify/busboy";
import crypto from "node:crypto";
import { Readable } from "node:stream";
import { google } from "googleapis";
import { sendEmail } from "./common/email.js";

/* ------------------------------------------------------------------ */
/* Secrets                                                            */
/* ------------------------------------------------------------------ */

const LINK_SECRET = defineSecret("LINK_SECRET");
const OAUTH_CLIENT_ID = defineSecret("OAUTH_CLIENT_ID");
const OAUTH_CLIENT_SECRET = defineSecret("OAUTH_CLIENT_SECRET");
const OAUTH_REDIRECT_URI = defineSecret("OAUTH_REDIRECT_URI");
const DRIVE_REFRESH_TOKEN = defineSecret("DRIVE_REFRESH_TOKEN");
const SMTP_EMAIL = defineSecret("SMTP_EMAIL");
const SMTP_PASSWORD = defineSecret("SMTP_PASSWORD");
const ADMIN_EMAIL = defineSecret("ADMIN_EMAIL");

/* ------------------------------------------------------------------ */
/* CORS                                                               */
/* ------------------------------------------------------------------ */

const corsHandler = cors({
  origin: true,
  methods: ["POST", "OPTIONS"],
});

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

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

function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const bb = new Busboy({ headers: req.headers });

    const fields = {};
    const files = {};

    bb.on("field", (name, val) => {
      fields[name] = val;
    });

    bb.on("file", (name, file, info) => {
      const chunks = [];
      file.on("data", (d) => chunks.push(d));
      file.on("end", () => {
        files[name] = {
          filename: info?.filename || "",
          mimeType: info?.mimeType || "",
          buffer: Buffer.concat(chunks),
        };
      });
    });

    bb.on("error", reject);
    bb.on("finish", () => resolve({ fields, files }));

    Readable.from(req.rawBody).pipe(bb);
  });
}

function oauthClientFromSecrets({ clientId, clientSecret, redirectUri, refreshToken }) {
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  return oauth2Client;
}

async function findFileByName({ drive, folderId, name }) {
  const q = `name='${name.replaceAll("'", "\\'")}' and '${folderId}' in parents and trashed=false`;
  const res = await drive.files.list({
    q,
    fields: "files(id, name, webViewLink)",
    pageSize: 5,
  });
  return res.data.files?.[0] || null;
}

async function uploadDriveFile({ drive, name, mimeType, parents, buffer }) {
  const res = await drive.files.create({
    requestBody: { name, mimeType, parents },
    media: { mimeType, body: Readable.from(buffer) },
    fields: "id, webViewLink",
  });
  return res.data;
}

async function updateDriveFile({ drive, fileId, mimeType, buffer }) {
  const res = await drive.files.update({
    fileId,
    media: { mimeType, body: Readable.from(buffer) },
    fields: "id, webViewLink",
  });
  return res.data;
}

/* ------------------------------------------------------------------ */
/* Handler                                                            */
/* ------------------------------------------------------------------ */

export const submitSignedContract = onRequest(
  {
    region: "us-central1",
    secrets: [
      LINK_SECRET,
      OAUTH_CLIENT_ID,
      OAUTH_CLIENT_SECRET,
      OAUTH_REDIRECT_URI,
      DRIVE_REFRESH_TOKEN,
      SMTP_EMAIL,
      SMTP_PASSWORD,
      ADMIN_EMAIL,
    ],
  },
  (req, res) =>
    corsHandler(req, res, async () => {
      try {
        if (req.method === "OPTIONS") return res.status(204).send("");
        if (req.method !== "POST") return res.status(405).send("Use POST");

        const token = String(req.query.t || "");
        if (!token) return res.status(400).send("Missing token");

        const draft = decrypt(token, LINK_SECRET.value());

        if (draft.exp && Date.now() > draft.exp) return res.status(410).send("Link expired");

        if (!draft.phase || draft.phase !== "signed") {
          return res.status(400).send("Invalid link");
        }

        const folderId = draft.folderId;
        const vin = draft.vin;
        const startDate = draft.startDate;
        const endDate = draft.endDate || "";
        const customerEmail = draft.customerEmail || "";

        if (!folderId || !vin || !startDate) {
          return res.status(400).send("Invalid link");
        }

        const { files } = await parseMultipart(req);

        // Frontend sends `signedContract` (PDF)
        const signed = files.signedContract;
        if (!signed?.buffer?.length) {
          return res.status(400).json({ ok: false, error: "Signed contract PDF is required." });
        }

        const oauth2Client = oauthClientFromSecrets({
          clientId: OAUTH_CLIENT_ID.value(),
          clientSecret: OAUTH_CLIENT_SECRET.value(),
          redirectUri: OAUTH_REDIRECT_URI.value(),
          refreshToken: DRIVE_REFRESH_TOKEN.value(),
        });

        const drive = google.drive({ version: "v3", auth: oauth2Client });

        // Save as CONTRACT_SIGNED.pdf (overwrite if already exists)
        const targetName = "CONTRACT_SIGNED.pdf";
        const existing = await findFileByName({ drive, folderId, name: targetName });

        let saved;
        if (existing?.id) {
          saved = await updateDriveFile({
            drive,
            fileId: existing.id,
            mimeType: signed.mimeType || "application/pdf",
            buffer: signed.buffer,
          });
        } else {
          saved = await uploadDriveFile({
            drive,
            name: targetName,
            mimeType: signed.mimeType || "application/pdf",
            parents: [folderId],
            buffer: signed.buffer,
          });
        }

        const debug = String(process.env.DEBUG_MODE || "").toLowerCase() === "true";

        if (debug) {
          return res.json({
            ok: true,
            signedContractLink: saved?.webViewLink || "",
            debugEmail: {
              to: customerEmail || "CUSTOMER",
              subject: "Signed contract received",
              body: [
                "SIGNED CONTRACT UPLOADED",
                "",
                `VIN: ${vin}`,
                `Start: ${startDate}`,
                `End: ${endDate}`,
                "",
                saved?.webViewLink ? `Drive link: ${saved.webViewLink}` : "(Drive link unavailable)",
              ].join("\n"),
            },
          });
        }

        // Email admin confirmation (optional - as per TODO comment)
        try {
          const adminEmailAddress = ADMIN_EMAIL.value();
          if (adminEmailAddress) {
            await sendEmail({
              to: adminEmailAddress,
              subject: `Signed Contract Received: ${vin} ${startDate}`,
              text: [
                "SIGNED CONTRACT UPLOADED",
                "",
                `VIN: ${vin}`,
                `Start Date: ${startDate}`,
                `End Date: ${endDate}`,
                `Customer Email: ${customerEmail || "N/A"}`,
                "",
                saved?.webViewLink
                  ? `Drive Link: ${saved.webViewLink}`
                  : "(Drive link unavailable)",
              ].join("\n"),
            });
            logger.info("Signed contract confirmation email sent to admin", {
              adminEmail: adminEmailAddress,
            });
          }
        } catch (emailError) {
          // Log error but don't fail the request - contract was still uploaded
          logger.error("Failed to send signed contract confirmation email", {
            error: emailError.message,
          });
        }

        return res.json({ ok: true, signedContractLink: saved?.webViewLink || "" });
      } catch (e) {
        logger.error("submitSignedContract failed", e);
        return res.status(500).json({ ok: false, error: e?.message || "Internal Server Error" });
      }
    })
);
