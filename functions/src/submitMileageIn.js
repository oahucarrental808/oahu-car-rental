import { onRequest } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import { defineSecret } from "firebase-functions/params";
import cors from "cors";
import { Busboy } from "@fastify/busboy";
import crypto from "node:crypto";
import { Readable } from "node:stream";
import { google } from "googleapis";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { CONTRACT_COORDS } from "./pdfCoordinates.js";

/* ------------------------------------------------------------------ */
/* Secrets                                                            */
/* ------------------------------------------------------------------ */

const LINK_SECRET = defineSecret("LINK_SECRET");
const OAUTH_CLIENT_ID = defineSecret("OAUTH_CLIENT_ID");
const OAUTH_CLIENT_SECRET = defineSecret("OAUTH_CLIENT_SECRET");
const OAUTH_REDIRECT_URI = defineSecret("OAUTH_REDIRECT_URI");
const DRIVE_REFRESH_TOKEN = defineSecret("DRIVE_REFRESH_TOKEN");

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

function mustIntString(s) {
  const v = String(s ?? "").trim();
  return /^\d+$/.test(v);
}

function mustString(v) {
  return String(v ?? "").trim();
}

function cleanAscii(s) {
  return String(s ?? "")
    .replace(/\u2192/g, "->")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "");
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
        const buf = Buffer.concat(chunks);
        files[name] = {
          filename: info.filename,
          mimeType: info.mimeType,
          buffer: buf,
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

async function uploadDriveFile({ drive, name, mimeType, parents, buffer }) {
  const res = await drive.files.create({
    requestBody: { name, mimeType, parents },
    media: { mimeType, body: Readable.from(buffer) },
    fields: "id, webViewLink",
  });
  return res.data;
}

async function findFileByName({ drive, folderId, name }) {
  const q = `'${folderId}' in parents and trashed=false and name='${name.replaceAll("'", "\\'")}'`;
  const list = await drive.files.list({
    q,
    fields: "files(id,name,mimeType,webViewLink)",
    pageSize: 10,
  });
  return list.data.files?.[0] || null;
}

async function downloadFileBytes({ drive, fileId }) {
  const out = await drive.files.get(
    { fileId, alt: "media" },
    { responseType: "arraybuffer" }
  );
  return Buffer.from(out.data);
}

async function downloadTextFile({ drive, fileId }) {
  return (await downloadFileBytes({ drive, fileId })).toString("utf8");
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
/* PDF completion (safe if coords missing)                            */
/* ------------------------------------------------------------------ */

async function makeCompletedContractPdf({ basePdfBytes, mileageJson }) {
  const pdf = await PDFDocument.load(basePdfBytes);
  const page = pdf.getPages()[0];
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const FONT_SIZE = CONTRACT_COORDS.fontSize ?? 11;

  function drawAt(value, pos) {
    const t = cleanAscii(value);
    if (!t || !pos || typeof pos.x !== "number" || typeof pos.y !== "number") return;
    page.drawText(t, { x: pos.x, y: pos.y, size: FONT_SIZE, font });
  }

  // NOTE: pdfCoordinates.js currently does NOT include these positions in the uploaded file.
  // If you add them later (recommended), this code will automatically start filling them:
  //
  // CONTRACT_COORDS.mileageOut / mileageIn / fuelOut / fuelIn
  //
  drawAt(
    mileageJson?.mileage?.out != null ? String(mileageJson.mileage.out) : "",
    CONTRACT_COORDS?.mileageOut
  );
  drawAt(
    mileageJson?.mileage?.in != null ? String(mileageJson.mileage.in) : "",
    CONTRACT_COORDS?.mileageIn
  );
  drawAt(mileageJson?.fuel?.out ?? "", CONTRACT_COORDS?.fuelOut);
  drawAt(mileageJson?.fuel?.in ?? "", CONTRACT_COORDS?.fuelIn);

  return await pdf.save();
}

/* ------------------------------------------------------------------ */
/* Handler                                                            */
/* ------------------------------------------------------------------ */

export const submitMileageIn = onRequest(
  {
    region: "us-central1",
    secrets: [
      LINK_SECRET,
      OAUTH_CLIENT_ID,
      OAUTH_CLIENT_SECRET,
      OAUTH_REDIRECT_URI,
      DRIVE_REFRESH_TOKEN,
    ],
  },
  (req, res) =>
    corsHandler(req, res, async () => {
      try {
        if (req.method === "OPTIONS") return res.status(204).send("");
        if (req.method !== "POST") return res.status(405).send("Use POST");

        const token = String(req.query.t || "");
        if (!token) return res.status(400).json({ ok: false, error: "Missing token" });

        const payload = decrypt(token, LINK_SECRET.value());

        if (payload?.exp && Date.now() > payload.exp) {
          return res.status(410).json({ ok: false, error: "Link expired" });
        }

        if (payload?.phase !== "in") {
          return res.status(400).json({ ok: false, error: "Invalid link phase" });
        }

        const folderId = mustString(payload.folderId);
        const vin = mustString(payload.vin);
        const startDate = mustString(payload.startDate);
        const endDate = mustString(payload.endDate);
        const customerEmail = mustString(payload.customerEmail);

        if (!folderId) return res.status(400).json({ ok: false, error: "Missing folderId" });
        if (!vin) return res.status(400).json({ ok: false, error: "Missing vin" });
        if (!startDate) return res.status(400).json({ ok: false, error: "Missing startDate" });

        const { fields, files } = await parseMultipart(req);

        const mileageIn = mustString(fields.mileageIn);
        const fuelIn = mustString(fields.fuelIn);
        const dashboard = files.dashboard;

        if (!mustIntString(mileageIn)) {
          return res.status(400).json({ ok: false, error: "mileageIn must be integer" });
        }
        if (!fuelIn) {
          return res.status(400).json({ ok: false, error: "fuelIn required" });
        }
        if (!dashboard?.buffer?.length) {
          return res.status(400).json({ ok: false, error: "dashboard photo required" });
        }

        const oauth2Client = oauthClientFromSecrets({
          clientId: OAUTH_CLIENT_ID.value(),
          clientSecret: OAUTH_CLIENT_SECRET.value(),
          redirectUri: OAUTH_REDIRECT_URI.value(),
          refreshToken: DRIVE_REFRESH_TOKEN.value(),
        });

        const drive = google.drive({ version: "v3", auth: oauth2Client });

        // Save dashboard photo as mileageIN.jpeg
        await uploadDriveFile({
          drive,
          name: "mileageIN.jpeg",
          mimeType: dashboard.mimeType || "image/jpeg",
          parents: [folderId],
          buffer: dashboard.buffer,
        });

        // Update mileage.json
        const mj = await findFileByName({ drive, folderId, name: "mileage.json" });
        let nextMileageJson = {
          mileage: { out: null, in: Number(mileageIn) },
          fuel: { out: null, in: fuelIn },
          updatedAt: new Date().toISOString(),
        };

        if (mj?.id) {
          let current = {};
          try {
            current = JSON.parse(await downloadTextFile({ drive, fileId: mj.id }));
          } catch {
            current = {};
          }

          nextMileageJson = {
            mileage: { out: current?.mileage?.out ?? null, in: Number(mileageIn) },
            fuel: { out: current?.fuel?.out ?? null, in: fuelIn },
            updatedAt: new Date().toISOString(),
          };

          await updateDriveFile({
            drive,
            fileId: mj.id,
            mimeType: "application/json",
            buffer: Buffer.from(JSON.stringify(nextMileageJson, null, 2), "utf8"),
          });
        }

        // Create CONTRACT_COMPLETED.pdf
        // If a signed contract exists, prefer it as the base PDF; otherwise use the generated CONTRACT.pdf.
        const signed = await findFileByName({ drive, folderId, name: "CONTRACT_SIGNED.pdf" });
        const contract = signed?.id
          ? signed
          : await findFileByName({ drive, folderId, name: "CONTRACT.pdf" });

        if (contract?.id) {
          const basePdfBytes = await downloadFileBytes({ drive, fileId: contract.id });
          const completedBytes = await makeCompletedContractPdf({
            basePdfBytes,
            mileageJson: nextMileageJson,
          });

          // Upload new file (keep original CONTRACT.pdf as-is)
          await uploadDriveFile({
            drive,
            name: "CONTRACT_COMPLETED.pdf",
            mimeType: "application/pdf",
            parents: [folderId],
            buffer: Buffer.from(completedBytes),
          });
        } else {
          // If neither CONTRACT_SIGNED.pdf nor CONTRACT.pdf exists, we still succeed; completion PDF can be generated later.
          // This avoids breaking workflow.
          logger.warn("Contract PDF not found in folder, skipping CONTRACT_COMPLETED.pdf generation", {
            folderId,
            vin,
            startDate,
          });
        }

        const debug = String(process.env.DEBUG_MODE || "").toLowerCase() === "true";

        if (debug) {
          return res.json({
            ok: true,
            // Email placeholders (debug-only)
            debugEmail: {
              to: "ADMIN",
              subject: `Rental Completed: ${vin} ${startDate}`,
              body: [
                "COMPLETED",
                "",
                `VIN: ${vin}`,
                `Start: ${startDate}`,
                `End: ${endDate || ""}`,
                `Customer Email: ${customerEmail}`,
                "",
                `Mileage OUT: ${nextMileageJson?.mileage?.out ?? ""}`,
                `Fuel OUT: ${nextMileageJson?.fuel?.out ?? ""}`,
                `Mileage IN: ${nextMileageJson?.mileage?.in ?? ""}`,
                `Fuel IN: ${nextMileageJson?.fuel?.in ?? ""}`,
                "",
                "CONTRACT_COMPLETED.pdf has been generated (if CONTRACT.pdf existed).",
              ].join("\n"),
            },
            // TODO (non-debug): email admin + start scheduler
          });
        }

        // TODO (non-debug): email admin + start scheduler

        return res.json({ ok: true });
      } catch (e) {
        logger.error("submitMileageIn failed", e);
        return res.status(500).json({ ok: false, error: e?.message || "Internal Server Error" });
      }
    })
);
