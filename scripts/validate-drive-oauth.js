// scripts/validate-drive-oauth.js
// Script to validate Google Drive OAuth credentials
import { google } from "googleapis";

// For local testing, use environment variables
// For Firebase Functions, these would be secrets
const CLIENT_ID = process.env.OAUTH_CLIENT_ID || process.env.DRIVE_CLIENT_ID;
const CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET || process.env.DRIVE_CLIENT_SECRET;
const REDIRECT_URI = process.env.OAUTH_REDIRECT_URI || "http://localhost:5557/oauth2callback";
const REFRESH_TOKEN = process.env.DRIVE_REFRESH_TOKEN;

async function validateDriveOAuth() {
  console.log("Validating Google Drive OAuth credentials...\n");
  console.log("-".repeat(60));

  // Check required variables
  const missing = [];
  if (!CLIENT_ID) missing.push("OAUTH_CLIENT_ID or DRIVE_CLIENT_ID");
  if (!CLIENT_SECRET) missing.push("OAUTH_CLIENT_SECRET or DRIVE_CLIENT_SECRET");
  if (!REFRESH_TOKEN) missing.push("DRIVE_REFRESH_TOKEN");

  if (missing.length > 0) {
    console.error("❌ Missing required environment variables:");
    missing.forEach((v) => console.error("  -", v));
    console.error("\nSet these before running the script.");
    process.exit(1);
  }

  console.log("✓ All required variables are set");
  console.log("  CLIENT_ID:", CLIENT_ID.substring(0, 20) + "...");
  console.log("  CLIENT_SECRET:", CLIENT_SECRET.substring(0, 10) + "...");
  console.log("  REDIRECT_URI:", REDIRECT_URI);
  console.log("  REFRESH_TOKEN:", REFRESH_TOKEN.substring(0, 20) + "...");
  console.log();

  try {
    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
    
    // Set refresh token
    oauth2Client.setCredentials({
      refresh_token: REFRESH_TOKEN,
    });

    // Test 1: Try to refresh the access token
    console.log("1. Testing token refresh...");
    const { credentials } = await oauth2Client.refreshAccessToken();
    console.log("✓ Token refresh successful!");
    console.log("  Access token obtained:", credentials.access_token ? "Yes" : "No");
    console.log("  Token expires at:", credentials.expiry_date ? new Date(credentials.expiry_date).toISOString() : "Unknown");

    // Test 2: Try to access Drive API
    console.log("\n2. Testing Drive API access...");
    const drive = google.drive({ version: "v3", auth: oauth2Client });
    
    // Try to list files (limited to 1 to test access)
    const filesResponse = await drive.files.list({
      pageSize: 1,
      fields: "files(id, name, mimeType)",
    });
    
    console.log("✓ Drive API access successful!");
    console.log("  Can list files:", filesResponse.data.files ? "Yes" : "No");
    if (filesResponse.data.files && filesResponse.data.files.length > 0) {
      console.log("  Sample file:", filesResponse.data.files[0].name);
    }

    // Test 3: Try to get user info
    console.log("\n3. Testing user info access...");
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    console.log("✓ User info access successful!");
    console.log("  Email:", userInfo.data.email);
    console.log("  Name:", userInfo.data.name);

    console.log("\n" + "=".repeat(60));
    console.log("✅ All validation tests passed!");
    console.log("=".repeat(60));
    console.log("\nYour OAuth credentials are valid and working.");
    console.log("\nTo use in Firebase Functions, set these secrets:");
    console.log("  firebase functions:secrets:set OAUTH_CLIENT_ID");
    console.log("  firebase functions:secrets:set OAUTH_CLIENT_SECRET");
    console.log("  firebase functions:secrets:set OAUTH_REDIRECT_URI");
    console.log("  firebase functions:secrets:set DRIVE_REFRESH_TOKEN");
  } catch (error) {
    console.error("\n" + "=".repeat(60));
    console.error("❌ Validation failed");
    console.error("=".repeat(60));
    console.error("\nError:", error.message);
    
    if (error.code === 401) {
      console.error("\n⚠ Authentication failed (401)");
      console.error("Possible causes:");
      console.error("1. Refresh token is invalid or expired");
      console.error("2. Client ID or Client Secret is incorrect");
      console.error("3. OAuth app credentials have been revoked");
      console.error("\nSolutions:");
      console.error("1. Regenerate refresh token using get-drive-refresh-token.cjs");
      console.error("2. Verify OAuth credentials in Google Cloud Console");
      console.error("3. Check that redirect URI matches");
    } else if (error.code === 403) {
      console.error("\n⚠ Permission denied (403)");
      console.error("The OAuth token may not have the required scopes.");
      console.error("Make sure you requested Drive API scopes when generating the token.");
    } else {
      console.error("\nFull error:", error);
    }
    
    process.exit(1);
  }
}

validateDriveOAuth();
