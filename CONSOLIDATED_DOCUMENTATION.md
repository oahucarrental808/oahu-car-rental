# Oahu Car Rental - Consolidated Documentation
## Complete Guide from All Previous Conversations

**Last Updated:** 2026-01-27  
**Purpose:** This document consolidates all previous agent conversations, setup guides, troubleshooting steps, and best practices into a single comprehensive reference.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Complete Setup Guide](#complete-setup-guide)
4. [Security & Design Review](#security--design-review)
5. [Deployment Guide](#deployment-guide)
6. [Troubleshooting](#troubleshooting)
7. [Email Configuration](#email-configuration)
8. [OAuth & Google APIs Setup](#oauth--google-apis-setup)
9. [Application Flow](#application-flow)
10. [Best Practices & Lessons Learned](#best-practices--lessons-learned)

---

## Project Overview

### What This Application Does

A full-stack car rental management system built with React and Firebase Functions that manages:
- Customer rental requests
- Customer information collection
- Contract PDF generation and signing
- Mileage and fuel tracking (pickup/dropoff)
- Document storage (Google Drive)
- Email automation throughout the rental process
- Admin dashboard for managing rentals

### Tech Stack

**Frontend:**
- React 19
- React Router
- Vite

**Backend:**
- Firebase Functions (v2)
- Firebase Hosting
- Google APIs (Drive, Sheets, Gmail)
- Nodemailer (SMTP)

**Security:**
- AES-256-GCM encryption for tokens
- Firebase Secrets for sensitive data
- Server-side admin authentication
- CORS protection
- Rate limiting
- Input sanitization

---

## System Architecture

### Frontend Routes

- `/` - Home page
- `/request` - Customer request form
- `/request/success` - Request confirmation
- `/admin/request-customer-info` - Admin: Create customer info link
- `/admin/customer-info?t=...` - Customer: Fill out info form
- `/success` - Customer: Success after info submission
- `/admin/pickup-instructions?t=...` - Admin: Set pickup instructions
- `/admin/dropoff-instructions?t=...` - Admin: Set dropoff instructions
- `/mileageOut?t=...` - Customer: Submit pickup mileage/fuel
- `/mileageIn?t=...` - Customer: Submit return mileage/fuel
- `/signedContract?t=...` - Customer: Upload signed contract
- `/gallery` - Vehicle gallery
- `/faq` - FAQ page
- `/about` - About page

### Backend Functions

| Function | Purpose | Secrets Used |
|----------|---------|--------------|
| `submitRequest` | Save customer request to Google Sheets | ADMIN_EMAIL, ADMIN_NUMBER, SMTP_EMAIL, SMTP_PASSWORD |
| `createCustomerInfoLink` | Generate encrypted customer info link | ADMIN_SECRET, LINK_SECRET, SMTP_EMAIL, SMTP_PASSWORD |
| `decodeCustomerInfoLink` | Decode and validate customer info link | LINK_SECRET |
| `createRentalPackage` | Generate contract PDF and all subsequent links | LINK_SECRET, DRIVE_PARENT_FOLDER_ID, OAUTH_*, DRIVE_REFRESH_TOKEN, SMTP_EMAIL, SMTP_PASSWORD, ADMIN_EMAIL |
| `decodeAdminInstructionLink` | Decode admin instruction links | LINK_SECRET |
| `createPickupMileageLink` | Generate customer pickup (mileage out) link | LINK_SECRET, SMTP_EMAIL, SMTP_PASSWORD |
| `createDropoffMileageLink` | Generate customer return (mileage in) link | LINK_SECRET, SMTP_EMAIL, SMTP_PASSWORD |
| `decodeMileageLink` | Decode mileage links | LINK_SECRET |
| `submitMileageOut` | Save pickup mileage/fuel data | LINK_SECRET, OAUTH_*, DRIVE_REFRESH_TOKEN, SMTP_EMAIL, SMTP_PASSWORD |
| `submitMileageIn` | Save return mileage/fuel data | LINK_SECRET, OAUTH_*, DRIVE_REFRESH_TOKEN, SMTP_EMAIL, SMTP_PASSWORD, ADMIN_EMAIL |
| `submitSignedContract` | Save signed contract PDF | LINK_SECRET, OAUTH_*, DRIVE_REFRESH_TOKEN, SMTP_EMAIL, SMTP_PASSWORD, ADMIN_EMAIL |
| `health` | Health check endpoint | None |

### Data Storage

- **Google Sheets**: Customer requests, rental data
- **Google Drive**: 
  - Contract PDFs (filled and signed)
  - Mileage/fuel photos
  - Customer documents (insurance, licenses, selfies)

---

## Complete Setup Guide

### Prerequisites

1. **Node.js 20+** installed
2. **Firebase CLI** installed: `npm install -g firebase-tools`
3. **Firebase project** with Functions and Hosting enabled
4. **Google Cloud project** with Drive, Sheets, and Gmail APIs enabled

### Step 1: Clone and Install

```bash
git clone <repository-url>
cd oahu-car-rental

# Install frontend dependencies
npm install

# Install backend dependencies
cd functions
npm install
cd ..
```

### Step 2: Firebase Configuration

```bash
firebase login
firebase use <your-project-id>
```

### Step 3: Set Up All Required Secrets

See [SECRETS_MANAGEMENT.md](./SECRETS_MANAGEMENT.md) for complete list. Quick setup:

```bash
# Core secrets
firebase functions:secrets:set LINK_SECRET
firebase functions:secrets:set ADMIN_SECRET
firebase functions:secrets:set ADMIN_EMAIL
firebase functions:secrets:set ADMIN_NUMBER

# Google OAuth
firebase functions:secrets:set OAUTH_CLIENT_ID
firebase functions:secrets:set OAUTH_CLIENT_SECRET
firebase functions:secrets:set OAUTH_REDIRECT_URI
firebase functions:secrets:set DRIVE_REFRESH_TOKEN
firebase functions:secrets:set DRIVE_PARENT_FOLDER_ID

# Email (Gmail - default)
firebase functions:secrets:set SMTP_EMAIL_GMAIL
firebase functions:secrets:set SMTP_PASSWORD_GMAIL
```

**Important:** After setting secrets, you **must** redeploy functions:
```bash
firebase deploy --only functions
```

### Step 4: Configure Google OAuth

See [OAuth & Google APIs Setup](#oauth--google-apis-setup) section below.

### Step 5: Set Up Email

See [Email Configuration](#email-configuration) section below.

### Step 6: Build and Deploy

```bash
# Build frontend
npm run build

# Deploy everything
firebase deploy
```

---

## Security & Design Review

### Security Score: 9/10 (Improved from 4/10)

### Critical Issues - ALL RESOLVED ✅

1. **CORS Configuration** ✅ FIXED
   - Now uses allowed origins list with runtime evaluation
   - Restricts to configured domains only

2. **Client-Side Admin Authentication** ✅ FIXED
   - Implemented server-side session-based authentication
   - Uses `ADMIN_PASSWORD` Firebase Secret (not exposed to client)
   - Three endpoints: `/api/admin/login`, `/api/admin/logout`, `/api/admin/verify`
   - Constant-time password comparison
   - 8-hour session expiration

3. **Deprecated TLS Cipher** ✅ FIXED
   - Removed insecure SSLv3 cipher
   - Using modern TLS defaults

4. **Email Validation** ✅ FIXED
   - All emails validated before sending

5. **File Upload Size Limits** ✅ FIXED
   - 10MB for photos, 5MB for PDFs
   - MIME type validation

6. **Admin Secret Exposed** ✅ FIXED
   - Removed client-side admin secret usage
   - Uses session token from `AdminGateServer`

### Moderate Issues - ALL RESOLVED ✅

7. **Rate Limiting** ✅ FIXED
   - Public: 100 requests per 15 minutes
   - Admin: 200 requests per 15 minutes
   - Upload: 20 requests per hour
   - Health: 10 requests per minute

8. **Input Sanitization** ✅ FIXED
   - Comprehensive sanitization for all inputs
   - HTML/script injection prevention
   - Length limits enforced

9. **Error Message Disclosure** ⚠️ IMPROVED
   - Standardized error handling
   - Debug mode may expose details (intentional for development)
   - **Ensure `DEBUG_MODE` is disabled in production**

### Design Quality: 8.5/10 (Improved from 6.5/10)

**Strengths:**
- ✅ Good separation of concerns
- ✅ Token-based security with encryption
- ✅ Error boundaries implemented
- ✅ Standardized error handling
- ✅ Code duplication eliminated
- ✅ Validation utilities consolidated
- ✅ Configuration centralized

**Remaining Improvements:**
- ⚠️ No TypeScript (medium priority)
- ⚠️ No testing suite (medium priority)
- ⚠️ Create `.env.example` file (low priority)

---

## Deployment Guide

### Pre-Deployment Checklist

- [ ] All secrets are set in Firebase
- [ ] Environment variables are configured
- [ ] Code is tested locally
- [ ] `.env` file is not committed
- [ ] Build passes without errors
- [ ] `DEBUG_MODE` is disabled for production

### Deployment Steps

1. **Update Secrets (if needed)**
   ```bash
   firebase functions:secrets:set SECRET_NAME
   # Remember to redeploy after updating secrets!
   firebase deploy --only functions
   ```
   
   **Important:** Secrets are bound at deployment time. After updating any secret, you **must** redeploy functions for the new version to take effect. See [Secret Not Working After Update](#secret-not-working-after-update) for details.

2. **Build Frontend**
   ```bash
   npm install
   npm run build
   ```

3. **Deploy Functions**
   ```bash
   firebase deploy --only functions
   ```

4. **Deploy Hosting**
   ```bash
   firebase deploy --only hosting
   ```

5. **Or Deploy Everything**
   ```bash
   firebase deploy
   ```

### Custom Domain Setup

1. Go to Firebase Console → Hosting → Add custom domain
2. Enter your domain: `oahu-car-rentals.com`
3. Add DNS records as instructed
4. Wait for DNS propagation
5. SSL certificate is automatically provisioned

### Post-Deployment

1. Test critical flows
2. Monitor logs: `firebase functions:log`
3. Verify email delivery
4. Check Google Drive uploads

### Rollback

**Functions:**
```bash
git checkout <previous-commit>
firebase deploy --only functions
```

**Hosting:**
- Go to Firebase Console → Hosting → Releases
- Click "Rollback" on previous version

---

## Troubleshooting

### OAuth Token Errors

**Error:** `invalid_grant` or "OAuth refresh token is invalid or expired"

**Solution:**
1. Verify redirect URI in Google Cloud Console matches Firebase
2. Regenerate token:
   ```powershell
   $env:GMAIL_CLIENT_ID = (firebase functions:secrets:access OAUTH_CLIENT_ID).Trim()
   $env:GMAIL_CLIENT_SECRET = (firebase functions:secrets:access OAUTH_CLIENT_SECRET).Trim()
   node scripts/get-gmail-refresh-token.cjs
   ```
3. Update Firebase secret:
   ```bash
   firebase functions:secrets:set DRIVE_REFRESH_TOKEN
   ```
4. Redeploy functions:
   ```bash
   firebase deploy --only functions
   ```

### Functions Not Updating After Deployment

1. **Force clean deployment:**
   ```powershell
   Remove-Item -Recurse -Force .firebase -ErrorAction SilentlyContinue
   firebase deploy --only functions
   ```

2. **Verify in Firebase Console:**
   - Functions → [function name] → Source
   - Check that code includes latest changes

3. **Check for build errors:**
   ```bash
   cd functions
   npm run lint
   ```

### Secret Not Working After Update

**Important:** Secrets are bound at deployment time. After updating a secret:
```bash
firebase functions:secrets:set SECRET_NAME
firebase deploy --only functions  # REQUIRED!
```

#### Why Redeployment is Required

Firebase Functions v2 binds secrets to functions at **deployment time**. When you update a secret:
1. A new version of the secret is created in Secret Manager
2. Your running functions continue using the version that was bound at deployment
3. The new secret version is only used after redeployment

#### Workflow for Updating Secrets

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

#### Best Practices for Secret Updates

1. **Update secrets during maintenance windows** when possible
2. **Test secret updates in a staging environment** first
3. **Deploy immediately after updating critical secrets** (e.g., API keys, passwords)
4. **Monitor function logs** after deployment to ensure secrets are working correctly
5. **Update multiple secrets before deploying** - you can update several secrets, then deploy once:
   ```bash
   firebase functions:secrets:set SECRET_1
   firebase functions:secrets:set SECRET_2
   firebase functions:secrets:set SECRET_3
   # Then deploy once (functions will use latest versions of all secrets)
   firebase deploy --only functions
   ```

#### Quick Reference: Update Secret + Deploy

```bash
# Update a secret and immediately redeploy
firebase functions:secrets:set SECRET_NAME && firebase deploy --only functions
```

### Email Not Sending

1. Check `DEBUG_MODE` is not `"true"`
2. Verify all email secrets are set:
   ```bash
   firebase functions:secrets:access SMTP_EMAIL_GMAIL
   firebase functions:secrets:access SMTP_PASSWORD_GMAIL
   ```
3. Check Firebase Functions logs:
   ```bash
   firebase functions:log
   ```
4. Verify SMTP credentials (use App Password if 2FA enabled)

### CORS Errors

1. Update `ALLOWED_ORIGINS` environment variable
2. Verify CORS configuration in `functions/src/common/cors.js`
3. Ensure domain is in allowed origins list

---

## Email Configuration

### Default: Gmail (Recommended)

**Setup Steps:**

1. **Enable 2-Step Verification** on Google Account
2. **Generate App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and device
   - Copy 16-character password
3. **Set Firebase Secrets:**
   ```bash
   firebase functions:secrets:set SMTP_EMAIL_GMAIL
   # Enter: yourname@gmail.com
   
   firebase functions:secrets:set SMTP_PASSWORD_GMAIL
   # Enter: 16-character app password
   
   firebase functions:secrets:set ADMIN_EMAIL
   # Enter: admin email address
   ```
4. **Deploy:**
   ```bash
   firebase deploy --only functions
   ```

### Alternative: Outlook/Hotmail

1. **Set provider:**
   ```bash
   firebase functions:config:set smtp_provider="outlook"
   ```

2. **Set Outlook secrets:**
   ```bash
   firebase functions:secrets:set SMTP_EMAIL_OUTLOOK
   firebase functions:secrets:set SMTP_PASSWORD_OUTLOOK
   ```

3. **Deploy:**
   ```bash
   firebase deploy --only functions
   ```

### Email Implementation

All email sending is wrapped in try-catch blocks - **email failures do NOT break the main workflow**.

**Email Types:**
1. New request notification (admin)
2. Customer info link email
3. Rental package emails (mileage out + signed contract links)
4. Pickup instructions email
5. Dropoff instructions email
6. Mileage out confirmation
7. Signed contract confirmation (admin)
8. Rental completion email (admin)

### Debug Mode

When `DEBUG_MODE=true`:
- Emails are **NOT** sent
- Email previews shown in API responses
- All email content returned in `debugEmail` fields

When `DEBUG_MODE=false` (production):
- Emails sent automatically
- No email previews in responses

---

## OAuth & Google APIs Setup

### Google Cloud Console Setup

1. **Create/Select Project** in Google Cloud Console
2. **Enable APIs:**
   - Google Drive API
   - Google Sheets API
   - Gmail API (if using Gmail OAuth)
3. **Create OAuth 2.0 Credentials:**
   - Go to APIs & Services → Credentials
   - Create OAuth 2.0 Client ID
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:5555/oauth2callback`

### Generate Refresh Token

1. **Set environment variables:**
   ```powershell
   $env:GMAIL_CLIENT_ID = (firebase functions:secrets:access OAUTH_CLIENT_ID).Trim()
   $env:GMAIL_CLIENT_SECRET = (firebase functions:secrets:access OAUTH_CLIENT_SECRET).Trim()
   ```

2. **Run token generation script:**
   ```bash
   node scripts/get-gmail-refresh-token.cjs
   ```

3. **Grant permissions** in browser (Drive and Gmail send)

4. **Copy refresh token** from terminal output

5. **Set Firebase secret:**
   ```bash
   firebase functions:secrets:set DRIVE_REFRESH_TOKEN
   # Paste the refresh token
   ```

6. **Redeploy functions:**
   ```bash
   firebase deploy --only functions
   ```

### Validate OAuth Setup

```powershell
$env:OAUTH_CLIENT_ID = (firebase functions:secrets:access OAUTH_CLIENT_ID).Trim()
$env:OAUTH_CLIENT_SECRET = (firebase functions:secrets:access OAUTH_CLIENT_SECRET).Trim()
$env:OAUTH_REDIRECT_URI = (firebase functions:secrets:access OAUTH_REDIRECT_URI).Trim()
$env:DRIVE_REFRESH_TOKEN = (firebase functions:secrets:access DRIVE_REFRESH_TOKEN).Trim()

node scripts/validate-drive-oauth.js
```

Should see: `✅ All checks passed! Your OAuth credentials are valid.`

### Google Sheets Setup

1. **Enable Google Sheets API** in Google Cloud Console
2. **Create Service Account** (recommended) or use OAuth
3. **Share Google Sheet** with service account email (Editor permissions)
4. **Place credentials.json** in project root (if using service account)

See [GOOGLE_SHEETS_API_SETUP.md](./GOOGLE_SHEETS_API_SETUP.md) for detailed steps.

---

## Application Flow

### Complete Rental Flow

```
1. Customer submits request
   ↓
2. Request saved to Google Sheets
   ↓ [TODO: Email admin]
3. Admin reviews request (manual - via Google Sheets)
   ↓
4. Admin creates customer info link
   ↓ [TODO: Email customer with link]
5. Customer completes info form
   ↓
6. System creates rental package
   - Generates contract PDF
   - Creates admin pickup/dropoff links
   - Creates customer mileage out link
   - Creates customer signed contract link
   ↓ [TODO: Email customer with links]
7. Admin sets pickup instructions
   ↓ [TODO: Email customer with instructions]
8. Customer uploads signed contract
   ↓ [TODO: Email admin confirmation (optional)]
9. Customer submits mileage out (pickup)
   ↓ [TODO: Email customer next steps]
10. Admin sets dropoff instructions
    ↓ [TODO: Email customer with instructions]
11. Customer submits mileage in (return)
    ↓ [TODO: Email admin + start scheduler]
12. Rental complete
```

### Link Types & Expiration

- **Customer info link**: 7 days
- **Mileage out link**: 7 days
- **Mileage in link**: 7 days
- **Signed contract link**: 7 days
- **Admin pickup instructions link**: 30 days
- **Admin dropoff instructions link**: 30 days

### Debug Mode

Debug mode is controlled server-side by Firebase Functions `DEBUG_MODE` and exposed to UI via `GET /api/health`.

When `debugMode=true`:
- Debug UI blocks shown (email previews, generated links)
- Some endpoints return debug preview payloads
- Emails are NOT sent

When `debugMode=false`:
- Production mode
- Emails sent automatically
- No debug UI

---

## Best Practices & Lessons Learned

### Secrets Management

1. **Never commit secrets to git**
   - Add `.env` to `.gitignore`
   - Never commit Firebase secrets

2. **Use Firebase Secrets for all sensitive data**
   - All API keys, passwords, tokens should be Firebase Secrets
   - Client-side env vars only for non-sensitive config

3. **Redeploy after updating secrets**
   - Secrets are bound at deployment time
   - Always run `firebase deploy --only functions` after updating secrets
   - See [Secret Not Working After Update](#secret-not-working-after-update) section for detailed workflow

4. **Rotate secrets regularly**
   - Change secrets periodically
   - Rotate immediately if compromised

### Error Handling

1. **Email failures don't break workflow**
   - All email sending wrapped in try-catch
   - Primary operations succeed even if email fails

2. **Standardized error responses**
   - Use `AppError` class from `functions/src/common/errors.js`
   - Consistent error format across all functions

3. **Error boundaries in React**
   - `ErrorBoundary` component wraps entire app
   - Graceful fallback UI

### Security

1. **CORS properly configured**
   - Only allow trusted origins
   - Runtime evaluation of allowed origins

2. **Server-side authentication**
   - Admin auth is server-side validated
   - Session-based with expiration

3. **Input validation and sanitization**
   - All inputs validated and sanitized
   - File uploads validated for size and type

4. **Rate limiting**
   - All endpoints protected
   - Different limits for different endpoint types

### Development Workflow

1. **Test locally first**
   ```bash
   cd functions
   npm run serve
   ```

2. **Use debug mode for testing**
   - Set `DEBUG_MODE=true` during development
   - Verify email content in API responses

3. **Monitor logs**
   ```bash
   firebase functions:log
   ```

4. **Deploy incrementally**
   - Deploy specific functions when possible
   - Test after each deployment

### Common Pitfalls

1. **Forgetting to redeploy after secret update**
   - Always redeploy functions after updating secrets

2. **OAuth redirect URI mismatch**
   - Ensure redirect URI in Google Cloud Console matches Firebase
   - Regenerate token if redirect URI changes

3. **Debug mode left enabled in production**
   - Always verify `DEBUG_MODE=false` before production deployment

4. **Email not sending**
   - Check `DEBUG_MODE` is not `"true"`
   - Verify App Password is used (not regular password)
   - Check Firebase Functions logs for errors

---

## Quick Reference Commands

### Secrets Management
```bash
# Set secret
firebase functions:secrets:set SECRET_NAME

# Access secret (for verification)
firebase functions:secrets:access SECRET_NAME

# List all secrets
firebase functions:secrets:access
```

### Deployment
```bash
# Build frontend
npm run build

# Deploy all
firebase deploy

# Deploy functions only
firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:submitRequest

# Deploy hosting only
firebase deploy --only hosting
```

### OAuth Token Generation
```powershell
$env:GMAIL_CLIENT_ID = (firebase functions:secrets:access OAUTH_CLIENT_ID).Trim()
$env:GMAIL_CLIENT_SECRET = (firebase functions:secrets:access OAUTH_CLIENT_SECRET).Trim()
node scripts/get-gmail-refresh-token.cjs
```

### Logs
```bash
# View all logs
firebase functions:log

# View specific function logs
firebase functions:log --only submitRequest -n 20
```

### Testing
```bash
# Test locally
cd functions
npm run serve

# Test OAuth
node scripts/validate-drive-oauth.js

# Test email connection
# (add to function temporarily)
```

---

## Related Documentation Files

- [README.md](./README.md) - Project overview and quick start
- [EMAIL_SETUP.md](./EMAIL_SETUP.md) - Email configuration guide
- [FLOW_OVERVIEW.md](./FLOW_OVERVIEW.md) - Application flow details
- [EMAIL_SETUP.md](./EMAIL_SETUP.md) - Email configuration guide
- [GMAIL_SETUP.md](./GMAIL_SETUP.md) - Gmail-specific setup
- [GOOGLE_SHEETS_API_SETUP.md](./GOOGLE_SHEETS_API_SETUP.md) - Google Sheets setup
- [SECURITY_AND_DESIGN_REVIEW.md](./SECURITY_AND_DESIGN_REVIEW.md) - Security audit results
- [OAUTH_TROUBLESHOOTING.md](./OAUTH_TROUBLESHOOTING.md) - OAuth troubleshooting
- [ADMIN_INSTRUCTIONS_FLOW.md](./ADMIN_INSTRUCTIONS_FLOW.md) - Admin flow details

---

## Support & Maintenance

### Regular Maintenance Tasks

1. **Monitor function logs** weekly
2. **Check OAuth token validity** monthly
3. **Rotate secrets** quarterly
4. **Review security** after major changes
5. **Test email delivery** after deployments

### Getting Help

1. Check this consolidated documentation
2. Review specific documentation files
3. Check Firebase Functions logs
4. Verify all secrets are set correctly
5. Test locally before deploying

---

**End of Consolidated Documentation**

*This document combines information from all previous agent conversations and documentation files. For specific details, refer to the individual documentation files listed above.*
