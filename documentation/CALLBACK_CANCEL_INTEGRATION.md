# Payment Integration with Callback & Cancel URLs

## Quick Start

### Environment Configuration

Add these to your `.env` file:

```bash
# Base URL for payment callbacks and cancellations
NEXT_PUBLIC_TEST_BASE_URL=http://localhost:3020

# For production:
NEXT_PUBLIC_SITE_URL=https://yourdomain.com

# Optional: Stripe webhook secret
STRIPE_WEBHOOK_SECRET=whsec_...

# Optional: PayPal sandbox mode
NEXT_PUBLIC_PAYPAL_SANDBOX=true
```

## How It Works

### Payment Flow

```
1. User initiates payment in Booking Form
   ↓
2. Payment action constructs callback & cancel URLs using NEXT_PUBLIC_TEST_BASE_URL
   ↓
3. URLs sent to payment provider:
   - callbackUrl: {NEXT_PUBLIC_TEST_BASE_URL}/api/payments/callback/{provider}
   - cancelUrl: {NEXT_PUBLIC_TEST_BASE_URL}/api/payments/cancel/{provider}
   ↓
4. Payment provider processes payment
   ↓
5. On completion/failure:
   - Provider sends webhook to callback URL
   - Callback handler sends notification to your webhook URL
   ↓
6. If cancelled:
   - Cancel endpoint is called
   - Cancel notification sent to your webhook URL
```

## API Endpoints

### Cancel Payment

**Endpoint:** `POST /api/payments/cancel/{provider}/{transactionId}`

**Providers:** `mpesa`, `paypal`, `stripe`

**Request:**
```json
{
  "reason": "User initiated"
}
```

**Response:**
```json
{
  "success": true,
  "transactionId": "uuid",
  "status": "cancelled",
  "message": "Payment cancelled successfully",
  "cancelNotificationSent": true
}
```

**Example - Cancel Stripe Payment:**
```bash
curl -X POST http://localhost:3020/api/payments/cancel/stripe/txn_12345 \
  -H "Content-Type: application/json" \
  -d '{"reason": "User clicked cancel"}'
```

### Get Payment Status

**Endpoint:** `GET /api/payments/status/{transactionId}`

**Response:**
```json
{
  "success": true,
  "payment": {
    "id": "txn_12345",
    "providerStatus": "completed",
    "provider": "stripe",
    "amount": 24.50,
    "currency": "USD",
    "createdAt": "2026-04-25T10:00:00Z",
    "updatedAt": "2026-04-25T10:01:00Z",
    "bookingType": "court_booking"
  },
  "isCompleted": true
}
```

## Callback & Cancel Notifications

### Callback Notification (On Payment Success)

**Sent to:** Your registered `callbackUrl`

**Headers:**
```
X-Payment-Callback: true
X-Callback-Version: 1.0
Content-Type: application/json
```

**Body:**
```json
{
  "idempotencyKey": "txn_12345",
  "gateway": "stripe",
  "status": "completed",
  "transactionId": "pi_1234567890",
  "amount": 24.50,
  "currency": "USD",
  "timestamp": "2026-04-25T10:01:00Z",
  "error": null,
  "metadata": {
    "courtId": "court_123",
    "organizationId": "org_123",
    "startTime": "2026-04-25T15:00:00Z",
    "endTime": "2026-04-25T16:00:00Z",
    "matchType": "singles"
  }
}
```

### Cancel Notification (On Payment Cancellation)

**Sent to:** Your registered `cancelUrl`

**Headers:**
```
X-Payment-Cancel: true
X-Cancel-Version: 1.0
Content-Type: application/json
```

**Body:**
```json
{
  "idempotencyKey": "txn_12345",
  "gateway": "stripe",
  "transactionId": "pi_1234567890",
  "reason": "User initiated",
  "timestamp": "2026-04-25T10:02:00Z",
  "metadata": {
    "courtId": "court_123",
    "organizationId": "org_123"
  }
}
```

## Implementation Examples

### Node.js/Express Example

```javascript
const express = require('express');
const app = express();

app.use(express.json());

// Handle callback notifications
app.post('/webhooks/payment/callback', (req, res) => {
  // Verify header
  if (req.get('X-Payment-Callback') !== 'true') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const {
    idempotencyKey,
    gateway,
    status,
    transactionId,
    amount,
    currency,
    metadata,
  } = req.body;

  console.log(`Payment ${status} from ${gateway}:`, {
    transactionId,
    amount,
    currency,
  });

  try {
    // Update your database
    // - Mark booking as confirmed
    // - Send confirmation email to user
    // - Update payment records
    db.updateBooking(metadata.courtId, { status: 'confirmed', paymentId: transactionId });

    // Always return 200 OK
    res.json({ success: true });
  } catch (error) {
    console.error('Callback processing error:', error);
    // Still return 200 - don't let provider retry
    res.json({ success: false, error: error.message });
  }
});

// Handle cancel notifications
app.post('/webhooks/payment/cancel', (req, res) => {
  // Verify header
  if (req.get('X-Payment-Cancel') !== 'true') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { idempotencyKey, gateway, transactionId, reason, metadata } = req.body;

  console.log(`Payment cancelled on ${gateway}:`, {
    transactionId,
    reason,
  });

  try {
    // Update your database
    // - Mark booking as cancelled
    // - Mark court as available again
    // - Send cancellation email to user
    db.cancelBooking(metadata.courtId, { reason });

    // Always return 200 OK
    res.json({ success: true });
  } catch (error) {
    console.error('Cancel notification processing error:', error);
    // Still return 200
    res.json({ success: false, error: error.message });
  }
});

// Cancel payment endpoint (optional - if you want to initiate cancellation)
app.post('/payments/:paymentId/cancel', async (req, res) => {
  try {
    const { reason } = req.body;

    // Call our cancellation endpoint
    const response = await fetch(
      `http://localhost:3020/api/payments/cancel/stripe/${paymentId}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason || 'User initiated' }),
      }
    );

    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3001, () => {
  console.log('Webhook server running on port 3001');
});
```

### Next.js API Route Example

```typescript
// pages/api/webhooks/payment.ts
import { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify header
  const callbackHeader = req.get('X-Payment-Callback');
  const cancelHeader = req.get('X-Payment-Cancel');

  if (!callbackHeader && !cancelHeader) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const {
    idempotencyKey,
    gateway,
    status,
    reason,
    transactionId,
    amount,
    metadata,
  } = req.body;

  try {
    if (callbackHeader === 'true') {
      // Handle payment success callback
      console.log(`Payment completed: ${transactionId}`);

      // Use idempotencyKey for deduplication
      const existing = await db.payment.findUnique({
        where: { idempotencyKey },
      });

      if (!existing) {
        await db.booking.update({
          where: { id: metadata.courtId },
          data: {
            status: 'confirmed',
            paymentId: transactionId,
          },
        });

        // Send confirmation email
        await sendEmail({
          to: req.user.email,
          subject: 'Booking Confirmed',
          template: 'booking-confirmation',
          data: { bookingId: metadata.courtId, amount, currency: 'USD' },
        });
      }
    } else if (cancelHeader === 'true') {
      // Handle payment cancellation
      console.log(`Payment cancelled: ${transactionId} - ${reason}`);

      await db.booking.update({
        where: { id: metadata.courtId },
        data: {
          status: 'cancelled',
          cancelReason: reason,
        },
      });

      // Send cancellation email
      await sendEmail({
        to: req.user.email,
        subject: 'Booking Cancelled',
        template: 'booking-cancelled',
        data: { bookingId: metadata.courtId, reason },
      });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    // Always return 200 to prevent retries
    res.status(200).json({ success: false, error: error.message });
  }
}
```

### Python/FastAPI Example

```python
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel
from typing import Optional

app = FastAPI()

class CallbackPayload(BaseModel):
    idempotencyKey: str
    gateway: str
    status: str
    transactionId: str
    amount: float
    currency: str
    metadata: dict

class CancelPayload(BaseModel):
    idempotencyKey: str
    gateway: str
    transactionId: str
    reason: str
    metadata: dict

@app.post("/webhooks/payment/callback")
async def handle_callback(
    payload: CallbackPayload,
    x_payment_callback: Optional[str] = Header(None)
):
    if x_payment_callback != 'true':
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        # Update database
        # Mark booking as confirmed
        # Send confirmation email
        
        return {"success": True}
    except Exception as e:
        print(f"Callback error: {e}")
        return {"success": False, "error": str(e)}

@app.post("/webhooks/payment/cancel")
async def handle_cancel(
    payload: CancelPayload,
    x_payment_cancel: Optional[str] = Header(None)
):
    if x_payment_cancel != 'true':
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        # Update database
        # Mark booking as cancelled
        # Send cancellation email
        
        return {"success": True}
    except Exception as e:
        print(f"Cancel error: {e}")
        return {"success": False, "error": str(e)}
```

## Database Migrations

After updating the schema, run:

```bash
# Generate migration
npx prisma migrate dev --name add_callback_cancel_urls

# Or for production:
npx prisma migrate deploy
```

## Security Best Practices

1. **Verify Headers:**
   ```javascript
   if (req.get('X-Payment-Callback') !== 'true') {
     return res.status(401).json({ error: 'Unauthorized' });
   }
   ```

2. **Verify HTTPS (Production):**
   ```javascript
   if (!webhookUrl.startsWith('https://') && process.env.NODE_ENV === 'production') {
     throw new Error('HTTPS required for webhook URLs');
   }
   ```

3. **Use Idempotency Key:**
   ```javascript
   // Check if already processed
   const existing = await db.payment.findUnique({
     where: { idempotencyKey: req.body.idempotencyKey }
   });
   if (existing) return res.json({ success: true });
   ```

4. **Return 200 OK Always:**
   ```javascript
   // Always return 200 to prevent provider retries
   res.status(200).json({ success: true });
   ```

5. **Log Everything:**
   ```javascript
   console.log('Webhook received:', {
     gateway: req.body.gateway,
     status: req.body.status,
     timestamp: new Date().toISOString(),
   });
   ```

## Testing Checklist

- [ ] Test M-Pesa payment with callbacks
- [ ] Test M-Pesa cancellation
- [ ] Test PayPal payment with callbacks
- [ ] Test PayPal cancellation
- [ ] Test Stripe payment with callbacks
- [ ] Test Stripe cancellation
- [ ] Verify callback notification received
- [ ] Verify cancel notification received
- [ ] Test webhook retry logic
- [ ] Verify idempotency (process same callback twice)
- [ ] Test invalid URLs (should fail gracefully)
- [ ] Test network timeout (callback should retry)
- [ ] Verify database updated correctly
- [ ] Verify user emails sent
- [ ] Test payment status endpoint

## Troubleshooting

### Callbacks Not Being Sent

1. Check if `callbackUrl` and `cancelUrl` are stored in database:
   ```sql
   SELECT id, callbackUrl, cancelUrl FROM "PaymentRecord" WHERE id = 'txn_123';
   ```

2. Check server logs for fetch errors:
   ```bash
   tail -f logs/payment.log | grep "Callback notification"
   ```

3. Verify webhook URL is accessible:
   ```bash
   curl -X POST http://localhost:3001/webhooks/payment \
     -H "X-Payment-Callback: true" \
     -H "Content-Type: application/json" \
     -d '{"test": true}'
   ```

### Cancellations Not Working

1. Verify cancel endpoint is accessible:
   ```bash
   curl -X POST http://localhost:3020/api/payments/cancel/stripe/txn_123 \
     -H "Content-Type: application/json" \
     -d '{"reason": "test"}'
   ```

2. Check if payment record exists:
   ```sql
   SELECT * FROM "PaymentRecord" WHERE id = 'txn_123';
   ```

3. Check provider-specific cancel support:
   - M-Pesa: STK push can only be cancelled within time window
   - PayPal: Order must be in pending state
   - Stripe: Payment intent must not be captured

## Files Modified/Created

```
src/
  actions/payments.ts (UPDATED - callback/cancel URLs)
  app/
    api/payments/
      callback/
        mpesa/route.ts (UPDATED - sends callback notifications)
        paypal/route.ts (UPDATED - sends callback notifications)
        stripe/route.ts (UPDATED - sends callback notifications)
      cancel/
        mpesa/[transactionId]/route.ts (NEW)
        paypal/[transactionId]/route.ts (NEW)
        stripe/[transactionId]/route.ts (NEW)
      status/[transactionId]/route.ts (UPDATED)
prisma/
  schema.prisma (UPDATED - added callbackUrl, cancelUrl columns)
.env (ALREADY SET - NEXT_PUBLIC_TEST_BASE_URL)
```

## Support

For issues or questions, check:
1. Payment provider documentation
2. Webhook delivery logs
3. Database records in `PaymentRecord` table
4. Application logs for errors
