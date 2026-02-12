// functions/src/adminLogin.js
import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { logger } from "firebase-functions";
import cors from "cors";
import crypto from "node:crypto";

const ADMIN_SECRET = defineSecret("ADMIN_SECRET");
const LINK_SECRET = defineSecret("LINK_SECRET");

const corsHandler = cors({
  origin: true,
  methods: ["POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
});

/**
 * Encrypts a payload using AES-256-GCM
 */
function encrypt(payloadObj, secret) {
  const key = crypto.createHash("sha256").update(secret, "utf8").digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  const plaintext = Buffer.from(JSON.stringify(payloadObj), "utf8");
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  function b64url(buf) {
    return Buffer.from(buf)
      .toString("base64")
      .replaceAll("+", "-")
      .replaceAll("/", "_")
      .replaceAll("=", "");
  }

  return `${b64url(iv)}.${b64url(tag)}.${b64url(ciphertext)}`;
}

export const adminLogin = onRequest(
  { region: "us-central1", secrets: [ADMIN_SECRET, LINK_SECRET] },
  (req, res) =>
    corsHandler(req, res, async () => {
      try {
        if (req.method === "OPTIONS") return res.status(204).send("");
        if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Use POST" });

        const body = req.body ?? {};
        const password = String(body.password ?? "").trim();

        const expectedPassword = ADMIN_SECRET.value();

        if (!expectedPassword) {
          logger.error("ADMIN_SECRET not configured");
          return res.status(500).json({ ok: false, error: "Admin authentication not configured" });
        }

        if (!password || password !== expectedPassword) {
          logger.warn("Invalid admin login attempt");
          return res.status(401).json({ ok: false, error: "Invalid credentials" });
        }

        // Create a session token
        const sessionToken = encrypt(
          {
            type: "admin",
            createdAt: new Date().toISOString(),
            exp: Date.now() + 8 * 60 * 60 * 1000, // 8 hours
          },
          LINK_SECRET.value()
        );

        logger.info("Admin login successful");

        return res.json({
          ok: true,
          token: sessionToken,
          expiresIn: 8 * 60 * 60 * 1000, // 8 hours in milliseconds
        });
      } catch (error) {
        logger.error("adminLogin error", error);
        return res.status(500).json({ ok: false, error: error.message || String(error) });
      }
    })
);
