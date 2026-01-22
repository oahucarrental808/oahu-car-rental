import { initializeApp } from "firebase-admin/app";
initializeApp();

export { submitRequest } from "./src/submitRequest.js";
export { createRentalPackage } from "./src/createRentalPackage.js";
export { createCustomerInfoLink } from "./src/createCustomerInfoLink.js";
export { decodeCustomerInfoLink } from "./src/decodeCustomerInfoLink.js";

export { decodeMileageLink } from "./src/decodeMileageLink.js";
export { submitMileageOut } from "./src/submitMileageOut.js";
export { submitMileageIn } from "./src/submitMileageIn.js";

// Admin instruction pages -> generate customer links
export { decodeAdminInstructionLink } from "./src/decodeAdminInstructionLink.js";
export { createPickupMileageLink } from "./src/createPickupMileageLink.js";
export { createDropoffMileageLink } from "./src/createDropoffMileageLink.js";
export { submitSignedContract } from "./src/submitSignedContract.js";
import { google } from "googleapis";

// from secrets
const CLIENT_ID = process.env.OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET;
const REDIRECT_URI = process.env.OAUTH_REDIRECT_URI;

function makeOAuthClient() {
  return new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
}

export async function oauthStart(req, res) {
  const oauth2 = makeOAuthClient();

  const url = oauth2.generateAuthUrl({
    access_type: "offline",      // required to get refresh_token
    prompt: "consent",           // forces refresh_token issuance
    scope: ["https://www.googleapis.com/auth/drive"],
  });

  res.redirect(url);
}

export async function oauthCallback(req, res) {
  const code = req.query.code;
  if (!code) return res.status(400).send("Missing code");

  const oauth2 = makeOAuthClient();
  const { tokens } = await oauth2.getToken(code);

  // tokens.refresh_token appears on first consent (or with prompt:consent)
  res
    .status(200)
    .send(
      `Got tokens. refresh_token:\n\n${tokens.refresh_token}\n\nCopy this into firebase secrets as DRIVE_REFRESH_TOKEN.`
    );
}