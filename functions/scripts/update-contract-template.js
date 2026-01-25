// One-time script to add "for Oahu Car Rentals" to the BLANK CONTRACT.pdf template
// Run with: node functions/scripts/update-contract-template.js (from root)
// Or: npm run update-contract (from functions directory)
// Or with custom coordinates: node scripts/update-contract-template.js <x> <y>

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function updateContractTemplate() {
  try {
    // Try to find the PDF - check relative to script location first, then try root
    let pdfPath = path.join(__dirname, "..", "assets", "BLANK CONTRACT.pdf");
    
    // If not found, try from root directory (if script is in functions/scripts/)
    try {
      await fs.access(pdfPath);
    } catch {
      // Try alternative path from root
      const rootPath = path.join(__dirname, "..", "..", "functions", "assets", "BLANK CONTRACT.pdf");
      try {
        await fs.access(rootPath);
        pdfPath = rootPath;
      } catch {
        throw new Error(`Could not find BLANK CONTRACT.pdf. Tried:\n  - ${pdfPath}\n  - ${rootPath}`);
      }
    }
    
    // Create/use backup of original to avoid duplicate text
    const backupPath = path.join(path.dirname(pdfPath), "BLANK CONTRACT.original.pdf");
    let originalBytes;
    
    try {
      // Try to use existing backup
      originalBytes = await fs.readFile(backupPath);
      console.log("📦 Using backup of original PDF to avoid duplicates...");
    } catch {
      // No backup exists, create one from current file
      console.log("📦 Creating backup of original PDF...");
      const currentBytes = await fs.readFile(pdfPath);
      await fs.writeFile(backupPath, currentBytes);
      originalBytes = currentBytes;
      console.log("✅ Backup created at:", backupPath);
    }
    
    console.log("Loading PDF template from:", pdfPath);
    
    // Always start from the original backup to avoid duplicate text
    const pdf = await PDFDocument.load(originalBytes);
    const page = pdf.getPages()[0];
    
    // Get page dimensions
    const { width, height } = page.getSize();
    console.log(`Page dimensions: ${width} x ${height} points`);
    
    // New complete title text
    const newTitle = "US Choice Auto Rental Systems Rental Contract for Oahu Car Rentals";
    
    // Title position - typically centered or left-aligned at top
    // Adjust these if the title position is different
    let titleX = 20; // Horizontal position (left-aligned, adjust as needed)
    let titleY = 720; // Vertical position near top (adjust as needed)
    const titleFontSize = 12; // Title font size (slightly larger than body text)
    
    // Title area dimensions for covering old text
    // Adjust width and height to cover the entire old title area
    const titleWidth = 300; // Width of rectangle to cover old title
    const titleHeight = 160; // Height of rectangle to cover old title
    
    // Check if coordinates are provided via command line
    const args = process.argv.slice(2);
    if (args.length >= 2) {
      titleX = parseFloat(args[0]);
      titleY = parseFloat(args[1]);
      console.log(`Using title coordinates from command line: (${titleX}, ${titleY})`);
    }
    
    // Validate coordinates are within page bounds
    if (titleX < 0 || titleX > width) {
      console.warn(`⚠️  Warning: x coordinate (${titleX}) is outside page width (0-${width}). Using default: 50`);
      titleX = 50;
    }
    if (titleY < 0 || titleY > height) {
      console.warn(`⚠️  Warning: y coordinate (${titleY}) is outside page height (0-${height}). Using default: 780`);
      titleY = 780;
    }
    
    console.log(`Replacing title with: "${newTitle}"`);
    console.log(`Title position: (${titleX}, ${titleY})`);
    
    // Embed font (using same font as the rest of the contract)
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    
    // First, draw a white rectangle to cover the old title
    // This will "erase" the existing title text
    page.drawRectangle({
      x: titleX,
      y: titleY-10, // Adjust y to cover the text area
      width: titleWidth,
      height: titleHeight,
      color: rgb(1, 1, 1), // White
    });
    
    console.log(`Covered old title area with white rectangle at (${titleX}, ${titleY - titleHeight}), size ${titleWidth}x${titleHeight}`);
    
    // Now draw the new complete title
    page.drawText(newTitle, {
      x: titleX,
      y: titleY,
      size: titleFontSize,
      font,
    });
    
    // Save the updated PDF
    const updatedPdfBytes = await pdf.save();
    await fs.writeFile(pdfPath, updatedPdfBytes);
    
    console.log("✅ Successfully updated BLANK CONTRACT.pdf");
    console.log(`   Replaced title with: "${newTitle}"`);
    console.log(`   Title position: (${titleX}, ${titleY})`);
    console.log("\n💡 Tip: To adjust title position, either:");
    console.log("   1. Edit titleX and titleY default values in this script (around line 65-66)");
    console.log("   2. Or pass coordinates as arguments: node scripts/update-contract-template.js <x> <y>");
    console.log(`   (Page bounds: 0-${width} width, 0-${height} height)`);
    console.log("\n💡 If the white rectangle doesn't fully cover the old title, adjust titleWidth and titleHeight (around line 70-71)");
    
  } catch (error) {
    console.error("❌ Error updating contract template:", error);
    process.exit(1);
  }
}

updateContractTemplate();
