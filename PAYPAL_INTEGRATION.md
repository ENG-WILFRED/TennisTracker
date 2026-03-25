# PayPal Integration Documentation

## PayPal Payment Flow

### 1. Create Order (Backend)

**Frontend calls:**
```javascript
POST /api/payments/paypal
{
  "amount": 500,
  "currency": "USD",
  "userId": "user-id",
  "eventId": "event-id",
  "bookingType": "tournament_entry",
  "metadata": { ... }
}
```

**Server action `processPayPalPayment` calls:**
```javascript
POST https://payment-gateway.kimaniwilfred95.workers.dev/api/payments/paypal
```

**Payment gateway (Cloudflare Worker) creates PayPal order via:**
```javascript
POST https://api.sandbox.paypal.com/v2/checkout/orders
{
  "intent": "CAPTURE",
  "purchase_units": [{
    "amount": {
      "currency_code": "USD",
      "value": "500.00"
    }
  }]
}
```

---

### 2. PayPal Response (Sample from your example)

```json
{
  "orderId": "5H065994EC1067026",
  "links": [
    {
      "href": "https://api.sandbox.paypal.com/v2/checkout/orders/5H065994EC1067026",
      "rel": "self",
      "method": "GET"
    },
    {
      "href": "https://www.sandbox.paypal.com/checkoutnow?token=5H065994EC1067026",
      "rel": "approve",
      "method": "GET"
    },
    {
      "href": "https://api.sandbox.paypal.com/v2/checkout/orders/5H065994EC1067026",
      "rel": "update",
      "method": "PATCH"
    },
    {
      "href": "https://api.sandbox.paypal.com/v2/checkout/orders/5H065994EC1067026/capture",
      "rel": "capture",
      "method": "POST"
    }
  ],
  "approvalUrl": "https://www.sandbox.paypal.com/checkoutnow?token=5H065994EC1067026",
  "status": "pending"
}
```

**Key Fields:**
- `orderId` - PayPal's unique order ID (same as token in approve URL)
- `approvalUrl` - URL where user approves payment (contains token/order ID)
- `status` - Always "pending" at creation
- `links` - HATEOAS links for subsequent operations

---

### 3. Our Database Record

After gateway responds, `processPayPalPayment` creates/updates:

```prisma
paymentRecord {
  id                   // Our transaction ID (e.g., "txn_abc123")
  userId              // Tournament participant
  eventId             // Tournament being paid for
  provider: "paypal"
  providerStatus: "pending"
  providerTransactionId: "5H065994EC1067026"  // PayPal orderId
  checkoutUrl: "https://www.sandbox.paypal.com/checkoutnow?token=5H065994EC1067026"
  metadata: {
    amount: 500,
    currency: "USD",
    paymentMethod: "paypal",
    ...
  }
}
```

---

### 4. Return to Frontend

```javascript
// Tournament checkout modal receives:
{
  "success": true,
  "transactionId": "txn_abc123",           // Our internal ID
  "approveUrl": "https://www.sandbox.paypal.com/checkoutnow?token=...",
  "orderId": "5H065994EC1067026"           // PayPal order ID
}
```

**Frontend action:**
```javascript
if (data.approveUrl) {
  window.location.href = data.approveUrl;  // Redirect to PayPal
}
```

---

### 5. User Approves on PayPal

User logs into PayPal sandbox and clicks "Approve"

PayPal redirects back to:
```
GET /api/webhooks/paypal?transactionId=txn_abc123&token=5H065994EC1067026&PayerID=PAYERID123
```

**Note:** The `token` parameter IS the PayPal order ID

---

### 6. Callback Handler

**Webhook GET route (`/api/webhooks/paypal`) receives:**
- `transactionId` - Our internal transaction ID
- `token` - PayPal's order ID (used for capture)
- `PayerID` - PayPal payer identifier

**Handler does:**
1. Find our payment record by `transactionId`
2. Update status to "completed"
3. Store PayPal metadata (token, payerId, timestamp)
4. If tournament entry: Create event registration
5. Redirect user to success page: `/tournaments/{eventId}?payment=success`

---

### 7. Capture Payment

After callback, the payment gateway should:

```bash
POST https://api.sandbox.paypal.com/v2/checkout/orders/{orderId}/capture
Authorization: Bearer {paypal_access_token}
```

This actually captures the funds (moves from pending to completed).

---

## Database Schema

```prisma
model PaymentRecord {
  id                    String   @id @default(cuid())
  userId                String
  eventId               String
  bookingType           String   // tournament_entry | amenity_booking | court_booking
  amount                Decimal
  currency              String   // USD, KES, etc
  provider              String   // paypal, stripe, mpesa
  providerStatus        String   // pending, completed, failed
  providerTransactionId String?  // orderId for PayPal, sessionId for Stripe, etc
  checkoutUrl           String?  // PayPal/Stripe checkout URL
  metadata              String   // JSON: { amount, currency, paymentMethod, ... }
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}
```

---

## Complete Request-Response Cycle

```
USER FLOW:
┌─────────────────────────────────────────────────────────────────┐
│ 1. User selects "Bank Transfer" (PayPal) in checkout            │
│    ↓                                                             │
│ 2. Frontend sends: POST /api/payments/paypal                    │
│    {amount, currency, userId, eventId, bookingType}             │
│    ↓                                                             │
│ 3. Backend creates PaymentRecord(status: pending)               │
│    ↓                                                             │
│ 4. Backend calls payment-gateway.workers.dev                    │
│    ↓                                                             │
│ 5. Gateway creates PayPal order via API                         │
│    ↓                                                             │
│ 6. Gateway returns: {orderId, approveUrl, ...}                  │
│    ↓                                                             │
│ 7. Backend stores: providerTransactionId=orderId                │
│    ↓                                                             │
│ 8. Backend returns: {approveUrl, orderId, transactionId}        │
│    ↓                                                             │
│ 9. Frontend redirects: window.location.href = approveUrl        │
│    ↓                                                             │
│ 10. User logs into PayPal and clicks "Approve"                  │
│    ↓                                                             │
│ 11. PayPal redirects: GET /api/webhooks/paypal                  │
│     ?transactionId=txn_abc123&token=ORDER_ID&PayerID=...        │
│    ↓                                                             │
│ 12. Webhook handler verifies & completes payment                │
│    ↓                                                             │
│ 13. Creates event registration if tournament_entry              │
│    ↓                                                             │
│ 14. Redirects user: /tournaments/{eventId}?payment=success      │
│    ↓                                                             │
│ 15. User sees success message ✓                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## API Endpoint Summary

| Endpoint | Method | Purpose | Input |
|----------|--------|---------|-------|
| `/api/payments/paypal` | POST | Initiate PayPal checkout | amount, currency, userId, eventId, bookingType |
| `/api/webhooks/paypal` | GET | Handle PayPal approval | transactionId, token, PayerID |
| `/api/webhooks/paypal` | POST | Handle payment cancellation | transactionId |

---

## Testing with Sample Response

### 1. Backend Test
```bash
# Simulate what payment gateway returns
curl -X POST http://localhost:3000/api/payments/paypal \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "amount": 500,
    "currency": "USD",
    "userId": "user123",
    "eventId": "event456",
    "bookingType": "tournament_entry"
  }'

# Expected response:
{
  "success": true,
  "transactionId": "...",
  "approveUrl": "https://www.sandbox.paypal.com/checkoutnow?token=5H065994EC1067026",
  "orderId": "5H065994EC1067026"
}
```

### 2. Frontend Test
```javascript
// Simulate user clicking pay
const response = await fetch('/api/payments/paypal', { ... });
const data = await response.json();

// Should navigate to PayPal
window.location.href = data.approveUrl;
```

### 3. Callback Test
```bash
# Simulate PayPal redirect after approval
curl "http://localhost:3000/api/webhooks/paypal?transactionId=txn_abc123&token=5H065994EC1067026&PayerID=PAYERID123"

# Should redirect to:
# /tournaments/event456?payment=success&transactionId=txn_abc123
```

---

## Troubleshooting

### Payment fails with 400 error
- ✓ Check that `amount > 0`
- ✓ Check that `currency` is provided
- ✓ Check that `userId` and `eventId` exist
- ✓ Check payment gateway connection

### Callback doesn't work
- ✓ Ensure `transactionId` parameter is passed
- ✓ Verify `transactionId` exists in database
- ✓ Check that event registration creation doesn't fail (member lookup)

### User redirected to wrong place
- ✓ Verify `eventId` is not null in payment record
- ✓ Check redirect URL construction in webhook handler

---

## Status Values

| Status | Meaning | Next Action |
|--------|---------|-------------|
| `pending` | Order created, awaiting approval | User approves on PayPal |
| `completed` | Payment captured successfully | Create registration |
| `failed` | Payment declined or cancelled | Notify user, allow retry |

---

## Environment Variables

Required in payment gateway (Cloudflare Worker):
```
PAYPAL_CLIENT_ID=your_sandbox_client_id
PAYPAL_CLIENT_SECRET=your_sandbox_secret
PAYPAL_API_BASE=https://api.sandbox.paypal.com
```

Switch to production:
```
PAYPAL_API_BASE=https://api.paypal.com
```
