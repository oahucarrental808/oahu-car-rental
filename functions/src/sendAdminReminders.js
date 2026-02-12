// functions/src/sendAdminReminders.js
import { onSchedule } from "firebase-functions/v2/scheduler";
import { defineSecret } from "firebase-functions/params";
import { logger } from "firebase-functions";
import { getFirestore } from "firebase-admin/firestore";
import { sendEmail } from "./common/email.js";

const ADMIN_EMAIL = defineSecret("ADMIN_EMAIL");
// Provider-specific secrets
const SMTP_EMAIL_GMAIL = defineSecret("SMTP_EMAIL_GMAIL");
const SMTP_PASSWORD_GMAIL = defineSecret("SMTP_PASSWORD_GMAIL");
const SMTP_EMAIL_OUTLOOK = defineSecret("SMTP_EMAIL_OUTLOOK");
const SMTP_PASSWORD_OUTLOOK = defineSecret("SMTP_PASSWORD_OUTLOOK");
// Legacy secrets (for backward compatibility)
const SMTP_EMAIL = defineSecret("SMTP_EMAIL");
const SMTP_PASSWORD = defineSecret("SMTP_PASSWORD");

/**
 * Converts a date string (YYYY-MM-DD) to a Date object at midnight in Hawaii time
 */
function parseHawaiiDate(dateStr) {
  // Hawaii is UTC-10, so we need to create a date at midnight Hawaii time
  // We'll parse the date and create it in UTC, then adjust
  const [year, month, day] = dateStr.split("-").map(Number);
  // Create date at midnight UTC, then subtract 10 hours to get Hawaii time
  // Actually, better approach: create date at 10:00 UTC which is midnight Hawaii
  const date = new Date(Date.UTC(year, month - 1, day, 10, 0, 0));
  return date;
}

/**
 * Gets the current date in Hawaii time (YYYY-MM-DD format)
 */
function getTodayHawaii() {
  const now = new Date();
  // Hawaii is UTC-10
  const hawaiiOffset = -10 * 60; // -10 hours in minutes
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const hawaiiTime = new Date(utc + hawaiiOffset * 60000);
  const year = hawaiiTime.getUTCFullYear();
  const month = String(hawaiiTime.getUTCMonth() + 1).padStart(2, "0");
  const day = String(hawaiiTime.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Calculates days between two dates (YYYY-MM-DD format)
 */
function daysBetween(dateStr1, dateStr2) {
  const date1 = parseHawaiiDate(dateStr1);
  const date2 = parseHawaiiDate(dateStr2);
  const diffTime = date2 - date1;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Helper function to send pickup reminder for a specific rental
 * Can be called immediately when rental is created if pickup is within 3 days
 * @param {Object} rentalData - Rental data object
 * @param {string} [adminEmailAddress] - Admin email address (optional, will use secret if not provided)
 */
export async function sendPickupReminderIfNeeded(rentalData, adminEmailAddress = null) {
  const { startDate, adminPickupInstructionsUrl, vin, customerEmail, endDate } = rentalData;
  
  if (!startDate || !adminPickupInstructionsUrl) {
    return false;
  }

  const today = getTodayHawaii();
  const daysUntilPickup = daysBetween(today, startDate);

  // Send if pickup is within 3 days and reminder hasn't been sent
  if (daysUntilPickup <= 3 && daysUntilPickup >= 0) {
    try {
      const adminEmail = adminEmailAddress || ADMIN_EMAIL.value();
      if (!adminEmail) {
        logger.warn("ADMIN_EMAIL not configured, cannot send pickup reminder");
        return false;
      }

      await sendEmail({
        to: adminEmail,
        subject: `Pickup Instructions Reminder: ${vin} - ${startDate}`,
        text: [
          "PICKUP INSTRUCTIONS REMINDER",
          "",
          `VIN: ${vin}`,
          `Pickup Date: ${startDate}`,
          `Dropoff Date: ${endDate || "N/A"}`,
          `Customer Email: ${customerEmail || "N/A"}`,
          "",
          daysUntilPickup === 0
            ? "Pickup is TODAY. Please complete pickup instructions:"
            : daysUntilPickup === 1
            ? "Pickup is TOMORROW. Please complete pickup instructions:"
            : `Pickup is in ${daysUntilPickup} days. Please complete pickup instructions:`,
          "",
          adminPickupInstructionsUrl,
          "",
          "— Oahu Car Rentals",
        ].join("\n"),
      });

      logger.info("Immediate pickup reminder sent", { vin, daysUntilPickup });
      return true;
    } catch (emailError) {
      logger.error("Failed to send immediate pickup reminder", {
        vin,
        error: emailError.message,
      });
      return false;
    }
  }

  return false;
}

/**
 * Scheduled function that runs daily at 8am Hawaii time (18:00 UTC)
 * Sends pickup reminders 3 days before pickup (or now if within 3 days)
 * Sends dropoff reminders 1 day before dropoff
 */
export const sendAdminReminders = onSchedule(
  {
    schedule: "0 18 * * *", // 18:00 UTC = 8:00 HST (Hawaii Standard Time, UTC-10)
    timeZone: "UTC",
    secrets: [
      ADMIN_EMAIL, 
      SMTP_EMAIL_GMAIL, 
      SMTP_PASSWORD_GMAIL, 
      SMTP_EMAIL_OUTLOOK, 
      SMTP_PASSWORD_OUTLOOK,
      SMTP_EMAIL, 
      SMTP_PASSWORD
    ],
  },
  async (event) => {
    try {
      const db = getFirestore();
      const today = getTodayHawaii();
      const adminEmailAddress = ADMIN_EMAIL.value();

      if (!adminEmailAddress) {
        logger.error("ADMIN_EMAIL secret not configured");
        return;
      }

      logger.info("Running admin reminders check", { today });

      // Get all rentals
      const rentalsSnapshot = await db.collection("rentals").get();

      if (rentalsSnapshot.empty) {
        logger.info("No rentals found in Firestore");
        return;
      }

      let pickupRemindersSent = 0;
      let dropoffRemindersSent = 0;

      for (const doc of rentalsSnapshot.docs) {
        const rental = doc.data();
        const { startDate, endDate, adminPickupInstructionsUrl, adminDropoffInstructionsUrl, pickupReminderSent, dropoffReminderSent, vin, customerEmail } = rental;

        if (!startDate || !endDate) {
          logger.warn("Rental missing dates", { rentalId: doc.id });
          continue;
        }

        // Check pickup reminder (3 days before, or now if within 3 days)
        const daysUntilPickup = daysBetween(today, startDate);
        if (daysUntilPickup <= 3 && daysUntilPickup >= 0 && !pickupReminderSent && adminPickupInstructionsUrl) {
          try {
            await sendEmail({
              to: adminEmailAddress,
              subject: `Pickup Instructions Reminder: ${vin} - ${startDate}`,
              text: [
                "PICKUP INSTRUCTIONS REMINDER",
                "",
                `VIN: ${vin}`,
                `Pickup Date: ${startDate}`,
                `Dropoff Date: ${endDate}`,
                `Customer Email: ${customerEmail || "N/A"}`,
                "",
                daysUntilPickup === 0
                  ? "Pickup is TODAY. Please complete pickup instructions:"
                  : daysUntilPickup === 1
                  ? "Pickup is TOMORROW. Please complete pickup instructions:"
                  : `Pickup is in ${daysUntilPickup} days. Please complete pickup instructions:`,
                "",
                adminPickupInstructionsUrl,
                "",
                "— Oahu Car Rentals",
              ].join("\n"),
            });

            // Mark reminder as sent
            await doc.ref.update({ pickupReminderSent: true, pickupReminderSentAt: new Date().toISOString() });
            pickupRemindersSent++;
            logger.info("Pickup reminder sent", { rentalId: doc.id, vin, daysUntilPickup });
          } catch (emailError) {
            logger.error("Failed to send pickup reminder", {
              rentalId: doc.id,
              vin,
              error: emailError.message,
            });
          }
        }

        // Check dropoff reminder (1 day before)
        const daysUntilDropoff = daysBetween(today, endDate);
        if (daysUntilDropoff === 1 && !dropoffReminderSent && adminDropoffInstructionsUrl) {
          try {
            await sendEmail({
              to: adminEmailAddress,
              subject: `Dropoff Instructions Reminder: ${vin} - ${endDate}`,
              text: [
                "DROPOFF INSTRUCTIONS REMINDER",
                "",
                `VIN: ${vin}`,
                `Pickup Date: ${startDate}`,
                `Dropoff Date: ${endDate} (TOMORROW)`,
                `Customer Email: ${customerEmail || "N/A"}`,
                "",
                "Dropoff is TOMORROW. Please complete dropoff instructions:",
                "",
                adminDropoffInstructionsUrl,
                "",
                "— Oahu Car Rentals",
              ].join("\n"),
            });

            // Mark reminder as sent
            await doc.ref.update({ dropoffReminderSent: true, dropoffReminderSentAt: new Date().toISOString() });
            dropoffRemindersSent++;
            logger.info("Dropoff reminder sent", { rentalId: doc.id, vin });
          } catch (emailError) {
            logger.error("Failed to send dropoff reminder", {
              rentalId: doc.id,
              vin,
              error: emailError.message,
            });
          }
        }
      }

      logger.info("Admin reminders check completed", {
        pickupRemindersSent,
        dropoffRemindersSent,
        totalRentals: rentalsSnapshot.size,
      });
    } catch (error) {
      logger.error("Failed to run admin reminders check", { error: error.message });
      throw error;
    }
  }
);
