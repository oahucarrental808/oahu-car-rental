# Admin Instructions Flow

## Overview

Admin instruction links (pickup and dropoff) are now created automatically when the rental package is generated (when customer submits their information). These links will be sent to the admin via Pub/Sub in the future.

## Current Implementation

### When Links Are Created

**Location**: `createRentalPackage.js`

When a customer completes their information form and the rental package is created, the system now generates:

1. **Admin Pickup Instructions Link** (`pickupInstructionsUrl`)
   - Phase: `admin_pickup`
   - Expiration: 30 days
   - URL: `/admin/pickup-instructions?t=<token>`

2. **Admin Dropoff Instructions Link** (`dropoffInstructionsUrl`)
   - Phase: `admin_dropoff`
   - Expiration: 30 days
   - URL: `/admin/dropoff-instructions?t=<token>`

### Response Format

The `createRentalPackage` API now returns:

```json
{
  "ok": true,
  "folderLink": "...",
  "contractLink": "...",
  "signedContractUrl": "...",
  "pickupInstructionsUrl": "https://oahu-car-rentals.web.app/admin/pickup-instructions?t=...",
  "dropoffInstructionsUrl": "https://oahu-car-rentals.web.app/admin/dropoff-instructions?t=..."
}
```

### Phase Standardization

- **New standard**: `admin_pickup` and `admin_dropoff` (matches `decodeAdminInstructionLink`)
- **Legacy support**: `pickupAdmin` and `dropoffAdmin` (still accepted for backward compatibility)

## Future Pub/Sub Integration

### Planned Implementation

The admin instruction links will be sent to the admin via Pub/Sub at specific times:

1. **Pickup Instructions Link**
   - **When**: 3 days before check-in date (`startDate - 3 days`)
   - **Topic**: `admin-pickup-reminder`
   - **Message**: Contains pickup instructions link and rental details

2. **Dropoff Instructions Link**
   - **When**: 1 day before check-out date (`endDate - 1 day`)
   - **Topic**: `admin-dropoff-reminder`
   - **Message**: Contains dropoff instructions link and rental details

### Pub/Sub Message Format (Proposed)

```json
{
  "rentalId": "folderId",
  "vin": "...",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "customerEmail": "...",
  "pickupInstructionsUrl": "https://...",
  "dropoffInstructionsUrl": "https://...",
  "reminderType": "pickup" | "dropoff"
}
```

### Implementation Steps (Future)

1. **Create Cloud Scheduler jobs**:
   - Schedule job for pickup reminder (3 days before startDate)
   - Schedule job for dropoff reminder (1 day before endDate)

2. **Create Pub/Sub topics**:
   - `admin-pickup-reminder`
   - `admin-dropoff-reminder`

3. **Create Pub/Sub subscribers**:
   - Email function that sends admin instruction links to admin email
   - Could also integrate with other notification systems

4. **Store rental data**:
   - When rental package is created, store rental info in Firestore or similar
   - Include pickup/dropoff instruction URLs
   - Use this data to trigger scheduled reminders

## Current Admin Flow

1. Admin receives links (currently via debug mode or manual sharing)
2. Admin clicks pickup instructions link
3. Admin enters pickup address and instructions
4. System generates customer mileage out link
5. Customer receives email with pickup info + mileage out link
6. (Later) Admin clicks dropoff instructions link
7. Admin enters dropoff address and instructions
8. System generates customer mileage in link
9. Customer receives email with dropoff info + mileage in link

## Files Modified

- `functions/src/createRentalPackage.js` - Added admin instruction link creation
- `functions/src/createPickupMileageLink.js` - Updated to accept both phase formats
- `functions/src/createDropoffMileageLink.js` - Updated to accept both phase formats

## Notes

- Admin links have 30-day expiration (vs 7 days for customer links)
- Links are created immediately but not sent automatically yet
- Frontend already handles these links in debug mode
- Phase values standardized to `admin_pickup` and `admin_dropoff` for new links
- Legacy phase values (`pickupAdmin`, `dropoffAdmin`) still supported for backward compatibility
