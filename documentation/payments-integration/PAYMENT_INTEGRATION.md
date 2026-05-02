# Payment Integration Guide

## Overview
This document describes the complete payment integration for court bookings using three payment providers: M-Pesa, PayPal, and Stripe.

## Architecture

### Payment Flow

```
User Selects Payment Method
    ↓
handlePayment() in BookingDetailsPage
    ↓
Process Payment (Server Action)
    ├── M-Pesa: processMPesaPayment()
    ├── PayPal: processPayPalPayment()
    └── Stripe: processStripePayment()
    ↓
Create PaymentRecord in Database
    ↓
Send to Payment Provider
    ↓
Return Checkout URL / Confirmation
    ├── M-Pesa: Redirect after STK push
    ├── PayPal: Redirect to checkout page
    └── Stripe: Redirect to checkout page
    ↓
User Completes Payment
    ↓
Payment Provider Webhook
    ├── M-Pesa: /api/payments/callback/mpesa
    ├── PayPal: /api/payments/callback/paypal
    └── Stripe: /api/payments/callback/stripe
    ↓
completePayment() Action
    ↓
Create Booking & Update PaymentRecord
```

## Files

### Payment Server Actions
**File:** `src/actions/payments.ts`

Key Functions:
- `processMPesaPayment()` - Initiates M-Pesa STK push
- `processPayPalPayment()` - Creates PayPal order
- `processStripePayment()` - Creates Stripe checkout session
- `completePayment()` - Finalizes payment and creates booking
- `createCourtBooking()` - Creates booking record after payment success
- `getPaymentStatus()` - Checks payment status
- `handlePaymentCallback()` - Processes webhook callbacks

### Booking Page
**File:** `src/app/player/booking/details/page.tsx`

Features:
- Date/time selection with peak hours visualization
- Payment method selection (PayPal, Stripe, M-Pesa)
- Mobile number input for M-Pesa
- Booking summary and policies
- Responsive mobile/desktop layout

### Callback Handlers

**M-Pesa:** `src/app/api/payments/callback/mpesa/route.ts`
- Receives STK push completion callbacks
- Processes transaction result

**PayPal:** `src/app/api/payments/callback/paypal/route.ts`
- Receives IPN callbacks
- Verifies callback authenticity with PayPal

**Stripe:** `src/app/api/payments/callback/stripe/route.ts`
- Receives webhook events
- Handles payment success/failure

### Status Endpoint
**File:** `src/app/api/payments/status/[transactionId]/route.ts`
- Client can poll to check payment completion
- Returns payment status and details

### Success Page
**File:** `src/app/player/booking/success/page.tsx`
- Handles return from PayPal/Stripe
- Polls for payment completion
- Creates booking on success
- Handles errors gracefully

## Payment Providers Configuration

### M-Pesa
- **Endpoint:** `https://mpesa-integration-worker.kimaniwilfred95.workers.dev/api/stk/push`
- **Currency:** KES (Kenyan Shilling)
- **Format:** `254XXXXXXXXX` (12 digits including country code)
- **Callback:** POST to `/api/payments/callback/mpesa`

### PayPal
- **Endpoints:** 
  - Production: `https://www.paypal.com`
  - Sandbox: `https://www.sandbox.paypal.com`
- **Payment Gateway:** `https://payment-gateway.kimaniwilfred95.workers.dev/api/payments/paypal`
- **Currency:** USD
- **Callback:** POST to `/api/payments/callback/paypal` (IPN)
- **Return URL:** `/player/booking/success?token={token}`

### Stripe
- **Payment Gateway:** `https://payment-gateway.kimaniwilfred95.workers.dev/api/payments/stripe`
- **Currency:** USD
- **Webhook Events:**
  - `payment_intent.succeeded`
  - `charge.succeeded`
  - `payment_intent.payment_failed`
- **Callback:** POST to `/api/payments/callback/stripe`
- **Return URL:** `/player/booking/success?session_id={session_id}`

## Database Schema

### PaymentRecord
```typescript
{
  id: String (unique)
  userId: String (user making payment)
  eventId: String (courtId for bookings)
  bookingType: 'court_booking' | 'tournament_entry' | 'amenity_booking'
  amount: Float
  currency: String (KES, USD, etc)
  provider: 'mpesa' | 'paypal' | 'stripe'
  providerStatus: 'pending' | 'completed' | 'failed'
  providerTransactionId: String (external transaction ID)
  checkoutUrl: String (redirect URL for PayPal/Stripe)
  metadata: JSON (booking details, notes, etc)
  createdAt: DateTime
  updatedAt: DateTime
}
```

### CourtBooking (Created after successful payment)
```typescript
{
  id: String
  playerId: String
  courtId: String
  organizationId: String
  startTime: DateTime
  endTime: DateTime
  matchType: 'singles' | 'doubles'
  status: 'confirmed' | 'cancelled'
  paymentStatus: 'completed' | 'refunded'
  paymentId: String (link to PaymentRecord)
  notes: String
  createdAt: DateTime
  updatedAt: DateTime
}
```

## Flow Details

### M-Pesa Flow
1. User enters M-Pesa number and selects duration
2. `handlePayment()` calls `processMPesaPayment()`
3. PaymentRecord created with status 'pending'
4. STK push sent to user's phone
5. User enters PIN to complete payment
6. M-Pesa sends callback to `/api/payments/callback/mpesa`
7. `handlePaymentCallback()` updates PaymentRecord to 'completed'
8. `createCourtBooking()` creates booking record
9. User is redirected to dashboard

### PayPal Flow
1. User selects PayPal as payment method
2. `handlePayment()` calls `processPayPalPayment()`
3. PaymentRecord created with status 'pending'
4. PayPal order created at payment gateway
5. Checkout URL returned
6. User redirected to PayPal checkout page
7. User completes payment on PayPal
8. PayPal redirects to `/player/booking/success?token={token}`
9. Success page polls `/api/payments/status/{transactionId}`
10. Webhook from PayPal calls `/api/payments/callback/paypal`
11. Payment completed, booking created
12. Dashboard redirect

### Stripe Flow
1. User selects Stripe as payment method
2. `handlePayment()` calls `processStripePayment()`
3. PaymentRecord created with status 'pending'
4. Stripe checkout session created
5. Checkout URL returned
6. User redirected to Stripe checkout page
7. User completes payment on Stripe
8. Stripe redirects to `/player/booking/success?session_id={session_id}`
9. Success page polls `/api/payments/status/{transactionId}`
10. Webhook from Stripe calls `/api/payments/callback/stripe`
11. Payment completed, booking created
12. Dashboard redirect

## Environment Variables

```bash
# PayPal
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
NEXT_PUBLIC_PAYPAL_SANDBOX=true

# Stripe
STRIPE_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# M-Pesa (handled by external worker)
# Configured in external worker at kimaniwilfred95.workers.dev
```

## Integration Checklist

- [x] Payment server actions for all three providers
- [x] PaymentRecord database schema
- [x] Webhook callback handlers for all providers
- [x] Booking creation after payment
- [x] Booking UI with payment methods
- [x] Payment status polling
- [x] Success/failure pages
- [ ] Test M-Pesa integration
- [ ] Test PayPal integration
- [ ] Test Stripe integration
- [ ] Set up webhook URLs in payment provider dashboards
- [ ] Add refund functionality
- [ ] Add payment history/receipt page
- [ ] Add error recovery/retry logic

## Testing

### M-Pesa Testing
1. Use test M-Pesa credentials
2. Test with format: `254712345678`
3. Verify callback handling
4. Check booking creation

### PayPal Testing
1. Enable sandbox mode (NEXT_PUBLIC_PAYPAL_SANDBOX=true)
2. Use sandbox seller/buyer accounts
3. Verify IPN callback processing
4. Check booking creation

### Stripe Testing
1. Use Stripe test API keys
2. Use test card numbers (4242424242424242)
3. Verify webhook delivery in Stripe dashboard
4. Check booking creation

## Error Handling

### Payment Processing Errors
- Invalid input validation
- Payment provider failures
- Network timeouts
- Database errors

### Callback Errors
- Invalid transaction ID
- Duplicate callback processing
- Signature verification failures
- Database transaction failures

All errors are logged and returned with appropriate HTTP status codes.

## Security Considerations

1. **Webhook Verification**: All callbacks verify signatures before processing
2. **User Validation**: Payments are verified to belong to authenticated user
3. **Idempotency**: Duplicate callbacks are handled safely
4. **Rate Limiting**: Consider adding rate limits to payment endpoints
5. **Data Encryption**: Sensitive payment data stored securely in metadata
6. **HTTPS Only**: All payment endpoints require HTTPS

## Future Enhancements

1. **Refund Processing**: Handle refunds for cancelled bookings
2. **Partial Payments**: Support deposit + balance payment
3. **Recurring Payments**: Monthly court passes
4. **Payment History**: UI to view past transactions
5. **Receipts**: Email receipts after payment
6. **Payment Plans**: Installment payment options
7. **Multi-Currency**: Support for different currencies per region
8. **Analytics**: Payment metrics and reporting
