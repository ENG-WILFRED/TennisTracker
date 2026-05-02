# TennisTracker Operating Model & Architecture

**Last Updated**: April 29, 2026  
**Version**: 1.0 - Core System Design (LOCKED)

## Executive Summary

TennisTracker is a **session-driven, org-centric platform** where:
- Organizations are the financial and operational hub
- Sessions generate all downstream data (progress, insights, revenue)
- Coaches never transact directly with parents
- Progress tracking and recommendations differentiate the platform

---

## Part 1: Core Operating Model (LOCKED)

### The Org-Centric Model

```
┌─────────────────────────────────────────────────────────┐
│                   ORGANIZATION                          │
│                (Financial Hub)                          │
├─────────────────────────────────────────────────────────┤
│ • Collects payments from parents                        │
│ • Pays coaches and staff                                │
│ • Owns all sessions and data                            │
│ • Controls pricing and availability                     │
│ • Issues invoices and reports                           │
└─────────────────────────────────────────────────────────┘
         ↑                          ↓
      Parents                    Coaches
   (pay org)                    (receive from org)
         ↑                          ↓
      Players                   Execute Sessions
   (train)                       (record data)
```

### Financial Flow (No Direct Parent-Coach Transactions)

```
Parent Payment → Org Account → Internal Accounting → Coach Payout
                                    ↓
                            Session calculates:
                            - Org revenue
                            - Coach earning
                            - Payment status
```

### Key Constraints (Enforce at System Level)

- ✅ All payments collected by organization
- ✅ No direct parent → coach payment APIs
- ✅ All invoices issued by organization
- ✅ Coach earnings calculated by system
- ✅ Org controls all financial relationships

---

## Part 2: Session System (The Backbone)

### Sessions Are Everything

**Mental Model**: Sessions generate data → Data generates insight → Insight drives decisions

Every system feature flows from sessions.

### 2.1 Session Entity

```prisma
model CoachSession {
  id                String      @id @default(uuid())
  organizationId    String      // Session belongs to org
  coachId           String      // Coach executes
  playerIds         String[]    // Players attend
  sessionType       String      // 1-on-1, group, match, fitness
  
  // Timing
  scheduledAt       DateTime
  startedAt         DateTime?
  completedAt       DateTime?
  durationMinutes   Int
  
  // Status Lifecycle
  status            String      // scheduled → confirmed → completed/canceled/no-show
  
  // Location & Details
  courtId           String?
  location          String?
  description       String?
  focusAreas        String[]    // e.g., ["forehand", "serve", "strategy"]
  
  // Pricing & Revenue
  pricePerPlayer    Decimal     // What this session costs
  totalRevenue      Decimal     // pricePerPlayer × playerCount
  
  // Completion Data
  coachNotes        String?     // Coach feedback
  sessionReport     SessionReport? // Detailed report
  attendanceRecords SessionAttendance[]
  
  // System Fields
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
  
  // Relations
  organization      Organization @relation(fields: [organizationId], references: [id])
  coach             Staff       @relation(fields: [coachId], references: [userId])
  sessions          SessionAttendance[]
  earnings          CoachEarning[]
  progressUpdates   ProgressUpdate[]
  
  @@index([organizationId])
  @@index([coachId])
  @@index([status])
  @@index([scheduledAt])
}
```

### 2.2 Session Lifecycle

```
SCHEDULED → CONFIRMED → COMPLETED → [triggers events]
                    ↓
                 CANCELED (at any point)
                    ↓
               NO-SHOW (if not confirmed by time)
```

### 2.3 Session Completion Trigger (Critical!)

```typescript
// When session marked COMPLETED, automatically trigger:

1. ProgressUpdate
   - Store current metrics
   - Calculate deltas
   - Set trend direction

2. CoachReport
   - Rating changes for each metric
   - Focus areas for next session
   - Notes and observations

3. SessionAttendance
   - Mark attended
   - Record time

4. CoachEarning
   - Calculate coach payment
   - Link to session
   - Mark as pending

5. OrgRevenue
   - Record transaction
   - Update org balance
   - Trigger notification

6. Recommendation
   - Analyze progress
   - Generate next steps
   - Update for parent/coach view
```

### 2.4 Session Ownership Rules

```
Session belongs to: Organization
Session executed by: Coach
Session attended by: Players
Session observed by: Parents (of child players, via app)

→ Only org can modify pricing/schedule
→ Only coach can submit completion data
→ Players/parents can book/cancel (with rules)
```

---

## Part 3: Progress Tracking System (Your Differentiator)

### 3.1 Structured Metrics Model

```prisma
model PlayerMetric {
  id                String      @id @default(uuid())
  playerId          String
  organizationId    String      // Org-scoped metrics
  
  // Core Metrics (always tracked)
  serve             MetricScore  // 0-100
  forehand          MetricScore
  backhand          MetricScore
  movement          MetricScore
  stamina           MetricScore
  strategy          MetricScore
  mentalToughness   MetricScore
  courtAwareness    MetricScore
  
  // Metadata
  lastUpdated       DateTime
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
  
  // Relations
  player            Player      @relation(fields: [playerId], references: [userId])
  organization      Organization @relation(fields: [organizationId], references: [id])
  historicalScores  MetricHistory[]
  
  @@unique([playerId, organizationId])
  @@index([playerId])
}

model MetricHistory {
  id                String      @id @default(uuid())
  metricId          String
  sessionId         String      // Which session triggered update
  
  // Scores
  serve             Int         // 0-100
  forehand          Int
  backhand          Int
  movement          Int
  stamina           Int
  strategy          Int
  mentalToughness   Int
  courtAwareness    Int
  
  // Calculation
  trend             String      // "up", "down", "stable"
  changes           Json        // { serve: +5, forehand: -2 }
  
  timestamp         DateTime    @default(now())
  
  metric            PlayerMetric @relation(fields: [metricId], references: [id])
  session           CoachSession @relation(fields: [sessionId], references: [id])
  
  @@index([metricId])
  @@index([timestamp])
  @@index([sessionId])
}

model ProgressUpdate {
  id                String      @id @default(uuid())
  playerId          String
  sessionId         String
  
  // Coach Submission
  ratingChanges     Json        // { serve: +5, forehand: -2, strategy: 0 }
  focusAreas        String[]    // ["forehand", "serve"]
  notes             String      // Coach observations
  
  // Calculated
  overallProgress   Int         // 0-100 overall
  timestamp         DateTime    @default(now())
  
  session           CoachSession @relation(fields: [sessionId], references: [id])
  
  @@index([playerId])
  @@index([sessionId])
  @@index([timestamp])
}
```

### 3.2 Session-Based Update Flow

```
Coach completes session
    ↓
Coach submits report:
  - Rating for each metric (+5 forehand, -2 stamina, etc.)
  - Focus areas for next session
  - General notes
    ↓
System creates:
  - MetricHistory (time-series entry)
  - ProgressUpdate (session event)
  - Calculated trend (up/down/stable)
    ↓
Data available for:
  - Progress graphs
  - Trend detection
  - Recommendations
  - Parent reports
```

### 3.3 What Never Overwrites

```
Each session creates a NEW historical record:
- Never delete old data
- Always store deltas
- Build time-series from history

Parent sees: "Forehand improved 15% over last month"
System has:  "Session 1: 60 → 63, Session 2: 63 → 65, Session 3: 65 → 75"
```

### 3.4 Parent View (Simplified)

```
Child's Progress
├── Overall: 72/100 (↑ +8% this month)
├── Key Improvements
│   ├── Serve: +12%
│   ├── Strategy: +8%
│   └── Movement: +5%
├── Focus Areas (Next)
│   ├── Backhand technique
│   └── Match play confidence
└── Coach Notes
    └── "Great progress on serve technique. Focus on footwork next."
```

---

## Part 4: Match / Game System

### 4.1 Match Entity

```prisma
model Match {
  id                String      @id @default(uuid())
  organizationId    String      // Match belongs to org
  
  // Match Info
  matchType         String      // "internal" | "external" | "tournament"
  format            String      // "singles" | "doubles"
  
  // Players & Score
  player1Id         String
  player2Id         String
  player1Score      Int
  player2Score      Int
  result            String      // "player1_win" | "player2_win" | "draw"
  
  // Tournament/External
  tournamentId      String?
  opponent1Info     Json?       // For external matches
  opponent2Info     Json?
  
  // Metadata
  playedAt          DateTime
  courtId           String?
  notes             String?
  
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
  
  // Relations
  organization      Organization @relation(fields: [organizationId], references: [id])
  player1           Player      @relation("Player1Matches", fields: [player1Id], references: [userId])
  player2           Player      @relation("Player2Matches", fields: [player2Id], references: [userId])
  matchStats        MatchStat[]
  confidenceImpacts  ConfidenceImpact[]
  
  @@index([organizationId])
  @@index([playedAt])
}

model MatchResult {
  id                String      @id @default(uuid())
  matchId           String
  
  // Impact on Player
  playerId          String
  won               Boolean
  
  // Performance Metrics
  acesCount         Int         @default(0)
  doubleFaultsCount Int         @default(0)
  breakPointsWon    Int         @default(0)
  
  // Confidence & Ranking
  confidenceChange  Int         // -5 to +10
  rankingPoints     Int         // Points earned/lost
  
  createdAt         DateTime    @default(now())
  
  @@index([matchId])
  @@index([playerId])
}
```

### 4.2 Match Impact

```
Match completed
    ↓
System calculates:
  - Winner confidence: +10
  - Loser confidence: -5
  - Ranking points adjustment
  - Recommendation update
    ↓
Impacts:
  - Player confidence metric
  - Player ranking
  - Recommendation: "Ready for higher level"
  - Parent notification
```

---

## Part 5: Recommendation Engine (The Differentiator)

### 5.1 Recommendation Entity

```prisma
model Recommendation {
  id                String      @id @default(uuid())
  organizationId    String
  targetId          String      // playerId, parentId, or coachId
  targetType        String      // "player" | "parent" | "coach"
  
  // Recommendation Content
  title             String      // "Increase backhand drills"
  description       String
  priority          String      // "high" | "medium" | "low"
  category          String      // "training" | "match" | "enrollment" | "progress"
  
  // Trigger & Analysis
  triggeredBy       String      // "session_analysis" | "match_result" | "weekly_job"
  triggerData       Json        // Data that triggered recommendation
  
  // Action Items
  actionItems       String[]    // Specific next steps
  linkedSessionId   String?     // Reference session if from session
  linkedMatchId     String?     // Reference match if from match
  
  // Engagement
  acknowledged      Boolean     @default(false)
  acknowledgedAt    DateTime?
  status            String      // "active" | "completed" | "dismissed"
  
  createdAt         DateTime    @default(now())
  validUntil        DateTime?   // Auto-expire recommendations
  
  @@index([organizationId])
  @@index([targetId])
  @@index([targetType])
  @@index([status])
}
```

### 5.2 Recommendation Types

**For Players:**
- "Increase backhand drills (currently weakest area)"
- "Join intermediate group training"
- "Ready to compete in tournament"
- "Work on match fitness"

**For Parents:**
- "Add 2 sessions/week to accelerate progress"
- "Enroll in group training for confidence"
- "Consider tournament participation"
- "Schedule private lessons for weakness: backhand"

**For Coaches:**
- "Player stagnating in movement - adjust plan"
- "Strong progress in serve - increase difficulty"
- "Player ready to move to intermediate level"

### 5.3 Trigger Points

```
1. After Session Completion
   - Analyze metrics vs. trend
   - Generate drill recommendations
   - Skill level advancement checks

2. After Match
   - Confidence-based recommendations
   - Level-up suggestions
   - Tournament eligibility

3. Weekly Analysis Job
   - Trend analysis (progress over 4 weeks)
   - Stagnation detection
   - Enrollment recommendations
   - Coach effectiveness review

4. Monthly Analytics
   - Parent engagement recommendations
   - Batch coaching recommendations
   - Report insights
```

---

## Part 6: Reporting System (Multi-Layer)

### 6.1 Player Report

```
Player Progress Report (Last 30 days)

Overall Progress: 72/100 ↑ +8%
├── Serve: 75/100 ↑ +12%
├── Forehand: 70/100 ↑ +5%
├── Backhand: 65/100 ↑ +3%
├── Movement: 68/100 ↑ +8%
├── Stamina: 72/100 ↑ +10%
├── Strategy: 75/100 ↑ +7%
└── Mental Toughness: 70/100 ↑ +6%

Sessions Attended: 8/8 (100%)
Matches Won: 3/5 (60%)
Focus Areas (This Month):
  - Backhand consistency
  - Serve placement
  - Court positioning

Coach Feedback:
  "Excellent improvement in stamina. Backhand technique needs 
   refinement. Overall, you're tracking well for tournament 
   readiness by next month."

Next Steps:
  1. Add 2 weekly backhand drills
  2. Practice serve placement (narrow target drills)
  3. Play 1 match/week minimum
```

### 6.2 Parent Report (Simplified & Actionable)

```
Your Child's Progress

Overall Growth: 8% improvement (Excellent!)
✓ Attend all sessions regularly
✓ Strong progress in serve and stamina
⚠ Focus area: Backhand technique

What Your Coach Says:
"Your child is making excellent progress. With consistent 
training and 1-2 matches per week, they'll be tournament-ready 
next month."

Recommended Actions:
1. Continue current 2x/week training (very effective)
2. Add 1 weekly match play for competition experience
3. Consider group training for advanced tactics

Cost Impact:
- Current: 2 sessions/week @ 2,000 KES = 16,000 KES/month
- Recommended: +1 match/week coaching @ 2,500 KES
- New total: 18,500 KES/month

Next Month's Focus: Backhand + Match Readiness
```

### 6.3 Coach Report

```
Coach Performance Report (April 2026)

Players Managed: 12
Sessions Delivered: 48
Session Completion Rate: 95%
Average Student Progress: +7.2%

Top Performers (Greatest Improvement):
  1. Alice (forehand +15%)
  2. Bob (serve +12%)
  3. Charlie (strategy +10%)

Areas Needing Attention:
  - David: Stagnating in movement (-2%)
  - Eve: Low attendance (3/8 sessions)

Earnings This Month:
  Sessions: 48 × 2,000 KES = 96,000 KES
  Match coaching: 4 × 1,500 KES = 6,000 KES
  Total: 102,000 KES
  Status: Paid (2026-04-28)

Next Month Focus:
  - Increase group training (2 sessions/week)
  - Support 2 tournament match prep
```

### 6.4 Organization Report

```
Monthly Organization Analytics (April 2026)

Revenue
├── Session Revenue: 1,250,000 KES
├── Tournament Fees: 85,000 KES
├── Group Training: 150,000 KES
└── Total: 1,485,000 KES

Player Metrics
├── Active Players: 120
├── Average Progress: +6.8%
├── Tournament Participants: 28
└── Retention Rate: 92%

Coach Metrics
├── Active Coaches: 8
├── Avg. Session Completion: 94%
├── Avg. Student Satisfaction: 4.6/5.0
└── Utilization Rate: 87%

Court Utilization
├── Total Court Hours: 240 hours
├── Occupancy Rate: 75%
├── Peak Hours: Tue-Thu 4-6 PM

Financial Breakdown
├── Coach Payroll: 850,000 KES (57%)
├── Staff & Admin: 300,000 KES (20%)
├── Court Rental: 200,000 KES (13%)
├── Net Profit: 135,000 KES (9%)

Next Month Focus:
  - Increase group training (projected +200K revenue)
  - Recruit 2 additional coaches
  - Expand court hours (currently at capacity Tue-Thu)
```

---

## Part 7: Payment System (Org-Centric Model)

### 7.1 Revenue Flow

```prisma
model OrgRevenue {
  id                String      @id @default(uuid())
  organizationId    String
  
  // Payment Source
  paymentType       String      // "per_session" | "subscription" | "tournament"
  fromPlayerId      String      // Parent/player who paid
  
  // Amount & Status
  amount            Decimal
  currency          String      @default("KES")
  status            String      // "pending" | "confirmed" | "reconciled"
  
  // Reference
  sessionIds        String[]    // Sessions this pays for
  subscriptionId    String?     // If subscription
  invoiceId         String?
  
  // M-Pesa Integration
  mpesaTransactionId String?
  paymentMethod     String      // "mpesa" | "bank" | "cash"
  
  createdAt         DateTime    @default(now())
  recordedAt        DateTime
  
  organization      Organization @relation(fields: [organizationId], references: [id])
  
  @@index([organizationId])
  @@index([status])
}
```

### 7.2 Coach Earning Calculation (Event-Driven)

```prisma
model CoachEarning {
  id                String      @id @default(uuid())
  sessionId         String      @unique
  coachId           String
  organizationId    String
  
  // Calculation
  sessionPrice      Decimal     // What org charged for session
  coachPercentage   Decimal     @default(0.60) // Coach gets 60%
  amount            Decimal     // sessionPrice × coachPercentage
  
  // Status
  status            String      // "pending" | "approved" | "paid"
  approvedAt        DateTime?
  paidAt            DateTime?
  payoutCycleId     String?     // Links to payout batch
  
  // Metadata
  createdAt         DateTime    @default(now())
  
  session           CoachSession @relation(fields: [sessionId], references: [id])
  staff             Staff       @relation(fields: [coachId], references: [userId])
  
  @@index([coachId])
  @@index([status])
  @@index([organizationId])
}

model CoachPayout {
  id                String      @id @default(uuid())
  organizationId    String
  cycleNumber       String      // "2026-04-W1" or "2026-04"
  cycleType         String      // "weekly" | "monthly"
  
  // Payout Details
  payoutDate        DateTime
  totalAmount       Decimal     // Sum of all earnings
  earningIds        String[]    // CoachEarning IDs included
  
  // Payment
  paymentMethod     String      // "mpesa" | "bank"
  transactionId     String?     // M-Pesa or bank ref
  status            String      // "pending" | "approved" | "sent" | "confirmed"
  
  createdAt         DateTime    @default(now())
  
  organization      Organization @relation(fields: [organizationId], references: [id])
  
  @@index([organizationId])
  @@index([payoutDate])
  @@index([status])
}
```

### 7.3 No Direct Payment Rule (Enforced)

```typescript
// ❌ NEVER allow this API:
POST /api/parent/:parentId/pay-coach/:coachId

// ✅ ALWAYS require:
POST /api/org/:orgId/sessions/:sessionId/book
  → Session recorded with org
  → Payment collected by org
  → Coach earning auto-calculated
```

---

## Part 8: Scheduling System

### 8.1 Coach Availability

```prisma
model CoachAvailability {
  id                String      @id @default(uuid())
  coachId           String
  organizationId    String
  
  // Recurrence
  dayOfWeek         Int         // 0=Sunday, 6=Saturday
  startTime         String      // "14:00"
  endTime           String      // "18:00"
  
  // Constraints
  maxSessionsPerDay Int         @default(6)
  sessionDuration   Int         // Default: 60 minutes
  bufferMinutes     Int         @default(0) // Between sessions
  
  // Exceptions
  isRecurring       Boolean     @default(true)
  recurringUntil    DateTime?
  blackoutDates     DateTime[]  // Days not available
  
  createdAt         DateTime    @default(now())
  
  staff             Staff       @relation(fields: [coachId], references: [userId])
  
  @@index([coachId])
  @@index([organizationId])
}
```

### 8.2 Booking Flow

```
Parent/Player selects available slot
    ↓
System validates:
  - Coach is available
  - Player has org membership (direct or inherited)
  - No double-booking
  - Slot hasn't passed
    ↓
Session created with status "scheduled"
    ↓
Org system calculates price:
  - Session type × player count = total
    ↓
Payment initiated
    ↓
Session status → "confirmed" (once paid)
    ↓
Notifications sent:
  - Coach: "New session confirmed"
  - Player: "Session booked"
  - Parent: "Training session booked"
```

---

## Part 9: Communication Layer

### 9.1 Communication Channels

```prisma
model Message {
  id                String      @id @default(uuid())
  fromId            String
  toId              String
  organizationId    String
  
  // Content
  type              String      // "text" | "voice" | "file"
  content           String
  attachmentUrl     String?
  
  // Session Context (optional)
  sessionId         String?     // Reference to session
  
  // Status
  read              Boolean     @default(false)
  readAt            DateTime?
  
  createdAt         DateTime    @default(now())
  
  @@index([fromId])
  @@index([toId])
  @@index([organizationId])
}

model Announcement {
  id                String      @id @default(uuid())
  organizationId    String
  authorId          String
  
  title             String
  content           String
  audience          String      // "coaches" | "players" | "parents" | "all"
  
  postedAt          DateTime    @default(now())
  expiresAt         DateTime?
  
  organization      Organization @relation(fields: [organizationId], references: [id])
}
```

### 9.2 Communication Rules

```
Coach ↔ Player:
  - Session feedback
  - Training questions
  - Performance discussion

Coach ↔ Parent:
  - Session summaries
  - Progress updates
  - Recommendations
  - Attendance alerts

Org ↔ Everyone:
  - Policy announcements
  - Schedule changes
  - Tournament info
  - Payment reminders
```

---

## Part 10: Notifications System (Critical in Your Market)

### 10.1 Notification Events

```prisma
model Notification {
  id                String      @id @default(uuid())
  organizationId    String
  targetId          String      // User receiving notification
  targetType        String      // "coach" | "player" | "parent"
  
  // Event
  eventType         String      // See triggers below
  eventId           String      // Reference (sessionId, matchId, etc.)
  
  // Content
  title             String
  body              String
  action            String?     // "view_report", "book_session", etc.
  actionUrl         String?
  
  // Delivery
  deliveryChannels  String[]    // ["sms", "push", "email"]
  sentAt            DateTime?
  readAt            DateTime?
  
  createdAt         DateTime    @default(now())
  
  @@index([targetId])
  @@index([organizationId])
  @@index([eventType])
}
```

### 10.2 Trigger Events

**Session-Related:**
- Session booked → Send SMS to coach & player
- Session in 24h → Reminder SMS
- Session in 1h → Final reminder (push + SMS)
- Session completed → Report available (email to parent)
- Session no-show → Alert to org

**Payment-Related:**
- Payment due → Email reminder
- Payment received → Confirmation SMS
- Payment failed → Alert + retry option
- Payout processed → Coach receives notification

**Report-Related:**
- Weekly progress → Email to parent
- Monthly report → Email to parent
- Recommendation → Push notification
- Achievement milestone → Push + SMS

**Match-Related:**
- Match scheduled → SMS to players
- Match result recorded → Push to family
- Ranking updated → App notification

---

## Part 11: Admin Control Panel (Org Command Center)

### 11.1 Admin Capabilities

```
Coaches Management
├── Add/remove coaches
├── Set availability
├── Review performance metrics
├── Approve reports
└── Process payouts

Players & Membership
├── View all players
├── Manage membership levels
├── View progress
├── Override schedules
└── Send communications

Sessions & Scheduling
├── View all sessions
├── Create/edit sessions
├── Cancel with reason
├── Bulk scheduling
└── Session reports

Financial Control
├── Set pricing (per-session, group, tournament)
├── View revenue dashboard
├── Approve coach payouts
├── Generate payment reports
└── M-Pesa/bank integration

Analytics & Insights
├── Player retention metrics
├── Coach effectiveness dashboard
├── Revenue trends
├── Utilization reports
└── Recommendations queue

Communications
├── Send announcements
├── View message logs
├── Notification settings
└── Emergency alerts
```

---

## Part 12: Data Flow (How Everything Connects)

### The Session-Centric Data Flow

```
┌─────────────────────────────────────────────────────────┐
│ SESSION SCHEDULED                                       │
│ (Parent books via app/site)                             │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ PAYMENT PROCESSED                                       │
│ (Org collects fee)                                      │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ SESSION CONFIRMED & NOTIFICATIONS SENT                  │
│ (Coach, player, parent alerted)                         │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ SESSION EXECUTED                                        │
│ (Coach conducts training)                               │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ SESSION COMPLETED & REPORT SUBMITTED                    │
│ (Coach marks complete + submits data)                   │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ TRIGGER EVENT-DRIVEN UPDATES                           │
│                                                          │
│ ✓ Update Player Metrics                                │
│ ✓ Create Progress Entry                                │
│ ✓ Record Attendance                                    │
│ ✓ Calculate Coach Earning                              │
│ ✓ Update Org Revenue                                   │
│ ✓ Generate Recommendations                             │
│ ✓ Prepare Session Report                               │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ DATA FLOWS TO DASHBOARDS & REPORTS                      │
│                                                          │
│ Coach Dashboard:  "Student improved forehand +5"        │
│ Parent App:       "Great session! Forehand +5"          │
│ Org Analytics:    "Revenue recorded, earnings pending"  │
│ Recommendation:   "Ready for group training"            │
└─────────────────────────────────────────────────────────┘
```

---

## Part 13: Architecture Direction

### Modular Monolith (Starting Point)

```
TennisTracker/
├── Identity & Membership
│   ├── User management
│   ├── Guardian relationships
│   ├── Organization membership
│   └── Role-based access
│
├── Sessions (The Core)
│   ├── Session lifecycle
│   ├── Booking & scheduling
│   ├── Coach availability
│   └── Session completion
│
├── Progress & Metrics
│   ├── Player metrics
│   ├── Progress tracking
│   ├── Metric history
│   └── Performance analysis
│
├── Matches & Rankings
│   ├── Match recording
│   ├── Rankings calculation
│   ├── Confidence metrics
│   └── Tournament integration
│
├── Payments & Finance
│   ├── Revenue recording
│   ├── Coach earnings
│   ├── Payouts
│   └── Payment integration (M-Pesa)
│
├── Recommendations
│   ├── Analysis engine
│   ├── Recommendation generation
│   ├── Trigger system
│   └── Acknowledgment tracking
│
├── Reporting
│   ├── Player reports
│   ├── Parent reports
│   ├── Coach reports
│   └── Org analytics
│
├── Notifications
│   ├── Event triggers
│   ├── Channel routing
│   ├── SMS integration
│   └── Delivery tracking
│
├── Admin Console
│   ├── Dashboard
│   ├── Management tools
│   ├── Analytics views
│   └── System controls
│
└── Shared
    ├── Database
    ├── Authentication
    ├── Error handling
    └── Logging
```

### Future Evolution Path

```
Year 1: Monolith + Event Bus (session completion → events)
Year 2: Extract Microservices
  - Payments → Separate service
  - Notifications → Queue-based
  - Recommendations → ML service
Year 3: Advanced Features
  - ML progress prediction
  - Real-time analytics
  - Video analysis integration
```

---

## Part 14: What Makes Vico Stand Out

### Not Just Booking (❌ Generic)

```
❌ Booking system (every platform has this)
❌ Basic payment (every platform has this)
❌ Calendar (every platform has this)
```

### Your Differentiation (✅ Unique)

```
✅ Structured Progress Tracking
   - 8 core metrics tracked per session
   - Historical time-series data
   - Trend analysis (not just scores)
   - Coach can see what's working

✅ Actionable Recommendations
   - "Increase backhand drills" (specific)
   - Based on real progress data
   - Different for coach/parent/player
   - Drives real decisions

✅ Clean Financial System
   - Org controls all money
   - No parent-coach confusion
   - Transparent coach earnings
   - Automatic payout tracking

✅ Strong Parent Experience
   - Simple progress summaries
   - Actionable recommendations
   - Know exactly what to do next
   - See ROI of training

✅ Coach Empowerment
   - Data-driven coaching
   - Know student trends
   - Automatic earning tracking
   - Performance visibility
```

---

## Part 15: The Mental Model (Keep This in Mind)

### Sessions Generate Data → Data Generates Insight → Insight Drives Decisions → Payments Follow Structure

```
Session data:
  "Forehand improved from 70→75"
  "Strategy focus area this week"
  "3 successful match plays"
        ↓↓↓
Insight generation:
  "Forehand is strongest area"
  "Ready for intermediate group"
  "Tournament readiness: 80%"
        ↓↓↓
Decision drivers:
  Coach: "Continue current program"
  Parent: "Add tournament coaching"
  Player: "I'm improving!"
        ↓↓↓
Payment structure:
  Session: 2,000 KES
  Coach cut: 1,200 KES (60%)
  Org: 800 KES (40%)
  Tracked, reported, paid on schedule
```

---

## Implementation Priority (MVP → V1 → Scale)

### MVP (Months 1-2)
- ✅ Basic session creation & completion
- ✅ Player metrics (basic)
- ✅ Coach report submission
- ✅ Simple progress view
- ✅ Revenue tracking
- ✅ Coach payout calculation

### V1 (Months 3-4)
- ✅ Full recommendation engine
- ✅ Match integration
- ✅ Multi-layer reports
- ✅ Admin dashboard
- ✅ Notification system
- ✅ Parent-kid membership

### Scale (Months 5+)
- ✅ Group training features
- ✅ Tournament integration
- ✅ Advanced analytics
- ✅ ML-based recommendations
- ✅ Video analysis prep
- ✅ Mobile app enhancement

---

## Success Metrics

```
Coach Engagement
  - Session completion rate > 95%
  - Average time on platform: > 20 min/day
  - Report submission rate: > 90%

Parent Engagement
  - App opens > 2x per week
  - Progress view > 50% weekly active
  - Recommendation follow-through > 40%

Financial Health
  - Monthly revenue growth > 15%
  - Coach retention > 90%
  - Coach earning predictability > 95%

Student Outcomes
  - Average progress improvement > 8% monthly
  - Tournament participation increase > 30%
  - Satisfaction rating > 4.5/5.0
```

---

**This document is LOCKED. All future work flows from this model.**
