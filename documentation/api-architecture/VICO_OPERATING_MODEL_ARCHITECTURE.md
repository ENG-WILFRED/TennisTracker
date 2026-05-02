# Vico Operating Model & System Architecture

**Version**: 1.0  
**Date**: April 29, 2026  
**Status**: LOCKED - Core Foundation

---

## Executive Summary

Vico is built on a **data-driven, org-centric operating model** where:

- **Organizations** are the financial and operational hub
- **Sessions** are the backbone of everything
- **Data flows** from sessions → insight → decisions → payments
- **Parents never transact directly with coaches** — all payments flow through the organization
- **Progress tracking is structured and time-series** — enabling trends, reports, and data-driven recommendations

---

## 1. Core Operating Model (Org-Centric)

### The Financial Model

```
Parent pays → Organization
Organization pays → Coaches (and staff)
Coaches NEVER transact directly with parents
```

**Why this matters:**
- Single point of financial control
- Simplified accounting and compliance
- Organization captures value and can apply fees
- Clean separation of concerns

### Operational Hub

The Organization controls:
- Coach management (hiring, suspension, monitoring)
- Player enrollment and assignments
- Court and session scheduling
- Pricing and payment methods
- Payout cycles and coach compensation
- Analytics and reporting
- Communications to all stakeholders

---

## 2. Session System (The Backbone)

Everything starts and flows from **sessions**. This is your differentiation.

### 2.1 Session Model

```typescript
CoachSession {
  id: UUID
  coachId: UUID
  organizationId: UUID
  playerId?: UUID (for 1-on-1)
  sessionType: "1-on-1" | "group" | "match_play" | "fitness"
  
  // Scheduling
  startTime: DateTime
  endTime: DateTime
  timezone: string
  courtId?: UUID
  maxParticipants: number
  
  // Status Lifecycle
  status: "scheduled" | "confirmed" | "in-progress" | "completed" | "cancelled" | "no-show"
  
  // Pricing & Revenue
  price: Float
  organizationId: String // Revenue goes here
  
  // Metadata
  title: string
  description?: string
  cancellationReason?: string
  cancelledAt?: DateTime
  createdAt: DateTime
  updatedAt: DateTime
}
```

### 2.2 Session Booking (Player Participation)

```typescript
SessionBooking {
  id: UUID
  sessionId: UUID
  playerId: UUID
  
  // Status tracking
  status: "pending" | "confirmed" | "cancelled" | "completed"
  attendanceStatus: "pending" | "attended" | "absent" | "late"
  
  // Feedback & Notes
  feedbackRating: Float (0-100)
  feedbackText?: string
  notes?: string
  
  // Completion
  completedAt?: DateTime
  createdAt: DateTime
  updatedAt: DateTime
}
```

### 2.3 Session Lifecycle & Events

When a session moves through its lifecycle, **trigger events**:

#### Scheduled
- Session created and published
- Players can book
- Coach confirms availability

#### Confirmed
- Player has booked
- Attendance notifications sent

#### In-Progress
- Coach marks session as started
- Real-time tracking available (optional)

#### **COMPLETED** ⭐ (CRITICAL)
When marked `completed`, automatically trigger:

```yaml
On Session Completed:
  1. Progress Update
     - Coach submits metric changes (serve +5, forehand -2, etc.)
     - Focus areas identified
     - Notes recorded
     
  2. Metrics Update
     - Player metrics updated with deltas
     - Historical record created (never overwrite)
     - Trend calculated
     
  3. Attendance Record
     - Mark player as attended/absent/late
     - Used for performance analysis
     
  4. Revenue Event
     - Create OrgRevenue entry
     - Amount = session price
     - Status = pending confirmation
     
  5. Coach Earning
     - Calculate coach earning (percentage of session price)
     - Add to pending balance
     - Create WalletTransaction record
     
  6. Recommendation Check
     - Analyze progress deltas
     - Check for stagnation patterns
     - Generate recommendations if needed
     
  7. Notifications
     - Parent: "Session completed, progress update available"
     - Coach: "Earnings pending, view payout schedule"
     - Admin: Revenue recorded (for reconciliation)
```

#### Cancelled / No-Show
- Recording reason is important
- Don't trigger payment events
- May trigger coaching flags (too many no-shows)

---

## 3. Progress Tracking System

This is your **primary differentiation**. Don't make it generic.

### 3.1 Skill Metrics Model

Every player in an organization has **one PlayerMetric record** per organization:

```typescript
PlayerMetric {
  id: UUID
  playerId: UUID
  organizationId: UUID
  
  // Core Metrics (0-100 scale, sensible defaults)
  serve: Int = 50
  forehand: Int = 50
  backhand: Int = 50
  movement: Int = 50
  stamina: Int = 50
  strategy: Int = 50
  mentalToughness: Int = 50
  courtAwareness: Int = 50
  
  // Metadata
  lastUpdated: DateTime (@updatedAt)
  createdAt: DateTime
}
```

**Key principle:** Each metric is 0-100. Default = 50 (neutral). Can go above 100 (elite). Below 10 = critical weakness.

### 3.2 Historical Tracking (MetricHistory)

**NEVER overwrite** existing metrics. Always create a historical record:

```typescript
MetricHistory {
  id: UUID
  metricId: UUID (reference to PlayerMetric)
  sessionId: UUID (which session caused this)
  
  // Snapshot of metrics at this point
  serve: Int
  forehand: Int
  backhand: Int
  movement: Int
  stamina: Int
  strategy: Int
  mentalToughness: Int
  courtAwareness: Int
  
  // Changes from previous
  changes: JSON {
    serve: +5,
    forehand: -2,
    strategy: 0,
    // etc
  }
  
  // Trend analysis
  trend: "up" | "down" | "stable"
  
  timestamp: DateTime
}
```

**This enables:**
- Graphs showing progression over time
- Trend detection ("backhand improving, serve stagnating")
- Seasonal analysis
- Impact analysis (how did vacation affect player?)

### 3.3 Session-Based Progress Update

After each session, coach submits:

```typescript
ProgressUpdate {
  id: UUID
  playerId: UUID
  sessionId: UUID
  
  // Coach submits
  ratingChanges: JSON {
    serve: +5,
    forehand: 0,
    strategy: +3
  }
  focusAreas: ["forehand", "serve"] // What to work on next
  notes: String (coach observations)
  
  // System calculates
  overallProgress: Int (0-100, aggregate improvement)
  
  timestamp: DateTime
}
```

**On session completion:**
1. Coach fills out ProgressUpdate
2. System applies ratingChanges to PlayerMetric
3. MetricHistory record created
4. Notification sent to parent with summary

---

## 4. Game / Match System

Separate from training sessions. Influences metrics and confidence.

### 4.1 Match Types

```typescript
Match {
  id: UUID
  organizationId: UUID
  
  matchType: "internal" | "external" | "tournament"
  
  // Players
  playerAId: UUID
  playerBId: UUID
  winnerId: UUID
  
  // Scoring
  score: String // "6-4 7-5" format
  duration?: Int (minutes)
  
  // Metadata
  referee?: UUID
  venue?: String
  scheduledAt: DateTime
  completedAt: DateTime
}
```

### 4.2 Impact on System

When a match is recorded:
- Influence player ranking within org
- Update confidence metrics
- Feed into recommendation engine
- Generate match statistics (optional advanced feature)

---

## 5. Recommendation Engine

This is your **insight layer**. Powerful and data-driven.

### 5.1 Recommendation Model

```typescript
Recommendation {
  id: UUID
  organizationId: UUID
  
  // WHO & WHAT
  targetId: UUID (playerId, parentId, or coachId)
  targetType: "player" | "parent" | "coach"
  
  // CONTENT
  title: String
  description: String
  priority: "high" | "medium" | "low"
  category: "training" | "match" | "enrollment" | "progress" | "concern"
  
  // WHY & DATA
  triggeredBy: "session_analysis" | "match_result" | "weekly_job" | "pattern_detection"
  triggerData: JSON (context of what triggered this)
  
  // ACTIONS
  actionItems: String[] (specific next steps)
  linkedSessionId?: UUID
  linkedMatchId?: UUID
  
  // ENGAGEMENT
  acknowledged: Boolean
  acknowledgedAt?: DateTime
  status: "active" | "completed" | "dismissed"
  validUntil?: DateTime (auto-expire old recommendations)
  
  createdAt: DateTime
  updatedAt: DateTime
}
```

### 5.2 Recommendation Types & Triggers

#### For Players
- "Increase backhand drills" (based on metric stagnation)
- "Join intermediate group" (based on skill progression)
- "Take rest week" (based on stamina decline pattern)
- "Work on court awareness" (coach feedback + match analysis)

**Trigger:** After session completion, weekly analysis job, match result

#### For Parents
- "Add 2 sessions/week for breakthrough" (based on progress velocity)
- "Enroll in tournament" (player skill at right level)
- "Consider private coaching" (group sessions showing plateau)
- "Take seasonal break" (burnout indicators)

**Trigger:** Monthly parent report, weekly analysis job

#### For Coaches
- "Player stagnating in movement" (metric unchanged 5+ sessions)
- "Adjust training plan for player X" (plateau detected)
- "Consider match play for player Y" (ready for competition)
- "Follow up with player Z" (high absence rate)

**Trigger:** Weekly coach review, pattern detection

### 5.3 Trigger Points

```
Recommendations generated at:
1. Session completion (immediate analysis)
2. Match completion (immediate)
3. Weekly analysis job (Mondays 2 AM UTC)
4. Monthly parent report generation
5. Coaching review (weekly staff report)
6. Manual admin trigger
```

---

## 6. Reporting System

Multi-layer, role-specific reports.

### 6.1 Player Report

**What it shows:**
- Progress over time (graphs of metrics)
- Strengths (top 3 skills)
- Weaknesses (bottom 3 skills)
- Coach notes (recent observations)
- Attendance record (sessions attended/missed)
- Recent recommendations
- Match results (if applicable)

**Frequency:** Weekly (auto-generated)  
**Audience:** Parent, Coach (admin view)

### 6.2 Parent Report

**What it shows:**
- Child's improvement (headline)
- Session summary (last 4 weeks)
- Key achievements
- Areas to focus on
- Recommended next steps
- Financial summary (sessions paid, coming due)

**Frequency:** Weekly / Monthly  
**Audience:** Parent only (simplified)  
**Language:** Non-technical, actionable

### 6.3 Coach Report

**What it shows:**
- Players managed (count, skill distribution)
- Performance impact (how many players improving)
- Session completion rate
- Earnings this month
- Payout status
- Recommendations generated by me
- Player feedback ratings (aggregated)

**Frequency:** Daily / Weekly / Monthly  
**Audience:** Coach (self-view), Admin (oversight)

### 6.4 Organization Report

**What it shows:**
- Revenue (total, by type)
- Player retention (active, churned)
- Coach effectiveness (student retention, ratings)
- Utilization (courts, sessions scheduled vs. completed)
- Seasonality trends
- Top players (by skill development)
- Problem areas (high dropout coaches, underutilized courts)

**Frequency:** Daily / Weekly / Monthly  
**Audience:** Admin, Finance Officer

---

## 7. Payment System (Org-Centric)

### 7.1 Revenue Flow

```
Parent Payment → Organization Account
↓
Organization holds all funds
↓
Organization calculates coach earnings
↓
Organization pays coaches (weekly/monthly)
```

### 7.2 Revenue Recording

When session completes:

```typescript
OrgRevenue {
  id: UUID
  organizationId: UUID
  
  // SOURCE
  paymentType: "per_session" | "subscription" | "tournament" | "membership"
  fromPlayerId: UUID (which parent/player)
  
  // AMOUNT
  amount: Decimal(10, 2)
  currency: "KES" | "USD" | etc
  status: "pending" | "confirmed" | "reconciled"
  
  // REFERENCES
  sessionIds: String[] (which sessions does this pay for)
  subscriptionId?: UUID
  invoiceId?: UUID
  
  // PAYMENT METHOD
  mpesaTransactionId?: String
  paymentMethod: "mpesa" | "bank" | "cash" | "card"
  
  createdAt: DateTime
  recordedAt?: DateTime (reconciliation timestamp)
  updatedAt: DateTime
}
```

### 7.3 Coach Earning Calculation

When session completes:

```
Base Session Price = $50
Org Commission Rate = 20%
Coach Earning = $50 × (1 - 0.20) = $40

Create entry:
  WalletTransaction {
    walletId: coach.walletId
    type: "credit"
    amount: 40
    description: "Session completed: Player X - $50"
    reference: sessionId
    platformFee: 10 (20% of $50)
  }

Update CoachWallet:
  balance += 40
  pendingBalance += 40
  totalEarned += 40
```

### 7.4 Coach Payout System

```typescript
CoachPayout {
  id: UUID
  coachId: UUID
  amount: Float
  status: "pending" | "processing" | "completed" | "failed"
  
  // Payment method
  paymentMethod: "bank_transfer" | "mpesa" | etc
  bankDetails?: String
  
  // Tracking
  transactionRef?: String
  notes?: String
  requestedAt: DateTime
  processedAt?: DateTime
  completedAt?: DateTime
}
```

**Payout Cycle:**
- Coach can request payout anytime (min amount: e.g., $10)
- Admin processes payouts weekly/biweekly
- M-Pesa for Kenya, bank transfer for others
- Status tracked in real-time
- Coach can see pending, processing, completed payouts

### 7.5 No Direct Payments (Enforced)

**System-level enforcement:**
- No API endpoint allows parent → coach direct payment
- All invoices issued by organization
- Coach payment address hidden from parents
- If coach and parent are in same org, payment flows through org

---

## 8. Scheduling System

### 8.1 Coach Availability

```typescript
CoachAvailability {
  id: UUID
  coachId: UUID
  organizationId: UUID
  
  // Recurring slots
  dayOfWeek: 0-6 (Monday-Sunday)
  startTime: "10:00"
  endTime: "18:00"
  
  // Constraints
  maxSessionsPerDay?: Int
  breaksBetweenSessions?: Int (minutes)
  
  createdAt: DateTime
  updatedAt: DateTime
}
```

### 8.2 Booking Flow

```
1. Parent/Player views available slots
   ↓
2. Selects time + session type
   ↓
3. System checks:
   - Coach availability
   - Court availability
   - Player's organization matches coach's
   ↓
4. Creates SessionBooking (pending)
   ↓
5. Coach confirms (optional approval step)
   ↓
6. Notifications sent to all parties
```

---

## 9. Communication Layer

### 9.1 Channels

- **Coach ↔ Player:** Direct messaging, session feedback
- **Coach ↔ Parent:** Progress updates, recommendations, announcements
- **Organization ↔ Everyone:** System announcements, alerts, billing

### 9.2 Features

```typescript
Message {
  id: UUID
  conversationId: UUID
  senderId: UUID
  recipientId: UUID | Group
  
  content: String
  attachments?: String[] (URLs)
  readAt?: DateTime
  
  createdAt: DateTime
  updatedAt: DateTime
}

Announcement {
  id: UUID
  organizationId: UUID
  createdBy: UUID (admin)
  
  title: String
  content: String
  audience: "all" | "coaches" | "players" | "parents"
  priority: "high" | "normal" | "low"
  
  publishedAt: DateTime
  expiresAt?: DateTime
}
```

---

## 10. Notifications System

**Critical for your market** — SMS + push is must-have.

### 10.1 Trigger Events

```yaml
Session Booked:
  - Coach: "New booking: Player X for tomorrow 10 AM"
  - Parent: "Session confirmed for $50"

Session Reminder:
  - Coach: "Reminder: Session starts in 2 hours"
  - Player: "Your session starts in 2 hours at Court 3"
  - Parent: "Your child's session starts in 2 hours"

Session Completed:
  - Parent: "Session completed! Progress update available"
  - Coach: "Session done. Submit progress report for $40 earning"
  
Report Available:
  - Parent: "Weekly progress report ready"
  - Coach: "Weekly player report ready"
  
Payment Due:
  - Parent: "Subscription due on 30th"
  - Org: "Revenue pending reconciliation"

Payout Processed:
  - Coach: "Payout of $200 sent to M-Pesa"

Recommendation:
  - Parent: "New recommendation: Add 2 sessions/week"
  - Coach: "Player X stagnating, consider match play"
```

### 10.2 Channels

```typescript
Notification {
  id: UUID
  recipientId: UUID
  organizationId: UUID
  
  type: "session_booked" | "reminder" | "completed" | "report" | "payment" | "payout" | "recommendation"
  title: String
  message: String
  deepLink?: String (to relevant page)
  
  channels: ["sms", "push", "email"]
  
  sentAt?: DateTime
  readAt?: DateTime
  
  metadata: JSON (context)
  createdAt: DateTime
}
```

---

## 11. Admin Control Panel

The organization's operational hub.

### 11.1 Admin Capabilities

```
1. Coach Management
   - Hire/suspend coaches
   - View performance metrics
   - Approve payouts
   - Manage pricing

2. Player Management
   - Assign coaches
   - View progress reports
   - Monitor attendance
   - Handle issues

3. Schedule Management
   - Override availability
   - Create bulk sessions
   - Block courts for maintenance
   - Manage recurring sessions

4. Financial Management
   - View revenue streams
   - Approve payouts
   - Reconcile payments
   - Generate invoices

5. Analytics
   - Revenue trends
   - Player retention
   - Coach effectiveness
   - Court utilization

6. Communications
   - Send announcements
   - Manage system notifications
   - Templates for common messages

7. Recommendations
   - Review pending recommendations
   - Archive/dismiss
   - Generate custom recommendations
```

---

## 12. Data Flow Architecture

**This is the real system:**

```
┌─────────────────────────────────────────────────────────────────┐
│ SESSION ECOSYSTEM                                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Session Scheduled                                              │
│  ├─ Player books                                                │
│  └─ Coach confirms                                              │
│         ↓                                                        │
│  Session In-Progress                                            │
│         ↓                                                        │
│  Session COMPLETED ⭐                                            │
│  ├─ Coach submits ProgressUpdate                                │
│  ├─ Metrics updated & MetricHistory recorded                    │
│  ├─ OrgRevenue recorded                                         │
│  ├─ Coach earning calculated & added to wallet                  │
│  ├─ Recommendations generated (if needed)                       │
│  └─ Notifications sent                                          │
│         ↓                                                        │
│  INSIGHTS GENERATED                                             │
│  ├─ Progress reports calculated                                 │
│  ├─ Trend analysis performed                                    │
│  ├─ Recommendation engine runs                                  │
│  └─ Weekly analysis jobs execute                                │
│         ↓                                                        │
│  DECISIONS MADE                                                 │
│  ├─ Players adjust training (based on recommendations)          │
│  ├─ Coaches modify plans                                        │
│  ├─ Parents enroll in new programs                              │
│  └─ Admins adjust pricing/staffing                              │
│         ↓                                                        │
│  PAYMENTS FOLLOW                                                │
│  ├─ Parent pays for services                                    │
│  ├─ Org collects revenue                                        │
│  ├─ Coach earning paid out                                      │
│  └─ Cycle repeats                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 13. Architecture Direction

### 13.1 Modular Monolith (Start Here)

Split into logical domains:

```
1. Identity & Membership
   - User management
   - Role assignment
   - Organization membership

2. Sessions Domain
   - Session creation/scheduling
   - Booking management
   - Availability management

3. Progress Domain
   - Metrics tracking
   - Historical scoring
   - Trend analysis

4. Payments Domain
   - Revenue recording
   - Coach earnings
   - Payout processing

5. Reporting Domain
   - Report generation
   - Analytics calculation
   - Data aggregation

6. Notifications Domain
   - Message queue
   - Multi-channel sending
   - Delivery tracking

7. Recommendation Domain
   - Trigger detection
   - Algorithm execution
   - Distribution
```

### 13.2 Future Microservices Evolution

Once stable, can split into:
- Identity Service
- Sessions Service
- Progress Service
- Payments Service
- Analytics Service
- Notifications Service
- Recommendations Service

**For now:** Keep as monolith with clear domain boundaries.

---

## 14. What Makes Vico Stand Out

Not CRUD. Not booking. **Insight + Structure**.

### 14.1 Differentiators

1. **Real Progress Tracking**
   - Time-series metrics
   - Trend detection
   - Historical analysis
   - NOT just attendance

2. **Actionable Recommendations**
   - Data-driven insights
   - Role-specific guidance
   - Triggered automatically
   - Measurable impact

3. **Clean Financial System**
   - Organization-controlled payments
   - Transparent coach earnings
   - No hidden fees
   - Reconcilable data

4. **Strong Parent Experience**
   - Simple, non-technical reports
   - Clear progress indicators
   - Actionable recommendations
   - Peace of mind

5. **Coach Empowerment**
   - Reliable, timely payouts
   - Performance metrics
   - Player growth attribution
   - Professional tools

---

## 15. Mental Model (For Implementation)

**Sessions generate data → Data generates insight → Insight drives decisions → Payments follow structure**

Every feature should map to this flow:
- Does it help generate better data? ✅
- Does it provide actionable insight? ✅
- Does it drive better decisions? ✅
- Does it integrate with payments? ✅

If it doesn't fit, reconsider.

---

## 16. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)
- ✅ Schema complete
- ✅ Session system locked in
- ✅ Progress tracking enabled
- ✅ Org-centric payments wired

### Phase 2: Experience (Weeks 3-4)
- Recommendations engine working
- Reporting system live
- Parent experience polished
- Coach dashboard functional

### Phase 3: Scale (Weeks 5-6)
- Notifications system robust
- Analytics dashboards live
- Admin panel complete
- Multi-organization support

### Phase 4: Optimize (Weeks 7+)
- Performance tuning
- Microservices planning
- Advanced analytics
- Market readiness

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Apr 29, 2026 | Initial locked architecture |

---

**This document is the foundation for all implementation decisions. Refer to it when in doubt.**
