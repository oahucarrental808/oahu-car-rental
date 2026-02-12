# All OAuth Token Refresh Methods - Complete History

This document catalogs **all the different ways** we've attempted to refresh/regenerate OAuth tokens throughout the project's development.

---

## Summary

We've tried **6 different methods** to refresh OAuth tokens, with **2 main scripts** and **4 different redirect URI approaches**.

---

## Method 1: Localhost Redirect URI (Primary Method)

### Script: `get-gmail-refresh-token.cjs`

**How it works:**
- Uses `http://localhost:5555/oauth2callback` as redirect URI
- Creates a local HTTP server on port 5555
- Opens browser for OAuth consent
- Automatically captures authorization code from callback
- Exchanges code for refresh token

**Usage:**
```powershell
# Set environment variables
$env:GMAIL_CLIENT_ID = (firebase functions:secrets:access OAUTH_CLIENT_ID).Trim()
$env:GMAIL_CLIENT_SECRET = (firebase functions:secrets:access OAUTH_CLIENT_SECRET).Trim()
$env:OAUTH_REDIRECT_URI = "http://localhost:5555/oauth2callback"

# Run script
node scripts/get-gmail-refresh-token.cjs
```

**Pros:**
- ✅ Fully automated (no manual code copying)
- ✅ Works well for local development
- ✅ No manual steps required

**Cons:**
- ⚠️ Requires localhost server to be accessible
- ⚠️ Redirect URI must be configured in Google Cloud Console

**Status:** ✅ **Currently Recommended**

---

## Method 2: Out-of-Band (OOB) Redirect URI

### Script: `get-gmail-refresh-token.cjs` (with OOB mode)

**How it works:**
- Uses `urn:ietf:wg:oauth:2.0:oob` as redirect URI
- Opens browser for OAuth consent
- Browser shows authorization code (user must copy manually)
- Requires separate script to exchange code for token

**Usage:**
```powershell
# Set environment variables
$env:GMAIL_CLIENT_ID = (firebase functions:secrets:access OAUTH_CLIENT_ID).Trim()
$env:GMAIL_CLIENT_SECRET = (firebase functions:secrets:access OAUTH_CLIENT_SECRET).Trim()
$env:OAUTH_REDIRECT_URI = "urn:ietf:wg:oauth:2.0:oob"

# Run script (opens browser, shows code)
node scripts/get-gmail-refresh-token.cjs

# Copy code from browser, then exchange:
node scripts/exchange-code-for-token.js <authorization-code>
```

**Pros:**
- ✅ Works for server-side applications
- ✅ No localhost server needed
- ✅ Standard OAuth 2.0 out-of-band flow

**Cons:**
- ⚠️ Requires manual code copying (two-step process)
- ⚠️ OOB redirect URI must be configured in Google Cloud Console
- ⚠️ Less user-friendly

**Status:** ✅ **Available as Alternative**

---

## Method 3: Exchange Code Script (Two-Step Process)

### Script: `exchange-code-for-token.js`

**How it works:**
- Used in conjunction with OOB method
- Takes authorization code as command-line argument
- Retrieves OAuth credentials from Firebase automatically
- Exchanges code for refresh token

**Usage:**
```bash
# After getting authorization code from browser (OOB method)
node scripts/exchange-code-for-token.js <authorization-code>
```

**Pros:**
- ✅ Automatically retrieves credentials from Firebase
- ✅ Provides helpful error messages
- ✅ Shows command to update Firebase secret

**Cons:**
- ⚠️ Only works with OOB method
- ⚠️ Requires manual code copying

**Status:** ✅ **Used with Method 2**

---

## Method 4: Helper Script for Environment Setup

### Script: `set-oauth-env.ps1`

**How it works:**
- PowerShell script that retrieves OAuth credentials from Firebase
- Sets environment variables automatically
- Prepares environment for token generation scripts

**Usage:**
```powershell
.\scripts\set-oauth-env.ps1
# Then run:
node scripts/get-gmail-refresh-token.cjs
```

**Pros:**
- ✅ Automates credential retrieval
- ✅ Reduces manual steps
- ✅ Prevents typos

**Cons:**
- ⚠️ Windows PowerShell only
- ⚠️ Still requires running token generation script

**Status:** ✅ **Convenience Helper**

---

## Method 5: Google Sheets Token Script (Alternative)

### Script: `get-sheets-refresh-token.cjs`

**How it works:**
- Similar to `get-gmail-refresh-token.cjs`
- Specifically for Google Sheets API
- Uses same localhost redirect URI approach
- Includes Sheets-specific scopes

**Usage:**
```powershell
$env:GMAIL_CLIENT_ID = "..."
$env:GMAIL_CLIENT_SECRET = "..."
node scripts/get-sheets-refresh-token.cjs
```

**Pros:**
- ✅ Sheets-specific scopes included
- ✅ Same automated flow as Method 1

**Cons:**
- ⚠️ Separate script (could be unified)
- ⚠️ Similar to main script but for different use case

**Status:** ✅ **For Sheets-Specific Tokens**

---

## Method 6: Diagnostic Testing (Validation Methods)

### Scripts: Multiple validation/diagnostic scripts

**Scripts:**
1. `validate-drive-oauth.js` - Validates existing token
2. `test-oauth-token.js` - Tests token with Firebase secrets
3. `diagnose-oauth-issue.js` - Tests multiple redirect URI options
4. `test-drive-upload.js` - Tests token with actual Drive API call

**How they work:**
- Test existing tokens without regenerating
- Try multiple redirect URI options to find what works
- Validate token before it causes errors in production

**Usage:**
```powershell
# Validate token
$env:OAUTH_CLIENT_ID = "..."
$env:OAUTH_CLIENT_SECRET = "..."
$env:OAUTH_REDIRECT_URI = "..."
$env:DRIVE_REFRESH_TOKEN = "..."
node scripts/validate-drive-oauth.js

# Diagnose issues (tries multiple redirect URIs)
node scripts/diagnose-oauth-issue.js
```

**What they test:**
- ✅ Exact Firebase redirect URI
- ✅ `postmessage` redirect URI (server-side)
- ✅ `urn:ietf:wg:oauth:2.0:oob` redirect URI (legacy)
- ✅ No explicit redirect URI (library default)

**Pros:**
- ✅ Helps diagnose issues without regenerating
- ✅ Tests multiple redirect URI options
- ✅ Provides clear error messages

**Cons:**
- ⚠️ Doesn't generate new tokens (only validates)
- ⚠️ Requires existing token to test

**Status:** ✅ **For Troubleshooting**

---

## Redirect URI Options Tried

### 1. `http://localhost:5555/oauth2callback` ✅ **Primary**
- **Used in:** Method 1 (localhost server)
- **Status:** Currently recommended
- **Requires:** Local server running, URI in Google Cloud Console

### 2. `urn:ietf:wg:oauth:2.0:oob` ✅ **Alternative**
- **Used in:** Method 2 (OOB flow)
- **Status:** Available for server-side apps
- **Requires:** URI in Google Cloud Console, manual code copying

### 3. `postmessage` ⚠️ **Tested but not used**
- **Tested in:** `diagnose-oauth-issue.js`
- **Status:** Works for server-side, but not our primary method
- **Note:** Google accepts this for refresh token usage

### 4. No explicit redirect URI ⚠️ **Tested but not used**
- **Tested in:** `diagnose-oauth-issue.js`
- **Status:** Library default, but not reliable for our use case

---

## Token Update Methods

### Method A: Firebase CLI (Interactive)
```bash
firebase functions:secrets:set DRIVE_REFRESH_TOKEN
# Paste token when prompted
```

### Method B: Firebase CLI (Echo)
```bash
echo "YOUR_TOKEN_HERE" | firebase functions:secrets:set DRIVE_REFRESH_TOKEN
```

### Method C: Firebase Console
- Go to Firebase Console → Functions → Secrets
- Edit `DRIVE_REFRESH_TOKEN`
- Paste new value

**Important:** After updating token, **always redeploy functions:**
```bash
firebase deploy --only functions
```

---

## Common Issues & Solutions

### Issue 1: `invalid_grant` Error

**Causes:**
- Redirect URI mismatch
- Token expired (7 days if app in Testing mode)
- Token revoked
- Client ID/Secret mismatch

**Solutions Tried:**
1. ✅ Verify redirect URI in Google Cloud Console
2. ✅ Regenerate token with exact redirect URI from Firebase
3. ✅ Check OAuth app status (Testing vs Production)
4. ✅ Revoke old token and regenerate fresh one
5. ✅ Use diagnostic script to test multiple redirect URIs

### Issue 2: No Refresh Token Returned

**Causes:**
- `prompt: "consent"` not set (but it is in our scripts)
- User already granted permissions (no new token)
- OAuth app configuration issue

**Solutions Tried:**
1. ✅ Ensure `prompt: "consent"` is set (already in scripts)
2. ✅ Revoke access first: https://myaccount.google.com/permissions
3. ✅ Then regenerate token

### Issue 3: Token Expires After 7 Days

**Cause:** OAuth app in "Testing" mode

**Solutions:**
1. ✅ Publish OAuth app in Google Cloud Console
2. ✅ Add test users (temporary fix)
3. ✅ Regenerate token regularly (workaround)

---

## Current Recommended Workflow

### Step 1: Set Environment Variables
```powershell
# Option A: Manual
$env:GMAIL_CLIENT_ID = (firebase functions:secrets:access OAUTH_CLIENT_ID).Trim()
$env:GMAIL_CLIENT_SECRET = (firebase functions:secrets:access OAUTH_CLIENT_SECRET).Trim()

# Option B: Helper script
.\scripts\set-oauth-env.ps1
```

### Step 2: Generate Token
```powershell
# Primary method (localhost)
node scripts/get-gmail-refresh-token.cjs

# Alternative (OOB - if localhost doesn't work)
$env:OAUTH_REDIRECT_URI = "urn:ietf:wg:oauth:2.0:oob"
node scripts/get-gmail-refresh-token.cjs
# Then: node scripts/exchange-code-for-token.js <code>
```

### Step 3: Update Firebase Secret
```bash
firebase functions:secrets:set DRIVE_REFRESH_TOKEN
# Paste token
```

### Step 4: Validate Token
```powershell
$env:OAUTH_CLIENT_ID = (firebase functions:secrets:access OAUTH_CLIENT_ID).Trim()
$env:OAUTH_CLIENT_SECRET = (firebase functions:secrets:access OAUTH_CLIENT_SECRET).Trim()
$env:OAUTH_REDIRECT_URI = (firebase functions:secrets:access OAUTH_REDIRECT_URI).Trim()
$env:DRIVE_REFRESH_TOKEN = (firebase functions:secrets:access DRIVE_REFRESH_TOKEN).Trim()
node scripts/validate-drive-oauth.js
```

### Step 5: Redeploy Functions
```bash
firebase deploy --only functions
```

---

## Lessons Learned

1. **Redirect URI Must Match Exactly**
   - Token must be generated with the same redirect URI stored in Firebase
   - Redirect URI must be authorized in Google Cloud Console

2. **OAuth App Status Matters**
   - Testing mode = tokens expire after 7 days
   - Production mode = tokens last indefinitely (unless revoked)

3. **Validation Before Production**
   - Always validate token before deploying
   - Use diagnostic scripts to troubleshoot issues

4. **Redeploy After Token Update**
   - Secrets are bound at deployment time
   - Must redeploy functions after updating token

5. **Multiple Methods for Flexibility**
   - Localhost method is easiest for development
   - OOB method works for server-side scenarios
   - Diagnostic scripts help troubleshoot

---

## File Reference

| File | Purpose | Method |
|------|---------|--------|
| `scripts/get-gmail-refresh-token.cjs` | Primary token generation | Method 1 & 2 |
| `scripts/exchange-code-for-token.js` | Exchange code for token | Method 3 |
| `scripts/set-oauth-env.ps1` | Environment setup helper | Method 4 |
| `scripts/get-sheets-refresh-token.cjs` | Sheets-specific token | Method 5 |
| `scripts/validate-drive-oauth.js` | Validate existing token | Method 6 |
| `scripts/test-oauth-token.js` | Test token with Firebase | Method 6 |
| `scripts/diagnose-oauth-issue.js` | Diagnose redirect URI issues | Method 6 |
| `scripts/test-drive-upload.js` | Test token with Drive API | Method 6 |

---

**Last Updated:** 2026-01-27  
**Total Methods Tried:** 6  
**Current Recommended:** Method 1 (Localhost Redirect URI)
