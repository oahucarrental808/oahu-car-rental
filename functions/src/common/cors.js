// functions/src/common/cors.js
import cors from "cors";
import { getAllowedOrigins } from "./config.js";

// CORS origin validation function
function originCallback(origin, callback) {
  // Allow requests with no origin (like mobile apps or curl requests)
  if (!origin) {
    return callback(null, true);
  }

  // Get allowed origins dynamically (in case config changes)
  const allowedOrigins = getAllowedOrigins();

  // If no origins configured, allow all (fallback)
  if (allowedOrigins.length === 0) {
    return callback(null, true);
  }

  // Check if origin is in allowed list
  if (allowedOrigins.includes(origin)) {
    return callback(null, true);
  }

  // Reject origin
  callback(new Error("Not allowed by CORS"));
}

export const publicCors = cors({
  origin: originCallback,
  methods: ["POST", "OPTIONS"],
  credentials: true,
});

export const adminCors = cors({
  origin: originCallback,
  methods: ["POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "X-Admin-Secret"],
  credentials: true,
});
