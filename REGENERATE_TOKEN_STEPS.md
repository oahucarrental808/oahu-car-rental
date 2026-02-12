# Steps to Fix OAuth invalid_grant Error

## The Problem
The error `invalid_grant` means the refresh token was generated with a redirect URI that doesn't match what's configured in Google Cloud Console.

## Solution: Regenerate Token with Correct Redirect URI

### Step 1: Verify Redirect URI in Google Cloud Console

1. Go to: https://console.cloud.google.com/apis/credentials
2. Find your OAuth 2.0 Client ID: `431070940574-blumci0ckunu19pmvgqh3rsbko432l7e`
3. Click on it to edit
4. Scroll to "Authorized redirect URIs"
5. **CRITICAL**: Ensure `http://localhost:5555/oauth2callback` is listed
6. If it's NOT there:
   - Click "+ ADD URI"
   - Enter: `http://localhost:5555/oauth2callback`
   - Click "SAVE"

### Step 2: Revoke Old Token (Optional but Recommended)

1. Go to: https://myaccount.google.com/permissions
2. Find "Oahu Car Rental" or your app name
3. Click "Remove access" to revoke the old token
4. This ensures a fresh token is generated

### Step 3: Regenerate Token

In PowerShell, run:

```powershell
# Get credentials from Firebase
$env:GMAIL_CLIENT_ID = (firebase functions:secrets:access OAUTH_CLIENT_ID).Trim()
$env:GMAIL_CLIENT_SECRET = (firebase functions:secrets:access OAUTH_CLIENT_SECRET).Trim()

# Generate new token
node scripts/get-gmail-refresh-token.cjs
```

**Important**: 
- When the browser opens, grant ALL permissions
- Make sure you're logged into the correct Google account
- The redirect URI in the browser URL should match `http://localhost:5555/oauth2callback`

### Step 4: Copy the New Token

Look for this in the terminal:
```
REFRESH TOKEN:
1//0xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Copy the entire token.

### Step 5: Update Firebase Secret

```powershell
# Method 1: Using echo (Windows PowerShell)
echo "YOUR_NEW_TOKEN_HERE" | firebase functions:secrets:set DRIVE_REFRESH_TOKEN

# Method 2: Interactive (recommended)
firebase functions:secrets:set DRIVE_REFRESH_TOKEN
# Then paste the token when prompted
```

### Step 6: Verify Token Works

```powershell
$env:OAUTH_CLIENT_ID = (firebase functions:secrets:access OAUTH_CLIENT_ID).Trim()
$env:OAUTH_CLIENT_SECRET = (firebase functions:secrets:access OAUTH_CLIENT_SECRET).Trim()
$env:OAUTH_REDIRECT_URI = (firebase functions:secrets:access OAUTH_REDIRECT_URI).Trim()
$env:DRIVE_REFRESH_TOKEN = (firebase functions:secrets:access DRIVE_REFRESH_TOKEN).Trim()

node scripts/validate-drive-oauth.js
```

You should see: `✅ All checks passed! Your OAuth credentials are valid.`

### Step 7: Redeploy Functions (if needed)

```powershell
firebase deploy --only functions:createRentalPackage
```

## Why This Happens

The `invalid_grant` error occurs when:
1. The redirect URI used to generate the token doesn't match what's in Google Cloud Console
2. The token was generated before the redirect URI was added to Google Cloud Console
3. The redirect URI was changed in Google Cloud Console after the token was generated

## Prevention

- Always verify the redirect URI is in Google Cloud Console BEFORE generating tokens
- Use the exact redirect URI from Firebase when generating tokens
- Don't change redirect URIs in Google Cloud Console without regenerating tokens
