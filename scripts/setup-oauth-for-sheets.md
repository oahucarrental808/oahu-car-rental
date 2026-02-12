# Google Sheets OAuth Setup Guide

This guide will help you set up OAuth authentication for Google Sheets and Drive APIs.

## Prerequisites

1. A Google Cloud Project (or Firebase project)
2. Node.js installed
3. Firebase CLI installed (optional, for setting secrets)

## Step 1: Enable Required APIs

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** > **Library**
4. Enable the following APIs:
   - **Google Sheets API**
   - **Google Drive API**
   - **Gmail API** (if using Gmail integration)

## Step 2: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. If prompted, configure the OAuth consent screen first:
   - User Type: **External** (for testing) or **Internal** (for Google Workspace)
   - App name: "Oahu Car Rentals API" (or your choice)
   - User support email: Your email
   - Developer contact: Your email
   - Add scopes:
     - `https://www.googleapis.com/auth/spreadsheets`
     - `https://www.googleapis.com/auth/drive`
     - `https://www.googleapis.com/auth/gmail.send` (if using Gmail)
   - Save and continue through the rest of the setup
4. Create OAuth Client ID:
   - Application type: **Web application**
   - Name: "Oahu Car Rentals API"
   - Authorized redirect URIs (add all three):
     - `http://localhost:5555/oauth2callback` (for Gmail)
     - `http://localhost:5556/oauth2callback` (for Sheets)
     - `http://localhost:5557/oauth2callback` (for Drive)
   - Click **Create**
5. Copy the **Client ID** and **Client Secret** (you'll need these)

## Step 3: Set Environment Variables

### On Windows (PowerShell):
```powershell
$env:GOOGLE_CLIENT_ID="your-client-id-here"
$env:GOOGLE_CLIENT_SECRET="your-client-secret-here"
```

Or use the provided script:
```powershell
.\scripts\set-oauth-env.ps1 -ClientId "your-id" -ClientSecret "your-secret"
```

### On macOS/Linux:
```bash
export GOOGLE_CLIENT_ID="your-client-id-here"
export GOOGLE_CLIENT_SECRET="your-client-secret-here"
```

## Step 4: Generate Refresh Tokens

### For Google Sheets:
```bash
node scripts/get-sheets-refresh-token.cjs
```

### For Google Drive:
```bash
node scripts/get-drive-refresh-token.cjs
```

### For Gmail:
```bash
node scripts/get-gmail-refresh-token.cjs
```

Each script will:
1. Open your browser
2. Ask you to sign in and grant permissions
3. Display the refresh token in the terminal
4. **Save the refresh token** - you'll need it for Firebase secrets

## Step 5: Set Firebase Secrets

Set the OAuth credentials as Firebase Functions secrets:

```bash
# OAuth credentials (same for all services)
firebase functions:secrets:set OAUTH_CLIENT_ID
firebase functions:secrets:set OAUTH_CLIENT_SECRET
firebase functions:secrets:set OAUTH_REDIRECT_URI

# Service-specific refresh tokens
firebase functions:secrets:set DRIVE_REFRESH_TOKEN
firebase functions:secrets:set GMAIL_REFRESH_TOKEN
```

When prompted, paste the values you copied earlier.

## Step 6: Verify Setup

### Test Sheets Access:
```bash
node scripts/test-sheet-access.js
```

### Validate Drive OAuth:
```bash
node scripts/validate-drive-oauth.js
```

## Troubleshooting

### "No refresh token received"
- You may have already authorized the app
- Revoke access at: https://myaccount.google.com/permissions
- Run the script again

### "Permission denied (403)"
- Make sure the service account or OAuth user has access to the Google Sheet
- Share the sheet with the email address shown in the error
- Check that the required APIs are enabled

### "Invalid grant (401)"
- Refresh token may have expired
- Regenerate the refresh token
- Make sure you're using the correct client ID/secret

### Token Expiration
Refresh tokens can expire if:
- The user revokes access
- The app is in testing mode and 7 days have passed
- The token hasn't been used in 6 months

To fix: Regenerate the refresh token using the scripts.

## Security Notes

- **Never commit** OAuth credentials or refresh tokens to git
- Use Firebase Secrets for production
- Keep your Client Secret secure
- Regularly rotate refresh tokens if possible
- Use environment variables only for local development

## Next Steps

After setting up OAuth:
1. Test the integration with `test-sheet-access.js`
2. Deploy your Firebase Functions
3. Monitor the Firebase Functions logs for any OAuth errors
4. Set up error alerts for authentication failures

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Sheets API Documentation](https://developers.google.com/sheets/api)
- [Google Drive API Documentation](https://developers.google.com/drive/api)
- [Firebase Functions Secrets](https://firebase.google.com/docs/functions/config-env)
