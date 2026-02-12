// scripts/get-firebase-oauth-creds.js
// Script to help get OAuth credentials from Firebase/Google Cloud Console
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

async function getFirebaseOAuthCreds() {
  console.log("Getting OAuth credentials from Firebase/Google Cloud...\n");
  console.log("=".repeat(60));

  try {
    // Try to get Firebase project ID
    console.log("1. Checking Firebase project...");
    try {
      const { stdout: projectId } = await execAsync("firebase use");
      console.log("✓ Firebase project:", projectId.trim() || "Not set");
    } catch {
      console.log("⚠ Firebase CLI not configured or not in a Firebase project");
    }

    console.log("\n2. OAuth Credentials Setup Guide:");
    console.log("-".repeat(60));
    console.log("\nTo get OAuth credentials:");
    console.log("\n1. Go to Google Cloud Console:");
    console.log("   https://console.cloud.google.com/");
    console.log("\n2. Select your Firebase project (or create one)");
    console.log("\n3. Enable required APIs:");
    console.log("   - Go to 'APIs & Services' > 'Library'");
    console.log("   - Enable 'Google Sheets API'");
    console.log("   - Enable 'Google Drive API'");
    console.log("   - Enable 'Gmail API' (if using Gmail)");
    console.log("\n4. Create OAuth 2.0 credentials:");
    console.log("   - Go to 'APIs & Services' > 'Credentials'");
    console.log("   - Click 'Create Credentials' > 'OAuth client ID'");
    console.log("   - Application type: 'Web application'");
    console.log("   - Name: 'Oahu Car Rentals API' (or your choice)");
    console.log("   - Authorized redirect URIs:");
    console.log("     * http://localhost:5555/oauth2callback (for Gmail)");
    console.log("     * http://localhost:5556/oauth2callback (for Sheets)");
    console.log("     * http://localhost:5557/oauth2callback (for Drive)");
    console.log("\n5. After creating, you'll get:");
    console.log("   - Client ID");
    console.log("   - Client Secret");
    console.log("\n6. Set environment variables:");
    console.log("   export GOOGLE_CLIENT_ID='your-client-id'");
    console.log("   export GOOGLE_CLIENT_SECRET='your-client-secret'");
    console.log("\n   Or on Windows (PowerShell):");
    console.log("   $env:GOOGLE_CLIENT_ID='your-client-id'");
    console.log("   $env:GOOGLE_CLIENT_SECRET='your-client-secret'");
    console.log("\n7. Generate refresh tokens:");
    console.log("   node scripts/get-gmail-refresh-token.cjs");
    console.log("   node scripts/get-sheets-refresh-token.cjs");
    console.log("   node scripts/get-drive-refresh-token.cjs");
    console.log("\n8. Set Firebase secrets:");
    console.log("   firebase functions:secrets:set OAUTH_CLIENT_ID");
    console.log("   firebase functions:secrets:set OAUTH_CLIENT_SECRET");
    console.log("   firebase functions:secrets:set OAUTH_REDIRECT_URI");
    console.log("   firebase functions:secrets:set DRIVE_REFRESH_TOKEN");
    console.log("   firebase functions:secrets:set GMAIL_REFRESH_TOKEN");
    console.log("\n" + "=".repeat(60));
    console.log("\nFor more details, see: scripts/setup-oauth-for-sheets.md");
  } catch (error) {
    console.error("Error:", error.message);
  }
}

getFirebaseOAuthCreds();
