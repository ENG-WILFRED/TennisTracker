# Callback & Cancel URLs - Quick Reference

## Base URL Configuration

The system automatically constructs callback and cancel URLs using the environment variable:

```bash
# In .env:
NEXT_PUBLIC_TEST_BASE_URL=http://localhost:3020
```

## Automatic URL Construction

When processing a payment, the system constructs URLs like:

```
Callback URL:  {NEXT_PUBLIC_TEST_BASE_URL}/api/payments/callback/{provider}
Cancel URL:    {NEXT_PUBLIC_TEST_BASE_URL}/api/payments/cancel/{provider}
```

**Examples:**
```
M-Pesa:
  Callback: http://localhost:3020/api/payments/callback/mpesa
  Cancel:   http://localhost:3020/api/payments/cancel/mpesa

PayPal:
  Callback: http://localhost:3020/api/payments/callback/paypal
  Cancel:   http://localhost:3020/api/payments/cancel/paypal

Stripe:
  Callback: http://localhost:3020/api/payments/callback/stripe
  Cancel:   http://localhost:3020/api/payments/cancel/stripe
```

## Payment Flow

### 1. Initiate Payment

**Booking Details Page** calls payment action:

```typescript
const paymentResult = await processStripePayment(
  totalPrice,           // amount
  'usd',               // currency
  user.id,             // userId
  courtId,             // eventId
  'court_booking',     // bookingType
  bookingMetadata      // metadata: { courtId, organizationId, startTime, endTime, matchType, notes, duration }
);
```

### 2. Payment Action Processes

```typescript
// In src/actions/payments.ts
const baseUrl = getBaseUrl(); // Gets NEXT_PUBLIC_TEST_BASE_URL
const callbackUrl = `${baseUrl}/api/payments/callback/stripe`;
const cancelUrl = `${baseUrl}/api/payments/cancel/stripe`;

// Sends to payment provider:
// {
//   amount: 2450,
//   currency: 'usd',
//   callbackUrl: 'http://localhost:3020/api/payments/callback/stripe',
//   cancelUrl: 'http://localhost:3020/api/payments/cancel/stripe',
//   metadata: { transactionId: ..., ... }
// }
```

### 3. Stores in Database

```sql
INSERT INTO "PaymentRecord" (
  id, userId, eventId, bookingType, amount, currency, provider,
  callbackUrl, cancelUrl, metadata, providerStatus
) VALUES (
  'txn_123abc', 'user_456', 'court_789', 'court_booking', 24.50, 'USD', 'stripe',
  'http://localhost:3020/api/payments/callback/stripe',
  'http://localhost:3020/api/payments/cancel/stripe',
  '{"courtId": "...", ...}',
  'pending'
)
```

### 4. User Completes/Cancels Payment

**Option A: Payment Completed**
- Payment provider confirms transaction
- Provider sends webhook to `/api/payments/callback/stripe`
- Handler fetches `callbackUrl` from database
- Sends notification to client's webhook URL

**Option B: Payment Cancelled**
- User clicks cancel or timeout occurs
- Frontend calls `/api/payments/cancel/stripe/{transactionId}`
- Handler fetches `cancelUrl` from database
- Sends notification to client's webhook URL

## Response Format

### Payment Action Response

```json
{
  "success": true,
  "transactionId": "txn_123abc",
  "checkoutUrl": "https://checkout.stripe.com/pay/...",
  "sessionId": "cs_test_...",
  "callbackUrlRegistered": true,
  "cancelUrlRegistered": true
}
```

### Callback Notification (Sent to Client Webhook)

```json
{
  "idempotencyKey": "txn_123abc",
  "gateway": "stripe",
  "status": "completed",
  "transactionId": "pi_1234567890",
  "amount": 24.50,
  "currency": "USD",
  "timestamp": "2026-04-25T10:01:00Z",
  "error": null,
  "metadata": {
    "courtId": "court_789",
    "organizationId": "org_456",
    "startTime": "2026-04-25T15:00:00Z",
    "endTime": "2026-04-25T16:00:00Z",
    "matchType": "singles"
  }
}
```

### Cancel Notification (Sent to Client Webhook)

```json
{
  "idempotencyKey": "txn_123abc",
  "gateway": "stripe",
  "transactionId": "pi_1234567890",
  "reason": "User initiated",
  "timestamp": "2026-04-25T10:02:00Z",
  "metadata": {
    "courtId": "court_789",
    "organizationId": "org_456"
  }
}
```

## How to Set Up Your Webhook Receiver

### Step 1: Create Your Webhook Endpoint

```typescript
// your-backend/webhook-handler.ts
app.post('/webhooks/payment', express.json(), async (req, res) => {
  const header = req.get('X-Payment-Callback') || req.get('X-Payment-Cancel');
  
  if (!header) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { idempotencyKey, status, reason, metadata } = req.body;

  try {
    if (req.get('X-Payment-Callback') === 'true') {
      // Handle payment completion
      await db.booking.update({
        where: { id: metadata.courtId },
        data: { 
          status: 'confirmed',
          paymentId: idempotencyKey,
          paymentStatus: 'completed'
        }
      });
      
      // Send confirmation email, SMS, etc.
    } else if (req.get('X-Payment-Cancel') === 'true') {
      // Handle payment cancellation
      await db.booking.update({
        where: { id: metadata.courtId },
        data: { 
          status: 'cancelled',
          cancelReason: reason
        }
      });
    }

    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});
```

### Step 2: Expose Your Webhook URL

Make sure your webhook endpoint is accessible at a public URL:
- Development: Use ngrok, localtunnel, etc.
- Production: Use your domain with HTTPS

### Step 3: Test the Integration

```bash
# Test callback notification
curl -X POST http://your-domain.com/webhooks/payment \
  -H "X-Payment-Callback: true" \
  -H "Content-Type: application/json" \
  -d @- << 'EOF'
{
  "idempotencyKey": "txn_123",
  "gateway": "stripe",
  "status": "completed",
  "transactionId": "pi_123",
  "amount": 24.50,
  "currency": "USD",
  "timestamp": "2026-04-25T10:00:00Z",
  "error": null,
  "metadata": {"courtId": "c1", "organizationId": "o1"}
}
EOF

# Test cancel notification
curl -X POST http://your-domain.com/webhooks/payment \
  -H "X-Payment-Cancel: true" \
  -H "Content-Type: application/json" \
  -d @- << 'EOF'
{
  "idempotencyKey": "txn_123",
  "gateway": "stripe",
  "transactionId": "pi_123",
  "reason": "User initiated",
  "timestamp": "2026-04-25T10:00:00Z",
  "metadata": {"courtId": "c1", "organizationId": "o1"}
}
EOF
```

## Environment Variables

```bash
# Base URL - REQUIRED
NEXT_PUBLIC_TEST_BASE_URL=http://localhost:3020

# Optional - for production:
NEXT_PUBLIC_SITE_URL=https://yourdomain.com

# Optional - for Stripe
STRIPE_WEBHOOK_SECRET=whsec_...

# Optional - for PayPal
NEXT_PUBLIC_PAYPAL_SANDBOX=true
```

## Troubleshooting

### URLs Not Being Set

Check database:
```sql
SELECT id, callbackUrl, cancelUrl, provider, providerStatus 
FROM "PaymentRecord" 
WHERE id = 'txn_123';
```

If NULL, restart app and try again.

### Callbacks Not Received

1. Verify your webhook URL is accessible:
   ```bash
   curl -X POST http://your-webhook-url/webhook \
     -H "X-Payment-Callback: true" \
     -d '{"test": true}'
   ```

2. Check application logs:
   ```bash
   grep "Callback notification" logs/*.log
   ```

3. Verify `callbackUrl` in database is correct

### Cancel Endpoint Returns 404

Verify transaction ID exists:
```bash
curl http://localhost:3020/api/payments/status/txn_123
```

## All Payment Providers Supported

| Provider | Callback URL | Cancel URL | Status |
|----------|-------------|-----------|--------|
| M-Pesa | `/api/payments/callback/mpesa` | `/api/payments/cancel/mpesa/{id}` | ✅ |
| PayPal | `/api/payments/callback/paypal` | `/api/payments/cancel/paypal/{id}` | ✅ |
| Stripe | `/api/payments/callback/stripe` | `/api/payments/cancel/stripe/{id}` | ✅ |

## Summary

✅ Base URL configured from environment
✅ URLs automatically constructed
✅ Stored in database for each payment
✅ Sent to payment providers
✅ Used by providers to notify of completion/cancellation
✅ Parsed by handlers to send client notifications
✅ Client webhooks receive structured JSON notifications
