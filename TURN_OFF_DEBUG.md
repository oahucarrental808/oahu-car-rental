# Turning Off Debug Mode

This document explains how to disable debug mode for both frontend and backend.

## Backend (Firebase Functions)

The `DEBUG_MODE` parameter defaults to `"false"` in `functions/src/common/config.js`. 

### To ensure it's disabled:

1. **Check current value:**
   ```bash
   firebase functions:config:get
   ```

2. **Set to false (if needed):**
   - Via Firebase Console:
     - Go to Firebase Console → Functions → Configuration
     - Set `DEBUG_MODE` to `false`
   
   - Via Firebase CLI (if using environment variables):
     ```bash
     # Set in .env file in functions directory
     DEBUG_MODE=false
     ```

3. **Verify it's disabled:**
   - The `DEBUG_MODE` parameter defaults to `"false"` in the code
   - Check function logs - debug logging should be minimal

## Frontend (Vite)

The frontend no longer uses a build-time debug flag.

### How it works now:

- The UI reads debug mode **at runtime** from `GET /api/health` (`data.debugMode`).
- That value is controlled by Firebase Functions `DEBUG_MODE`.

## What Gets Disabled

### Backend:
- Detailed debug logging in `adminAuth.js` (session verification, token previews)
- Verbose error stack traces in error responses
- Debug email previews in API responses

### Frontend:
- Console.log statements for session checking, login responses
- Debug UI elements (email previews, debug links)
- Debug information in success pages

## Verification

1. **Backend:** Check function logs - should see minimal logging
2. **Frontend:** Check browser console - should see no debug logs
3. **UI:** Debug sections should not appear in the interface

## Notes

- `console.error` statements are kept for actual errors (important for production debugging)
- `logger.warn` and `logger.error` in backend are kept (important for monitoring)
- Only verbose `logger.info` and `console.log` statements are disabled
