# Fixing OAuth `invalid_grant` Errors

## What This Fix Does

Instead of just catching OAuth errors, the code now:

1. **Validates tokens proactively** - Checks if the refresh token is valid before attempting any Google Drive operations
2. **Provides clear error messages** - Tells you exactly what's wrong and how to fix it
3. **Catches errors early** - Fails fast with helpful instructions instead of cryptic errors

## The Problem

The `invalid_grant` error means your Google OAuth refresh token is:
- Expired (refresh tokens can expire if unused for 6+ months)
- Revoked (you may have revoked access in Google account settings)
- Invalid (doesn't match your OAuth client credentials)

## How to Fix

### Step 1: Validate Your Current Token

Test if your token is valid:

```powershell
# Set your OAuth credentials
$env:OAUTH_CLIENT_ID = "your-client-id"
$env:OAUTH_CLIENT_SECRET = "your-client-secret"
$env:OAUTH_REDIRECT_URI = "your-redirect-uri"
$env:DRIVE_REFRESH_TOKEN = "your-refresh-token"

# Run the validation script
node scripts/validate-drive-oauth.js
```

This will tell you if your token is valid or needs to be regenerated.

### Step 2: Regenerate the Refresh Token

If validation fails, regenerate the token:

```powershell
# Set your OAuth client credentials (you need these from Google Cloud Console)
$env:GMAIL_CLIENT_ID = "your-client-id"
$env:GMAIL_CLIENT_SECRET = "your-client-secret"

# Run the token generation script
node scripts/get-gmail-refresh-token.cjs
```

This will:
1. Open your browser
2. Ask you to grant Google Drive access
3. Return a new refresh token in the terminal

### Step 3: Update Firebase Secrets

Copy the new refresh token and update it in Firebase Functions:

```powershell
# Using Firebase CLI
firebase functions:secrets:set DRIVE_REFRESH_TOKEN

# Or update via Firebase Console:
# Functions → Secrets → DRIVE_REFRESH_TOKEN → Edit
```

### Step 4: Verify the Fix

Run the validation script again to confirm:

```powershell
node scripts/validate-drive-oauth.js
```

You should see: `✅ All checks passed! Your OAuth credentials are valid.`

## What Changed in the Code

1. **Created `functions/src/common/oauth.js`** - Shared OAuth utility with automatic token validation
2. **Updated `createRentalPackage.js`** - Now uses the shared utility and validates tokens before use
3. **Created `scripts/validate-drive-oauth.js`** - Script to test OAuth credentials

## Benefits

- **Early detection** - Catches invalid tokens before they cause errors
- **Clear error messages** - Tells you exactly what's wrong
- **Actionable fixes** - Provides step-by-step instructions
- **Prevents production errors** - Validates tokens proactively

## Next Steps

Consider updating other functions (`submitMileageIn.js`, `submitMileageOut.js`, `submitSignedContract.js`) to use the shared `createOAuthClient` function from `common/oauth.js` for consistent error handling across all functions.
