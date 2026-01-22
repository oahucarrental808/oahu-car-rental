import { onRequest } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import { defineSecret } from "firebase-functions/params";
import { Busboy } from "@fastify/busboy";
import { PDFDocument, StandardFonts } from "pdf-lib";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { google } from "googleapis";
import { adminCors } from "./common/cors.js";
import { mustString, isValidDateString } from "./common/validate.js";
import { CONTRACT_COORDS } from "./pdfCoordinates.js";
import { sendEmail } from "./common/email.js";

/* ------------------------------------------------------------------ */
/* Secrets                                                            */
/* ------------------------------------------------------------------ */

const LINK_SECRET = defineSecret("LINK_SECRET");
const DRIVE_PARENT_FOLDER_ID = defineSecret("DRIVE_PARENT_FOLDER_ID");
const OAUTH_CLIENT_ID = defineSecret("OAUTH_CLIENT_ID");
const OAUTH_CLIENT_SECRET = defineSecret("OAUTH_CLIENT_SECRET");
const OAUTH_REDIRECT_URI = defineSecret("OAUTH_REDIRECT_URI");
const DRIVE_REFRESH_TOKEN = defineSecret("DRIVE_REFRESH_TOKEN");
const SMTP_EMAIL = defineSecret("SMTP_EMAIL");
const SMTP_PASSWORD = defineSecret("SMTP_PASSWORD");

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function b64urlToBuf(s) {
  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  const b64 = (s + pad).replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(b64, "base64");
}

function decryptCustomerToken(token, secret) {
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

function b64url(buf) {
  return Buffer.from(buf)
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function encryptToken(payloadObj, secret) {
  const key = crypto.createHash("sha256").update(secret).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  const plaintext = Buffer.from(JSON.stringify(payloadObj), "utf8");
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${b64url(iv)}.${b64url(tag)}.${b64url(ciphertext)}`;
}

function cleanAscii(s) {
  return String(s ?? "")
    .replace(/\u2192/g, "->")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "");
}

function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const bb = new Busboy({ headers: req.headers });

    const fields = {};
    const files = {};

    bb.on("field", (name, val) => {
      fields[name] = val;
    });

    bb.on("file", (name, file, info) => {
      const chunks = [];
      file.on("data", (d) => chunks.push(d));
      file.on("end", () => {
        const buf = Buffer.concat(chunks);
        files[name] = {
          filename: info.filename,
          mimeType: info.mimeType,
          buffer: buf,
        };
      });
    });

    bb.on("error", reject);
    bb.on("finish", () => resolve({ fields, files }));

    Readable.from(req.rawBody).pipe(bb);
  });
}

function requirePhoto(files, key) {
  if (!files[key] || !files[key].buffer?.length) {
    const err = new Error(`Missing required photo: ${key}`);
    err.status = 400;
    throw err;
  }
}

function oauthClientFromSecrets({ clientId, clientSecret, redirectUri, refreshToken }) {
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  return oauth2Client;
}

async function uploadDriveFile({ drive, name, mimeType, parents, buffer }) {
  const res = await drive.files.create({
    requestBody: { name, mimeType, parents },
    media: { mimeType, body: Readable.from(buffer) },
    fields: "id, webViewLink",
  });
  return res.data;
}

async function createDriveFolder({ drive, name, parentId }) {
  const res = await drive.files.create({
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    },
    fields: "id, webViewLink",
  });
  return res.data;
}

/* ------------------------------------------------------------------ */
/* PDF generation                                                     */
/* ------------------------------------------------------------------ */

async function makeFilledContractPdf({ draft, d1, d2, hasSecondDriver }) {
  const pdfPath = path.join(process.cwd(), "assets", "BLANK CONTRACT.pdf");
  const baseBytes = await fs.readFile(pdfPath);

  const pdf = await PDFDocument.load(baseBytes);
  const page = pdf.getPages()[0];
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const FONT_SIZE = CONTRACT_COORDS.fontSize ?? 11;

  function drawAt(value, pos) {
    const t = cleanAscii(value);
    if (!t || !pos) return;
    page.drawText(t, { x: pos.x, y: pos.y, size: FONT_SIZE, font });
  }

  // DRIVER 1
  drawAt(d1.lastName, CONTRACT_COORDS.d1.lastName);
  drawAt(d1.firstName, CONTRACT_COORDS.d1.firstName);
  drawAt(d1.mi, CONTRACT_COORDS.d1.mi);

  drawAt(d1.homeAddress, CONTRACT_COORDS.d1.homeAddress);

  drawAt(d1.city, CONTRACT_COORDS.d1.city);
  drawAt(d1.state, CONTRACT_COORDS.d1.state);
  drawAt(d1.zip, CONTRACT_COORDS.d1.zip);

  drawAt(d1.homePhone, CONTRACT_COORDS.d1.homePhone);
  drawAt(d1.businessPhone, CONTRACT_COORDS.d1.businessPhone);

  drawAt(d1.employer, CONTRACT_COORDS.d1.employer);
  drawAt(d1.employerCity, CONTRACT_COORDS.d1.employerCity);
  drawAt(d1.employerState, CONTRACT_COORDS.d1.employerState);

  drawAt(d1.dlNumber, CONTRACT_COORDS.d1.dlNumber);
  drawAt(d1.dlExp, CONTRACT_COORDS.d1.dlExp);
  drawAt(d1.dlState, CONTRACT_COORDS.d1.dlState);

  drawAt(d1.cellPhone, CONTRACT_COORDS.d1.cellPhone);
  drawAt(d1.dob, CONTRACT_COORDS.d1.dob);

  // INSURANCE
  drawAt(d1.insuranceCompany, CONTRACT_COORDS.d1.insuranceCompany);
  drawAt(d1.insuranceCompanyPhone, CONTRACT_COORDS.d1.insuranceCompanyPhone);
  drawAt(d1.agentName, CONTRACT_COORDS.d1.agentName);
  drawAt(d1.agentPhone, CONTRACT_COORDS.d1.agentPhone);

  // VEHICLE (right table)
  const makeModel = [draft.make, draft.model].filter(Boolean).join(" ");
  drawAt(makeModel, CONTRACT_COORDS.vehicle.makeModel);
  drawAt(draft.color, CONTRACT_COORDS.vehicle.color);
  drawAt(draft.vin, CONTRACT_COORDS.vehicle.vin);
  drawAt(draft.licensePlate, CONTRACT_COORDS.vehicle.tagNumber);

  // ✅ Per request: fill Day In/Out using 12:01 AM and 11:59 PM
  drawAt(`${draft.startDate} 12:01 AM`, CONTRACT_COORDS.vehicle.dateTimeOut);
  drawAt(`${draft.endDate} 11:59 PM`, CONTRACT_COORDS.vehicle.dateDueIn);

  // ✅ Cost/day (format expected: "${cost}/Day")
  if (CONTRACT_COORDS?.rental?.dayRate) {
    drawAt(draft.costPerDay, CONTRACT_COORDS.rental.dayRate);
  }

  // DRIVER 2
  if (hasSecondDriver) {
    drawAt(d2.lastName, CONTRACT_COORDS.d2.lastName);
    drawAt(d2.firstName, CONTRACT_COORDS.d2.firstName);

    drawAt(d2.address, CONTRACT_COORDS.d2.address);

    drawAt(d2.city, CONTRACT_COORDS.d2.city);
    drawAt(d2.state, CONTRACT_COORDS.d2.state);
    drawAt(d2.zip, CONTRACT_COORDS.d2.zip);

    drawAt(d2.dlNumber, CONTRACT_COORDS.d2.dlNumber);
    drawAt(d2.dlExp, CONTRACT_COORDS.d2.dlExp);
    drawAt(d2.dlState, CONTRACT_COORDS.d2.dlState);

    drawAt(d2.dob, CONTRACT_COORDS.d2.dob);
  }

  return await pdf.save();
}

/* ------------------------------------------------------------------ */
/* Handler                                                            */
/* ------------------------------------------------------------------ */

export const createRentalPackage = onRequest(
  {
    secrets: [
      LINK_SECRET,
      DRIVE_PARENT_FOLDER_ID,
      OAUTH_CLIENT_ID,
      OAUTH_CLIENT_SECRET,
      OAUTH_REDIRECT_URI,
      DRIVE_REFRESH_TOKEN,
      SMTP_EMAIL,
      SMTP_PASSWORD,
    ],
  },
  (req, res) =>
    adminCors(req, res, async () => {
      try {
        if (req.method === "OPTIONS") return res.status(204).send();
        if (req.method !== "POST") return res.status(405).send("POST only");

        const token = String(req.query.t || "");
        if (!token) return res.status(401).json({ ok: false, error: "Unauthorized" });

        const payload = decryptCustomerToken(token, LINK_SECRET.value());

        // ✅ Option B: lean draft payload (model replaces year)
        const vin = payload?.vin;
        const make = payload?.make;
        const color = payload?.color;
        const model = payload?.model || payload?.year || ""; // backward compat
        const licensePlate = payload?.licensePlate || "";
        const startDate = payload?.startDate;
        const endDate = payload?.endDate;

        // ✅ New fields
        const customerEmail = payload?.customerEmail || "";
        const costPerDay = payload?.costPerDay || "";

        if (!mustString(vin)) return res.status(400).json({ ok: false, error: "vin required" });
        if (!mustString(make)) return res.status(400).json({ ok: false, error: "make required" });
        if (!mustString(color)) return res.status(400).json({ ok: false, error: "color required" });
        if (!mustString(model)) return res.status(400).json({ ok: false, error: "model required" });
        if (!isValidDateString(startDate))
          return res.status(400).json({ ok: false, error: "startDate invalid" });
        if (!isValidDateString(endDate))
          return res.status(400).json({ ok: false, error: "endDate invalid" });

        if (!mustString(customerEmail))
          return res.status(400).json({ ok: false, error: "customerEmail required" });
        if (!mustString(costPerDay))
          return res.status(400).json({ ok: false, error: "costPerDay required" });

        const { fields, files } = await parseMultipart(req);
        const hasSecondDriver = fields.hasSecondDriver === "true";

        requirePhoto(files, "d1_ins");
        requirePhoto(files, "d1_lic");
        requirePhoto(files, "d1_self");

        if (hasSecondDriver) {
          requirePhoto(files, "d2_ins");
          requirePhoto(files, "d2_lic");
          requirePhoto(files, "d2_self");
        }

        let d1 = {};
        let d2 = {};
        try {
          d1 = JSON.parse(fields.d1 || "{}");
        } catch {
          const err = new Error("Invalid JSON in field 'd1'");
          err.status = 400;
          throw err;
        }
        try {
          d2 = JSON.parse(fields.d2 || "{}");
        } catch {
          const err = new Error("Invalid JSON in field 'd2'");
          err.status = 400;
          throw err;
        }

        d1 = {
          firstName: d1.firstName ?? fields.d1_firstName ?? "",
          lastName: d1.lastName ?? fields.d1_lastName ?? "",
          mi: d1.mi ?? fields.d1_mi ?? "",
          homeAddress: d1.homeAddress ?? fields.d1_homeAddress ?? "",
          city: d1.city ?? fields.d1_city ?? "",
          state: d1.state ?? fields.d1_state ?? "",
          zip: d1.zip ?? fields.d1_zip ?? "",
          homePhone: d1.homePhone ?? fields.d1_homePhone ?? "",
          businessPhone: d1.businessPhone ?? fields.d1_businessPhone ?? "",
          employer: d1.employer ?? fields.d1_employer ?? "",
          employerCity: d1.employerCity ?? fields.d1_employerCity ?? "",
          employerState: d1.employerState ?? fields.d1_employerState ?? "",
          cellPhone: d1.cellPhone ?? fields.d1_cellPhone ?? "",
          dob: d1.dob ?? fields.d1_dob ?? "",
          dlNumber: d1.dlNumber ?? fields.d1_dlNumber ?? "",
          dlExp: d1.dlExp ?? fields.d1_dlExp ?? "",
          dlState: d1.dlState ?? fields.d1_dlState ?? "",
          insuranceCompany: d1.insuranceCompany ?? fields.d1_insuranceCompany ?? "",
          insuranceCompanyPhone:
            d1.insuranceCompanyPhone ?? fields.d1_insuranceCompanyPhone ?? "",
          agentName: d1.agentName ?? fields.d1_agentName ?? "",
          agentPhone: d1.agentPhone ?? fields.d1_agentPhone ?? "",
        };

        d2 = {
          firstName: d2.firstName ?? fields.d2_firstName ?? "",
          lastName: d2.lastName ?? fields.d2_lastName ?? "",
          address: d2.address ?? fields.d2_homeAddress ?? fields.d2_address ?? "",
          city: d2.city ?? fields.d2_city ?? "",
          state: d2.state ?? fields.d2_state ?? "",
          zip: d2.zip ?? fields.d2_zip ?? "",
          dob: d2.dob ?? fields.d2_dob ?? "",
          dlNumber: d2.dlNumber ?? fields.d2_dlNumber ?? "",
          dlExp: d2.dlExp ?? fields.d2_dlExp ?? "",
          dlState: d2.dlState ?? fields.d2_dlState ?? "",
        };

        const draft = {
          vin,
          make,
          model,
          color,
          licensePlate,
          startDate,
          endDate,
          customerEmail,
          costPerDay,
        };

        const oauth2Client = oauthClientFromSecrets({
          clientId: OAUTH_CLIENT_ID.value(),
          clientSecret: OAUTH_CLIENT_SECRET.value(),
          redirectUri: OAUTH_REDIRECT_URI.value(),
          refreshToken: DRIVE_REFRESH_TOKEN.value(),
        });

        const drive = google.drive({ version: "v3", auth: oauth2Client });

        const folderName = `${vin}_${startDate}_${endDate}`;
        const parentId = DRIVE_PARENT_FOLDER_ID.value();

        const folder = await createDriveFolder({
          drive,
          name: folderName,
          parentId,
        });

        // Upload photos
        await uploadDriveFile({
          drive,
          name: `d1_insurance`,
          mimeType: files.d1_ins.mimeType || "image/jpeg",
          parents: [folder.id],
          buffer: files.d1_ins.buffer,
        });
        await uploadDriveFile({
          drive,
          name: `d1_license`,
          mimeType: files.d1_lic.mimeType || "image/jpeg",
          parents: [folder.id],
          buffer: files.d1_lic.buffer,
        });
        await uploadDriveFile({
          drive,
          name: `d1_selfie`,
          mimeType: files.d1_self.mimeType || "image/jpeg",
          parents: [folder.id],
          buffer: files.d1_self.buffer,
        });

        if (hasSecondDriver) {
          await uploadDriveFile({
            drive,
            name: `d2_insurance`,
            mimeType: files.d2_ins.mimeType || "image/jpeg",
            parents: [folder.id],
            buffer: files.d2_ins.buffer,
          });
          await uploadDriveFile({
            drive,
            name: `d2_license`,
            mimeType: files.d2_lic.mimeType || "image/jpeg",
            parents: [folder.id],
            buffer: files.d2_lic.buffer,
          });
          await uploadDriveFile({
            drive,
            name: `d2_selfie`,
            mimeType: files.d2_self.mimeType || "image/jpeg",
            parents: [folder.id],
            buffer: files.d2_self.buffer,
          });
        }

        // Summary JSON
        const summary = { draft, d1, hasSecondDriver, d2: hasSecondDriver ? d2 : null };
        await uploadDriveFile({
          drive,
          name: `CustomerInfo_${vin}_${startDate}.txt`,
          mimeType: "text/plain",
          parents: [folder.id],
          buffer: Buffer.from(JSON.stringify(summary, null, 2), "utf8"),
        });

        // Filled contract PDF
        const filledPdfBytes = await makeFilledContractPdf({ draft, d1, d2, hasSecondDriver });

        const contract = await uploadDriveFile({
          drive,
          name: `CONTRACT.pdf`,
          mimeType: "application/pdf",
          parents: [folder.id],
          buffer: Buffer.from(filledPdfBytes),
        });

        // Initialize mileage.json (OUT pickup + IN return)
        const mileageInit = {
          mileage: { out: null, in: null },
          fuel: { out: null, in: null },
          updatedAt: new Date().toISOString(),
        };

        await uploadDriveFile({
          drive,
          name: "mileage.json",
          mimeType: "application/json",
          parents: [folder.id],
          buffer: Buffer.from(JSON.stringify(mileageInit, null, 2), "utf8"),
        });

        const createdAt = new Date().toISOString();
        const exp = Date.now() + 7 * 24 * 60 * 60 * 1000;

        // ✅ Create Signed Contract Upload link
        const signedContractToken = encryptToken(
          {
            vin,
            startDate,
            endDate,
            customerEmail,
            folderId: folder.id,
            phase: "signed",
            createdAt,
            exp,
          },
          LINK_SECRET.value()
        );

        const signedContractUrl = `https://oahu-car-rentals.web.app/signedContract?t=${encodeURIComponent(
          signedContractToken
        )}`;

        // ✅ Create Admin Pickup Instructions link
        // This link will be sent to admin via Pub/Sub 3 days before checkin
        const adminPickupToken = encryptToken(
          {
            vin,
            startDate,
            endDate,
            customerEmail,
            folderId: folder.id,
            phase: "admin_pickup",
            createdAt,
            exp: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days expiration for admin links
          },
          LINK_SECRET.value()
        );

        const adminPickupInstructionsUrl = `https://oahu-car-rentals.web.app/admin/pickup-instructions?t=${encodeURIComponent(
          adminPickupToken
        )}`;

        // ✅ Create Admin Dropoff Instructions link
        // This link will be sent to admin via Pub/Sub 1 day before checkout
        const adminDropoffToken = encryptToken(
          {
            vin,
            startDate,
            endDate,
            customerEmail,
            folderId: folder.id,
            phase: "admin_dropoff",
            createdAt,
            exp: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days expiration for admin links
          },
          LINK_SECRET.value()
        );

        const adminDropoffInstructionsUrl = `https://oahu-car-rentals.web.app/admin/dropoff-instructions?t=${encodeURIComponent(
          adminDropoffToken
        )}`;

        const debug = String(process.env.DEBUG_MODE || "").toLowerCase() === "true";

        if (debug) {
          return res.status(200).json({
            ok: true,
            folderLink: folder.webViewLink,
            contractLink: contract.webViewLink,
            signedContractUrl,
            pickupInstructionsUrl: adminPickupInstructionsUrl,
            dropoffInstructionsUrl: adminDropoffInstructionsUrl,
            debugSignedContractEmail: {
              to: customerEmail,
              subject: "Upload signed contract",
              body: [
                "Thanks for renting with Oahu Car Rentals.",
                "",
                "Please upload a signed copy of your contract using this secure link:",
                signedContractUrl,
                "",
                "— Oahu Car Rentals",
              ].join("\n"),
            },
          });
        }

        // Send email to customer with signed contract link
        // Note: Mileage out link will be sent separately when admin sets pickup instructions
        try {
          await sendEmail({
            to: customerEmail,
            subject: "Upload Signed Contract - Oahu Car Rentals",
            text: [
              "Thanks for renting with Oahu Car Rentals.",
              "",
              "Please upload a signed copy of your contract using this secure link:",
              signedContractUrl,
              "",
              "— Oahu Car Rentals",
            ].join("\n"),
          });

          logger.info("Rental package email sent", { email: customerEmail });
        } catch (emailError) {
          // Log error but don't fail the request - package was still created
          logger.error("Failed to send rental package email", {
            email: customerEmail,
            error: emailError.message,
          });
        }

        return res.status(200).json({
          ok: true,
          folderLink: folder.webViewLink,
          contractLink: contract.webViewLink,
          signedContractUrl,
          pickupInstructionsUrl: adminPickupInstructionsUrl,
          dropoffInstructionsUrl: adminDropoffInstructionsUrl,
        });
      } catch (e) {
        logger.error("createRentalPackage failed", e);
        const status = e?.status || 500;
        if (!res.headersSent) {
          return res.status(status).json({
            ok: false,
            error: e?.message || "Internal Server Error",
          });
        }
      }
    })
);
