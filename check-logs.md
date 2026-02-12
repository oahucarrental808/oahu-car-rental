# Firebase Logs Commands

Use these commands to check Firebase Functions logs and diagnose SMS issues.

## Quick Commands

### View Recent Logs for submitRequest Function
```bash
firebase functions:log --only submitRequest
```

### View All Recent Logs (Last 50 entries)
```bash
firebase functions:log
```

### View Logs with Specific Number of Lines
```bash
# View last 100 lines
firebase functions:log --only submitRequest -n 100

# View last 50 lines
firebase functions:log --only submitRequest -n 50
```

### Filter Logs by Text (Search for SMS-related logs)
```bash
firebase functions:log --only submitRequest -n 100 | grep -i "sms"
```

### Open Logs in Web Browser
```bash
firebase functions:log --open
```

## Using Google Cloud Console (Web UI)

1. Go to: https://console.cloud.google.com/logs/query?project=oahu-car-rentals
2. Or navigate: Google Cloud Console → Logging → Logs Explorer
3. Filter by:
   - Resource type: `cloud_function`
   - Function name: `submitRequest`
   - Search for: `SMS` or `sms`

## What to Look For

After submitting a request, check logs for:

1. **Debug Mode Check:**
   ```
   "Debug mode enabled - skipping email and SMS notifications"
   ```
   If you see this, SMS won't be sent. Fix: Set `DEBUG_MODE=false`

2. **Missing ADMIN_NUMBER:**
   ```
   "SMS not sent: ADMIN_NUMBER secret is not set or empty"
   ```
   Fix: Set the secret: `firebase functions:secrets:set ADMIN_NUMBER`

3. **Phone Number Format Issue:**
   ```
   "SMS not sent: Failed to format phone number"
   ```
   Fix: Ensure ADMIN_NUMBER is in E.164 format (e.g., `+1234567890`)

4. **SMS Send Success:**
   ```
   "New request notification SMS sent to admin"
   ```
   This means SMS was sent successfully.

5. **SMS Send Error:**
   ```
   "Failed to send new request notification SMS"
   ```
   Check the error message for details.

## PowerShell Commands (Windows)

If using PowerShell on Windows:

```powershell
# View recent logs
firebase functions:log --only submitRequest

# Filter for SMS logs
firebase functions:log --only submitRequest | Select-String -Pattern "SMS"

# View logs in real-time
firebase functions:log --only submitRequest --follow
```

## Check Configuration

### Check if DEBUG_MODE is set
```bash
# This will show in logs, but you can also check via:
firebase functions:config:get
```

### Check if ADMIN_NUMBER secret exists
```bash
firebase functions:secrets:access ADMIN_NUMBER
```

### List all secrets
```bash
firebase functions:secrets:access
```

## Example Workflow

1. **Submit a test request** from your application
2. **Immediately check logs:**
   ```bash
   firebase functions:log --only submitRequest --limit 20
   ```
3. **Look for SMS-related messages** in the output
4. **Identify the issue** based on the log messages above
5. **Fix the configuration** and test again
