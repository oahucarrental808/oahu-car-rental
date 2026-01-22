// functions/src/submitRequest.js
import { onRequest } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import { randomUUID } from "crypto";

import { publicCors } from "./common/cors.js";
import { getSheetsClient } from "./common/google.js";
import { isValidDateString } from "./common/validate.js";

// ✅ Your sheet info
const SHEET_ID = "1jTbHW-j-agj00ovF4amuPpPy7ksFAirSoATWLDntR-c";
const SHEET_TAB = "Incoming Requests";

export const submitRequest = onRequest(
  { region: "us-central1" },
  (req, res) =>
    publicCors(req, res, async () => {
      try {
        if (req.method === "OPTIONS") return res.status(204).send("");
        if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Use POST" });

        const body = req.body ?? {};

        const name = String(body.name ?? "").trim();
        const email = String(body.email ?? "").trim();
        const startDate = String(body.startDate ?? "").trim();
        const endDate = String(body.endDate ?? "").trim();
        const notes = String(body.notes ?? "").trim();

        const carTypes = Array.isArray(body.carTypes)
          ? body.carTypes.map((v) => String(v).trim()).filter(Boolean)
          : [];

        const minPrice = Number(body.minPrice);
        const maxPrice = Number(body.maxPrice);

        if (!name) return res.status(400).json({ ok: false, error: "name is required" });
        if (!email) return res.status(400).json({ ok: false, error: "email is required" });
        if (!isValidDateString(startDate))
          return res.status(400).json({ ok: false, error: "startDate must be YYYY-MM-DD" });
        if (!isValidDateString(endDate))
          return res.status(400).json({ ok: false, error: "endDate must be YYYY-MM-DD" });
        if (!Number.isFinite(minPrice) || !Number.isFinite(maxPrice))
          return res.status(400).json({ ok: false, error: "minPrice/maxPrice must be numbers" });

        const sheets = getSheetsClient();

        logger.info("Sheets target", { SHEET_ID, SHEET_TAB });

        const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
        logger.info("Sheets READ ok", { title: meta.data.properties?.title });

        const id = randomUUID();
        const createdAt = new Date().toISOString();

        const values = [[
          id,
          createdAt,
          name,
          email,
          startDate,
          endDate,
          carTypes.join(", "),
          minPrice,
          maxPrice,
          notes,
        ]];

        await sheets.spreadsheets.values.append({
          spreadsheetId: SHEET_ID,
          range: `${SHEET_TAB}!A1`,
          valueInputOption: "USER_ENTERED",
          insertDataOption: "INSERT_ROWS",
          requestBody: { values },
        });

        return res.status(200).json({ ok: true, id });
      } catch (err) {
        logger.error("submitRequest failed", err);

        const status = err?.code || err?.response?.status || 500;
        const message = err?.message || String(err);
        const details = err?.response?.data;

        return res.status(Number(status) || 500).json({
          ok: false,
          error: message,
          status,
          details,
        });
      }
    })
);
