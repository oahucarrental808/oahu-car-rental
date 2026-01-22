# Email Setup Guide

## Overview

Email functionality has been implemented using Hotmail/Outlook SMTP via nodemailer. All 7 email automation tasks have been completed.

## Required Firebase Secrets

You need to set the following secrets in Firebase:

1. **SMTP_EMAIL** - Your Hotmail/Outlook email address (e.g., `yourname@hotmail.com` or `yourname@outlook.com`)
2. **SMTP_PASSWORD** - Your Hotmail/Outlook password (or app password if 2FA is enabled)
3. **ADMIN_EMAIL** - Admin email address to receive notifications (e.g., `admin@yourdomain.com`)

### Setting Secrets

```bash
# Set SMTP email
firebase functions:secrets:set SMTP_EMAIL

# Set SMTP password
firebase functions:secrets:set SMTP_PASSWORD

# Set admin email
firebase functions:secrets:set ADMIN_EMAIL
```

Or via Firebase Console:
1. Go to Firebase Console → Functions → Secrets
2. Add each secret with its value

## Hotmail/Outlook SMTP Configuration

The email utility is configured for Hotmail/Outlook SMTP:
- **Host**: `smtp-mail.outlook.com`
- **Port**: `587`
- **Security**: STARTTLS (not SSL)
- **Authentication**: Required

### Important Notes

1. **App Passwords**: If you have 2FA enabled on your Hotmail/Outlook account, you'll need to use an App Password instead of your regular password:
   - Go to Microsoft Account Security settings
   - Create an App Password
   - Use that app password for `SMTP_PASSWORD`

2. **Less Secure Apps**: Make sure "Less secure app access" is enabled if required (though App Passwords are preferred)

## Email Implementation Details

### 1. New Request Notification Email
**Location**: `submitRequest.js`
- **Trigger**: When customer submits a new rental request
- **Recipient**: Admin email
- **Content**: Request details (name, email, dates, car types, price range, notes)
- **Note**: Only sent in non-debug mode

### 2. Customer Info Link Email
**Location**: `createCustomerInfoLink.js`
- **Trigger**: When admin creates customer info link
- **Recipient**: Customer email
- **Content**: Link to complete customer information form

### 3. Rental Package Emails
**Location**: `createRentalPackage.js`
- **Trigger**: After customer submits info and rental package is created
- **Recipient**: Customer email
- **Emails Sent**:
  - Mileage out (pickup) link
  - Signed contract upload link

### 4. Pickup Instructions Email
**Location**: `createPickupMileageLink.js`
- **Trigger**: When admin sets pickup instructions
- **Recipient**: Customer email
- **Content**: Pickup instructions + mileage out link

### 5. Dropoff Instructions Email
**Location**: `createDropoffMileageLink.js`
- **Trigger**: When admin sets dropoff instructions
- **Recipient**: Customer email
- **Content**: Dropoff instructions + mileage in link

### 6. Mileage Out Confirmation Email
**Location**: `submitMileageOut.js`
- **Trigger**: After customer submits pickup mileage/fuel
- **Recipient**: Customer email
- **Content**: Confirmation and next steps

### 7. Signed Contract Confirmation Email
**Location**: `submitSignedContract.js`
- **Trigger**: When customer uploads signed contract
- **Recipient**: Admin email
- **Content**: Notification that signed contract was received

### 8. Rental Completion Email
**Location**: `submitMileageIn.js`
- **Trigger**: When customer submits return mileage/fuel
- **Recipient**: Admin email
- **Content**: Rental completion summary with mileage/fuel data

## Debug Mode

When `DEBUG_MODE=true`:
- Emails are **NOT** sent
- Email previews are shown in API responses (for testing)
- All email content is returned in `debugEmail` fields

When `DEBUG_MODE=false` (production):
- Emails are sent automatically
- No email previews in responses

## Error Handling

All email sending is wrapped in try-catch blocks:
- **Email failures do NOT break the main workflow**
- Errors are logged to Firebase Functions logs
- The primary operation (link creation, data saving, etc.) still succeeds even if email fails

## Testing

### Test Email Connection

You can test the SMTP connection by temporarily adding this to a function:

```javascript
import { verifyEmailConnection } from "./common/email.js";
await verifyEmailConnection();
```

### Test in Debug Mode

1. Set `DEBUG_MODE=true` in Firebase Functions environment
2. Trigger the workflow
3. Check API responses for `debugEmail` fields
4. Verify email content is correct

### Test in Production Mode

1. Set `DEBUG_MODE=false` or remove it
2. Set all required secrets
3. Trigger the workflow
4. Check email inboxes
5. Check Firebase Functions logs for email sending status

## Troubleshooting

### Emails Not Sending

1. **Check Secrets**: Verify all secrets are set correctly
   ```bash
   firebase functions:secrets:access SMTP_EMAIL
   ```

2. **Check Logs**: Look for email errors in Firebase Functions logs
   ```bash
   firebase functions:log
   ```

3. **Verify SMTP Credentials**: 
   - Ensure email/password are correct
   - Use App Password if 2FA is enabled
   - Check if account is locked or restricted

4. **Check Network**: Ensure Firebase Functions can reach `smtp-mail.outlook.com:587`

### Common Errors

- **"Invalid login"**: Wrong password or need App Password
- **"Connection timeout"**: Network/firewall issue
- **"Authentication failed"**: Account security settings blocking access

## Next Steps

After setting up secrets:
1. Deploy functions: `firebase deploy --only functions`
2. Test in debug mode first
3. Verify email content
4. Switch to production mode
5. Monitor logs for any issues

## Files Modified

- `functions/src/common/email.js` (NEW) - Email utility module
- `functions/src/submitRequest.js` - Added admin notification email
- `functions/src/createCustomerInfoLink.js` - Added email sending
- `functions/src/createRentalPackage.js` - Added email sending
- `functions/src/createPickupMileageLink.js` - Added email sending
- `functions/src/createDropoffMileageLink.js` - Added email sending
- `functions/src/submitMileageOut.js` - Added email sending
- `functions/src/submitMileageIn.js` - Added email sending
- `functions/src/submitSignedContract.js` - Added email sending
- `functions/package.json` - Added nodemailer dependency
