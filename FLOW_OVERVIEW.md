# Oahu Car Rental - Flow Overview

## Current Booking & Rental Flow

### Phase 1: Customer Request
1. **Customer submits request** (`/request`)
   - Customer fills out QuickRequestCard form
   - Submits: name, email, dates, car types, price range, notes
   - Request saved to Google Sheets ("Incoming Requests" tab)
   - Customer redirected to `/request/success`

### Phase 2: Admin Processing
2. **Admin reviews request** (manual - via Google Sheets)
   - Admin reviews incoming requests
   - Determines availability and pricing

3. **Admin creates customer info link** (`/admin/request-customer-info`)
   - Admin enters:
     - VIN, Make, Model, Color, License Plate
     - Start Date, End Date
     - Customer Email
     - Cost Per Day
   - System generates encrypted customer info link
   - **TODO**: Send email to customer with link + start scheduler
   - Link format: `/admin/customer-info?t=<token>`

### Phase 3: Customer Information Collection
4. **Customer completes info form** (`/admin/customer-info?t=...`)
   - Customer enters:
     - Driver 1 info (personal, license, insurance, employer)
     - Optional Driver 2 info
     - Uploads: insurance photos, license photos, selfies (for each driver)
   - System validates all required fields
   - On submit: calls `/api/createRentalPackage`
   - System generates:
     - Filled contract PDF (with customer data)
     - Admin pickup instructions link
     - Admin dropoff instructions link
     - Customer signed contract upload link
     - Customer mileage out (pickup) link
   - **TODO**: Send email to customer with mileageOutUrl + signedContractUrl + start scheduler
   - Customer redirected to `/success`

### Phase 4: Pre-Pickup
5. **Admin sets pickup instructions** (`/admin/pickup-instructions?t=...`)
   - Admin enters pickup address and instructions
   - System generates customer mileage out link
   - **TODO**: Send email to customer with instructions + mileageOutUrl (non-debug mode)

6. **Customer uploads signed contract** (`/signedContract?t=...`)
   - Customer uploads PDF of signed contract
   - Contract saved to Google Drive
   - **TODO**: Email admin confirmation (optional)

### Phase 5: Pickup
7. **Customer submits mileage out** (`/mileageOut?t=...`)
   - Customer enters:
     - Mileage (integer)
     - Fuel level (E, 1/8, 1/4, 3/8, 1/2, 5/8, 3/4, 7/8, F)
     - Dashboard photo
   - System saves to Google Drive
   - System generates mileage in (return) link
   - **TODO**: Email customer next-step instructions

### Phase 6: Dropoff
8. **Admin sets dropoff instructions** (`/admin/dropoff-instructions?t=...`)
   - Admin enters dropoff address and instructions
   - System generates customer mileage in link
   - **TODO**: Send email to customer with mileageInUrl + dropoff instructions (non-debug mode)

9. **Customer submits mileage in** (`/mileageIn?t=...`)
   - Customer enters:
     - Mileage (integer)
     - Fuel level
     - Dashboard photo
   - System saves to Google Drive
   - **TODO**: Email admin + start scheduler

---

## Current System Architecture

### Frontend Routes
- `/` - Home page
- `/request` - Customer request form
- `/request/success` - Request confirmation
- `/admin/request-customer-info` - Admin: Create customer info link
- `/admin/customer-info?t=...` - Customer: Fill out info form
- `/success` - Customer: Success after info submission
- `/admin/pickup-instructions?t=...` - Admin: Set pickup instructions
- `/admin/dropoff-instructions?t=...` - Admin: Set dropoff instructions
- `/mileageOut?t=...` - Customer: Submit pickup mileage/fuel
- `/mileageIn?t=...` - Customer: Submit return mileage/fuel
- `/signedContract?t=...` - Customer: Upload signed contract
- `/gallery` - Vehicle gallery
- `/faq` - FAQ page
- `/about` - About page

### Backend Functions (Firebase)
- `submitRequest` - Save customer request to Google Sheets
- `createCustomerInfoLink` - Generate encrypted customer info link
- `decodeCustomerInfoLink` - Decode and validate customer info link
- `createRentalPackage` - Generate contract PDF and all subsequent links
- `decodeAdminInstructionLink` - Decode admin instruction links
- `createPickupMileageLink` - Generate customer pickup (mileage out) link
- `createDropoffMileageLink` - Generate customer return (mileage in) link
- `decodeMileageLink` - Decode mileage links
- `submitMileageOut` - Save pickup mileage/fuel data
- `submitMileageIn` - Save return mileage/fuel data
- `submitSignedContract` - Save signed contract PDF

### Data Storage
- **Google Sheets**: Customer requests, rental data
- **Google Drive**: 
  - Contract PDFs (filled and signed)
  - Mileage/fuel photos
  - Customer documents (insurance, licenses, selfies)

### Security
- Admin routes protected by `AdminGate` component (requires admin secret)
- All customer-facing links use encrypted tokens
- Tokens include expiration (7 days default)

### Debug Mode
- When `VITE_DEBUG_MODE=true`:
  - Email previews shown in UI instead of sending
  - Links displayed for testing
  - Admin instruction links shown on success page

---

## Outstanding TODOs

### Email Automation (7 items)
1. **Customer Info Link Email** (`AdminRequestCustomerInfo.jsx`)
   - Send email when admin creates customer info link
   - Include link and start scheduler

2. **Rental Package Email** (`createRentalPackage.js`)
   - Send email after rental package creation
   - Include mileageOutUrl + signedContractUrl
   - Start scheduler

3. **Pickup Instructions Email** (`createPickupMileageLink.js`, `AdminPickupInstructions.jsx`)
   - Send email when admin generates pickup instructions
   - Include instructions + mileageOutUrl
   - Only in non-debug mode

4. **Dropoff Instructions Email** (`createDropoffMileageLink.js`, `AdminDropoffInstructions.jsx`)
   - Send email when admin generates dropoff instructions
   - Include mileageInUrl + dropoff instructions
   - Only in non-debug mode

5. **Mileage Out Next Steps** (`submitMileageOut.js`)
   - Email customer next-step instructions after mileage out submission

6. **Signed Contract Confirmation** (`submitSignedContract.js`)
   - Email admin confirmation when customer uploads signed contract
   - Optional (marked as "keep as TODO only")

7. **Rental Completion Email** (`submitMileageIn.js`)
   - Email admin when rental is completed
   - Start scheduler

### Scheduler Integration
- Need to implement scheduled tasks for:
  - Reminders before pickup
  - Reminders before dropoff
  - Follow-ups after completion

---

## Flow Diagram

```
Customer Request
    ↓
Admin Reviews (Google Sheets)
    ↓
Admin Creates Customer Info Link
    ↓ [TODO: Email customer]
Customer Fills Info Form
    ↓
System Creates Rental Package
    ↓ [TODO: Email customer with links]
Admin Sets Pickup Instructions
    ↓ [TODO: Email customer]
Customer Uploads Signed Contract
    ↓ [TODO: Email admin (optional)]
Customer Submits Mileage Out (Pickup)
    ↓ [TODO: Email customer next steps]
Admin Sets Dropoff Instructions
    ↓ [TODO: Email customer]
Customer Submits Mileage In (Return)
    ↓ [TODO: Email admin + scheduler]
Rental Complete
```

---

## Notes
- All links use encrypted tokens for security
- Debug mode allows testing without sending emails
- Google Drive integration for document storage
- Google Sheets for request tracking
- Contract PDFs are auto-filled with customer data
