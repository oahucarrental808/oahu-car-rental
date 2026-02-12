// scripts/upload-to-google-sheets.js
// Script to upload data to Google Sheets
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

const SHEET_ID = process.env.SHEET_ID || process.env.TEST_SHEET_ID;
const SHEET_TAB = process.env.SHEET_TAB || "Incoming Requests";

if (!SHEET_ID) {
  console.error("Error: SHEET_ID environment variable is required");
  console.error("Usage: SHEET_ID=your-sheet-id node scripts/upload-to-google-sheets.js");
  process.exit(1);
}

/**
 * Upload a single row to Google Sheets
 * @param {Array} rowData - Array of values for the row
 * @param {string} range - Optional range (defaults to appending to end)
 */
export async function uploadRow(rowData, range = null) {
  try {
    const sheets = getSheetsClient();

    const request = {
      spreadsheetId: SHEET_ID,
      range: range || `${SHEET_TAB}!A1`,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [rowData] },
    };

    const response = await sheets.spreadsheets.values.append(request);
    
    return {
      success: true,
      updatedRange: response.data.updates?.updatedRange,
      updatedRows: response.data.updates?.updatedRows,
      updatedColumns: response.data.updates?.updatedColumns,
    };
  } catch (error) {
    console.error("Error uploading row:", error.message);
    throw error;
  }
}

/**
 * Upload multiple rows to Google Sheets
 * @param {Array<Array>} rowsData - Array of row arrays
 * @param {string} range - Optional range (defaults to appending to end)
 */
export async function uploadRows(rowsData, range = null) {
  try {
    const sheets = getSheetsClient();

    const request = {
      spreadsheetId: SHEET_ID,
      range: range || `${SHEET_TAB}!A1`,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: rowsData },
    };

    const response = await sheets.spreadsheets.values.append(request);
    
    return {
      success: true,
      updatedRange: response.data.updates?.updatedRange,
      updatedRows: response.data.updates?.updatedRows,
      updatedColumns: response.data.updates?.updatedColumns,
    };
  } catch (error) {
    console.error("Error uploading rows:", error.message);
    throw error;
  }
}

/**
 * Update a specific cell or range in Google Sheets
 * @param {string} range - Range to update (e.g., "A1" or "A1:B2")
 * @param {Array<Array>} values - Values to write
 */
export async function updateRange(range, values) {
  try {
    const sheets = getSheetsClient();

    const request = {
      spreadsheetId: SHEET_ID,
      range: `${SHEET_TAB}!${range}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values },
    };

    const response = await sheets.spreadsheets.values.update(request);
    
    return {
      success: true,
      updatedRange: response.data.updatedRange,
      updatedRows: response.data.updatedRows,
      updatedColumns: response.data.updatedColumns,
    };
  } catch (error) {
    console.error("Error updating range:", error.message);
    throw error;
  }
}

/**
 * Read data from Google Sheets
 * @param {string} range - Range to read (e.g., "A1:Z100")
 * @returns {Array<Array>} Array of rows
 */
export async function readRange(range) {
  try {
    const sheets = getSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_TAB}!${range}`,
    });

    return response.data.values || [];
  } catch (error) {
    console.error("Error reading range:", error.message);
    throw error;
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];
  
  if (command === "test") {
    console.log("Testing Google Sheets upload...\n");
    const testRow = [
      new Date().toISOString(),
      "TEST",
      "test@example.com",
      "2024-01-01",
      "2024-01-02",
      "Test Car",
      100,
      200,
      "Test upload - can be deleted",
    ];
    
    uploadRow(testRow)
      .then((result) => {
        console.log("✅ Upload successful!");
        console.log("Result:", result);
      })
      .catch((error) => {
        console.error("❌ Upload failed:", error.message);
        process.exit(1);
      });
  } else {
    console.log("Usage:");
    console.log("  node scripts/upload-to-google-sheets.js test");
    console.log("\nOr import the functions:");
    console.log("  import { uploadRow, uploadRows, updateRange, readRange } from './scripts/upload-to-google-sheets.js'");
  }
}
