// functions/src/common/cors.js
import cors from "cors";

export const publicCors = cors({
  origin: true,
  methods: ["POST", "OPTIONS"],
});

export const adminCors = cors({
  origin: true,
  methods: ["POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "X-Admin-Secret"],
});
