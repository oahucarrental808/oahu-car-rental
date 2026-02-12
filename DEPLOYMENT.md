# Deployment Guide

## Overview

This guide covers deploying the Oahu Car Rental application to Firebase Hosting and Functions.

## Prerequisites

1. **Firebase CLI installed**
   ```bash
   npm install -g firebase-tools
   ```

2. **Firebase project initialized**
   ```bash
   firebase login
   firebase init
   ```

3. **All secrets configured**
   - See [SECRETS_MANAGEMENT.md](./SECRETS_MANAGEMENT.md) for details
   - Ensure all required secrets are set

## Custom Domain Setup

### Adding a Custom Domain to Firebase Hosting

To use your custom domain `oahu-car-rentals.com`:

1. **Add Domain in Firebase Console**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project: `oahu-car-rentals`
   - Navigate to **Hosting** → **Add custom domain**
   - Enter your domain: `oahu-car-rentals.com`
   - Follow the verification steps

2. **DNS Configuration**
   - Firebase will provide DNS records to add to your domain registrar
   - Add the A record and/or CNAME record as instructed
   - Wait for DNS propagation (can take up to 48 hours, usually much faster)

3. **SSL Certificate**
   - Firebase automatically provisions SSL certificates for custom domains
   - SSL will be active once DNS is verified

4. **Update CORS Configuration**
   - The domain `https://oahu-car-rentals.com` has been added to allowed origins
   - After deploying, the domain will be automatically allowed for API requests

5. **Verify Domain**
   ```bash
   # Test the domain is accessible
   curl https://oahu-car-rentals.com
   
   # Verify CORS is working
   curl -H "Origin: https://oahu-car-rentals.com" \
        -H "Access-Control-Request-Method: POST" \
        -X OPTIONS \
        https://oahu-car-rentals.com/api/health
   ```

## Environment Configuration

### Setting Environment Variables

Firebase Functions v2 uses `defineString()` for parameters. These can be set via:

1. **Firebase Console** (Recommended):
   - Go to Firebase Console → Functions → Configuration
   - Add environment variables as needed
   - For `BASE_URL`, set it to `https://oahu-car-rentals.com`

2. **Default Values in Code**:
   - Parameters have defaults set in `functions/src/common/config.js`
   - `BASE_URL` defaults to `https://oahu-car-rentals.com`
   - If not set in console, the default will be used

**Note**: The old `firebase functions:config:set` command does NOT work with Firebase Functions v2. Use the Firebase Console instead.

### Environment-Specific Settings

1. **Development**
   - `ENVIRONMENT=development`
   - `DEBUG_MODE=true`
   - `BASE_URL=http://localhost:5173` (or your dev URL)

2. **Staging** (if applicable)
   - `ENVIRONMENT=staging`
   - `DEBUG_MODE=true`
   - `BASE_URL=https://staging.yourdomain.com`

3. **Production**
   - `ENVIRONMENT=production`
   - `DEBUG_MODE=false`
   - `BASE_URL=https://oahu-car-rentals.com` (default is already set in code)

## Deployment Steps

### 1. Pre-Deployment Checklist

- [ ] All secrets are set in Firebase
- [ ] Environment variables are configured
- [ ] Code is tested locally
- [ ] `.env` file is not committed (check `.gitignore`)
- [ ] Build passes without errors

### 1.5. Update Secrets (If Needed)

**Important**: If you've updated any secrets, you **must** redeploy functions for them to take effect.

```bash
# Update a secret
firebase functions:secrets:set SECRET_NAME

# Then redeploy functions to use the new secret version
firebase deploy --only functions
```

**Note**: Secrets are bound to functions at deployment time. After updating a secret value, redeploy the functions that use it. See [SECRETS_MANAGEMENT.md](./SECRETS_MANAGEMENT.md) for more details.

### 2. Build Frontend

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Verify build output
ls -la dist/
```

### 3. Deploy Functions

```bash
# Deploy all functions
firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:submitRequest

# Deploy with environment variables
firebase deploy --only functions --project your-project-id
```

### 4. Deploy Hosting

```bash
# Deploy hosting
firebase deploy --only hosting

# Deploy both functions and hosting
firebase deploy
```

### 5. Verify Deployment

1. **Check Function Logs**
   ```bash
   firebase functions:log
   ```

2. **Test API Endpoints**
   - Visit your deployed site
   - Test form submissions
   - Check email delivery (if not in debug mode)

3. **Verify Health Check**
   ```bash
   curl https://us-central1-oahu-car-rentals.cloudfunctions.net/health
   ```

## Health Check Endpoint

A health check endpoint is available at `/api/health` to verify deployment status.

**Endpoint:** `GET /api/health`

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production",
  "version": "1.0.0"
}
```

## Rollback Procedure

If deployment fails or issues are discovered:

1. **Rollback Functions**
   ```bash
   # List recent deployments
   firebase functions:list
   
   # Rollback to previous version (manual process)
   # Redeploy previous working version from git
   git checkout <previous-commit>
   firebase deploy --only functions
   ```

2. **Rollback Hosting**
   ```bash
   # Firebase Hosting keeps previous versions
   # Go to Firebase Console → Hosting → Releases
   # Click "Rollback" on previous version
   ```

## Continuous Deployment

### GitHub Actions (Example)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Firebase

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - run: npm run build
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          projectId: oahu-car-rentals
```

## Monitoring

### Function Monitoring

1. **Firebase Console**
   - Go to Functions → Dashboard
   - View execution metrics, errors, logs

2. **Cloud Logging**
   ```bash
   firebase functions:log --limit 50
   ```

### Hosting Monitoring

1. **Firebase Console**
   - Go to Hosting → Dashboard
   - View traffic, performance metrics

2. **Analytics** (if configured)
   - Google Analytics integration
   - Custom event tracking

## Troubleshooting

### Functions Not Deploying

- **Error:** "Permission denied"
  - Solution: Check Firebase project permissions
  - Verify you're logged in: `firebase login`

- **Error:** "Secret not found"
  - Solution: Set missing secrets (see SECRETS_MANAGEMENT.md)

- **Issue:** Function using old secret value after updating
  - Solution: **Redeploy functions** after updating secrets - secrets are bound at deployment time
  - Run: `firebase deploy --only functions`

### Hosting Not Updating

- **Issue:** Changes not visible after deployment
  - Solution: Clear browser cache
  - Check Firebase Console for deployment status

### CORS Errors

- **Error:** "Not allowed by CORS"
  - Solution: Update `ALLOWED_ORIGINS` environment variable
  - Verify CORS configuration in `functions/src/common/cors.js`

### Build Failures

- **Error:** Build errors
  - Solution: Run `npm run build` locally first
  - Check for TypeScript/ESLint errors
  - Verify all dependencies are installed

## Post-Deployment

1. **Test Critical Flows**
   - Customer request submission
   - Admin link creation
   - File uploads
   - Email delivery

2. **Monitor Logs**
   - Watch for errors in first 24 hours
   - Check email delivery status
   - Verify Google Drive uploads

3. **Update Documentation**
   - Note any deployment-specific changes
   - Update version numbers if applicable

## Security Checklist

- [ ] All secrets are set (not hardcoded)
- [ ] CORS is properly configured
- [ ] Environment variables are set correctly
- [ ] Debug mode is disabled in production
- [ ] No sensitive data in client code
- [ ] Error messages don't leak sensitive info

## Version Management

Track versions in:
- `package.json` (frontend)
- `functions/package.json` (backend)
- Git tags for releases

Example:
```bash
git tag -a v1.0.0 -m "Production release"
git push origin v1.0.0
```
