// scripts/generate-sheets.js
// Script to generate/initialize Google Sheets structure
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

const SHEET_ID = process.env.SHEET_ID;
const SHEET_NAME = process.env.SHEET_NAME || "Oahu Car Rentals";

if (!SHEET_ID) {
  console.log("No SHEET_ID provided. This script will show you how to create a new sheet.");
  console.log("To use an existing sheet, set SHEET_ID environment variable.\n");
}

/**
 * Creates a new Google Sheet with the standard structure
 */
async function createNewSheet() {
  try {
    const sheets = getSheetsClient();
    
    console.log("Creating new Google Sheet...");
    
    const spreadsheet = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: SHEET_NAME,
        },
        sheets: [
          {
            properties: {
              title: "Incoming Requests",
              gridProperties: {
                rowCount: 1000,
                columnCount: 20,
              },
            },
          },
          {
            properties: {
              title: "Reviews",
              gridProperties: {
                rowCount: 1000,
                columnCount: 10,
              },
            },
          },
        ],
      },
    });

    const sheetId = spreadsheet.data.spreadsheetId;
    const sheetUrl = spreadsheet.data.spreadsheetUrl;

    console.log("\n✅ Sheet created successfully!");
    console.log("Sheet ID:", sheetId);
    console.log("Sheet URL:", sheetUrl);
    console.log("\nSet this as your SHEET_ID:");
    console.log(`  export SHEET_ID="${sheetId}"`);

    // Add headers to the first sheet
    await initializeSheetHeaders(sheetId, "Incoming Requests");
    
    return sheetId;
  } catch (error) {
    console.error("Error creating sheet:", error.message);
    throw error;
  }
}

/**
 * Initializes headers for a sheet tab
 */
async function initializeSheetHeaders(sheetId, tabName) {
  try {
    const sheets = getSheetsClient();

    const headers = [
      [
        "ID",
        "Created At",
        "Name",
        "Email",
        "Start Date",
        "End Date",
        "Car Types",
        "Min Price",
        "Max Price",
        "Notes",
      ],
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `${tabName}!A1:J1`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: headers,
      },
    });

    // Format header row
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: 0, // First sheet
                startRowIndex: 0,
                endRowIndex: 1,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: {
                    red: 0.2,
                    green: 0.4,
                    blue: 0.8,
                  },
                  textFormat: {
                    foregroundColor: {
                      red: 1,
                      green: 1,
                      blue: 1,
                    },
                    bold: true,
                  },
                },
              },
              fields: "userEnteredFormat(backgroundColor,textFormat)",
            },
          },
        ],
      },
    });

    console.log("✓ Headers initialized for", tabName);
  } catch (error) {
    console.error("Error initializing headers:", error.message);
    throw error;
  }
}

/**
 * Initializes an existing sheet with headers
 */
async function initializeExistingSheet(sheetId) {
  try {
    console.log("Initializing existing sheet:", sheetId);
    
    // Check if sheet exists and get its info
    const sheets = getSheetsClient();
    const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
    
    console.log("Sheet title:", meta.data.properties?.title);
    console.log("Tabs:", meta.data.sheets?.map((s) => s.properties?.title).join(", "));

    // Initialize headers for "Incoming Requests" tab if it exists
    const incomingTab = meta.data.sheets?.find(
      (s) => s.properties?.title === "Incoming Requests"
    );
    
    if (incomingTab) {
      await initializeSheetHeaders(sheetId, "Incoming Requests");
      console.log("✓ Initialized 'Incoming Requests' tab");
    } else {
      console.log("⚠ 'Incoming Requests' tab not found. Creating it...");
      // Could add logic to create the tab here
    }

    // Initialize headers for "Reviews" tab if it exists
    const reviewsTab = meta.data.sheets?.find(
      (s) => s.properties?.title === "Reviews"
    );
    
    if (reviewsTab) {
      const reviewHeaders = [["VIN", "Start Date", "End Date", "Customer Email", "Rating", "Review"]];
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: "Reviews!A1:F1",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: reviewHeaders },
      });
      console.log("✓ Initialized 'Reviews' tab");
    }

    console.log("\n✅ Sheet initialization complete!");
  } catch (error) {
    console.error("Error initializing sheet:", error.message);
    throw error;
  }
}

// CLI usage
const command = process.argv[2];

if (command === "create") {
  createNewSheet()
    .then(() => {
      console.log("\n✅ Done!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Failed:", error.message);
      process.exit(1);
    });
} else if (command === "init") {
  if (!SHEET_ID) {
    console.error("Error: SHEET_ID is required for init command");
    console.error("Usage: SHEET_ID=your-sheet-id node scripts/generate-sheets.js init");
    process.exit(1);
  }
  initializeExistingSheet(SHEET_ID)
    .then(() => {
      console.log("\n✅ Done!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Failed:", error.message);
      process.exit(1);
    });
} else {
  console.log("Google Sheets Generation Script");
  console.log("=".repeat(60));
  console.log("\nUsage:");
  console.log("  node scripts/generate-sheets.js create  # Create a new sheet");
  console.log("  node scripts/generate-sheets.js init    # Initialize existing sheet (requires SHEET_ID)");
  console.log("\nExamples:");
  console.log("  node scripts/generate-sheets.js create");
  console.log("  SHEET_ID=your-sheet-id node scripts/generate-sheets.js init");
}
