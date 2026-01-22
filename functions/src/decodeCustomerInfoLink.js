import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { logger } from "firebase-functions";
import cors from "cors";
import crypto from "node:crypto";

const LINK_SECRET = defineSecret("LINK_SECRET");

const corsHandler = cors({
  origin: true,
  methods: ["GET", "OPTIONS"],
});

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

export const decodeCustomerInfoLink = onRequest(
  { region: "us-central1", secrets: [LINK_SECRET] },
  (req, res) =>
    corsHandler(req, res, async () => {
      try {
        if (req.method === "OPTIONS") return res.status(204).send("");
        if (req.method !== "GET") return res.status(405).send("Use GET");

        const token = String(req.query.t || "");
        if (!token) return res.status(400).send("Missing token");

        const draft = decrypt(token, LINK_SECRET.value());

        if (draft.exp && Date.now() > draft.exp) return res.status(410).send("Link expired");

        // ✅ backward compat: old tokens had year
        if (!draft.model && draft.year) draft.model = draft.year;

        // ✅ keep defaults stable
        if (!draft.licensePlate) draft.licensePlate = "";

        // ✅ new fields: default to empty if missing (older tokens)
        if (!draft.customerEmail) draft.customerEmail = "";
        if (!draft.costPerDay) draft.costPerDay = "";

        return res.json({ ok: true, draft });
      } catch (e) {
        logger.error(e);
        return res.status(400).json({ ok: false, error: "Invalid link" });
      }
    })
);
