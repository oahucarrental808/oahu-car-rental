# OAuth Token Expiration Guide

## Why OAuth Refresh Tokens Expire

Google OAuth refresh tokens can expire for several reasons:

### 1. **OAuth App in "Testing" Mode** ⚠️ MOST COMMON
- **Problem**: If your OAuth app is in "Testing" mode in Google Cloud Console, refresh tokens expire after **7 days**
- **Solution**: Publish your OAuth app or add test users
- **How to check**: Google Cloud Console → APIs & Services → OAuth consent screen
- **Status**: Check if it says "Testing" or "In production"

### 2. **Token Unused for 6+ Months**
- **Problem**: Google revokes refresh tokens that haven't been used for 6+ months
- **Solution**: Ensure your app uses the token regularly (your app should be fine if it's active)

### 3. **User Revoked Access**
- **Problem**: The user manually revoked access in their Google account settings
- **Solution**: Regenerate the token and ensure the user doesn't revoke it

### 4. **Too Many Refresh Tokens**
- **Problem**: Google limits the number of refresh tokens per user per OAuth app (usually 50)
- **Solution**: Revoke old tokens or use a single token consistently

### 5. **OAuth Credentials Changed**
- **Problem**: If CLIENT_ID or CLIENT_SECRET changed, old refresh tokens become invalid
- **Solution**: Regenerate tokens after credential changes

## Quick Fix: Regenerate Refresh Token

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

**Important**: Make sure to click "Allow" for all requested permissions!

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

## Prevent Future Expiration

### Option 1: Publish Your OAuth App (Recommended)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **OAuth consent screen**
3. If status is "Testing", click **PUBLISH APP**
4. Complete the verification process (may require app verification for sensitive scopes)

**Benefits**:
- Refresh tokens won't expire after 7 days
- Tokens remain valid indefinitely (unless revoked or unused for 6+ months)

### Option 2: Add Test Users (Quick Fix)

If you can't publish the app yet:

1. Go to **OAuth consent screen**
2. Scroll to **Test users**
3. Click **+ ADD USERS**
4. Add the Google account email that's being used for OAuth

**Note**: This only works for up to 100 test users and tokens still expire after 7 days, but it's a temporary solution.

### Option 3: Use Service Account (Alternative)

Instead of OAuth, you could use a Service Account:
- Service Account tokens don't expire
- No user interaction required
- Better for automated systems
- Requires sharing Google Drive folders with the service account email

## Troubleshooting

### "invalid_grant" Error
- The refresh token is expired or revoked
- Regenerate using the steps above

### "invalid_client" Error
- CLIENT_ID or CLIENT_SECRET is incorrect
- Verify in Firebase secrets: `firebase functions:secrets:access OAUTH_CLIENT_ID`

### No Refresh Token Returned
- Make sure `prompt: "consent"` is set (it is in the script)
- Try revoking access first: https://myaccount.google.com/permissions
- Then regenerate the token

### Token Works But Expires Quickly
- **Most likely cause**: OAuth app is in Testing mode
- **Solution**: Publish the app (see Option 1 above)

## Check Current Token Status

To check if your current token is valid:

```powershell
# Set environment variables
$env:OAUTH_CLIENT_ID = (firebase functions:secrets:access OAUTH_CLIENT_ID).Trim()
$env:OAUTH_CLIENT_SECRET = (firebase functions:secrets:access OAUTH_CLIENT_SECRET).Trim()
$env:OAUTH_REDIRECT_URI = (firebase functions:secrets:access OAUTH_REDIRECT_URI).Trim()
$env:DRIVE_REFRESH_TOKEN = (firebase functions:secrets:access DRIVE_REFRESH_TOKEN).Trim()

# Validate
node scripts/validate-drive-oauth.js
```

## Summary

**Most Common Issue**: OAuth app in Testing mode → tokens expire after 7 days
**Best Solution**: Publish your OAuth app in Google Cloud Console
**Quick Fix**: Regenerate token using `node scripts/get-gmail-refresh-token.cjs`
