# Quick Fix: OAuth Refresh Token Error

## The Error You're Seeing

```
OAuth refresh token is invalid or expired. Please regenerate the refresh token using the setup script.
```

✅ **Good news:** Our proactive validation caught this early! The token needs to be regenerated.

## Quick Fix Steps

### Step 1: Set Environment Variables

In PowerShell, run:

```powershell
# Get credentials from Firebase
$env:GMAIL_CLIENT_ID = (firebase functions:secrets:access OAUTH_CLIENT_ID).Trim()
$env:GMAIL_CLIENT_SECRET = (firebase functions:secrets:access OAUTH_CLIENT_SECRET).Trim()
```

Or use the helper script:
```powershell
.\scripts\set-oauth-env.ps1
```

### Step 2: Generate New Refresh Token

```powershell
node scripts/get-gmail-refresh-token.cjs
```

This will:
1. Open your browser
2. Ask you to grant Google Drive and Gmail access
3. Show the new refresh token in the terminal

### Step 3: Copy the Refresh Token

Look for this in the terminal output:
```
REFRESH TOKEN:
1//0xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Copy the entire token (it's a long string starting with `1//0`).

### Step 4: Update Firebase Secret

```powershell
firebase functions:secrets:set DRIVE_REFRESH_TOKEN
```

When prompted, paste the new refresh token and press Enter.

### Step 5: Verify It Works

```powershell
# Set the new token for testing
$env:DRIVE_REFRESH_TOKEN = "your-new-refresh-token-here"

# Test it
node scripts/validate-drive-oauth.js
```

You should see: `✅ All checks passed! Your OAuth credentials are valid.`

## That's It!

The error should be resolved. The new token will be valid for 6+ months (or indefinitely if used regularly).
