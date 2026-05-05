# Quick Start - Coaching Session Payment System

## 1. Database Migration

After schema changes, run:

```bash
# Generate Prisma client
npx prisma generate

# Create migration
npx prisma migrate dev --name add_coaching_session_payments

# Deploy to production
npx prisma migrate deploy
```

## 2. Initialize Organization Pricing

```bash
# For each organization that offers coaching:
curl -X POST http://localhost:3000/api/orgs/ORG_ID/coaching-pricing \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "pricePerHour": 50,
    "currency": "USD",
    "minSessionDurationMinutes": 30,
    "roundingType": "up"
  }'
```

## 3. Coach Workflow

### Step 1: Coach schedules a session
```
- Create CoachSession with startTime, endTime, organizationId
- Required fields: title, description, coach info
```

### Step 2: Player books the session
```
- Create SessionBooking linking player to session
```

### Step 3: Session occurs
```
- Coach and player meet
- Conduct training session
```

### Step 4: Coach marks session complete
```bash
curl -X POST http://localhost:3000/api/sessions/SESSION_ID/payment?action=coach-complete \
  -H "Authorization: Bearer COACH_TOKEN"
```

**System automatically:**
- Calculates duration and amount
- Charges player
- Credits coach earnings
- Creates debt record
- Updates wallet

### Step 5: Player confirms (optional)
```bash
curl -X POST http://localhost:3000/api/sessions/SESSION_ID/payment?action=player-confirm \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer PLAYER_TOKEN" \
  -d '{
    "attendanceStatus": "attended"
  }'
```

**If absent:**
- Automatic refund applied
- Debt removed from player
- Coach earnings reversed

## 4. Check Payment Details

```bash
# Coach/Player can view payment details
curl http://localhost:3000/api/sessions/SESSION_ID/payment \
  -H "Authorization: Bearer TOKEN"

# Response includes:
# - SessionPayment: amount charged, duration, coach earnings
# - UserDebt: player's outstanding debt
# - CoachEarning: coach's commission
```

## 5. Monitor Earnings (Coach)

```bash
# Coach can check their earnings
curl http://localhost:3000/api/coach/earnings-summary \
  -H "Authorization: Bearer COACH_TOKEN"

# Response includes:
# - Wallet: balance, total earned, pending
# - Recent earnings from sessions
```

## 6. Check User Debt (Player/Admin)

```bash
# Player can check their debt to an organization
curl http://localhost:3000/api/orgs/ORG_ID/user-debt \
  -H "Authorization: Bearer PLAYER_TOKEN"

# Admin/Finance can check any user's debt
curl http://localhost:3000/api/orgs/ORG_ID/user-debt?userId=USER_ID \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Response includes:
# - Total debt, paid amount, outstanding
# - Transaction history (charges, payments, refunds)
```

## 7. Setup Frontend Components

### Display Session Payment Info
```typescript
const { data } = await fetch(`/api/sessions/${sessionId}/payment`)
  .then(r => r.json());

// Show player:
- Amount charged: $data.sessionPayment.amount
- Date: $data.sessionPayment.createdAt
- Duration: $data.sessionPayment.durationMinutes minutes

// Show coach:
- Your earnings: $data.coachEarning.amount
- Commission: ${data.sessionPayment.coachCommissionRate * 100}%
```

### Display User Debt
```typescript
const { data } = await fetch(`/api/orgs/${orgId}/user-debt`)
  .then(r => r.json());

// Show player:
- Total sessions: $data.debtTransactions.filter(t => t.transactionType === 'charge').length
- Outstanding debt: $data.outstandingAmount
- Last payment: $data.lastPaymentAt
- Debt status: $data.status

// History table:
- Date | Type | Amount | Description
- 2026-05-04 | charge | +$50 | Coaching session
- 2026-05-05 | payment | -$50 | Payment received
```

## 8. Configuration Options

### Rounding Types
- **"up"** (default): Round partial hours up to next 15-minute mark
  - 30-45 min session → billed as 1 hour
- **"down"**: Round down to previous 15-minute mark
  - 0-15 min session → 0 hours (not charged)
- **"nearest"**: Round to nearest 15-minute mark
  - 18 min session → 15 min
  - 23 min session → 30 min

### Commission Rates (Coach-specific)
Set in CoachPricing model:
- Default: 60% to coach, 40% to organization
- Customizable per coach
- Can be adjusted by admin

## 9. Common Tasks

### Get all pending sessions for organization
```typescript
const sessions = await prisma.coachSession.findMany({
  where: {
    organizationId: ORG_ID,
    status: 'completed',
    coachCompletedAt: { not: null },
  },
  include: {
    sessionPayment: true,
    earnings: true,
  },
});
```

### Get all unpaid coach earnings
```typescript
const unpaidEarnings = await prisma.coachEarning.findMany({
  where: {
    coachId: COACH_ID,
    status: 'pending',
  },
  orderBy: { createdAt: 'desc' },
});
```

### Get overdue player debts
```typescript
const overdueDebts = await prisma.userOrgDebt.findMany({
  where: {
    organizationId: ORG_ID,
    status: 'active',
    dueDate: { lt: new Date() },
  },
});
```

### Create manual debt adjustment
```typescript
// Admin creates adjustment (e.g., discount or penalty)
const adjustment = await prisma.debtTransaction.create({
  data: {
    debtId: DEBT_ID,
    transactionType: 'adjustment',
    amount: new Decimal(-50), // negative for discount
    description: 'Admin discount - loyalty program',
    referenceType: 'adjustment',
  },
});

// Update the debt
await prisma.userOrgDebt.update({
  where: { id: DEBT_ID },
  data: {
    outstandingAmount: {
      decrement: 50,
    },
  },
});
```

## 10. Error Handling

```typescript
try {
  await coachingSessionPaymentService.markSessionComplete({
    sessionId,
    coachId,
    organizationId,
  });
} catch (error) {
  if (error.message.includes('pricing not configured')) {
    // Guide admin to set pricing first
  } else if (error.message.includes('Only the coach')) {
    // Wrong user attempting action
  } else if (error.message.includes('not found')) {
    // Session doesn't exist
  }
}
```

## 11. Database Queries for Insights

### Total revenue from coaching (pending + paid)
```sql
SELECT 
  organization_id,
  SUM(CAST(amount AS NUMERIC)) as total_revenue,
  COUNT(*) as session_count
FROM session_payments
WHERE status IN ('pending', 'completed')
GROUP BY organization_id;
```

### Coach earnings breakdown
```sql
SELECT 
  coach_id,
  SUM(CAST(amount AS NUMERIC)) as total_earned,
  COUNT(*) as session_count,
  AVG(CAST(amount AS NUMERIC)) as avg_per_session
FROM coach_earnings
WHERE status IN ('pending', 'approved', 'paid')
GROUP BY coach_id;
```

### Player debt summary
```sql
SELECT 
  user_id,
  organization_id,
  SUM(CAST(total_amount AS NUMERIC)) as total_debt,
  SUM(CAST(outstanding_amount AS NUMERIC)) as outstanding,
  status,
  COUNT(*) as debt_records
FROM user_org_debts
GROUP BY user_id, organization_id, status;
```

---

## Support

For more details, see [COACHING_SESSION_PAYMENTS.md](./COACHING_SESSION_PAYMENTS.md)
