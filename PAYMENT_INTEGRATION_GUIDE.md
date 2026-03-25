# Payment Integration Master Guide

## Overview

The Tennis Tracker app supports three payment methods for tournament registration and amenity bookings:

1. **M-Pesa** (Mobile Money) - For Kenya/Africa market
2. **PayPal** - For international payments
3. **Stripe** (Credit/Debit Cards) - For global card payments

All three integrate through:
- **Backend:** `src/actions/payments.ts` (server actions)
- **API Routes:** `src/app/api/payments/{provider}/route.ts`
- **Webhooks:** `src/app/api/webhooks/{provider}/route.ts`
- **UI:** `src/app/tournaments/[id]/page.tsx` (checkout modals)

---

## Payment Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER SELECTS METHOD                       │
│                                                                  │
│  [💳 Card]  [🏦 Bank Transfer]  [📱 Mobile Money]              │
└────────────────────────────────────────────────────────────────┘
                                │
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│              FRONTEND - Tournament Page                          │
│  • CheckoutModal collects amount & payment method              │
│  • Calls /api/payments/{provider} with validated data           │
│  • Receives checkout URL or success message                     │
└────────────────────────────────────────────────────────────────┘
                                │
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│           BACKEND - Payment Route Handler                        │
│  • Validates required fields                                     │
│  • Calls server action (processMPesaPayment, etc)               │
│  • Logs validation results                                       │
│  • Returns response to frontend                                  │
└────────────────────────────────────────────────────────────────┘
                                │
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│        SERVER ACTION - Payment Processing                        │
│  • Creates PaymentRecord in database (status: pending)          │
│  • Calls payment gateway (Cloudflare Worker)                    │
│  • Updates PaymentRecord with provider IDs                      │
│  • Returns checkout URL or status to frontend                   │
└────────────────────────────────────────────────────────────────┘
                                │
                                ↓
┌──────────────────────┬────────────────────┬──────────────────────┐
│   M-Pesa Flow        │   PayPal Flow      │   Stripe Flow        │
├──────────────────────┼────────────────────┼──────────────────────┤
│ 1. STK Push Sent     │ 1. Redirect URL    │ 1. Redirect URL      │
│ 2. User enters PIN   │ 2. User approves   │ 2. User enters card  │
│ 3. M-Pesa callback   │ 3. PayPal redirect │ 3. Stripe webhook    │
│ 4. Payment confirmed │ 4. Our webhook     │ 4. Payment confirmed │
└──────────────────────┴────────────────────┴──────────────────────┘
                                │
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│         WEBHOOK HANDLER - Confirm Payment                        │
│  • Receive callback from provider                               │
│  • Verify payment status                                        │
│  • Update PaymentRecord (status: completed)                     │
│  • Create EventRegistration if tournament_entry                 │
│  • Log transaction                                              │
└────────────────────────────────────────────────────────────────┘
                                │
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│              DATABASE & USER EXPERIENCE                          │
│  PaymentRecord.providerStatus = "completed"                     │
│  User registered for tournament ✓                               │
│  Email confirmation sent (optional)                             │
└────────────────────────────────────────────────────────────────┘
```

---

## Comparison Matrix

| Feature | M-Pesa | PayPal | Stripe |
|---------|--------|--------|--------|
| **Target Market** | Kenya/Africa | Global | Global |
| **User Flow** | STK → PIN → Callback | Redirect → Approve → Redirect | Redirect → Card → Webhook |
| **Checkout UX** | On phone | On PayPal page | On Stripe page |
| **Currency** | KES | Multiple | Multiple |
| **Webhook** | POST callback | GET redirect | Signed POST webhook |
| **Verification** | Receipt number | Token | Payment intent status |
| **Speed** | ~30 seconds | ~1 minute | Instant |
| **User Exit** | Finish on phone | Need redirect back | Finish on Stripe |
| **Documentation** | MPESA_INTEGRATION.md | PAYPAL_INTEGRATION.md | STRIPE_INTEGRATION.md |

---

## Database Schema

```prisma
model PaymentRecord {
  id                    String   @id @default(cuid())
  
  // Booking info
  userId                String   @index
  eventId               String   @index
  bookingType           String   // tournament_entry | amenity_booking | court_booking
  
  // Amount & Currency
  amount                Decimal  // 500 (stored as-is)
  currency              String   // KES, USD, GBP, etc
  
  // Provider tracking
  provider              String   // mpesa, paypal, stripe
  providerStatus        String   // pending, completed, failed
  providerTransactionId String?  // Receipt/Order/Intent ID
  checkoutUrl           String?  // Redirect URL (null for M-Pesa)
  
  // Full details storage
  metadata              String   // JSON stringify
  
  // Timestamps
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  @@unique([provider, providerTransactionId])
  @@index([providerStatus, provider])
}
```

**Metadata Examples:**

```javascript
// M-Pesa
{
  "mobileNumber": "254722000000",
  "accountReference": "TOURNAMENT-123-456",
  "transactionDesc": "Tournament entry",
  "mpesaReceiptNumber": "SAF62I7K0YV",
  "resultCode": 0
}

// PayPal
{
  "amount": 500,
  "currency": "USD",
  "paypalToken": "5H065994EC1067026",
  "paypalPayerId": "PAYERID123",
  "approvedAt": "2024-01-15T10:30:00Z"
}

// Stripe
{
  "amount": 50000,  // cents
  "currency": "usd",
  "stripeSessionId": "cs_live_...",
  "stripePaymentIntentId": "pi_...",
  "paymentStatus": "paid"
}
```

---

## Key Validation Rules

### M-Pesa
```
- Mobile Number: Must match /^254\d{9}$/ (Format: 254XXXXXXXXX)
- Amount: Must be > 0 KES
- Account Reference: Must be unique
- No more than 10 decimal places for KES
```

### PayPal
```
- Amount: Must be > 0
- Currency: ISO 4217 code (USD, EUR, GBP, etc)
- Must match PayPal supported currencies
- Idempotency key prevents duplicate orders
```

### Stripe
```
- Amount: Must be in cents (multiply USD by 100)
- Currency: ISO 4217 code (lowercase: "usd", not "USD")
- Session timeout is typically 24 hours
- Test vs Live mode must match environment
```

---

## API Request/Response Examples

### Initiate Payment

```bash
# M-Pesa
curl -X POST http://localhost:3000/api/payments/mpesa \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "mobileNumber": "254722000000",
    "amount": 500,
    "userId": "user1",
    "eventId": "event1",
    "bookingType": "tournament_entry"
  }'

# PayPal
curl -X POST http://localhost:3000/api/payments/paypal \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "amount": 500,
    "currency": "USD",
    "userId": "user1",
    "eventId": "event1",
    "bookingType": "tournament_entry"
  }'

# Stripe
curl -X POST http://localhost:3000/api/payments/stripe \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "amount": 50000,
    "currency": "usd",
    "userId": "user1",
    "eventId": "event1",
    "bookingType": "tournament_entry"
  }'
```

### Success Responses

```json
// M-Pesa Success
{
  "success": true,
  "transactionId": "txn_abc123",
  "checkoutRequestId": "ws_CO_...",
  "message": "M-Pesa STK push sent"
}

// PayPal Success
{
  "success": true,
  "transactionId": "txn_abc123",
  "approveUrl": "https://www.sandbox.paypal.com/checkoutnow?token=...",
  "orderId": "5H065994EC1067026"
}

// Stripe Success
{
  "success": true,
  "transactionId": "txn_abc123",
  "checkoutUrl": "https://checkout.stripe.com/pay/...",
  "sessionId": "cs_live_..."
}
```

### Error Responses

```json
// Validation Error
{
  "success": false,
  "error": "Missing required fields: mobileNumber, amount"
}

// Gateway Error
{
  "success": false,
  "error": "Payment gateway temporarily unavailable"
}

// Processing Error
{
  "success": false,
  "error": "Failed to process payment: [specific reason]"
}
```

---

## Webhook Handling

### M-Pesa Callback
```
POST /api/webhooks/mpesa
{
  "transactionId": "txn_abc123",
  "resultCode": 0,
  "mpesaReceiptNumber": "SAF62I7K0YV",
  ...
}
Response: { success: true, message: "Payment confirmed" }
```

### PayPal Callback
```
GET /api/webhooks/paypal?transactionId=txn_abc123&token=...&PayerID=...
Response: 302 redirect to /tournaments/{eventId}?payment=success
```

### Stripe Webhook
```
POST /api/webhooks/stripe
{
  "type": "checkout.session.completed",
  "data": { "object": { "metadata": { "transactionId": "txn_abc123" }, ... } }
}
Response: 200 { success: true }
```

---

## Event Registration Flow

After payment is confirmed, if `bookingType === 'tournament_entry'`:

```javascript
1. Find or create ClubMember
   WHERE playerId = payment.userId

2. Find latest EventRegistration
   WHERE eventId = payment.eventId
   ORDER BY signupOrder DESC

3. Calculate next signup order
   = (latest.signupOrder || 0) + 1

4. Create EventRegistration
   {
     eventId: payment.eventId,
     memberId: member.id,
     status: 'registered',
     signupOrder: nextOrder
   }

5. User is now registered for tournament ✓
```

---

## Testing Checklist

### Unit Tests Needed
- [ ] Payment route validation
- [ ] Field format validation (mobile number, amount, currency)
- [ ] PaymentRecord creation
- [ ] Error handling and logging
- [ ] Webhook callback processing

### Integration Tests Needed
- [ ] M-Pesa: STK push → callback → registration
- [ ] PayPal: Redirect → approve → webhook → registration
- [ ] Stripe: Redirect → checkout → webhook → registration
- [ ] Tournament registration creation after payment
- [ ] Multiple registrations same user same tournament
- [ ] Concurrent payment processing

### Manual Tests
- [ ] M-Pesa with sandbox test numbers
- [ ] PayPal with sandbox accounts
- [ ] Stripe with test cards
- [ ] Failed payment scenarios
- [ ] Webhook signature verification
- [ ] Database consistency

---

## Debugging Tips

### Enable Request Logging
```javascript
// In route handlers, check console for:
console.log('Route received:', { mobileNumber, amount, userId, ... });
console.log('Validation errors:', errors);
console.log('PaymentRecord created:', record.id);
```

### Check PaymentRecord States
```sql
-- View all pending payments
SELECT * FROM PaymentRecord WHERE providerStatus = 'pending'

-- View failed payments with error details
SELECT id, provider, providerStatus, metadata 
FROM PaymentRecord WHERE providerStatus = 'failed'
ORDER BY createdAt DESC

-- Group by provider for summary
SELECT provider, providerStatus, COUNT(*) 
FROM PaymentRecord 
GROUP BY provider, providerStatus
```

### Monitor Webhooks
```bash
# For M-Pesa: Check server logs for callback receipt
# For PayPal: Verify redirect parameters in browser
# For Stripe: Check Stripe Dashboard > Events for webhook delivery status
```

---

## Security Considerations

1. **Payment Gateway Authentication**
   - All gateway requests use HTTPS
   - API keys stored in environment variables (Cloudflare)
   - Idempotency keys prevent duplicate charges

2. **Webhook Verification**
   - PayPal: Verify token matches created order
   - Stripe: Verify webhook signature before processing
   - M-Pesa: Validate callback against PaymentRecord

3. **Payment Record Integrity**
   - Use database unique constraints
   - Store immutable payment details in metadata
   - Log all state transitions

4. **User Data**
   - Mobile numbers hashed in logs if needed
   - Sensitive metadata encrypted at rest
   - No sensitive data in error messages to users

---

## Production Deployment

### Environment Setup
```bash
# .env.production
MPESA_API_BASE=https://api.safaricom.co.ke (not sandbox)
PAYPAL_API_BASE=https://api.paypal.com (not sandbox)
STRIPE_SECRET_KEY=sk_live_... (not sk_test_...)
STRIPE_WEBHOOK_SECRET=whsec_... (production webhook)
```

### Verification Steps
- [ ] All payment gateway credentials updated for production
- [ ] Webhook URLs updated to production domain
- [ ] SSL certificates valid
- [ ] Database backups configured
- [ ] Error logging and monitoring enabled
- [ ] Rate limiting implemented
- [ ] Load testing completed

---

## Related Documentation

- **M-Pesa Details:** See [MPESA_INTEGRATION.md](MPESA_INTEGRATION.md)
- **PayPal Details:** See [PAYPAL_INTEGRATION.md](PAYPAL_INTEGRATION.md)
- **Stripe Details:** See [STRIPE_INTEGRATION.md](STRIPE_INTEGRATION.md)
- **Issues & Fixes:** See [PAYMENT_ISSUES_AND_FIXES.md](PAYMENT_ISSUES_AND_FIXES.md)

---

## Code Structure

```
src/
├── actions/
│   └── payments.ts               # Server actions for all providers
├── app/api/payments/
│   ├── mpesa/route.ts           # M-Pesa route handler
│   ├── paypal/route.ts          # PayPal route handler
│   └── stripe/route.ts          # Stripe route handler
├── app/api/webhooks/
│   ├── mpesa/route.ts           # M-Pesa callback handler
│   ├── paypal/route.ts          # PayPal callback handler
│   └── stripe/route.ts          # Stripe callback handler
└── app/tournaments/
    └── [id]/page.tsx            # Checkout modals
```

---

## Function Signatures

```typescript
// Server Actions (src/actions/payments.ts)
export async function processMPesaPayment(
  mobileNumber: string,
  amount: number,
  accountReference: string,
  transactionDesc: string,
  userId: string,
  eventId: string,
  bookingType: 'tournament_entry' | 'amenity_booking' | 'court_booking'
): Promise<{ success: boolean; error?: string; transactionId?: string; ... }>

export async function processPayPalPayment(
  amount: number,
  currency: string,
  userId: string,
  eventId: string,
  bookingType: 'tournament_entry' | 'amenity_booking' | 'court_booking',
  metadata?: Record<string, any>
): Promise<{ success: boolean; error?: string; approveUrl?: string; ... }>

export async function processStripePayment(
  amount: number,
  currency: string,
  userId: string,
  eventId: string,
  bookingType: 'tournament_entry' | 'amenity_booking' | 'court_booking',
  metadata?: Record<string, any>
): Promise<{ success: boolean; error?: string; checkoutUrl?: string; ... }>
```

---

## Quick Reference

| Aspect | M-Pesa | PayPal | Stripe |
|--------|--------|--------|--------|
| **Documentation** | MPESA_INTEGRATION.md | PAYPAL_INTEGRATION.md | STRIPE_INTEGRATION.md |
| **Action** | processMPesaPayment | processPayPalPayment | processStripePayment |
| **Route** | /api/payments/mpesa | /api/payments/paypal | /api/payments/stripe |
| **Webhook** | /api/webhooks/mpesa | /api/webhooks/paypal | /api/webhooks/stripe |
| **Mobile Input** | Yes | No | No |
| **Checkout URL** | No | Yes | Yes |
| **Callback Type** | POST | GET | POST (signed) |
| **Test Setup** | Sandbox credentials | Sandbox account | Test mode key |
