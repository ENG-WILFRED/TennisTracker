# Payment Integration: Issues & Fixes

## 🔴 Issues Identified

### 1. **Missing Required Fields - M-Pesa 400 Error**
**Problem:** POST `/api/payments/mpesa` returns 400 (Bad Request) when `mobileNumber` is `undefined`.

**Root Cause:** 
- In `src/app/tournaments/[id]/page.tsx`, the checkout modal was sending:
  ```javascript
  mobileNumber: paymentMethod === 'mobile' ? user.phone : undefined,
  ```
- If `user.phone` is not set, the API route rejects the request with missing field error.
- The route handler was giving generic error messages without specifying which fields were missing.

**Impact:**
- M-Pesa payments fail silently with 400 error
- Users don't know which field is missing
- No validation before API call

### 2. **Chat Authentication Errors - 401 Unauthorized**
**Problem:** GET requests to `/api/chat/me` and `/api/chat/rooms` return 401.

**Possible Causes:**
- JWT token is expired or invalid
- Token refresh mechanism not working
- `getAuthHeader()` in `tokenManager.ts` may be returning null/undefined

**Status:** This is separate from payment issues - requires session/auth debugging

---

## ✅ Fixes Applied

### Fix 1: Enhanced Route Validation & Logging

**Files Modified:**
- `src/app/api/payments/mpesa/route.ts`
- `src/app/api/payments/paypal/route.ts`
- `src/app/api/payments/stripe/route.ts`

**What Changed:**
1. Added detailed field-by-field validation
2. Specific error messages listing exactly which fields are missing
3. Logged validation results for debugging
4. Added safety checks for null/undefined values
5. Standardized response headers with `'Content-Type': 'application/json'`

**Example - M-Pesa Route:**
```javascript
// Before: Generic error
if (!mobileNumber || !amount || !userId || !eventId || !bookingType) {
  return new Response(JSON.stringify({ success: false, error: 'Missing required fields' }), ...);
}

// After: Specific errors
const errors = [];
if (!mobileNumber) errors.push('mobileNumber');
if (!amount || amount <= 0) errors.push('amount');
// ... etc

if (errors.length > 0) {
  const errorMsg = `Missing required fields: ${errors.join(', ')}`;
  console.error('M-Pesa validation failed:', errorMsg);
  return new Response(JSON.stringify({ success: false, error: errorMsg }), ...);
}
```

### Fix 2: Mobile Number Validation in Checkout Modal

**File Modified:**
- `src/app/tournaments/[id]/page.tsx` - `CheckoutModal` component

**What Changed:**
1. Added `mobileNumber` state: `const [mobileNumber, setMobileNumber] = useState<string>(user?.phone || '');`
2. Added mobile number input field that shows only when 'mobile' payment is selected
3. Added regex validation before sending request:
   ```javascript
   if (!mobileNumber || !mobileNumber.match(/^254\d{9}$/)) {
     setError('Invalid mobile number. Please use format: 254XXXXXXXXX');
     return;
   }
   ```
4. Updated payload to use the validated mobile number

**UI Changes:**
- Mobile Money option now shows an input field
- Field accepts `254XXXXXXXXX` format (Kenya numbers)
- Helper text explains the required format
- Validation happens before API call

---

## 📋 Required Fields Summary

### M-Pesa Route (`POST /api/payments/mpesa`)
**Required:**
- `mobileNumber` - String, format: `254XXXXXXXXX`
- `amount` - Number, > 0
- `userId` - String
- `eventId` - String
- `bookingType` - Enum: `tournament_entry | amenity_booking | court_booking`

**Optional:**
- `accountReference` - Default: auto-generated
- `transactionDesc` - Default: auto-generated

### PayPal Route (`POST /api/payments/paypal`)
**Required:**
- `amount` - Number, > 0
- `currency` - String (e.g., "USD")
- `userId` - String
- `eventId` - String
- `bookingType` - Enum: `tournament_entry | amenity_booking | court_booking`

**Optional:**
- `metadata` - Object

### Stripe Route (`POST /api/payments/stripe`)
**Required:**
- `amount` - Number, > 0
- `currency` - String (e.g., "usd")
- `userId` - String
- `eventId` - String
- `bookingType` - Enum: `tournament_entry | amenity_booking | court_booking`

**Optional:**
- `metadata` - Object

---

## 🧪 Testing Checklist

### 1. **M-Pesa Payment Flow**
- [ ] Select "Mobile Money (M-Pesa)" in tournament checkout
- [ ] Verify input field appears for mobile number
- [ ] Enter valid phone: `254722000000`
- [ ] Click "Confirm & Pay"
- [ ] Check browser console for detailed error if it fails
- [ ] Verify console shows specifc missing fields (if any)

### 2. **PayPal Payment Flow**
- [ ] Select "Bank Transfer" in tournament checkout
- [ ] Verify amount and currency are sent
- [ ] Click "Confirm & Pay"
- [ ] Should redirect to PayPal approve URL

### 3. **Stripe Payment Flow**
- [ ] Select "Credit / Debit Card" in tournament checkout
- [ ] Verify amount and currency are sent
- [ ] Click "Confirm & Pay"
- [ ] Should redirect to Stripe checkout URL

### 4. **Error Handling**
- [ ] Try paying without mobile number selected
- [ ] Try invalid mobile number (e.g., `123456`)
- [ ] Check that specific error messages appear

### 5. **Amenity Booking**
- [ ] Book an amenity
- [ ] Verify mobile number input works
- [ ] Test M-Pesa payment for amenity

### 6. **Chat Authentication (Separate Issue)**
- [ ] Check token expiration in localStorage
- [ ] Manually test `/api/chat/me` with valid auth header
- [ ] Check if session needs to be refreshed

---

## 🔧 Debug Commands

### Check Payment Route Logs
```bash
# Look for validation errors in console
npm run dev
# Check browser console for: "M-Pesa validation failed: ..."
# Check server console for: "M-Pesa route received: ..."
```

### Test M-Pesa Endpoint Directly
```bash
curl -X POST http://localhost:3000/api/payments/mpesa \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "userId": "USER_ID",
    "eventId": "EVENT_ID",
    "mobileNumber": "254722000000",
    "amount": 500,
    "bookingType": "tournament_entry",
    "accountReference": "TEST-$(date +%s)",
    "transactionDesc": "Test payment"
  }'
```

### Check TokenManager
```javascript
// In browser console:
const tokens = JSON.parse(localStorage.getItem('authTokens'));
console.log('Tokens:', tokens);
console.log('Access expired:', Date.now() >= tokens.expiresAt);
```

---

## 📝 Next Steps

1. **Verify fixes work** - Test all three payment methods with the new validation
2. **Check amenity booking** - Ensure mobile input field appears there too
3. **Debug chat 401** - Investigate JWT token refresh mechanism
4. **Add logging** - Consider adding more detailed payment flow logging to DB
5. **Test callbacks** - Verify webhook routes receive callbacks correctly

---

## 🚀 Key Improvements

✅ Better error messages - Users know exactly which field is missing
✅ Client-side validation - Mobile number validated before API call
✅ Mobile input field - No more relying on user.phone
✅ Detailed logging - Server logs show all received fields
✅ Consistent validation - All three payment routes follow same pattern
