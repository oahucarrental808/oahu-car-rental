import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { logger } from "firebase-functions";
import crypto from "node:crypto";
import { adminCors } from "./common/cors.js";

// Decodes encrypted admin instruction links (pickup/dropoff admin pages).
// Token format: iv.tag.ciphertext (base64url), AES-256-GCM with LINK_SECRET.
// Payload should include exp (ms since epoch). Other fields are returned as-is.

const LINK_SECRET = defineSecret("LINK_SECRET");

function b64urlToBuf(s) {
  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  const b64 = (s + pad).replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(b64, "base64");
}

function decryptToken(token, secret) {
  const [ivB64, tagB64, ctB64] = String(token).split(".");
  if (!ivB64 || !tagB64 || !ctB64) throw new Error("Bad token");

  const key = crypto.createHash("sha256").update(secret).digest();
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, b64urlToBuf(ivB64));
  decipher.setAuthTag(b64urlToBuf(tagB64));

  const plaintext = Buffer.concat([
    decipher.update(b64urlToBuf(ctB64)),
    decipher.final(),
  ]).toString("utf8");

  return JSON.parse(plaintext);
}

export const decodeAdminInstructionLink = onRequest(
  { secrets: [LINK_SECRET] },
  (req, res) =>
    adminCors(req, res, async () => {
      try {
        if (req.method === "OPTIONS") return res.status(204).send();
        if (req.method !== "GET") return res.status(405).send("GET only");

        const token = String(req.query.t || "");
        if (!token) return res.status(401).json({ ok: false, error: "Missing token" });

        const draft = decryptToken(token, LINK_SECRET.value());

        const exp = Number(draft?.exp || 0);
        if (!exp) return res.status(401).json({ ok: false, error: "Token missing exp" });
        if (Date.now() > exp) return res.status(401).json({ ok: false, error: "Link expired" });

        const phase = String(draft?.phase || "");
        if (phase && phase !== "admin_pickup" && phase !== "admin_dropoff") {
          // Non-fatal warning to avoid breaking older/experimental tokens.
          logger.warn("decodeAdminInstructionLink: unexpected phase", { phase });
        }

        return res.status(200).json({ ok: true, draft });
      } catch (e) {
        logger.error("decodeAdminInstructionLink failed", e);
        return res.status(400).json({ ok: false, error: e?.message || "Failed to decode link" });
      }
    })
);
