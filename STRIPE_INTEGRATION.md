# Stripe Integration Documentation

## Stripe Payment Flow

### 1. Create Checkout Session (Backend)

**Frontend calls:**
```javascript
POST /api/payments/stripe
{
  "amount": 50000,         // Amount in cents: $500.00
  "currency": "usd",
  "userId": "user-id",
  "eventId": "event-id",
  "bookingType": "tournament_entry",
  "metadata": { ... }
}
```

**Server action `processStripePayment` calls:**
```javascript
POST https://payment-gateway.kimaniwilfred95.workers.dev/api/payments/stripe
{
  "amount": 50000,         // Stripe requires cents
  "currency": "usd",
  "metadata": {
    "transactionId": "txn_abc123",  // Our internal ID
    "eventId": "event-id",
    "userId": "user-id",
    "bookingType": "tournament_entry"
  }
}
```

**Payment gateway (Cloudflare Worker) creates Stripe session via:**
```javascript
POST https://api.stripe.com/v1/checkout/sessions
{
  "payment_method_types": ["card"],
  "mode": "payment",
  "line_items": [{
    "price_data": {
      "currency": "usd",
      "unit_amount": 50000,  // $500.00
      "product_data": {
        "name": "Tournament Entry - {tournament_id}"
      }
    },
    "quantity": 1
  }],
  "success_url": "https://your-app.com/api/webhooks/stripe/success?session_id={CHECKOUT_SESSION_ID}",
  "cancel_url": "https://your-app.com"
}
```

---

### 2. Stripe Response

```json
{
  "sessionId": "cs_live_1BNz64BXyYp2hfFyCT5w8xC3lLB6ubU0ZX0X1cSZZzVV8CzxqkLHN3BXyYp2",
  "checkoutUrl": "https://checkout.stripe.com/pay/cs_live_1BNz64BXyYp2hfFyCT5w8xC3lLB6ubU0ZX0X1cSZZzVV8CzxqkLHN3BXyYp2",
  "paymentIntentId": "pi_1BNz64BXyYp2hfFyCT5w8xC3",
  "clientSecret": "pi_1BNz64BXyYp2hfFyCT5w8xC3_secret_HwSuOXVnQ1nIZXqGGJPD0NfT9",
  "status": "open"
}
```

**Key Fields:**
- `sessionId` - Unique checkout session ID
- `checkoutUrl` - URL where user completes payment
- `paymentIntentId` - Stripe payment intent ID
- `clientSecret` - Secret for client-side Stripe.js (if needed)
- `status` - "open" = awaiting payment, "complete" = paid, "expired" = timed out

---

### 3. Our Database Record

After session is created:

```prisma
paymentRecord {
  id                   // Our transaction ID (e.g., "txn_abc123")
  userId              // User making payment
  eventId             // Tournament
  provider: "stripe"
  providerStatus: "pending"
  providerTransactionId: "pi_1BNz64BXyYp2hfFyCT5w8xC3"  // paymentIntentId
  checkoutUrl: "https://checkout.stripe.com/pay/cs_live_1BNz..."
  metadata: {
    amount: 50000,
    currency: "usd",
    stripeSessionId: "cs_live_1BNz...",
    stripePaymentIntentId: "pi_1BNz...",
    bookingType: "tournament_entry"
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
  "sessionId": "cs_live_1BNz...",
  "checkoutUrl": "https://checkout.stripe.com/pay/cs_live_1BNz...",
  "clientSecret": "pi_1BNz..._secret_...",
  "paymentIntentId": "pi_1BNz..."
}
```

**Frontend action:**
```javascript
if (data.checkoutUrl) {
  window.location.href = data.checkoutUrl;  // Redirect to Stripe
}

// Alternative: embed Stripe.js
// const stripe = Stripe(STRIPE_PUBLIC_KEY);
// stripe.redirectToCheckout({ sessionId: data.sessionId });
```

---

### 5. User Completes Payment

User fills in card details on Stripe's hosted checkout page.

After successful payment, Stripe:
1. Sends webhook: `checkout.session.completed` or `payment_intent.succeeded`
2. Redirects user back to success URL (optional)

---

### 6. Webhook Handler

**Webhook POST route (`/api/webhooks/stripe`) receives:**

```json
{
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_live_1BNz64BXyYp2hfFyCT5w8xC3",
      "payment_intent": "pi_1BNz64BXyYp2hfFyCT5w8xC3",
      "payment_status": "paid",
      "metadata": {
        "transactionId": "txn_abc123",
        "eventId": "event-id",
        "userId": "user-id",
        "bookingType": "tournament_entry"
      }
    }
  }
}
```

**Handler does:**
1. Extract metadata and IDs
2. Find our payment record by `transactionId` 
3. Verify `payment_status === "paid"`
4. Update status to "completed"
5. If tournament_entry: Create event registration
6. Log success | Return 200 (even if something fails)

---

### 7. Database After Webhook

```prisma
paymentRecord {
  id: "txn_abc123"
  providerStatus: "completed"  // Changed from "pending"
  providerTransactionId: "pi_1BNz64BXyYp2hfFyCT5w8xC3"
  metadata: {
    stripeSessionId: "cs_live_1BNz...",
    stripePaymentIntentId: "pi_1BNz...",
    stripePaymentStatus: "paid",
    webhookReceivedAt: "2024-01-15T10:30:45.000Z"
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
  amount                Decimal  // In cents for Stripe (50000 = $500.00)
  currency              String   // usd, gbp, eur, etc
  provider              String   // stripe
  providerStatus        String   // pending, completed, failed
  providerTransactionId String?  // paymentIntentId
  checkoutUrl           String?  // Stripe checkout URL
  metadata              String   // JSON: session details
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}
```

---

## Complete Request-Response Cycle

```
USER FLOW:
┌─────────────────────────────────────────────────────────────────┐
│ 1. User selects "Credit / Debit Card" in checkout               │
│    ↓                                                             │
│ 2. Frontend sends: POST /api/payments/stripe                    │
│    {amount, currency, userId, eventId, bookingType}             │
│    ↓                                                             │
│ 3. Backend creates PaymentRecord(status: pending)               │
│    ↓                                                             │
│ 4. Backend calls payment-gateway.workers.dev                    │
│    ↓                                                             │
│ 5. Gateway creates Stripe checkout session via API              │
│    ↓                                                             │
│ 6. Stripe returns: {sessionId, checkoutUrl, ...}                │
│    ↓                                                             │
│ 7. Backend stores: providerTransactionId, checkoutUrl           │
│    ↓                                                             │
│ 8. Backend returns: {checkoutUrl, sessionId, ...}               │
│    ↓                                                             │
│ 9. Frontend redirects: window.location.href = checkoutUrl       │
│    ↓                                                             │
│ 10. User enters card details on Stripe's page                   │
│    ↓                                                             │
│ 11. User clicks "Pay"                                           │
│    ↓                                                             │
│ 12. Stripe processes card                                       │
│    ↓                                                             │
│ 13. If successful: Stripe sends webhook                         │
│    ↓                                                             │
│ 14. Stripe sends: POST /api/webhooks/stripe                     │
│     {type: "checkout.session.completed", data: {...}}           │
│    ↓                                                             │
│ 15. Webhook handler verifies payment                            │
│    ↓                                                             │
│ 16. Creates event registration                                  │
│    ↓                                                             │
│ 17. Updates status to "completed"                               │
│    ↓                                                             │
│ 18. Returns 200 to Stripe                                       │
│    ↓                                                             │
│ 19. Stripe redirects user (optional)                            │
│    ↓                                                             │
│ 20. User sees success ✓                                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## API Endpoint Summary

| Endpoint | Method | Purpose | Input |
|----------|--------|---------|-------|
| `/api/payments/stripe` | POST | Create checkout session | amount, currency, userId, eventId, bookingType |
| `/api/webhooks/stripe` | POST | Handle Stripe webhook | Stripe webhook payload |

---

## Testing with Stripe Test Cards

### 1. Backend Test - Create Session
```bash
curl -X POST http://localhost:3000/api/payments/stripe \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "amount": 50000,
    "currency": "usd",
    "userId": "user123",
    "eventId": "event456",
    "bookingType": "tournament_entry"
  }'

# Expected response:
{
  "success": true,
  "transactionId": "txn_abc123",
  "sessionId": "cs_live_...",
  "checkoutUrl": "https://checkout.stripe.com/pay/...",
  "paymentIntentId": "pi_..."
}
```

### 2. Frontend Test - Redirect to Checkout
```javascript
const response = await fetch('/api/payments/stripe', {
  method: 'POST',
  body: JSON.stringify({
    amount: 50000,
    currency: "usd",
    userId: user.id,
    eventId: tournament.id,
    bookingType: "tournament_entry"
  })
});

const data = await response.json();
if (data.checkoutUrl) {
  window.location.href = data.checkoutUrl;
}
```

### 3. Test Card - Successful Payment
```
Card Number: 4242 4242 4242 4242
Expiry: 12/25 (any future date)
CVC: 123 (any 3 digits)
Name: Any name
```

### 4. Test Card - Requires Authentication
```
Card Number: 4000 0025 0000 3155
(Will trigger 3D Secure)
```

### 5. Test Card - Declined
```
Card Number: 4000 0000 0000 0002
(Will be declined)
```

### 6. Webhook Simulation
```bash
# Retrieve test event from Stripe
curl -u sk_test_YOUR_KEY: https://api.stripe.com/v1/events \
  --data-urlencode "type=checkout.session.completed" \
  --data-urlencode "limit=1"

# Forward the event to your webhook
curl -X POST http://localhost:3000/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d '{
    "type": "checkout.session.completed",
    "data": {
      "object": {
        "id": "cs_...",
        "payment_intent": "pi_...",
        "payment_status": "paid",
        "metadata": {
          "transactionId": "txn_abc123",
          "eventId": "event456",
          "userId": "user123",
          "bookingType": "tournament_entry"
        }
      }
    }
  }'
```

---

## Status Values

| Payment Status | Meaning |
|---|---|
| `open` | Session created, awaiting payment |
| `complete` | Payment successful |
| `expired` | Session expired (usually after 24 hours) |

| Status Code | Event Type | Action |
|---|---|---|
| `checkout.session.completed` | Payment completed | Fulfill order |
| `payment_intent.succeeded` | Payment succeeded | Fulfill order |
| `payment_intent.payment_failed` | Payment failed | Notify user |
| `charge.failed` | Charge failed | Log error |

---

## Amount Formatting

**Important:** Stripe requires amounts in the smallest currency unit (cents for USD):

```javascript
// Frontend sends in dollars:
amount: 500  // $500.00

// Backend must convert to cents:
stripeAmount = Math.round(amount * 100)  // 50000 cents

// After webhook, convert back:
dollars = stripeAmount / 100  // $500.00
```

---

## Troubleshooting

### Payment fails immediately
- ✓ Verify amount > 0
- ✓ Verify currency code (lowercase: "usd", not "USD")
- ✓ Check Stripe API key is valid
- ✓ Verify worker can connect to Stripe

### Checkout doesn't load
- ✓ Test Stripe API key (publishable vs secret)
- ✓ Verify account has Stripe account enabled
- ✓ Check that session creation succeeded (check logs)

### Webhook not received
- ✓ Verify webhook endpoint is publicly accessible
- ✓ Check HTTP status code is 200
- ✓ Verify Webhook Signing Secret is correct
- ✓ Check Stripe Dashboard > Webhooks for failed attempts

### User doesn't see payment update
- ✓ Check webhook handler logic (especially registration creation)
- ✓ Verify transactionId extraction from metadata
- ✓ Check that payment_status is "paid" (not "requires_action")
- ✓ Frontend may need to poll or refresh

---

## Environment Variables

Required in payment gateway (Cloudflare Worker):
```
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_public_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_API_BASE=https://api.stripe.com
```

Switch to production:
```
STRIPE_SECRET_KEY=sk_live_your_live_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key
```

---

## Client-Side Integration (Optional)

For more control, you can use Stripe.js directly:

```javascript
// Load Stripe
const stripe = Stripe(STRIPE_PUBLISHABLE_KEY);

// From checkout response
const { sessionId } = await fetch('/api/payments/stripe', {/*...*/});

// Redirect to checkout
stripe.redirectToCheckout({ sessionId });
```

Or use embedded payment form:

```javascript
const elements = stripe.elements();
const cardElement = elements.create('card');
cardElement.mount('#card-element');

// Handle form submission
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const { paymentMethod } = await stripe.createPaymentMethod({
    type: 'card',
    card: cardElement,
  });
  // Send paymentMethod.id to backend
});
```

---

## Reconciliation

To verify payments match transactions:

```sql
-- List all payments by provider
SELECT provider, providerStatus, COUNT(*) as count, SUM(amount) as total
FROM PaymentRecord
GROUP BY provider, providerStatus;

-- Find pending payments
SELECT id, transactionId, amount, updatedAt
FROM PaymentRecord
WHERE provider = 'stripe' AND providerStatus = 'pending'
AND createdAt < NOW() - INTERVAL '24 hours';

-- List failed transactions
SELECT id, eventId, amount, currency, metadata
FROM PaymentRecord
WHERE provider = 'stripe' AND providerStatus = 'failed'
ORDER BY createdAt DESC;
```
