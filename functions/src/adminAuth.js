// functions/src/adminAuth.js
import { defineSecret } from "firebase-functions/params";
import { logger } from "firebase-functions";

const ADMIN_SECRET = defineSecret("ADMIN_SECRET");

/**
 * Validates admin secret from request header
 * @param {import("express").Request} req - Express request object
 * @throws {Error} If admin secret is missing or invalid
 */
export function requireAdminSecret(req) {
  const provided = String(req.get("X-Admin-Secret") || "");
  const expected = ADMIN_SECRET.value();
  
  if (!expected) {
    logger.warn("ADMIN_SECRET not configured");
    const err = new Error("Admin authentication not configured");
    err.status = 500;
    throw err;
  }
  
  if (!provided || provided !== expected) {
    logger.warn("Invalid admin secret attempt", { 
      providedLength: provided.length,
      expectedLength: expected.length 
    });
    const err = new Error("Unauthorized");
    err.status = 401;
    throw err;
  }
  
  logger.info("Admin authentication successful");
}

/**
 * Middleware function to validate admin secret
 * Can be used directly in route handlers
 */
export function adminAuthMiddleware(req, res, next) {
  try {
    requireAdminSecret(req);
    next();
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({ 
      ok: false, 
      error: error.message || "Unauthorized" 
    });
  }
}

/**
 * Validates admin token from query parameter
 * @param {string} token - Admin token from query parameter
 * @param {string} secret - Secret key for decryption
 * @returns {Object|null} Decrypted payload or null if invalid
 */
export function validateAdminToken(token, secret) {
  if (!token || !secret) {
    return null;
  }
  
  try {
    // Token format: iv.tag.ciphertext (all base64url)
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }
    
    // Decryption logic would go here if tokens are encrypted
    // For now, this is a placeholder for token validation
    return { valid: true };
  } catch (error) {
    logger.error("Token validation error", { error: error.message });
    return null;
  }
}
