// functions/src/common/oauth.js
import { google } from "googleapis";
import { logger } from "firebase-functions";
import { AppError, ErrorCodes } from "./errors.js";

/**
 * Creates an OAuth2 client with automatic token validation
 * Validates the refresh token before returning the client to catch issues early
 * 
 * @param {Object} params - OAuth parameters
 * @param {string} params.clientId - OAuth client ID
 * @param {string} params.clientSecret - OAuth client secret
 * @param {string} params.redirectUri - OAuth redirect URI
 * @param {string} params.refreshToken - OAuth refresh token
 * @returns {Promise<google.auth.OAuth2Client>} - Validated OAuth2 client
 * @throws {AppError} - If credentials are missing or refresh token is invalid
 */
export async function createOAuthClient({ clientId, clientSecret, redirectUri, refreshToken }) {
  // Validate all required parameters
  if (!clientId || !clientSecret || !redirectUri || !refreshToken) {
    throw new AppError(
      "OAuth credentials are missing. Please check all OAuth secrets are configured.",
      500,
      ErrorCodes.AUTHENTICATION_ERROR
    );
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  // Try to refresh the token to validate it's still valid
  // This catches invalid_grant errors early, before attempting Drive operations
  try {
    // This will attempt to get a new access token using the refresh token
    // If the refresh token is invalid, this will throw an error
    await oauth2Client.getAccessToken();
    logger.info("OAuth token validated successfully");
  } catch (tokenError) {
    const errorMessage = tokenError?.message || String(tokenError);
    
    // Check for specific OAuth errors
    if (errorMessage.includes("invalid_grant") || 
        errorMessage.includes("invalid_token") ||
        errorMessage.includes("unauthorized")) {
      logger.error("OAuth refresh token is invalid or expired", {
        error: errorMessage,
        hint: "The refresh token needs to be regenerated. Run: node scripts/get-gmail-refresh-token.cjs"
      });
      
      throw new AppError(
        "OAuth refresh token is invalid or expired. Please regenerate the refresh token using the setup script.",
        401,
        ErrorCodes.AUTHENTICATION_ERROR,
        {
          originalError: errorMessage,
          fixInstructions: "Run: node scripts/get-gmail-refresh-token.cjs to generate a new refresh token, then update the DRIVE_REFRESH_TOKEN secret in Firebase Functions"
        }
      );
    }
    
    // Re-throw other errors (network issues, etc.)
    logger.error("OAuth token validation failed", {
      error: errorMessage,
      name: tokenError?.name,
    });
    throw tokenError;
  }

  return oauth2Client;
}
