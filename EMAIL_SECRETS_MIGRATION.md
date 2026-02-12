# Email Secrets Migration Guide

## What Changed

The email system now uses **separate secrets for Gmail and Outlook**, allowing you to switch providers without overwriting credentials.

## New Secret Structure

### Gmail Secrets (Default)
- `SMTP_EMAIL_GMAIL` - Your Gmail address
- `SMTP_PASSWORD_GMAIL` - Your Gmail app password

### Outlook Secrets (Optional)
- `SMTP_EMAIL_OUTLOOK` - Your Outlook/Hotmail address
- `SMTP_PASSWORD_OUTLOOK` - Your Outlook app password

### Legacy Secrets (Still Supported)
- `SMTP_EMAIL` - Falls back to this if provider-specific secret not found
- `SMTP_PASSWORD` - Falls back to this if provider-specific secret not found

## Migration Steps

### If You're Currently Using Gmail

1. **Set Gmail-specific secrets:**
   ```bash
   firebase functions:secrets:set SMTP_EMAIL_GMAIL
   # Enter your Gmail address
   
   firebase functions:secrets:set SMTP_PASSWORD_GMAIL
   # Enter your Gmail app password
   ```

2. **Deploy functions:**
   ```bash
   firebase deploy --only functions
   ```

3. **Test** - Submit a request and verify emails are sent

4. **Optional:** You can keep or remove the legacy `SMTP_EMAIL` and `SMTP_PASSWORD` secrets

### If You're Currently Using Outlook

1. **Set Outlook-specific secrets:**
   ```bash
   firebase functions:secrets:set SMTP_EMAIL_OUTLOOK
   # Enter your Outlook address
   
   firebase functions:secrets:set SMTP_PASSWORD_OUTLOOK
   # Enter your Outlook app password
   ```

2. **Set provider to Outlook:**
   ```bash
   firebase functions:config:set smtp_provider="outlook"
   ```

3. **Deploy functions:**
   ```bash
   firebase deploy --only functions
   ```

4. **Test** - Submit a request and verify emails are sent

## How It Works

1. The system checks `SMTP_PROVIDER` (defaults to "gmail")
2. If provider is "gmail", it uses `SMTP_EMAIL_GMAIL` and `SMTP_PASSWORD_GMAIL`
3. If provider is "outlook", it uses `SMTP_EMAIL_OUTLOOK` and `SMTP_PASSWORD_OUTLOOK`
4. If provider-specific secrets aren't found, it falls back to legacy `SMTP_EMAIL` and `SMTP_PASSWORD`

## Benefits

- ✅ **No credential overwriting** - Gmail and Outlook secrets are separate
- ✅ **Easy switching** - Change `SMTP_PROVIDER` to switch between providers
- ✅ **Backward compatible** - Legacy secrets still work
- ✅ **Better organization** - Clear separation of provider credentials

## Quick Reference

### Set Gmail Secrets
```bash
firebase functions:secrets:set SMTP_EMAIL_GMAIL
firebase functions:secrets:set SMTP_PASSWORD_GMAIL
```

### Set Outlook Secrets
```bash
firebase functions:secrets:set SMTP_EMAIL_OUTLOOK
firebase functions:secrets:set SMTP_PASSWORD_OUTLOOK
```

### Switch Provider
```bash
# Use Gmail (default)
firebase functions:config:set smtp_provider="gmail"

# Use Outlook
firebase functions:config:set smtp_provider="outlook"
```

### Check Current Provider
```bash
firebase functions:config:get
# Look for smtp_provider value
```
