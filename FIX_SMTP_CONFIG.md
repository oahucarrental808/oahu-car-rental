# Fix SMTP Configuration Issue

## Problem

Your logs show that even though `SMTP_PROVIDER="gmail"`, it's using Outlook SMTP settings:
- Provider: `gmail`
- But using: `smtp-mail.outlook.com:465` (Outlook settings)

This happens because explicit `SMTP_HOST`, `SMTP_PORT`, and `SMTP_SECURE` settings are overriding the provider defaults.

## Solution

The code has been fixed to always use provider defaults when provider is "gmail" or "outlook". However, you should clear the old explicit settings to avoid confusion.

### Step 1: Clear Old SMTP Settings

Run these commands to remove the explicit Outlook settings:

```bash
# Remove explicit SMTP settings (they'll use provider defaults instead)
firebase functions:config:unset smtp_host
firebase functions:config:unset smtp_port
firebase functions:config:unset smtp_secure
```

### Step 2: Verify Provider is Set to Gmail

```bash
# Check current provider (should be "gmail" or not set)
firebase functions:config:get

# If not set to "gmail", set it:
firebase functions:config:set smtp_provider="gmail"
```

### Step 3: Set Gmail Secrets

Make sure you have Gmail secrets set:

```bash
firebase functions:secrets:set SMTP_EMAIL_GMAIL
# Enter: oahucarrental808@gmail.com

firebase functions:secrets:set SMTP_PASSWORD_GMAIL
# Enter: your Gmail app password
```

### Step 4: Deploy

```bash
firebase deploy --only functions:submitRequest
```

### Step 5: Test

Submit a test request and check logs:

```bash
firebase functions:log --only submitRequest -n 20
```

You should now see:
- `"host":"smtp.gmail.com"`
- `"port":587`
- `"provider":"gmail"`
- `"email":"oahucarrental808@gmail.com"`

## What Changed

The code now:
- ✅ Always uses Gmail settings when `SMTP_PROVIDER="gmail"`
- ✅ Always uses Outlook settings when `SMTP_PROVIDER="outlook"`
- ✅ Ignores explicit `SMTP_HOST`/`SMTP_PORT`/`SMTP_SECURE` for known providers
- ✅ Only uses explicit settings for custom/unknown providers
