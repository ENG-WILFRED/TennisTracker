# Implementation Summary - Coaching Session Payment System

## What Was Implemented

This is a complete end-to-end system for handling coaching session payments, where:
- **Organization** charges players for coaching sessions at a fixed hourly rate
- **Coach** receives a commission when a session is completed
- **Player** accumulates debt to the organization
- **System** automatically calculates, bills, and tracks all transactions

---

## Database Changes

### New Models Added (6)

1. **OrgCoachingPricing**
   - Organization-level pricing per hour for coaching sessions
   - Configurable rounding and minimum duration

2. **SessionPayment**
   - Records payment generated from each coaching session
   - Tracks amount charged, duration, coach commission
   - Links to debt and earnings

3. **UserOrgDebt**
   - Tracks outstanding debt from player to organization
   - Includes total, paid, and outstanding amounts
   - Status tracking (active, paid, overdue, etc.)

4. **DebtTransaction**
   - Audit trail for all debt changes
   - Records charges, payments, refunds, adjustments
   - Full transaction history

5. **CoachWallet** (updated)
   - Now tracks coach earnings with session payment integration
   - Links to wallet transactions for earnings

6. **CoachSession** (updated)
   - Added `coachCompletedAt` to track when coach marks complete
   - Added `durationMinutes` calculation
   - Added relation to `SessionPayment`

### Updated Models (2)

- **SessionBooking**: Added `playerConfirmedAt` to track player confirmation
- **Organization**: Added relations to pricing, payments, and debts
- **User**: Added relation to organization debts

---

## Services Created

### CoachingSessionPaymentService (`src/services/coaching-session-payment.service.ts`)

**Main Methods:**

1. `markSessionComplete()`
   - Called when coach marks session complete
   - Calculates billing amount based on org pricing
   - Creates payment, debt, and earnings records
   - Updates coach wallet

2. `confirmPlayerSessionComplete()`
   - Called when player confirms session
   - Handles absence refunds automatically
   - Updates debt accordingly

3. `getSessionPaymentDetails()`
   - Retrieves full payment info including debt

4. `getUserOrgDebt()`
   - Gets user's total debt to organization

5. `getCoachEarningsSummary()`
   - Coach's earnings and wallet status

6. `configureOrgCoachingPrice()`
   - Sets organization pricing

---

## API Endpoints Created (6)

### 1. Mark Session Complete (Coach)
**Route:** `POST /api/sessions/[sessionId]/payment?action=coach-complete`
- Coach marks session as done
- System auto-calculates billing
- Creates payment, debt, earnings records

### 2. Player Confirms Session
**Route:** `POST /api/sessions/[sessionId]/payment?action=player-confirm`
- Player confirms attendance
- Handles absences with auto-refund

### 3. Get Session Payment Details
**Route:** `GET /api/sessions/[sessionId]/payment`
- View payment, debt, earnings for session

### 4. Get User Debt
**Route:** `GET /api/orgs/[orgId]/user-debt`
- Player views their debt to organization
- Includes transaction history

### 5. Get Coach Earnings
**Route:** `GET /api/coach/earnings-summary`
- Coach views earnings and wallet

### 6. Get/Set Organization Pricing
**Route:** `GET/POST /api/orgs/[orgId]/coaching-pricing`
- Get current pricing
- Set/update hourly rate

---

## Key Features

### 1. Automatic Billing Calculation
```
Duration × Price Per Hour = Amount Charged
30 min × $50/hour = $25 (with rounding up)
```

### 2. Coach Commission
```
Amount × Commission Rate = Coach Earnings
$25 × 60% = $15 to coach
$25 × 40% = $10 to organization
```

### 3. Debt Tracking
- Player debt automatically created
- Full transaction history maintained
- Status tracking (active, paid, overdue, etc.)

### 4. Absence Handling
- If player absent: automatic full refund
- Debt reversed
- Coach earnings reversed

### 5. Session Rounding
Configurable rounding types:
- **Up**: 30-45 min → 1 hour (default)
- **Down**: 0-15 min → 0 hours
- **Nearest**: 18 min → 15 min

### 6. Access Control
- Coaches can only mark their own sessions complete
- Players can only confirm their own bookings
- Admins can view and manage all transactions

---

## Payment Flow Diagram

```
SETUP PHASE:
Organization Admin
    ↓
Sets coaching price (e.g., $50/hour)
    ↓
Creates OrgCoachingPricing record

SESSION PHASE:
Coach creates session
    ↓
Player books session
    ↓
Session occurs

COMPLETION PHASE:
Coach marks complete
    ↓
System calculates:
  - Duration in hours
  - Amount = Duration × Price
  - Coach earnings = Amount × Commission %
    ↓
System creates records:
  - SessionPayment (tracks payment)
  - UserOrgDebt (tracks player owes)
  - CoachEarning (tracks commission)
  - CoachWallet (credits earnings)
  - DebtTransaction (audit trail)
    ↓
Player receives notification:
  "You've been charged $25 for coaching session"
    ↓
Coach receives notification:
  "You earned $15 from coaching session"

CONFIRMATION PHASE:
Player confirms attendance
    ↓
If absent → automatic refund
    ↓
Session marked as confirmed

PAYMENT PHASE:
Player pays organization
    ↓
DebtTransaction recorded
    ↓
UserOrgDebt updated

PAYOUT PHASE:
Coach requests payout
    ↓
CoachEarning approved
    ↓
CoachWallet transferred
    ↓
Coach receives payment
```

---

## Database Transaction Safety

All complex operations use Prisma transactions (`$transaction`) to ensure:
- Atomicity: All or nothing (no partial updates)
- Consistency: Related records stay in sync
- Isolation: Concurrent requests don't interfere
- Durability: Data persists reliably

Example: When marking session complete:
```
START TRANSACTION
  1. Get session
  2. Get org pricing
  3. Calculate billing
  4. Update session
  5. Create payment
  6. Create/update debt
  7. Create debt transaction
  8. Create earnings
  9. Update wallet
  10. Create wallet transaction
COMMIT
```

---

## Configuration Example

```typescript
// 1. Set up organization pricing
await coachingSessionPaymentService.configureOrgCoachingPrice(
  organizationId: "org-123",
  pricePerHour: 50
);

// 2. Coach marks session complete
const result = await coachingSessionPaymentService.markSessionComplete({
  sessionId: "session-456",
  coachId: "coach-789",
  organizationId: "org-123"
});

// Result contains:
// - sessionPayment: $25 charged to player
// - userDebt: updated debt record
// - coachEarning: $15 to coach
// - coachWallet: +$15 pending

// 3. Player confirms
await coachingSessionPaymentService.confirmPlayerSessionComplete({
  sessionId: "session-456",
  playerId: "player-000",
  attendanceStatus: "attended"
});

// 4. View debt
const debt = await coachingSessionPaymentService.getUserOrgDebt(
  "player-000",
  "org-123"
);

// 5. View coach earnings
const earnings = await coachingSessionPaymentService.getCoachEarningsSummary(
  "coach-789"
);
```

---

## Integration Checklist

Before using in production:

- [ ] Run database migration
- [ ] Generate Prisma client
- [ ] Set organization pricing for each org
- [ ] Configure coach commission rates in CoachPricing
- [ ] Set up payment gateway (for actual charging)
- [ ] Add UI components for session completion
- [ ] Add notifications (email/push) for charges
- [ ] Add reports for accounting
- [ ] Test with sample sessions
- [ ] Train coaches and players on workflow

---

## Next Steps (Optional Enhancements)

1. **Payment Gateway Integration**
   - Stripe/M-Pesa/PayPal integration
   - Automatic charging on session completion
   - Wallet system for prepaid credits

2. **Group Sessions**
   - Split cost among multiple players
   - Pro-rata refunds on absence

3. **Session Packages**
   - 5-session packages at discount
   - Automatic deduction from prepaid balance

4. **Reporting**
   - Coach earning reports
   - Organization revenue reports
   - Debt aging analysis
   - Payment failure reports

5. **Notifications**
   - SMS/Email when charged
   - Payment due reminders
   - Coach earnings notifications
   - Overdue debt alerts

6. **Admin Controls**
   - Manual adjustments (discounts, penalties)
   - Payment reversals
   - Session rebilling
   - Bulk debt write-offs

---

## Documentation Files

- **COACHING_SESSION_PAYMENTS.md**: Complete technical documentation
- **QUICK_START.md**: Quick reference guide and common tasks
- **This file**: Implementation summary

---

## Files Created/Modified

### Created
- `/src/services/coaching-session-payment.service.ts`
- `/src/app/api/sessions/[sessionId]/payment/route.ts`
- `/src/app/api/orgs/[orgId]/user-debt/route.ts`
- `/src/app/api/coach/earnings-summary/route.ts`
- `/src/app/api/orgs/[orgId]/coaching-pricing/route.ts`
- `/documentation/coaching-payments/COACHING_SESSION_PAYMENTS.md`
- `/documentation/coaching-payments/QUICK_START.md`

### Modified
- `/prisma/schema.prisma` (added models and relations)

---

## Testing Recommendations

1. **Unit Tests**: Service methods
2. **Integration Tests**: API endpoints
3. **E2E Tests**: Complete workflow (session → payment → debt)
4. **Load Tests**: Concurrent session completions
5. **Security Tests**: Access control and authorization

---

## Support & Troubleshooting

**Q: "Coaching pricing not configured"**
- A: Set pricing using `/api/orgs/[orgId]/coaching-pricing` POST endpoint

**Q: "Only the coach can mark session complete"**
- A: Make sure you're using coach's auth token and they created the session

**Q: Player didn't get charged**
- A: Check: session has organizationId, status changed to completed, pricing is set

**Q: Coach didn't receive earnings**
- A: Check: CoachEarning created, CoachWallet updated, pendingBalance increased

**Q: Refund didn't apply for absent player**
- A: Call player-confirm endpoint with `attendanceStatus: "absent"`

---

Created: May 4, 2026
Last Updated: May 4, 2026
