import { onRequest } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import { defineSecret } from "firebase-functions/params";
import cors from "cors";
import { Busboy } from "@fastify/busboy";
import crypto from "node:crypto";
import { Readable } from "node:stream";
import { google } from "googleapis";

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

// AES-256-GCM: token = iv.tag.ciphertext (all base64url)
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

function mustIntString(s) {
  const v = String(s ?? "").trim();
  return /^\d+$/.test(v);
}

function mustString(v) {
  return String(v ?? "").trim();
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

async function downloadTextFile({ drive, fileId }) {
  const out = await drive.files.get(
    { fileId, alt: "media" },
    { responseType: "arraybuffer" }
  );
  return Buffer.from(out.data).toString("utf8");
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

export const submitMileageOut = onRequest(
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

        if (payload?.phase !== "out") {
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

        const mileageOut = mustString(fields.mileageOut);
        const fuelOut = mustString(fields.fuelOut);
        const dashboard = files.dashboard;

        if (!mustIntString(mileageOut)) {
          return res.status(400).json({ ok: false, error: "mileageOut must be integer" });
        }
        if (!fuelOut) {
          return res.status(400).json({ ok: false, error: "fuelOut required" });
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

        // Save dashboard photo as mileageOUT.jpeg
        await uploadDriveFile({
          drive,
          name: "mileageOUT.jpeg",
          mimeType: dashboard.mimeType || "image/jpeg",
          parents: [folderId],
          buffer: dashboard.buffer,
        });

        // Update mileage.json
        const mj = await findFileByName({ drive, folderId, name: "mileage.json" });
        if (mj?.id) {
          let current = {};
          try {
            current = JSON.parse(await downloadTextFile({ drive, fileId: mj.id }));
          } catch {
            current = {};
          }

          const next = {
            mileage: { out: Number(mileageOut), in: current?.mileage?.in ?? null },
            fuel: { out: fuelOut, in: current?.fuel?.in ?? null },
            updatedAt: new Date().toISOString(),
          };

          await updateDriveFile({
            drive,
            fileId: mj.id,
            mimeType: "application/json",
            buffer: Buffer.from(JSON.stringify(next, null, 2), "utf8"),
          });
        }

        const debug = String(process.env.DEBUG_MODE || "").toLowerCase() === "true";

        if (debug) {
          return res.json({
            ok: true,
            message:
              "Mileage Out submitted. (Return link is generated from the admin dropoff instructions page.)",
            // TODO (non-debug): email customer next-step instructions
          });
        }

        // TODO (non-debug): email customer next-step instructions

        return res.json({ ok: true });
      } catch (e) {
        logger.error("submitMileageOut failed", e);
        return res.status(500).json({ ok: false, error: e?.message || "Internal Server Error" });
      }
    })
);
