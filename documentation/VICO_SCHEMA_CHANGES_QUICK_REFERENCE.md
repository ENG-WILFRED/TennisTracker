# Vico Schema Changes - Quick Reference

**Date**: April 29, 2026  
**File**: `prisma/schema.prisma`

---

## 🔄 Modified Models

### CoachSession
```typescript
// CHANGED: status field expanded
- status: "scheduled" | "in-progress" | "completed" | "cancelled"
+ status: "scheduled" | "confirmed" | "in-progress" | "completed" | "cancelled" | "no-show"

// ADDED: sessionType variations
- sessionType: "1-on-1" | "group"
+ sessionType: "1-on-1" | "group" | "match_play" | "fitness"

// ADDED: Relations
+ progressUpdates: ProgressUpdate[]
+ metricHistories: MetricHistory[]
+ sessionReport: SessionReport?
```

### ProgressUpdate
```typescript
// ADDED: coachId relationship
+ coachId: String  // Who submitted the update
+ coach: Staff @relation(fields: [coachId], references: [userId], onDelete: Cascade)

// UPDATED: Indexes
+ @@index([coachId])
```

### OrgRevenue
```typescript
// ADDED: Parent payment tracking
+ fromParentId: String?

// UPDATED: Indexes
+ @@index([fromParentId])

// UPDATED: Payment methods comment
- paymentMethod: String  // "mpesa" | "bank" | "cash"
+ paymentMethod: String  // "mpesa" | "bank" | "cash" | "card"
```

### Staff
```typescript
// ADDED: Progress updates relation
+ progressUpdates: ProgressUpdate[]

// ADDED: Coach reports relation
+ coachReports: CoachReport[]
```

### Player
```typescript
// ADDED: Reporting relations
+ playerReports: PlayerReport[]
+ invoices: Invoice[]
+ subscriptions: Subscription[]
```

### Organization
```typescript
// ADDED: Reporting models
+ playerReports: PlayerReport[]
+ parentReports: ParentReport[]
+ coachReports: CoachReport[]
+ analytics: OrgAnalytics?

// ADDED: Payment/Subscription models
+ invoices: Invoice[]
+ paymentMethods: PaymentMethod[]
+ subscriptions: Subscription[]
+ notificationTriggers: NotificationTrigger[]
```

---

## ✨ New Models

### PlayerReport
**Purpose**: Weekly player progress snapshot with analysis  
**Key Fields**:
- `playerId`, `organizationId`
- `periodStart`, `periodEnd`, `reportDate`
- `metricsSnapshot`: JSON of current metrics
- `improvementScore`: 0-100 aggregate
- `strengths`: Top 3 areas
- `weaknesses`: Bottom 3 areas
- `coachNotes`: Coach observations
- `focusAreas`, `recommendedNextSteps`

**Indexes**: playerId, organizationId, reportDate

### ParentReport
**Purpose**: Simplified parent-facing progress report  
**Key Fields**:
- `parentId`, `childId`, `organizationId`
- `improvementSummary`: Headline
- `sessionSummary`: Last 4 weeks
- `achievements`: String[]
- `recommendations`: String[]
- Financial: `sessionsEnrolled`, `totalPaid`, `nextPaymentDue`

**Indexes**: parentId, childId, organizationId, generatedAt

### CoachReport
**Purpose**: Coach performance & earnings dashboard  
**Key Fields**:
- `coachId`, `organizationId`
- `periodStart`, `periodEnd`
- Stats: `playersManaged`, `sessionsCompleted`, `completionRate`
- Performance: `avgPlayerRating`, `playersImproving`, `playersStagnating`
- Earnings: `earningsThisPeriod`, `pendingEarnings`, `payoutSchedule`
- `playerFeedback`: Recent reviews

**Indexes**: coachId, organizationId, periodStart

### OrgAnalytics
**Purpose**: Organization-level metrics & analytics  
**Key Fields**:
- `organizationId`: unique per organization
- Revenue: `totalRevenue`, `revenueByType` (JSON)
- Players: `activePlayersCount`, `newPlayersCount`, `retentionRate`, `churnedPlayersCount`
- Coaches: `activeCoachesCount`, `totalCoachEarnings`, `avgCoachRating`
- Sessions: `completionRate`, `avgSessionRating`, `sessionsByType` (JSON)
- Courts: `courtUtilization`, `totalBookings`, `peakHours`

**Indexes**: organizationId (unique)

### Invoice
**Purpose**: Parent invoicing for sessions & subscriptions  
**Key Fields**:
- `organizationId`, `playerId`
- `invoiceNumber`: unique identifier
- `issueDate`, `dueDate`
- `lineItems`: JSON array of items
- `totalAmount`, `paidAmount`
- `status`: "draft" | "issued" | "paid" | "overdue"
- Payment: `paymentMethod`, `paidAt`

**Indexes**: organizationId, playerId, status, dueDate

### PaymentMethod
**Purpose**: Organization payment method configuration  
**Key Fields**:
- `organizationId`, `type` (mpesa|bank_transfer|card|cash)
- M-Pesa: `mpesaBusinessCode`, `mpesaAccountCode`
- Bank: `accountName`, `accountNumber`, `bankName`, `swiftCode`
- Card: `stripeAccountId`
- `isActive`, `isDefault`

**Indexes**: organizationId, type

### Subscription
**Purpose**: Recurring revenue (sessions per period)  
**Key Fields**:
- `organizationId`, `playerId`
- `type`: "monthly" | "quarterly" | "yearly"
- `sessionsPerPeriod`, `pricePerPeriod`
- `status`: "active" | "paused" | "cancelled"
- Dates: `startDate`, `endDate`, `nextBillingDate`
- `autoRenew`: boolean

**Indexes**: organizationId, playerId, status, nextBillingDate

### NotificationTrigger
**Purpose**: Event-based notification configuration  
**Key Fields**:
- `organizationId`, `eventType` (e.g., "session.completed")
- `triggerCondition`: JSON (optional advanced conditions)
- `notifyTo`: ["player", "parent", "coach", "admin"]
- `channels`: ["sms", "push", "email"]
- `messageTemplate`, `titleTemplate`
- Retry: `retryCount`, `retryDelayMinutes`
- `isActive`: boolean

**Indexes**: organizationId, eventType, isActive

---

## 📊 Schema Verification

After applying migration:

```bash
# Validate schema syntax
npx prisma validate

# Generate migration
npx prisma migrate dev --name vico_architecture_lock

# Generate updated Prisma Client
npx prisma generate

# Type-check with generated types
npm run type-check
```

---

## 🔍 Key Relationships (New)

### Session Completion Flow
```
CoachSession (completed)
  ├─ ProgressUpdate (coach submission)
  │  └─ Staff (coach who submitted)
  │
  ├─ MetricHistory (time-series record)
  │  └─ PlayerMetric (aggregated player metrics)
  │
  └─ SessionReport (what was worked on)
```

### Reporting Flow
```
Organization
  ├─ PlayerReport (per player, per period)
  ├─ ParentReport (per parent, per period)
  ├─ CoachReport (per coach, per period)
  └─ OrgAnalytics (single record per org, updated daily)
```

### Payment Flow
```
Organization
  ├─ OrgRevenue (parent pays)
  │  └─ Invoice (parent sees bill)
  │     └─ PaymentMethod (org configured)
  │
  └─ Subscription (recurring player commitment)
```

---

## ⚠️ Important Migration Notes

1. **No Data Loss**: All changes are additive (new fields/models, no deletions)
2. **Existing Data Safe**: Existing sessions, bookings, metrics unaffected
3. **Status Enum**: CoachSession status is now larger - backward compatible
4. **Nullable Fields**: Most new fields on reports are nullable (optional)
5. **Cascading Deletes**: New relations use `onDelete: Cascade` for cleanup

---

## 🚀 Next Database Operations

```bash
# Create migration
npx prisma migrate dev --name vico_architecture_implementation

# Deploy to production
npx prisma migrate deploy

# View migration status
npx prisma migrate status

# If needed, reset dev database
npx prisma migrate reset  # ⚠️ Only in dev!
```

---

## 📝 Testing Checklist

After migration:

- [ ] Create a test CoachSession
- [ ] Submit ProgressUpdate with coachId
- [ ] Verify PlayerMetric updated
- [ ] Create MetricHistory entry
- [ ] Create OrgRevenue with fromParentId
- [ ] Query new reporting models
- [ ] Test notification trigger creation
- [ ] Verify all indexes created (check database)

---

**This schema is LOCKED and ready for implementation.**
