// scripts/test-sheet-access.js
// Script to test Google Sheets API access
import { google } from "googleapis";

function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive",
    ],
  });
  return google.sheets({ version: "v4", auth });
}

const SHEET_ID = process.env.TEST_SHEET_ID || "1jTbHW-j-agj00ovF4amuPpPy7ksFAirSoATWLDntR-c";
const SHEET_TAB = process.env.TEST_SHEET_TAB || "Incoming Requests";

async function testSheetAccess() {
  console.log("Testing Google Sheets API access...\n");
  console.log("Sheet ID:", SHEET_ID);
  console.log("Sheet Tab:", SHEET_TAB);
  console.log("-".repeat(60));

  try {
    const sheets = getSheetsClient();

    // Test 1: Get spreadsheet metadata
    console.log("\n1. Testing spreadsheet metadata access...");
    const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
    console.log("✓ Success!");
    console.log("  Title:", meta.data.properties?.title);
    console.log("  Spreadsheet URL:", meta.data.spreadsheetUrl);

    // Test 2: Read a small range
    console.log("\n2. Testing read access...");
    const readResult = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_TAB}!A1:Z1`, // Read first row
    });
    console.log("✓ Success!");
    console.log("  First row columns:", readResult.data.values?.[0]?.length || 0);
    if (readResult.data.values?.[0]) {
      console.log("  Headers:", readResult.data.values[0].slice(0, 5).join(", "), "...");
    }

    // Test 3: Write a test row (optional, can be disabled)
    if (process.env.TEST_WRITE === "true") {
      console.log("\n3. Testing write access...");
      const testRow = [
        new Date().toISOString(),
        "TEST",
        "test@example.com",
        "2024-01-01",
        "2024-01-02",
        "Test Car",
        100,
        200,
        "This is a test row - can be deleted",
      ];

      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: `${SHEET_TAB}!A1`,
        valueInputOption: "USER_ENTERED",
        insertDataOption: "INSERT_ROWS",
        requestBody: { values: [testRow] },
      });
      console.log("✓ Success! Test row written.");
      console.log("  Note: You may want to delete this test row from the sheet.");
    } else {
      console.log("\n3. Skipping write test (set TEST_WRITE=true to enable)");
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ All tests passed! Google Sheets API is working correctly.");
    console.log("=".repeat(60));
  } catch (error) {
    console.error("\n" + "=".repeat(60));
    console.error("❌ Error testing Google Sheets API");
    console.error("=".repeat(60));
    console.error("\nError details:");
    console.error("  Message:", error.message);
    
    if (error.code === 403) {
      console.error("\n⚠ Permission denied (403)");
      console.error("Possible causes:");
      console.error("1. Service account doesn't have access to the sheet");
      console.error("2. Sheet sharing settings need to be updated");
      console.error("3. OAuth token expired or invalid");
      console.error("\nSolutions:");
      console.error("1. Share the Google Sheet with the service account email");
      console.error("2. Check Firebase Functions service account permissions");
      console.error("3. Regenerate OAuth tokens if using OAuth");
    } else if (error.code === 404) {
      console.error("\n⚠ Sheet not found (404)");
      console.error("Check that SHEET_ID is correct:", SHEET_ID);
    } else {
      console.error("\nFull error:", error);
    }
    
    process.exit(1);
  }
}

testSheetAccess();
