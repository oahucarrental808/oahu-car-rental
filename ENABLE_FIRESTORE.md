# Enable Firestore API

## Quick Fix

1. **Visit the Google Cloud Console:**
   - Go to: https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=oahu-car-rentals
   - Or navigate: Google Cloud Console → APIs & Services → Enable APIs → Search "Cloud Firestore API" → Enable

2. **Alternative via Firebase Console:**
   - Go to: https://console.firebase.google.com/project/oahu-car-rentals/firestore
   - Click "Create database" if prompted
   - Choose "Start in test mode" (you can secure it later)

3. **Wait a few minutes** for the API to propagate

4. **Retry your login**

## Why Firestore is Needed

The admin authentication system uses Firestore to store session tokens. This is necessary because:
- Firebase Functions run on different serverless instances
- In-memory storage doesn't persist across instances
- Firestore provides persistent storage accessible from all instances

## Note

Your project already uses Firestore in `createRentalPackage.js` (for storing rental data), so enabling it is safe and necessary for the full application to work.
