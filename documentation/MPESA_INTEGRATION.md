# M-Pesa Integration Documentation

## M-Pesa STK Push Flow

### 1. Initiate STK Push (Backend)

**Frontend calls:**
```javascript
POST /api/payments/mpesa
{
  "mobileNumber": "254722000000",
  "amount": 500,
  "accountReference": "TOURNAMENT-event123-1234567890",
  "transactionDesc": "Entry fee for tournament",
  "userId": "user-id",
  "eventId": "event-id",
  "bookingType": "tournament_entry"
}
```

**Server action `processMPesaPayment` calls:**
```javascript
POST https://mpesa-integration-worker.kimaniwilfred95.workers.dev/api/stk/push
{
  "mobileNumber": "254722000000",
  "amount": 500,
  "accountReference": "TOURNAMENT-event123-1234567890",
  "transactionDesc": "Entry fee for tournament",
  "transactionId": "txn_abc123"  // Our internal ID
}
```

---

### 2. M-Pesa STK Push Response

```json
{
  "checkoutRequestId": "ws_CO_13092023140000736f0f3c1cc00b10e5",
  "responseCode": "0",
  "responseDescription": "Success. Request accepted for processing",
  "customerMessage": "Enter your M-Pesa PIN to complete this transaction.",
  "requestId": "16970-3954353-1"
}
```

**Key Fields:**
- `checkoutRequestId` - ID used to poll status
- `responseCode` - "0" = success, non-zero = error
- `responseDescription` - Human readable message
- `customerMessage` - What user sees on their phone

---

### 3. Our Database Record

After STK push is initiated, we create/update:

```prisma
paymentRecord {
  id                   // Our transaction ID (e.g., "txn_abc123")
  userId              // Player making payment
  eventId             // Tournament
  provider: "mpesa"
  providerStatus: "pending"
  providerTransactionId: "ws_CO_13092023140000736f0f3c1cc00b10e5"  // checkoutRequestId
  checkoutUrl: null   // M-Pesa doesn't need a redirect URL
  metadata: {
    mobileNumber: "254722000000",
    accountReference: "TOURNAMENT-event123-1234567890",
    transactionDesc: "Entry fee for tournament",
    amount: 500,
    currency: "KES"
  }
}
```

---

### 4. Return to Frontend

```javascript
// Tournament checkout modal receives:
{
  "success": true,
  "transactionId": "txn_abc123",
  "checkoutRequestId": "ws_CO_13092023140000736f0f3c1cc00b10e5",
  "message": "M-Pesa STK push sent. Please complete the payment on your phone."
}
```

**Frontend action:**
```javascript
// No redirect needed - user completes on their phone
// Show message: "Complete payment on your phone"
// Poll for status or wait for webhook callback
```

---

### 5. User Enters M-Pesa PIN

User receives STK push on their phone and enters PIN to authorize.

M-Pesa sends callback to payment gateway.

---

### 6. Callback Handler

**Webhook POST route (`/api/webhooks/mpesa`) receives:**

```json
{
  "transactionId": "txn_abc123",
  "checkoutRequestId": "ws_CO_13092023140000736f0f3c1cc00b10e5",
  "resultCode": 0,
  "resultDesc": "The service request has been processed successfully.",
  "mpesaReceiptNumber": "SAF62I7K0YV",
  "mpesaTransactionDate": "20230913140000",
  "mpesaAmount": 500
}
```

**Handler does:**
1. Find payment record by `transactionId`
2. Check `resultCode`:
   - `0` = Success
   - Non-zero = Failed
3. If success:
   - Update status to "completed"
   - Store M-Pesa receipt number
   - Create event registration if tournament_entry
4. Update metadata with transaction details

---

### 7. Database After Callback

```prisma
paymentRecord {
  id: "txn_abc123"
  providerStatus: "completed"  // Changed from "pending"
  providerTransactionId: "SAF62I7K0YV"  // M-Pesa receipt
  metadata: {
    mpesaReceiptNumber: "SAF62I7K0YV",
    mpesaTransactionDate: "20230913140000",
    mpesaAmount: 500,
    resultCode: 0,
    resultDesc: "The service request has been processed successfully.",
    callbackReceivedAt: "2023-09-13T14:06:30.000Z"
  }
}
```

---

## Database Schema

```prisma
model PaymentRecord {
  id                    String   @id @default(cuid())
  userId                String
  eventId               String
  bookingType           String   // tournament_entry | amenity_booking | court_booking
  amount                Decimal
  currency              String   // KES, USD, etc
  provider              String   // mpesa, paypal, stripe
  providerStatus        String   // pending, completed, failed
  providerTransactionId String?  // Receipt number or request ID
  checkoutUrl           String?  // Null for M-Pesa (no redirect)
  metadata              String   // JSON: transaction details
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}
```

---

## Complete Request-Response Cycle

```
USER FLOW:
┌──────────────────────────────────────────────────────────────────┐
│ 1. User selects "Mobile Money (M-Pesa)" in checkout             │
│    ↓                                                              │
│ 2. User enters mobile number: 254722000000                       │
│    ↓                                                              │
│ 3. Frontend sends: POST /api/payments/mpesa                      │
│    {mobileNumber, amount, userId, eventId, bookingType}          │
│    ↓                                                              │
│ 4. Backend creates PaymentRecord(status: pending)                │
│    ↓                                                              │
│ 5. Backend calls mpesa-integration-worker.dev                    │
│    ↓                                                              │
│ 6. Worker calls M-Pesa STK push API                              │
│    ↓                                                              │
│ 7. M-Pesa responds: {checkoutRequestId, responseCode, ...}       │
│    ↓                                                              │
│ 8. Backend stores: providerTransactionId=checkoutRequestId       │
│    ↓                                                              │
│ 9. Backend returns: {checkoutRequestId, transactionId, message}  │
│    ↓                                                              │
│ 10. Frontend shows: "STK prompt sent. Check your phone"           │
│    ↓                                                              │
│ 11. User receives STK push on phone                              │
│    ↓                                                              │
│ 12. User enters PIN to authorize                                 │
│    ↓                                                              │
│ 13. M-Pesa processes transaction                                 │
│    ↓                                                              │
│ 14. M-Pesa sends callback: POST /api/webhooks/mpesa              │
│     {transactionId, resultCode, mpesaReceiptNumber, ...}         │
│    ↓                                                              │
│ 15. Webhook handler verifies receipt                             │
│    ↓                                                              │
│ 16. If success: creates event registration                       │
│    ↓                                                              │
│ 17. Frontend polls or subscribes to status                       │
│    ↓                                                              │
│ 18. User sees success ✓                                          │
└──────────────────────────────────────────────────────────────────┘
```

---

## API Endpoint Summary

| Endpoint | Method | Purpose | Input |
|----------|--------|---------|-------|
| `/api/payments/mpesa` | POST | Initiate STK push | mobileNumber, amount, userId, eventId, bookingType |
| `/api/webhooks/mpesa` | POST | Handle M-Pesa callback | transactionId, resultCode, mpesaReceiptNumber, ... |

---

## Testing with Sample Flow

### 1. Backend Test - Initiate Payment
```bash
curl -X POST http://localhost:3000/api/payments/mpesa \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "mobileNumber": "254722000000",
    "amount": 500,
    "accountReference": "TEST-$(date +%s)",
    "transactionDesc": "Test tournament payment",
    "userId": "user123",
    "eventId": "event456",
    "bookingType": "tournament_entry"
  }'

# Expected response:
{
  "success": true,
  "transactionId": "txn_abc123",
  "checkoutRequestId": "ws_CO_...",
  "message": "M-Pesa STK push sent. Please complete the payment on your phone."
}
```

### 2. Frontend Test - User Experience
```javascript
// User enters mobile number
const response = await fetch('/api/payments/mpesa', {
  method: 'POST',
  body: JSON.stringify({
    mobileNumber: "254722000000",
    amount: 500,
    userId: user.id,
    eventId: tournament.id,
    bookingType: "tournament_entry"
  })
});

const data = await response.json();
if (data.success) {
  // Show: "STK push sent. Enter PIN on your phone"
  showMessage(data.message);
  // Store transactionId for later polling/status check
  sessionStorage.setItem('lastPaymentId', data.transactionId);
}
```

### 3. Callback Test - Simulate M-Pesa Response
```bash
# M-Pesa calls this after user enters PIN
curl -X POST http://localhost:3000/api/webhooks/mpesa \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "txn_abc123",
    "checkoutRequestId": "ws_CO_13092023140000736f0f3c1cc00b10e5",
    "resultCode": 0,
    "resultDesc": "The service request has been processed successfully.",
    "mpesaReceiptNumber": "SAF62I7K0YV",
    "mpesaTransactionDate": "20230913140000",
    "mpesaAmount": 500
  }'

# Response:
{
  "success": true,
  "message": "Payment confirmed",
  "transactionId": "txn_abc123"
}
```

---

## Status Values

| ResultCode | Status | Meaning |
|-----------|--------|---------|
| 0 | `completed` | Payment successful |
| 1 | `failed` | Insufficient balance |
| 1001 | `failed` | Unable to process transaction |
| 1032 | `failed` | Transaction cancelled by user |

---

## Field Validation

### Required Fields
- `mobileNumber` - Format: `254XXXXXXXXX` (Kenya)
- `amount` - Numeric, > 0
- `accountReference` - Unique identifier for transaction
- `transactionDesc` - Human readable description
- `userId` - Application user ID
- `eventId` - Tournament/event ID
- `bookingType` - One of: `tournament_entry`, `amenity_booking`, `court_booking`

### Recommended Formats
```javascript
// Good examples:
mobileNumber: "254722000000"  // ✓ Correct format
amount: 500                    // ✓ Numeric
accountReference: "TOURNAMENT-event123-1234567890"  // ✓ Unique, descriptive
transactionDesc: "Entry fee for Nairobi Tennis Cup"  // ✓ Descriptive

// Bad examples:
mobileNumber: "722000000"      // ✗ Missing country code
amount: "500"                  // ✗ String instead of number
accountReference: "test"        // ✗ Not unique
transactionDesc: ""             // ✗ Empty
```

---

## Troubleshooting

### Payment fails immediately
- ✓ Validate mobile number format: `254XXXXXXXXX`
- ✓ Check amount > 0
- ✓ Verify worker connection to M-Pesa gateway
- ✓ Check API credits/authentication

### STK doesn't send
- ✓ Verify phone number has M-Pesa enabled
- ✓ Check account balance and limits
- ✓ Try with a different number
- ✓ Review worker logs for API errors

### Callback not received
- ✓ Verify callback URL is publicly accessible
- ✓ Check that firewall allows M-Pesa IPs
- ✓ Verify webhook handler is deployed
- ✓ Check server logs for callback attempts

### User doesn't get STK prompt
- ✓ Check mobile number is correct
- ✓ Verify network connectivity
- ✓ Try manual USSD: `*150*00#`
- ✓ Check M-Pesa account status

---

## Environment Variables

Required in payment gateway (Cloudflare Worker):
```
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=174379  // Sandbox
MPESA_PASSKEY=your_passkey
MPESA_API_BASE=https://sandbox.safaricom.co.ke  // Sandbox
CALLBACK_URL=https://your-app.com/api/webhooks/mpesa
```

Switch to production:
```
MPESA_SHORTCODE=your_production_shortcode
MPESA_API_BASE=https://api.safaricom.co.ke
```

---

## Response Polling (Optional)

For immediate feedback, frontend can poll status:

```javascript
async function checkPaymentStatus(transactionId) {
  const response = await fetch(`/api/payments/status/${transactionId}`, {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const { status } = await response.json();
  return status;  // pending, completed, failed
}

// Poll every 2 seconds for up to 60 seconds
async function waitForPayment(transactionId) {
  for (let i = 0; i < 30; i++) {
    const status = await checkPaymentStatus(transactionId);
    if (status === 'completed') {
      return true;
    }
    if (status === 'failed') {
      return false;
    }
    await new Promise(r => setTimeout(r, 2000));
  }
  return null; // Timeout
}
```
