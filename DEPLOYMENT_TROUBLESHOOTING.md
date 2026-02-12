# Deployment Troubleshooting: Changes Not Reflecting

If your Firebase Functions changes aren't appearing after redeploy, try these steps:

## 1. Force Clean Deployment

```powershell
# Navigate to project root
cd C:\Users\20ela\Projects\oahu-car-rental

# Deploy only the specific function to force update
firebase deploy --only functions:submitMileageIn

# Or deploy all functions
firebase deploy --only functions
```

## 2. Clear Firebase Cache

Sometimes Firebase caches the old code. Try:

```powershell
# Delete any build artifacts
Remove-Item -Recurse -Force functions\.firebase -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .firebase -ErrorAction SilentlyContinue

# Then redeploy
firebase deploy --only functions:submitMileageIn
```

## 3. Verify Changes Are Deployed

Check the deployed function code:

```powershell
# View function logs to see if new code is running
firebase functions:log --only submitMileageIn

# Or check in Firebase Console:
# Functions → submitMileageIn → Source
```

## 4. Check Function Source in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Navigate to **Functions** → **submitMileageIn**
3. Click on **Source** tab
4. Verify the code includes `createOAuthClient` import and usage

## 5. Force Function Update

If the above doesn't work, try:

```powershell
# Delete and redeploy
firebase functions:delete submitMileageIn
firebase deploy --only functions:submitMileageIn
```

**Note:** You'll need to update the hosting rewrite rules if you delete the function.

## 6. Verify Import Path

Make sure the import is correct:
- File: `functions/src/submitMileageIn.js`
- Import: `import { createOAuthClient } from "./common/oauth.js";`
- Usage: `await createOAuthClient({ ... })`

## 7. Check for Build Errors

```powershell
cd functions
npm run lint
# Fix any critical errors (warnings are usually OK)
```

## 8. Test Locally First

Before deploying, test locally:

```powershell
cd functions
npm run serve
# Test the function endpoint locally
# If it works locally, the issue is deployment-related
```

## Common Issues

1. **Cached deployment**: Firebase may cache old code - force redeploy
2. **Wrong function name**: Make sure you're deploying `submitMileageIn`
3. **Import errors**: Check that `functions/src/common/oauth.js` exists and exports `createOAuthClient`
4. **Deployment timeout**: Large functions may timeout - deploy specific function only

## Quick Fix Command

```powershell
# One-liner to force clean redeploy
Remove-Item -Recurse -Force .firebase -ErrorAction SilentlyContinue; firebase deploy --only functions:submitMileageIn
```
