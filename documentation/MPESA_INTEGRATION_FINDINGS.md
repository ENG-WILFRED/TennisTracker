# M-Pesa Payment Integration - Findings Report

## Overview
Found 3 matches for `processMPesaPayment` function being called in the codebase.

---

## 1. FUNCTION DEFINITION

### Location: [src/actions/payments.ts](src/actions/payments.ts#L9)

**Function Signature:**
```typescript
export async function processMPesaPayment(
  mobileNumber: string,
  amount: number,
  accountReference: string,
  transactionDesc: string,
  userId: string,
  eventId: string,
  bookingType: 'tournament_entry' | 'amenity_booking' | 'court_booking'
)
```

**Parameters Being Passed:**
- `mobileNumber`: Mobile number in format 254XXXXXXXXX (Kenya)
- `amount`: Transaction amount in KES
- `accountReference`: Reference string (e.g., "TOURNAMENT-{id}-{timestamp}")
- `transactionDesc`: Description of transaction
- `userId`: User ID making the payment
- `eventId`: Tournament/Event ID
- `bookingType`: Type of booking ('tournament_entry', 'amenity_booking', 'court_booking')

**Function Behavior:**
1. Validates mobile number format (254XXXXXXXXX)
2. Creates a PaymentRecord in database
3. Calls M-Pesa worker service at: `https://mpesa-integration-worker.kimaniwilfred95.workers.dev/api/stk/push`
4. Stores metadata (mobileNumber, accountReference, transactionDesc) as JSON

---

## 2. API ENDPOINT

### Location: [src/app/api/payments/mpesa/route.ts](src/app/api/payments/mpesa/route.ts#L12)

**Endpoint:** `POST /api/payments/mpesa`

**Request Payload Structure:**
```typescript
{
  mobileNumber: string,      // User's phone number
  amount: number,            // Payment amount
  accountReference: string,  // Reference for transaction
  transactionDesc: string,   // Description
  userId: string,           // User ID
  eventId: string,          // Tournament/Event ID
  bookingType: string       // 'tournament_entry' | 'amenity_booking' | 'court_booking'
}
```

**Validation:** All fields are required except they're checked individually

---

## 3. CALL SITE #1: TOURNAMENT ENTRY PAYMENT

### Location: [src/app/tournaments/[id]/page.tsx](src/app/tournaments/[id]/page.tsx#L254)

**Context:** Tournament registration checkout flow

**Payload Being Constructed:**
```typescript
const payload = {
  userId: user.id,
  eventId: t.id,
  mobileNumber: paymentMethod === 'mobile' ? user.phone : undefined,  // ← User's phone from auth context
  bookingType: 'tournament_entry',
  amount: total,                                    // ← Entry fee
  accountReference: `TOURNAMENT-${t.id}-${Date.now()}`,
  transactionDesc: `Entry fee for ${t.name}`,
};

// Called when paymentMethod === 'mobile'
const response = await authenticatedFetch('/api/payments/mpesa', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});
```

**Form/Modal:** Payment Modal (lines 333-410 in tournament page)

**Input Fields:**
- **Payment Method Selection** (Radio buttons):
  - 💳 Credit / Debit Card
  - 🏦 Bank Transfer  
  - 📱 Mobile Money (M-Pesa)
  
  ```tsx
  [{ key: 'card', label: '💳 Credit / Debit Card' }, 
   { key: 'bank', label: '🏦 Bank Transfer' }, 
   { key: 'mobile', label: '📱 Mobile Money (M-Pesa)' }]
  ```
  
- **Mobile Number Source:** `user.phone` from authenticated user context (NOT collected from form - uses user's existing phone number)
- **Amount:** Tournament entry fee (t.entryFee)

**State Variables:**
```typescript
const [paymentMethod, setPaymentMethod] = useState('card'); // Default payment method
```

---

## 4. CALL SITE #2: AMENITY BOOKING PAYMENT

### Location: [src/app/tournaments/[id]/page.tsx](src/app/tournaments/[id]/page.tsx#L1134)

**Context:** Amenity booking (lodging, facilities, etc.) payment flow

**Payload Being Constructed:**
```typescript
const payloadBase = {
  userId: user?.id,
  eventId: tournamentId,
  bookingType: 'amenity_booking',
  amount: price,                                    // ← Amenity price
  accountReference: `AMENITY-${selectedAmenity.id}-${Date.now()}`,
  transactionDesc: `Booking ${selectedAmenity.name}`,
};

// Called when method === 'mobile'
const response = await authenticatedFetch('/api/payments/mpesa', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    ...payloadBase,
    mobileNumber: bookingData.mobileNumber || '',  // ← From booking form
    bookingType: 'amenity_booking',
  }),
});
```

**Form/Modal:** Amenity Booking Modal (lines 845-965 in tournament page)

**Input Fields:**
- **Start Time**: datetime-local input
- **End Time**: datetime-local input
- **Guest Name**: Optional text field
- **Notes**: Optional textarea field
- **Mobile Number**: Passed via `bookingData.mobileNumber` (source: extracted from form submission, implementation unclear)
- **Payment Method**: Extracted from `bookingData.paymentMethod` (source: unclear from code)

**Data Flow:**
1. User books amenity → `handleAmenityBooking(amenity)` sets modal to 'amenity-booking'
2. User fills form → `AmenityBookingModal` component submits
3. `confirmAmenityBooking(bookingData)` is called with booking details
4. Payment handler checks payment method and calls appropriate payment API

**State Variables:**
```typescript
const [selectedAmenity, setSelectedAmenity] = useState<any>(null);
```

---

## 5. KEY FINDINGS - MOBILE NUMBER SOURCES

### Tournament Entry:
- **Source**: `user.phone` from authenticated user (from auth context)
- **Collection**: NOT collected from form - uses existing profile data
- **Format Expected**: 254XXXXXXXXX (Kenya format)

### Amenity Booking:
- **Source**: `bookingData.mobileNumber` (from amenity booking submission)
- **Collection**: Form submission data, but mobile input field not visible in current code
- **Note**: The mobile number field may be conditionally shown or dynamically added

---

## 6. PAYMENT FLOW SUMMARY

```
User initiates payment
    ↓
Selects payment method (mobile/bank/card)
    ↓
For M-Pesa flow:
    - Collects mobile number (tournament: from user profile, amenity: from form)
    - Calls POST /api/payments/mpesa
    ↓
API Route Handler:
    - Validates payload
    - Calls processMPesaPayment()
    ↓
Action Function:
    - Validates mobile format
    - Creates PaymentRecord in DB
    - Calls M-Pesa worker service
    - Returns success/error
    ↓
User sees STK push on phone or error message
```

---

## 7. BOOKING TYPE USAGE

The `bookingType` parameter determines the context of payment:

1. **`tournament_entry`** (Line 254): Entry fee for tournament registration
2. **`amenity_booking`** (Line 1143): Payment for amenities/accommodations within tournament
3. **`court_booking`**: Court reservation (booking type defined but usage not found in search results)

---

## 8. NEXT STEPS TO INVESTIGATE

1. **Find mobile number collection for amenity bookings**: Search for where `bookingData.mobileNumber` is populated
2. **Find payment method selection for amenities**: Search for where `bookingData.paymentMethod` is set
3. **Find court_booking flow**: Complete the payment type coverage
4. **Check error handling**: How payment failures are handled in UI
5. **Check webhook callback**: How M-Pesa callbacks are processed in `POST /api/payments/mpesa/callback`

---

## Files Referenced

- [src/actions/payments.ts](src/actions/payments.ts) - Server action implementation
- [src/app/api/payments/mpesa/route.ts](src/app/api/payments/mpesa/route.ts) - API endpoint
- [src/app/tournaments/[id]/page.tsx](src/app/tournaments/[id]/page.tsx) - UI/forms
