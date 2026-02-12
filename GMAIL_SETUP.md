# Gmail Email Setup - Quick Guide

## Overview

Your application now defaults to **Gmail** for all email sending. This includes:
- Admin notification emails
- Customer emails (rental links, confirmations, etc.)
- SMS messages (via email-to-SMS gateway)

## Step-by-Step Setup

### 1. Enable 2-Step Verification

1. Go to your Google Account: https://myaccount.google.com/
2. Click **Security** in the left sidebar
3. Under "Signing in to Google", click **2-Step Verification**
4. Follow the prompts to enable it

### 2. Generate App Password

1. Go to: https://myaccount.google.com/apppasswords
   - Or: Google Account → Security → 2-Step Verification → App passwords
2. Select:
   - **App**: Mail
   - **Device**: Other (Custom name) → Enter "Firebase Functions"
3. Click **Generate**
4. **Copy the 16-character password** (you'll need this for Firebase)
   - Format: `xxxx xxxx xxxx xxxx` (spaces don't matter)

### 3. Set Firebase Secrets

Run these commands in your terminal:

```bash
# Set your Gmail address (Gmail-specific secret)
firebase functions:secrets:set SMTP_EMAIL_GMAIL
# When prompted, enter: yourname@gmail.com

# Set your Gmail app password (Gmail-specific secret)
firebase functions:secrets:set SMTP_PASSWORD_GMAIL
# When prompted, paste the 16-character app password (spaces optional)

# Set admin email (where you want to receive notifications)
firebase functions:secrets:set ADMIN_EMAIL
# When prompted, enter: yourname@gmail.com (or another email)
```

**Note:** Gmail secrets are separate from Outlook secrets, so you can switch providers without overwriting credentials.

### 4. Verify Configuration (Optional)

Check that secrets are set:

```bash
firebase functions:secrets:access SMTP_EMAIL_GMAIL
firebase functions:secrets:access ADMIN_EMAIL
# (SMTP_PASSWORD_GMAIL won't show for security)
```

### 5. Deploy Functions

```bash
cd functions
npm run deploy -- --only functions:submitRequest
```

Or deploy all functions:

```bash
firebase deploy --only functions
```

### 6. Test

1. Submit a test rental request from your website
2. Check logs:
   ```bash
   firebase functions:log --only submitRequest -n 20
   ```
3. Look for:
   - `"Email sent successfully"`
   - `"New request notification SMS sent to admin"`
4. Check your email inbox and phone for the notifications

## Switching to Outlook (Optional)

If you need to use Outlook/Hotmail instead:

```bash
# Set provider to Outlook
firebase functions:config:set smtp_provider="outlook"

# Set Outlook-specific secrets (separate from Gmail secrets)
firebase functions:secrets:set SMTP_EMAIL_OUTLOOK
firebase functions:secrets:set SMTP_PASSWORD_OUTLOOK
# Use Outlook email and app password

firebase deploy --only functions
```

**Note:** Outlook secrets (`SMTP_EMAIL_OUTLOOK`, `SMTP_PASSWORD_OUTLOOK`) are separate from Gmail secrets, so you can switch back and forth without losing credentials.

## Troubleshooting

### "Invalid login" or "Authentication failed"
- Make sure you're using an **App Password**, not your regular Gmail password
- Verify 2-Step Verification is enabled
- Check that the app password was copied correctly (no extra spaces)

### "Connection timeout"
- Gmail should work reliably from Firebase Functions
- If you see timeouts, check Firebase Functions logs for details
- Verify your Gmail account isn't locked or restricted

### Emails not sending
- Check `DEBUG_MODE` is not set to `"true"`:
  ```bash
  firebase functions:config:get
  ```
- Verify all secrets are set correctly
- Check Firebase Functions logs for error messages

## What Changed

- **Default provider**: Changed from Outlook to Gmail
- **New setting**: `SMTP_PROVIDER` parameter (defaults to "gmail")
- **Auto-configuration**: SMTP settings automatically set based on provider
- **All emails**: Now come from your Gmail account by default

## Next Steps

After setup:
1. Test with a real request submission
2. Monitor logs for any issues
3. Verify emails are received correctly
4. Check SMS delivery to your phone
