# Secrets Management Guide

## Overview

This project uses Firebase Secrets for all sensitive server-side configuration. Client-side environment variables are only used for non-sensitive configuration.

## Firebase Secrets (Server-Side Only)

All secrets are managed via Firebase Functions Secrets. These are **never** exposed to the client.

### Required Secrets

#### Core Secrets
- **`LINK_SECRET`** - Secret key for encrypting/decrypting customer links and tokens
  - Used in: All link generation and decoding functions
  - Format: Random string (recommended: 32+ characters)
  - Set via: `firebase functions:secrets:set LINK_SECRET`

#### Google OAuth & Drive
- **`OAUTH_CLIENT_ID`** - Google OAuth 2.0 Client ID
  - Used in: Google Drive and Sheets API access
  - Set via: `firebase functions:secrets:set OAUTH_CLIENT_ID`

- **`OAUTH_CLIENT_SECRET`** - Google OAuth 2.0 Client Secret
  - Used in: Google Drive and Sheets API access
  - Set via: `firebase functions:secrets:set OAUTH_CLIENT_SECRET`

- **`OAUTH_REDIRECT_URI`** - OAuth redirect URI
  - Used in: OAuth flow
  - Format: `http://localhost:PORT/oauth2callback` (dev) or your production callback URL
  - Set via: `firebase functions:secrets:set OAUTH_REDIRECT_URI`

- **`DRIVE_REFRESH_TOKEN`** - Google Drive refresh token
  - Used in: Accessing Google Drive for file storage
  - Set via: `firebase functions:secrets:set DRIVE_REFRESH_TOKEN`

- **`DRIVE_PARENT_FOLDER_ID`** - Google Drive folder ID for storing rental documents
  - Used in: `createRentalPackage.js`
  - Set via: `firebase functions:secrets:set DRIVE_PARENT_FOLDER_ID`

#### Email Configuration
- **`SMTP_EMAIL`** - SMTP email address (Hotmail/Outlook)
  - Used in: All email sending functions
  - Format: `yourname@hotmail.com` or `yourname@outlook.com`
  - Set via: `firebase functions:secrets:set SMTP_EMAIL`

- **`SMTP_PASSWORD`** - SMTP password or app password
  - Used in: All email sending functions
  - Note: Use App Password if 2FA is enabled
  - Set via: `firebase functions:secrets:set SMTP_PASSWORD`

#### Admin Configuration
- **`ADMIN_SECRET`** - Secret for admin API authentication
  - Used in: Admin-only functions (createCustomerInfoLink, etc.)
  - Format: Random string (recommended: 32+ characters)
  - Set via: `firebase functions:secrets:set ADMIN_SECRET`

- **`ADMIN_EMAIL`** - Admin email for notifications
  - Used in: Email notifications to admin
  - Set via: `firebase functions:secrets:set ADMIN_EMAIL`

- **`ADMIN_NUMBER`** - Admin phone number for SMS notifications
  - Used in: SMS notifications (optional)
  - Format: E.164 format (e.g., `+1234567890`)
  - Set via: `firebase functions:secrets:set ADMIN_NUMBER`

- **`ADMIN_CARRIER`** - SMS carrier for admin (optional)
  - Used in: SMS gateway routing
  - Default: T-Mobile if not set
  - Set via: `firebase functions:secrets:set ADMIN_CARRIER`

## Client-Side Environment Variables

The frontend does **not** use a build-time debug flag. Debug UI is controlled by Firebase Functions `DEBUG_MODE` and is read at runtime from `GET /api/health` (`data.debugMode`).

## Setting Secrets

### Using Firebase CLI

```bash
# Set a secret
firebase functions:secrets:set SECRET_NAME

# Access a secret (for verification)
firebase functions:secrets:access SECRET_NAME

# List all secrets
firebase functions:secrets:access

# Delete a secret
firebase functions:secrets:delete SECRET_NAME
```

### Using Firebase Console

1. Go to Firebase Console → Functions → Secrets
2. Click "Add Secret"
3. Enter secret name and value
4. Click "Save"

## Environment Variables

### Development (.env file)

Create a `.env` file in the project root:

```env
# (No client-side debug flag)
# Debug mode is controlled server-side via Firebase Functions DEBUG_MODE

# Server-side secrets are set via Firebase CLI / Firebase Console, not .env
```

### Production

- Client-side variables: Set in your build/deployment environment
- Server-side secrets: Set via Firebase Console or CLI

## Security Best Practices

1. ✅ **Never commit secrets to git**
   - Add `.env` to `.gitignore`
   - Never commit Firebase secrets

2. ✅ **Use Firebase Secrets for all sensitive data**
   - All API keys, passwords, tokens should be Firebase Secrets
   - Client-side env vars are only for non-sensitive config

3. ✅ **Rotate secrets regularly**
   - Change secrets periodically
   - Rotate immediately if compromised

4. ✅ **Use App Passwords for email**
   - If 2FA is enabled, use App Passwords instead of main password

5. ⚠️ **Client-side admin auth is insecure**
   - `VITE_ADMIN_PASSWORD` is exposed in client bundle
   - Consider implementing Firebase Authentication for admin routes

## Secret Usage by Function

| Function | Secrets Used |
|----------|-------------|
| `submitRequest` | ADMIN_EMAIL, ADMIN_NUMBER, SMTP_EMAIL, SMTP_PASSWORD |
| `createCustomerInfoLink` | ADMIN_SECRET, LINK_SECRET, SMTP_EMAIL, SMTP_PASSWORD |
| `createRentalPackage` | LINK_SECRET, DRIVE_PARENT_FOLDER_ID, OAUTH_*, DRIVE_REFRESH_TOKEN, SMTP_EMAIL, SMTP_PASSWORD, ADMIN_EMAIL |
| `createPickupMileageLink` | LINK_SECRET, SMTP_EMAIL, SMTP_PASSWORD |
| `createDropoffMileageLink` | LINK_SECRET, SMTP_EMAIL, SMTP_PASSWORD |
| `submitMileageOut` | LINK_SECRET, OAUTH_*, DRIVE_REFRESH_TOKEN, SMTP_EMAIL, SMTP_PASSWORD |
| `submitMileageIn` | LINK_SECRET, OAUTH_*, DRIVE_REFRESH_TOKEN, SMTP_EMAIL, SMTP_PASSWORD, ADMIN_EMAIL |
| `submitSignedContract` | LINK_SECRET, OAUTH_*, DRIVE_REFRESH_TOKEN, SMTP_EMAIL, SMTP_PASSWORD, ADMIN_EMAIL |
| `decodeCustomerInfoLink` | LINK_SECRET |
| `decodeMileageLink` | LINK_SECRET |
| `decodeAdminInstructionLink` | LINK_SECRET |

## Ensuring Functions Use Latest Secrets

**Important**: When you update a secret value in Firebase, your functions will **NOT** automatically use the new version. You must **redeploy your functions** after updating secrets.

### Why Redeployment is Required

Firebase Functions v2 binds secrets to functions at **deployment time**. When you update a secret:
1. A new version of the secret is created in Secret Manager
2. Your running functions continue using the version that was bound at deployment
3. The new secret version is only used after redeployment

### Workflow for Updating Secrets

1. **Update the secret**:
   ```bash
   firebase functions:secrets:set SECRET_NAME
   # Enter the new value when prompted
   ```

2. **Redeploy functions** to use the new secret version:
   ```bash
   # Deploy all functions
   firebase deploy --only functions
   
   # Or deploy a specific function
   firebase deploy --only functions:functionName
   ```

3. **Verify the update**:
   ```bash
   # Check that functions are using the latest secret
   firebase functions:log --limit 10
   ```

### Best Practices

1. **Update secrets during maintenance windows** when possible
2. **Test secret updates in a staging environment** first
3. **Deploy immediately after updating critical secrets** (e.g., API keys, passwords)
4. **Monitor function logs** after deployment to ensure secrets are working correctly
5. **Use version pinning** only if you need to rollback to a specific secret version

### Quick Reference: Update Secret + Deploy

```bash
# Update a secret and immediately redeploy
firebase functions:secrets:set SECRET_NAME && firebase deploy --only functions
```

### Alternative: Update Multiple Secrets Before Deploying

If you need to update multiple secrets, you can update them all first, then deploy once:

```bash
# Update multiple secrets
firebase functions:secrets:set SECRET_1
firebase functions:secrets:set SECRET_2
firebase functions:secrets:set SECRET_3

# Then deploy once (functions will use latest versions of all secrets)
firebase deploy --only functions
```

## Troubleshooting

### Secret Not Found
- Error: `Secret SECRET_NAME not found`
- Solution: Set the secret via Firebase CLI or Console

### Secret Access Denied
- Error: `Permission denied`
- Solution: Ensure you have proper Firebase project permissions

### Function Using Old Secret Value
- Symptom: Function behavior hasn't changed after updating secret
- Solution: **Redeploy the function** - secrets are bound at deployment time
  ```bash
  firebase deploy --only functions:functionName
  ```

### Client Variable Not Working
- Check that variable name starts with `VITE_`
- Restart dev server after changing `.env`
- Rebuild for production changes

## Migration Notes

If migrating from hardcoded values:
1. Identify all hardcoded secrets
2. Create Firebase Secrets for each
3. Update code to use `defineSecret()`
4. Remove hardcoded values
5. Test thoroughly before deploying
