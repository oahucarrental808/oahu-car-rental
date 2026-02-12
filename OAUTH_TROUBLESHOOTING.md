# OAuth Token Troubleshooting - createRentalPackage Failing

## Current Status
- ✅ Token updated in Firebase: `DRIVE_REFRESH_TOKEN`
- ✅ Redirect URI in Firebase: `http://localhost:5555/oauth2callback`
- ✅ Functions deployed
- ❌ Still getting OAuth error in `createRentalPackage`

## Critical Checks

### 1. Verify Redirect URI in Google Cloud Console

The redirect URI **MUST** be configured in Google Cloud Console:

1. Go to: https://console.cloud.google.com/apis/credentials
2. Find your OAuth 2.0 Client ID: `431070940574-blumci0ckunu19pmvgqh3rsbko432l7e`
3. Click on it to edit
4. Under "Authorized redirect URIs", verify `http://localhost:5555/oauth2callback` is listed
5. If it's NOT listed, add it and save

### 2. Regenerate Token with Exact Redirect URI

The token must be generated using the EXACT redirect URI from Firebase:

```powershell
# Set environment variables
$env:GMAIL_CLIENT_ID = (firebase functions:secrets:access OAUTH_CLIENT_ID).Trim()
$env:GMAIL_CLIENT_SECRET = (firebase functions:secrets:access OAUTH_CLIENT_SECRET).Trim()

# Generate new token
node scripts/get-gmail-refresh-token.cjs
```

**Important**: When the browser opens, make sure you grant ALL requested permissions.

### 3. Update Token in Firebase

After getting the new token:

```powershell
# Copy the refresh token from terminal output
# Then update Firebase:
echo "YOUR_NEW_TOKEN_HERE" | firebase functions:secrets:set DRIVE_REFRESH_TOKEN
```

### 4. Redeploy Functions

```powershell
firebase deploy --only functions
```

## Why This Happens

1. **Redirect URI Mismatch**: If the token was generated with a different redirect URI than what's in Firebase, it will fail
2. **Not Configured in Google Cloud**: The redirect URI must be in Google Cloud Console's authorized list
3. **OAuth App in Testing Mode**: Tokens expire after 7 days if app is in testing mode
4. **Token Generated Before Redirect URI Was Set**: Old tokens won't work with new redirect URIs

## Quick Test

Test the token locally before deploying:

```powershell
$env:OAUTH_CLIENT_ID = (firebase functions:secrets:access OAUTH_CLIENT_ID).Trim()
$env:OAUTH_CLIENT_SECRET = (firebase functions:secrets:access OAUTH_CLIENT_SECRET).Trim()
$env:OAUTH_REDIRECT_URI = (firebase functions:secrets:access OAUTH_REDIRECT_URI).Trim()
$env:DRIVE_REFRESH_TOKEN = (firebase functions:secrets:access DRIVE_REFRESH_TOKEN).Trim()

node scripts/validate-drive-oauth.js
```

If this passes but production fails, the issue is likely:
- Redirect URI not in Google Cloud Console
- Token generated with wrong redirect URI
- OAuth app needs to be published (if in testing mode)
