# Coaching Session Payment System

## Overview

This system handles the complete lifecycle of coaching session payments, debt tracking, and coach earnings. The organization (not individual coaches) charges players for coaching sessions, and coaches receive a commission.

## Key Concepts

### 1. **Organization-Level Pricing**
- Each organization sets a **fixed price per hour** for coaching sessions
- The organization charges ALL players the same rate
- Example: Organization XYZ charges $50/hour for coaching sessions

### 2. **Session Completion Flow**

```
Session Occurs
    ↓
Coach marks session as COMPLETE
    ↓
System calculates amount based on:
    - Duration (in hours)
    - Organization's hourly rate
    ↓
Player is CHARGED the amount
    ↓
Coach receives COMMISSION (e.g., 60%)
    ↓
Player DEBT to organization is created/updated
    ↓
Coach WALLET is credited with earnings
    ↓
Player can CONFIRM (verify attendance)
    ↓
If player was ABSENT → automatic REFUND
```

## Database Models

### 1. **OrgCoachingPricing**
Stores organization-level pricing for coaching sessions

```prisma
{
  id: string
  organizationId: string (unique)
  pricePerHour: float              // Fixed price per hour (e.g., 50.00)
  currency: string                 // "USD", "KES", etc.
  minSessionDurationMinutes: int   // Minimum billing duration (default: 30 min)
  roundingType: string             // "up", "down", "nearest" - how to round partial hours
  createdAt: DateTime
  updatedAt: DateTime
}
```

### 2. **CoachSession** (Updated)
Tracks individual coaching sessions

```prisma
{
  id: string
  coachId: string
  organizationId: string
  playerId: string (optional)
  startTime: DateTime
  endTime: DateTime
  price: float                     // Amount charged for this session
  durationMinutes: int             // Calculated from start/end time
  coachCompletedAt: DateTime       // When coach marked session complete
  status: string                   // "scheduled", "completed", "cancelled"
  // ... other fields
}
```

### 3. **SessionBooking** (Updated)
Links players to coaching sessions

```prisma
{
  id: string
  sessionId: string
  playerId: string
  playerConfirmedAt: DateTime      // When player confirmed completion
  attendanceStatus: string         // "pending", "attended", "absent", "late"
  status: string                   // "pending", "completed", "cancelled"
  // ... other fields
}
```

### 4. **SessionPayment** (NEW)
Records the payment generated from a session

```prisma
{
  id: string
  sessionId: string (unique)       // One payment per session
  organizationId: string
  playerId: string                 // Who is being charged
  coachId: string                  // Coach who conducted session
  
  amount: Decimal                  // Total amount charged to player
  durationMinutes: int             // Actual session duration
  durationHours: Decimal           // Calculated hours
  pricePerHour: Decimal            // Rate applied
  
  coachEarnings: Decimal           // Amount credited to coach
  coachCommissionRate: Decimal     // Commission % (e.g., 0.60 = 60%)
  
  status: string                   // "pending", "completed", "failed", "refunded"
  chargedAt: DateTime              // When player was actually charged
  paidToCoachAt: DateTime          // When coach received earnings
  
  createdAt: DateTime
  updatedAt: DateTime
}
```

### 5. **UserOrgDebt** (NEW)
Tracks user's outstanding debt to organization

```prisma
{
  id: string
  userId: string                   // Player who owes money
  organizationId: string
  
  totalAmount: Decimal             // Total debt generated
  paidAmount: Decimal              // Amount already paid
  outstandingAmount: Decimal       // Amount still owed
  currency: string
  
  status: string                   // "active", "paid", "partially_paid", "overdue"
  dueDate: DateTime
  lastPaymentAt: DateTime
  
  notes: string                    // Admin notes
  
  createdAt: DateTime
  updatedAt: DateTime
}
```

### 6. **DebtTransaction** (NEW)
Audit trail for debt changes (charges, payments, refunds)

```prisma
{
  id: string
  debtId: string                   // Links to UserOrgDebt
  
  transactionType: string          // "charge", "payment", "refund", "adjustment"
  amount: Decimal
  description: string              // "Coaching session on 2026-05-04"
  
  referenceType: string            // "session_payment", "payment_method"
  referenceId: string              // ID of the reference (e.g., sessionPaymentId)
  
  createdAt: DateTime
}
```

### 7. **CoachWallet** (Updated with SessionPayment)
Tracks coach's earnings and balance

```prisma
{
  id: string
  coachId: string (unique)
  balance: float                   // Available balance
  totalEarned: float               // Total earnings
  totalWithdrawn: float
  pendingBalance: float            // Earnings awaiting payout
  
  transactions: WalletTransaction[]
}
```

## API Endpoints

### 1. **Mark Session Complete (Coach)**
```
POST /api/sessions/[sessionId]/payment?action=coach-complete

Headers:
  Authorization: Bearer <token>

Response:
{
  success: true,
  data: {
    sessionPayment: { /* SessionPayment record */ },
    userDebt: { /* UserOrgDebt record */ },
    coachEarning: { /* CoachEarning record */ },
    coachWallet: { /* Updated wallet */ }
  },
  message: "Session marked as complete. Player has been charged and coach earnings credited."
}
```

**What happens:**
1. Validates coach owns the session
2. Calculates duration and amount charged
3. Creates SessionPayment record
4. Creates/updates UserOrgDebt
5. Creates CoachEarning record
6. Credits CoachWallet with earnings
7. Creates transaction records for audit trail

### 2. **Confirm Session Complete (Player)**
```
POST /api/sessions/[sessionId]/payment?action=player-confirm

Body:
{
  attendanceStatus: "attended" | "absent" | "late"
}

Response:
{
  success: true,
  data: { /* Updated SessionBooking */ },
  message: "Session confirmed by player"
}
```

**What happens:**
1. Validates player is booked for session
2. Records player confirmation
3. If absent: creates automatic refund
   - Removes debt from UserOrgDebt
   - Creates refund DebtTransaction
   - Reverses coach earnings

### 3. **Get Session Payment Details**
```
GET /api/sessions/[sessionId]/payment

Response:
{
  success: true,
  data: {
    sessionPayment: { /* Full payment record */ },
    userDebt: { /* User's debt record */ },
    coachEarning: { /* Coach's earning */ }
  }
}
```

### 4. **Get User's Debt to Organization**
```
GET /api/orgs/[orgId]/user-debt

Response:
{
  success: true,
  data: {
    userId: string,
    organizationId: string,
    totalAmount: 500.00,
    paidAmount: 200.00,
    outstandingAmount: 300.00,
    status: "partially_paid",
    debtTransactions: [
      {
        transactionType: "charge",
        amount: 50.00,
        description: "Coaching session on 2026-05-04",
        createdAt: DateTime
      },
      // ... more transactions
    ]
  }
}
```

### 5. **Get Coach Earnings Summary**
```
GET /api/coach/earnings-summary

Response:
{
  success: true,
  data: {
    wallet: {
      coachId: string,
      balance: 1500.00,
      totalEarned: 5000.00,
      pendingBalance: 1500.00,
      transactions: [ /* Last 10 transactions */ ]
    },
    recentEarnings: [
      {
        sessionId: string,
        amount: 300.00,
        status: "pending",
        session: { /* Session details */ }
      },
      // ... more earnings
    ]
  }
}
```

### 6. **Get/Set Organization Coaching Pricing**
```
GET /api/orgs/[orgId]/coaching-pricing

Response:
{
  success: true,
  data: {
    organizationId: string,
    pricePerHour: 50.00,
    currency: "USD",
    minSessionDurationMinutes: 30,
    roundingType: "up"
  }
}

---

POST /api/orgs/[orgId]/coaching-pricing

Headers:
  Authorization: Bearer <token>
  
Body:
{
  pricePerHour: 50.00,
  currency: "USD",
  minSessionDurationMinutes: 30,
  roundingType: "up"  // "up", "down", "nearest"
}

Response:
{
  success: true,
  data: { /* Updated OrgCoachingPricing */ },
  message: "Coaching pricing set to $50.00/hour"
}
```

## Service Methods

### CoachingSessionPaymentService

```typescript
// Mark coaching session as complete by coach
// Triggers: billing calculation, payment creation, debt tracking, coach earnings
markSessionComplete(input: {
  sessionId: string
  coachId: string
  organizationId: string
}): Promise<SessionPaymentResult>

// Player confirms session completion
confirmPlayerSessionComplete(input: {
  sessionId: string
  playerId: string
  attendanceStatus: 'attended' | 'absent' | 'late'
}): Promise<SessionBooking>

// Get full payment details including debt
getSessionPaymentDetails(sessionId: string): Promise<{
  sessionPayment: SessionPayment
  userDebt: UserOrgDebt
  coachEarning: CoachEarning
}>

// Get user's total debt to organization
getUserOrgDebt(userId: string, organizationId: string): Promise<UserOrgDebt>

// Get coach's earnings summary
getCoachEarningsSummary(coachId: string): Promise<{
  wallet: CoachWallet
  recentEarnings: CoachEarning[]
}>

// Configure organization pricing
configureOrgCoachingPrice(
  organizationId: string,
  pricePerHour: number
): Promise<OrgCoachingPricing>
```

## Example Workflow

### Scenario: 30-minute coaching session at $50/hour

1. **Organization Setup**
   - Admin sets pricing: $50/hour
   - Coach accepts 60% commission

2. **Session Created**
   - Coach schedules 30-minute session
   - Player books the session

3. **Session Occurs**
   - Coach and player meet
   - 30 minutes coaching

4. **Coach Marks Complete**
   ```
   POST /api/sessions/xyz/payment?action=coach-complete
   ```
   
   System calculates:
   - Duration: 30 min = 0.5 hours (rounded up from 30 min)
   - Amount: 0.5 × $50 = $25
   - Coach earnings: $25 × 60% = $15

   Results:
   - SessionPayment: $25 charged to player
   - UserOrgDebt: +$25 to player's outstanding debt
   - CoachWallet: +$15 earnings
   - CoachEarning: Marked as "pending" (awaiting payout cycle)

5. **Player Confirms (Optional)**
   ```
   POST /api/sessions/xyz/payment?action=player-confirm
   Body: { attendanceStatus: "attended" }
   ```
   - SessionBooking marked as confirmed
   - If absence: automatic $25 refund to player

6. **Player Pays Debt**
   - Eventually player pays organization $25
   - UserOrgDebt updated
   - DebtTransaction logged

7. **Coach Gets Payout**
   - During payout cycle, coach receives $15
   - Status changes to "paid"
   - CoachWallet balance updated

## Rounding Logic

Sessions are rounded to nearest 15 minutes for billing:

```
Rounding Type: "up"
- 0-15 min → 15 min (0.25 hours)
- 15-30 min → 30 min (0.5 hours)
- 30-45 min → 45 min (0.75 hours)
- 45-60 min → 60 min (1 hour)

Rounding Type: "down"
- 0-15 min → 0 min (0 hours) - not charged
- 15-30 min → 15 min (0.25 hours)
- 30-45 min → 30 min (0.5 hours)
- 45-60 min → 45 min (0.75 hours)

Rounding Type: "nearest"
- 0-7 min → 0 min
- 8-22 min → 15 min
- 23-37 min → 30 min
- 38-52 min → 45 min
- 53-60 min → 60 min
```

## Debt Tracking

The system maintains a complete audit trail:

```
UserOrgDebt:
├── id: debt record ID
├── userId: who owes money
├── organizationId: owed to which org
├── totalAmount: $500 total debt
├── paidAmount: $200 paid so far
├── outstandingAmount: $300 remaining
├── status: "partially_paid"
└── debtTransactions:
    ├── charge: +$50 (session on 2026-05-04)
    ├── charge: +$50 (session on 2026-05-05)
    ├── payment: -$100 (payment received)
    ├── refund: -$0 (player was absent)
    └── charge: +$100 (session on 2026-05-06)
```

## Coach Earnings Flow

1. **Pending**: Coach earns amount when session is marked complete
2. **Approved**: Finance officer approves earnings during payout cycle
3. **Paid**: Coach receives payout to their bank account
4. **Tracking**: Full history in WalletTransaction records

## Security & Access Control

- **Coaches** can only mark their own sessions complete
- **Players** can only confirm their own bookings
- **Admins/Finance Officers** can:
  - Configure organization pricing
  - View all debts and payments
  - Manage payouts
  - Create adjustments/refunds
- **Players** can:
  - View their own debt
  - Confirm session attendance

## Future Enhancements

1. **Payment Gateway Integration**
   - Auto-charge player's payment method
   - Wallet system for prepaid credits
   - Payment plans/subscriptions

2. **Advanced Features**
   - Group session billing (split cost)
   - Discount codes/vouchers
   - Late cancellation fees
   - Session rescheduling policies

3. **Reporting**
   - Coach earnings reports
   - Organization revenue reports
   - Debt aging reports
   - Payment history exports

4. **Notifications**
   - Coach: Session marked complete, earnings credited
   - Player: You've been charged, payment due date reminder
   - Admin: Payment failures, overdue debts
