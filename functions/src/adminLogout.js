// functions/src/adminLogout.js
import { onRequest } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import cors from "cors";

const corsHandler = cors({
  origin: true,
  methods: ["POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
});

/**
 * Admin logout endpoint
 * In a stateless API, logout is primarily client-side (token deletion)
 * This endpoint provides server-side logging and validation
 */
export const adminLogout = onRequest(
  { region: "us-central1" },
  (req, res) =>
    corsHandler(req, res, async () => {
      try {
        if (req.method === "OPTIONS") return res.status(204).send("");
        if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Use POST" });

        // Extract token from Authorization header or body for logging
        const authHeader = req.get("Authorization") || "";
        const tokenFromHeader = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : null;
        const tokenFromBody = req.body?.token || null;

        // Log logout attempt (for audit purposes)
        if (tokenFromHeader || tokenFromBody) {
          logger.info("Admin logout requested");
        }

        // In a stateless system, the client should delete the token
        // This endpoint confirms the logout request
        return res.json({
          ok: true,
          message: "Logged out successfully. Please delete the token on the client side.",
        });
      } catch (error) {
        logger.error("adminLogout error", error);
        return res.status(500).json({ ok: false, error: error.message || String(error) });
      }
    })
);
