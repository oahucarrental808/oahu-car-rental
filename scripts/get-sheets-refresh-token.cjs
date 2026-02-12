// scripts/get-sheets-refresh-token.cjs
// Script to get OAuth refresh token for Google Sheets API
const http = require("http");
const { google } = require("googleapis");
const { exec } = require("child_process");

const PORT = 5556; // Different port from Gmail script

const CLIENT_ID = process.env.SHEETS_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.SHEETS_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Error: Missing OAuth credentials");
  console.error("Set SHEETS_CLIENT_ID and SHEETS_CLIENT_SECRET (or GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET) env vars first.");
  console.error("\nYou can get these from:");
  console.error("1. Go to https://console.cloud.google.com/");
  console.error("2. Select your project");
  console.error("3. Go to APIs & Services > Credentials");
  console.error("4. Create OAuth 2.0 Client ID (or use existing)");
  console.error("5. Set authorized redirect URI to: http://localhost:" + PORT + "/oauth2callback");
  process.exit(1);
}

const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;
const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

// Scopes needed for Google Sheets and Drive
const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive",
];

const authUrl = oAuth2Client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent", // Force consent to get refresh token
  scope: SCOPES,
});

function openBrowser(url) {
  const cmd =
    process.platform === "win32"
      ? `start "" "${url}"`
      : process.platform === "darwin"
        ? `open "${url}"`
        : `xdg-open "${url}"`;
  exec(cmd);
}

const server = http.createServer(async (req, res) => {
  try {
    if (!req.url.startsWith("/oauth2callback")) {
      res.writeHead(302, { Location: authUrl });
      return res.end();
    }

    const url = new URL(req.url, `http://localhost:${PORT}`);
    const code = url.searchParams.get("code");
    if (!code) {
      res.end("No authorization code in callback. Please try again.");
      return;
    }

    const { tokens } = await oAuth2Client.getToken(code);

    res.end(`
      <html>
        <head><title>Success</title></head>
        <body style="font-family: Arial; padding: 40px; text-align: center;">
          <h1 style="color: green;">✅ Success!</h1>
          <p>Check your terminal for the refresh token.</p>
          <p>You can close this tab.</p>
        </body>
      </html>
    `);
    server.close();

    console.log("\n" + "=".repeat(60));
    console.log("OAUTH TOKENS RECEIVED");
    console.log("=".repeat(60));
    console.log("\nFull token object:");
    console.log(JSON.stringify(tokens, null, 2));
    
    console.log("\n" + "-".repeat(60));
    console.log("REFRESH TOKEN (save this!):");
    console.log("-".repeat(60));
    if (tokens.refresh_token) {
      console.log(tokens.refresh_token);
      console.log("\n✅ Refresh token obtained successfully!");
      console.log("\nSet this as your DRIVE_REFRESH_TOKEN secret in Firebase:");
      console.log("  firebase functions:secrets:set DRIVE_REFRESH_TOKEN");
    } else {
      console.log("❌ No refresh token received!");
      console.log("\nThis usually means:");
      console.log("1. You've already authorized this app before");
      console.log("2. The prompt=consent parameter didn't work");
      console.log("\nTry:");
      console.log("1. Revoke access at: https://myaccount.google.com/permissions");
      console.log("2. Run this script again");
    }
    console.log("\n" + "=".repeat(60));
  } catch (e) {
    console.error("\n❌ Error:", e.message);
    res.end(`
      <html>
        <head><title>Error</title></head>
        <body style="font-family: Arial; padding: 40px; text-align: center;">
          <h1 style="color: red;">❌ Error</h1>
          <p>${e.message}</p>
          <p>Check your terminal for details.</p>
        </body>
      </html>
    `);
    server.close();
  }
});

server.listen(PORT, () => {
  console.log("\n" + "=".repeat(60));
  console.log("GOOGLE SHEETS OAUTH SETUP");
  console.log("=".repeat(60));
  console.log("\nOpening browser for OAuth consent...");
  console.log("\nURL:", authUrl);
  console.log("\nWaiting for authorization...");
  console.log("(Make sure redirect URI is set to: http://localhost:" + PORT + "/oauth2callback)");
  console.log("\n" + "-".repeat(60));
  openBrowser(authUrl);
});
