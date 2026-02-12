// functions/src/adminVerify.js
import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { logger } from "firebase-functions";
import cors from "cors";
import crypto from "node:crypto";

const LINK_SECRET = defineSecret("LINK_SECRET");

const corsHandler = cors({
  origin: true,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
});

/**
 * Decrypts a token using AES-256-GCM
 */
function decrypt(token, secret) {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid token format");
  }

  function unb64url(s) {
    const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
    const b64 = s.replaceAll("-", "+").replaceAll("_", "/") + pad;
    return Buffer.from(b64, "base64");
  }

  const [ivB64, tagB64, ciphertextB64] = parts;
  const iv = unb64url(ivB64);
  const tag = unb64url(tagB64);
  const ciphertext = unb64url(ciphertextB64);

  const key = crypto.createHash("sha256").update(secret, "utf8").digest();
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);

  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return JSON.parse(plaintext.toString("utf8"));
}

/**
 * Verifies admin authentication token
 */
export const adminVerify = onRequest(
  { region: "us-central1", secrets: [LINK_SECRET] },
  (req, res) =>
    corsHandler(req, res, async () => {
      try {
        if (req.method === "OPTIONS") return res.status(204).send("");

        // Get token from Authorization header or query/body
        let token = null;
        
        // Try Authorization header first
        const authHeader = req.get("Authorization") || "";
        if (authHeader.startsWith("Bearer ")) {
          token = authHeader.substring(7);
        }
        
        // Fallback to query parameter
        if (!token) {
          token = req.query?.token || req.body?.token || null;
        }

        if (!token) {
          return res.status(401).json({ ok: false, error: "No token provided" });
        }

        try {
          const payload = decrypt(token, LINK_SECRET.value());

          // Check if token is expired
          if (payload.exp && Date.now() > payload.exp) {
            return res.status(401).json({ ok: false, error: "Token expired" });
          }

          // Check if token is an admin token
          if (payload.type !== "admin") {
            return res.status(403).json({ ok: false, error: "Invalid token type" });
          }

          logger.info("Admin token verified", { createdAt: payload.createdAt });

          return res.json({
            ok: true,
            valid: true,
            type: payload.type,
            createdAt: payload.createdAt,
            expiresAt: payload.exp ? new Date(payload.exp).toISOString() : null,
          });
        } catch (decryptError) {
          logger.warn("Token decryption failed", { error: decryptError.message });
          return res.status(401).json({ ok: false, error: "Invalid token" });
        }
      } catch (error) {
        logger.error("adminVerify error", error);
        return res.status(500).json({ ok: false, error: error.message || String(error) });
      }
    })
);
