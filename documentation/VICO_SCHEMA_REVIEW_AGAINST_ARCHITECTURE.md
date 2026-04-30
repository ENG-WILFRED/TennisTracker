# Vico Schema Review Against Operating Model

**Date**: April 29, 2026  
**Status**: COMPREHENSIVE ALIGNMENT CHECK

---

## 1. Core Models Status

### ✅ Foundation Models (LOCKED)

#### User & Membership
- **User**: Email, phone, name, location, guardian relationships ✅
- **Membership**: userId, orgId, role, status ✅
- **Guardian**: Child-parent relationships ✅

#### Organization
- **Organization**: Name, contact, metrics (activity score, rating) ✅
- Relations to: Memberships, Courts, Finance, Coaches, etc. ✅

#### Staff (Coaches)
- **Staff**: Extended coach profile with expertise, certifications, bio ✅
- **CoachPricing**: Per-session price, packages, discounts ✅
- **Availability**: Weekly recurring slots ✅

---

### ✅ Session System (CORE BACKBONE)

#### Sessions
- **CoachSession** ✅
  - `coachId`, `organizationId`, `playerId` (1-on-1 specific)
  - `sessionType`: "1-on-1", "group" ✅
  - `status`: "scheduled", "in-progress", "completed", "cancelled" ✅
  - `price`, `courtId`, `startTime`, `endTime` ✅
  - Relations: coach, organization, player, court, bookings ✅

#### Bookings
- **SessionBooking** ✅
  - `sessionId`, `playerId`
  - `status`: "pending", "confirmed", "cancelled", "completed" ✅
  - `attendanceStatus`: "pending", "attended", "absent", "late" ✅
  - `feedbackRating`, `feedbackText`, `notes` ✅
  - `completedAt` for tracking ✅

---

### ✅ Progress Tracking (DIFFERENTIATION)

#### Metrics
- **PlayerMetric** ✅
  - `playerId`, `organizationId` (unique pair)
  - 8 core metrics: serve, forehand, backhand, movement, stamina, strategy, mentalToughness, courtAwareness
  - All default to 50 (0-100 scale) ✅
  - `lastUpdated` via @updatedAt ✅

#### Historical Tracking
- **MetricHistory** ✅
  - `metricId`, `sessionId` (linked)
  - Snapshot of all metrics at this point
  - `changes`: JSON delta tracking ✅
  - `trend`: "up", "down", "stable" ✅
  - `timestamp` for time-series ✅

#### Progress Updates
- **ProgressUpdate** ✅
  - `playerId`, `sessionId` (coach report)
  - `ratingChanges`: JSON delta ✅
  - `focusAreas`: array of next focus points ✅
  - `notes`: coach observations ✅
  - `overallProgress`: calculated 0-100 ✅

---

### ✅ Match System

#### Matches
- **Match** ✅
  - `playerAId`, `playerBId`, `winnerId`
  - `score`, `duration`, `referee`
  - `group` (for tournaments)

#### Match Records
- **MatchBallCrew**: Track match officials ✅
- **MatchReport**: PDF reports from referees ✅

---

### ✅ Recommendation Engine

#### Recommendations
- **Recommendation** ✅
  - `organizationId`, `targetId`, `targetType` (player|parent|coach)
  - `title`, `description`, `priority`, `category`
  - `triggeredBy`: "session_analysis", "match_result", "weekly_job" ✅
  - `triggerData`: JSON context
  - `actionItems`: array of next steps
  - `linkedSessionId`, `linkedMatchId`: context
  - `status`: "active", "completed", "dismissed" ✅
  - `validUntil`: auto-expiration
  - `acknowledged`, `acknowledgedAt` for engagement

---

### ✅ Financial System (ORG-CENTRIC)

#### Revenue
- **OrgRevenue** ✅
  - `organizationId`, `fromPlayerId`
  - `paymentType`: "per_session", "subscription", "tournament" ✅
  - `amount`, `currency` ✅
  - `status`: "pending", "confirmed", "reconciled" ✅
  - `sessionIds`: array of sessions covered
  - `subscriptionId`, `invoiceId`
  - `mpesaTransactionId`, `paymentMethod` ✅
  - `recordedAt` for reconciliation timestamp ✅

#### Coach Earnings
- **CoachEarning** ✅
  - `sessionId` (unique), `coachId`, `organizationId`
  - `sessionPrice`, `coachPercentage`, `amount`
  - `status`: "pending", "approved", "paid" ✅
  - `payoutCycleId` for grouping

#### Coach Wallet
- **CoachWallet** ✅
  - `coachId` (unique), `balance`, `totalEarned`, `totalWithdrawn`, `pendingBalance`
  - Relations to transactions

#### Wallet Transactions
- **WalletTransaction** ✅
  - `walletId`, `type`: "credit", "debit", "withdrawal"
  - `amount`, `description`, `reference` (sessionId)
  - `balanceBefore`, `balanceAfter` ✅
  - `platformFee` ✅

#### Payouts
- **CoachPayout** ✅
  - `coachId`, `amount`, `status` ✅
  - `paymentMethod`, `bankDetails`, `transactionRef`
  - `requestedAt`, `processedAt`, `completedAt` ✅

---

### ✅ Communication Layer

#### Messages
- **Message** ✅
  - `senderId`, `recipientId`, `organizationId`
  - `content`, `readAt`
  - Relations for threading

#### Announcements
- **Announcement** ✅
  - `organizationId`, `createdBy`
  - `title`, `content`
  - `audience`: "all", "coaches", "players", "parents"
  - `publishedAt`, `expiresAt`

---

### ✅ Notifications

#### Notifications
- **Notification** ✅
  - `recipientId`, `organizationId`
  - `type`: "session_booked", "reminder", "completed", "report", etc. ✅
  - `title`, `message`, `deepLink`
  - `channels`: SMS, push, email (array)
  - `sentAt`, `readAt`
  - `metadata`: JSON context
  - **STATUS**: Exists but needs trigger implementation

#### Notification Log
- **NotificationLog** ✅
  - Legacy? Might consolidate with Notification

---

### ✅ Coach Management

#### Coach-Player Relationship
- **CoachPlayerRelationship** ✅
  - `coachId`, `playerId`, `organizationId`
  - `status`: "active", "inactive", "archived"
  - `joinedAt`, `lastSessionAt`
  - `sessionsCount` ✅
  - Relations to notes

#### Coach Notes
- **CoachPlayerNote** ✅
  - `relationshipId`
  - `title`, `content`, `category`

#### Coach Reviews
- **CoachReview** ✅
  - `coachId`, `playerId`, `rating`, `reviewText`

#### Coach Stats
- **CoachStats** ✅
  - Aggregate stats (players, sessions, earnings)
- **CoachDailyStats** ✅
  - Time-series stats

#### Session Reviews
- **CoachSessionReview** ✅
  - Per-session feedback

---

### ✅ Attendance & Performance

#### Attendance
- **Attendance** ✅
  - `playerId`, `date`, `present`

#### Performance Points
- **PerformancePoint** ✅
  - `playerId`, `date`, `rating`, `points`

---

### ⚠️ MODELS TO REVIEW/UPDATE

#### 1. CoachSession - STATUS FIELD
**Current**: "scheduled", "in-progress", "completed", "cancelled"  
**Issue**: Missing "no-show" and "confirmed" states  
**Action**: Add `"no-show"` to status enum + "confirmed"

#### 2. ProgressUpdate - MISSING COACH RELATIONSHIP
**Current**: `playerId`, `sessionId` only  
**Issue**: Should track WHO submitted (coachId)  
**Action**: Add `coachId` relationship

#### 3. CoachEarning vs CoachPayout - REDUNDANCY
**Current**: Two models with similar names and different purposes  
**Issue**: Clarity needed on distinction  
**Clarify**:
- `CoachEarning`: Per-session earning (linked to CoachSession)
- `CoachPayout`: Batch payout (multiple CoachEarning IDs)

#### 4. OrgRevenue - MISSING PARENT RELATIONSHIP
**Current**: `fromPlayerId` only  
**Issue**: Need to know if parent or player (guardian relationship)  
**Suggest**: Add `fromParentId` OR populate through User/Guardian model

#### 5. CoachAvailability - VERIFY IMPLEMENTATION
**Exists**: ✅ But need to check:
- Is it linked to organization?
- Does it support recurring weekly slots?
- Does it track capacity?

#### 6. Notifications - INCOMPLETE TRIGGER SYSTEM
**Exists**: Model ✅, but needs:
- Event-driven triggers
- Queue system
- Delivery tracking
- Retry logic
- **Action**: Create NotificationTrigger model + implementation

#### 7. SessionReport - INCOMPLETE
**Exists**: Let me check what this model contains

#### 8. Reporting Models - MISSING
**Need to verify**: Are there models for:
- PlayerReport / PlayerReportData
- ParentReport
- CoachReport
- OrgAnalytics

---

## 2. Data Flow Implementation Status

### ✅ Session Completion Event

**Current Implementation**: ❓ Need to verify if implemented

**What should happen (from architecture)**:
```
Session marked completed →
  1. ProgressUpdate submitted by coach
  2. MetricHistory recorded
  3. OrgRevenue recorded
  4. CoachEarning calculated
  5. CoachWallet updated
  6. WalletTransaction recorded
  7. Recommendations generated
  8. Notifications sent
```

**Status**: Schema exists, but need to verify:
- Are there API triggers for this?
- Is it event-driven (queue-based)?
- Are all steps sequential and atomic?

### ⚠️ Coaching Event Triggers

**What needs implementation**:
- When session completed → fire event to generate recommendations
- When weekly analysis runs → fire batch recommendations
- When match completed → fire match analysis
- When coach earns → update wallet and notify

---

## 3. Domain Model Review

### Core Domains (Should be clear in schema):

#### 1. Identity & Membership ✅
- User, Membership, Guardian, Role, Permission

#### 2. Sessions ✅
- CoachSession, SessionBooking, CoachAvailability, Court
- **Status**: Good, but ensure court availability checking

#### 3. Progress ✅
- PlayerMetric, MetricHistory, ProgressUpdate, Attendance
- **Status**: Good, but add coach link to ProgressUpdate

#### 4. Payments ✅
- OrgRevenue, CoachEarning, CoachPayout, CoachWallet, WalletTransaction
- **Status**: Good, but need:
  - Invoice model (for parent invoicing)
  - PaymentMethod model (for M-Pesa, bank, etc.)
  - PaymentReconciliation model

#### 5. Recommendations ✅
- Recommendation
- **Status**: Model exists, implementation needed

#### 6. Reporting ⚠️
- SessionReport exists (need to verify)
- **Missing**: PlayerReport, ParentReport, CoachReport, OrgAnalytics

#### 7. Notifications ⚠️
- Notification exists
- **Status**: Model complete, trigger system needed

#### 8. Communication ✅
- Message, Announcement, ChatRoom, ChatMessage
- **Status**: Good

---

## 4. Missing Models (To Add)

### Priority 1 (Critical)

#### 1. PlayerReport
```typescript
model PlayerReport {
  id: UUID
  playerId: UUID
  organizationId: UUID
  
  // Report data
  reportDate: DateTime
  periodStart: DateTime
  periodEnd: DateTime
  
  // Metrics summary
  metricsSnapshot: JSON (current state)
  improvementScore: Int (0-100)
  
  // Analysis
  strengths: String[] (top 3)
  weaknesses: String[] (bottom 3)
  coachNotes: String
  
  // Recommendations
  focusAreas: String[]
  recommendedNextSteps: String[]
  
  // Generated
  generatedAt: DateTime
  
  // Relations
  player: Player
  organization: Organization
}
```

#### 2. ParentReport (Simplified view)
```typescript
model ParentReport {
  id: UUID
  parentId: UUID
  childId: UUID
  organizationId: UUID
  
  // Simplified
  childName: String
  improvementSummary: String (headline)
  sessionSummary: String (last 4 weeks)
  
  // Key achievements
  achievements: String[]
  
  // Next steps
  recommendations: String[]
  
  // Financial
  sessionsEnrolled: Int
  totalPaid: Decimal
  nextPaymentDue: DateTime?
  
  // Meta
  generatedAt: DateTime
}
```

#### 3. CoachReport (Dashboard data)
```typescript
model CoachReport {
  id: UUID
  coachId: UUID
  organizationId: UUID
  
  // Time period
  periodStart: DateTime
  periodEnd: DateTime
  
  // Stats
  playersManaged: Int
  sessionsCompleted: Int
  sessionsScheduled: Int
  completionRate: Float (0-100)
  
  // Performance
  avgPlayerRating: Float
  playersImproving: Int
  playersStagnating: Int
  
  // Earnings
  earningsThisPeriod: Decimal
  pendingEarnings: Decimal
  payoutSchedule: String
  
  // Feedback
  playerFeedback: String[] (recent reviews)
  
  generatedAt: DateTime
}
```

#### 4. OrgAnalytics
```typescript
model OrgAnalytics {
  id: UUID
  organizationId: UUID
  
  // Time period
  date: DateTime (@default(now()))
  
  // Revenue
  totalRevenue: Decimal
  revenueByType: JSON {
    per_session: Decimal,
    subscription: Decimal,
    tournament: Decimal
  }
  
  // Players
  activePlayersCount: Int
  newPlayersCount: Int
  retentionRate: Float
  churnedPlayersCount: Int
  
  // Coaches
  activeCoachesCount: Int
  totalCoachEarnings: Decimal
  avgCoachRating: Float
  
  // Sessions
  sessionCompletionRate: Float
  avgSessionRating: Float
  sessionsByType: JSON
  
  // Courts
  courtUtilization: Float (0-100)
  totalBookings: Int
  peakHours: String[]
}
```

#### 5. Invoice (Parent invoicing)
```typescript
model Invoice {
  id: UUID
  organizationId: UUID
  playerId: UUID
  parentId: UUID
  
  // Details
  invoiceNumber: String (@unique)
  issueDate: DateTime
  dueDate: DateTime
  
  // Items
  lineItems: JSON [
    {
      description: String,
      quantity: Int,
      unitPrice: Decimal,
      amount: Decimal
    }
  ]
  
  totalAmount: Decimal
  paidAmount: Decimal @default(0)
  
  // Status
  status: "draft" | "issued" | "paid" | "overdue"
  
  // Payment
  paymentMethod?: String
  paidAt?: DateTime
  
  createdAt: DateTime
}
```

#### 6. PaymentMethod (Org configuration)
```typescript
model PaymentMethod {
  id: UUID
  organizationId: UUID
  
  type: "mpesa" | "bank_transfer" | "card" | "cash"
  
  // M-Pesa
  mpesaBusinessCode?: String
  mpesaAccountCode?: String
  
  // Bank
  accountName?: String
  accountNumber?: String
  bankName?: String
  
  // Card processing
  stripeAccountId?: String
  
  isActive: Boolean @default(true)
  
  createdAt: DateTime
}
```

### Priority 2 (Important)

#### 7. Subscription Model
```typescript
model Subscription {
  id: UUID
  organizationId: UUID
  playerId: UUID
  
  // Details
  type: "monthly" | "quarterly" | "yearly"
  sessionsPerPeriod: Int
  pricePerPeriod: Decimal
  
  status: "active" | "paused" | "cancelled"
  
  startDate: DateTime
  endDate?: DateTime
  nextBillingDate: DateTime
  
  createdAt: DateTime
}
```

#### 8. NotificationTrigger (Event configuration)
```typescript
model NotificationTrigger {
  id: UUID
  organizationId: UUID
  
  eventType: String // "session.completed", "progress.update", etc.
  triggerCondition: JSON (when to fire)
  
  // Who gets notified
  notifyTo: String[] // ["player", "parent", "coach", "admin"]
  
  // What channels
  channels: String[] // ["sms", "push", "email"]
  
  // Template
  messageTemplate: String
  titleTemplate: String
  
  isActive: Boolean @default(true)
}
```

---

## 5. Schema Alignment Recommendations

### Immediate Updates (Priority 1)

1. **Add "confirmed" to CoachSession status**
   ```typescript
   status: "scheduled" | "confirmed" | "in-progress" | "completed" | "cancelled" | "no-show"
   ```

2. **Add coachId to ProgressUpdate**
   ```typescript
   coachId: String
   coach: Staff @relation(fields: [coachId], references: [userId])
   ```

3. **Add parentId to OrgRevenue**
   ```typescript
   fromParentId?: String // Through Guardian relationship
   ```

4. **Create Invoice model** (for parent billing)

5. **Create PlayerReport model** (for progress reports)

### Medium Updates (Priority 2)

6. **Create CoachReport model**

7. **Create OrgAnalytics model**

8. **Create NotificationTrigger model** (for event-driven notifications)

9. **Verify CoachAvailability** has organization relationship

10. **Add Subscription model**

### Verification Tasks

11. **Check SessionReport** - Does it align with required reporting?

12. **Verify notification triggers** - Are they implemented in API layer?

13. **Check recommendation trigger system** - Is it event-driven?

14. **Verify payment reconciliation** - Can OrgRevenue be matched to actual payments?

---

## 6. Implementation Checklist

- [ ] Update CoachSession status enum
- [ ] Add coachId to ProgressUpdate
- [ ] Add parentId to OrgRevenue (or clarify parent/player)
- [ ] Create PlayerReport model
- [ ] Create ParentReport model
- [ ] Create CoachReport model
- [ ] Create OrgAnalytics model
- [ ] Create Invoice model
- [ ] Create PaymentMethod model
- [ ] Create Subscription model
- [ ] Create NotificationTrigger model
- [ ] Verify CoachAvailability structure
- [ ] Add indexes for common queries
- [ ] Document API layer trigger system
- [ ] Create migration file

---

## 7. Next Steps

1. **Schema Updates** (this doc phase)
2. **API Architecture** - How to trigger events
3. **Job System** - Weekly analysis, batch notifications
4. **Frontend Models** - Report components, parent view
5. **Testing** - End-to-end flow verification

---

**This review maintains alignment with the Operating Model while accounting for existing schema.**
