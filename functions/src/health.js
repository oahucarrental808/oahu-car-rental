// functions/src/health.js
import { onRequest } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import cors from "cors";

const corsHandler = cors({
  origin: true,
  methods: ["GET", "OPTIONS"],
});

/**
 * Health check endpoint
 * Returns the status of the service and basic system information
 */
export const health = onRequest(
  { region: "us-central1" },
  (req, res) =>
    corsHandler(req, res, async () => {
      try {
        if (req.method === "OPTIONS") return res.status(204).send("");

        const healthStatus = {
          ok: true,
          status: "healthy",
          timestamp: new Date().toISOString(),
          service: "oahu-car-rentals",
          version: process.env.K_SERVICE || "local",
          region: process.env.FUNCTION_REGION || "us-central1",
        };

        // Optional: Check critical dependencies
        const checks = {
          firebase: true, // Firebase Admin is initialized
          // Add more checks as needed:
          // sheets: await checkSheetsAccess(),
          // drive: await checkDriveAccess(),
        };

        const allHealthy = Object.values(checks).every((check) => check === true);

        if (!allHealthy) {
          healthStatus.status = "degraded";
          healthStatus.checks = checks;
        }

        const statusCode = allHealthy ? 200 : 503;

        logger.info("Health check", healthStatus);

        return res.status(statusCode).json(healthStatus);
      } catch (error) {
        logger.error("health check error", error);
        return res.status(503).json({
          ok: false,
          status: "unhealthy",
          error: error.message || String(error),
          timestamp: new Date().toISOString(),
        });
      }
    })
);
