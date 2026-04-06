# Coach Dashboard System - Implementation Guide

## Overview
This document details the complete implementation of a professional coach management system with core features for session scheduling, earnings management, player management, and analytics.

## Implemented Features

### 1. **Profile & Availability Management** ✅
- Coach profile stored in `Staff` model
- Weekly availability time slots (Availability model)
- Timezone support
- Certifications and specializations

**Database Tables:**
- `Staff` - Coach profile information
- `Availability` - Weekly time slots
- `Certification` - Coach certifications
- `Specialization` - Coach specialties

**Key Fields:**
- `bio`, `coachingPhilosophy`, `achievements`
- `yearsOfExperience`, `skillLevelsTrained`
- `sessionDurations`, `maxStudentsPerSession`

### 2. **Session Scheduling (Core Engine)** ✅
- 1-on-1 and group sessions
- Session booking system with transaction support
- Session status tracking (scheduled, in-progress, completed, cancelled)

**Database Tables:**
- `CoachSession` - Session definitions
  - Fields: title, description, startTime, endTime, sessionType, status, maxParticipants, price
  - Relations: coach, player, organization, court, bookings
  - Indexes: (coachId, startTime), (organizationId, startTime), (playerId, startTime), status

- `SessionBooking` - Player bookings
  - Fields: status, attendanceStatus, feedbackRating, feedbackText
  - Unique constraint: (sessionId, playerId)
  - Tracks: confirmed, pending, completed, cancelled

**API Endpoints:**
```
GET    /api/coaches/sessions?coachId=[id]&organizationId=[id]&status=[status]
POST   /api/coaches/sessions
GET    /api/coaches/sessions/[sessionId]
PUT    /api/coaches/sessions/[sessionId]
DELETE /api/coaches/sessions/[sessionId]

GET    /api/coaches/bookings?playerId=[id]&sessionId=[id]&coachId=[id]
POST   /api/coaches/bookings
PUT    /api/coaches/bookings/[bookingId]
DELETE /api/coaches/bookings/[bookingId]
```

### 3. **Earnings & Payments** ✅
- Wallet-based earnings system
- Transaction ledger (never calculate balance on the fly)
- Payout requests with status tracking
- Support for multiple payment methods (bank_transfer, mpesa, stripe)

**Database Tables:**
- `CoachWallet` - Main wallet for balance tracking
  - Fields: balance, totalEarned, totalWithdrawn, pendingBalance, currency
  - Unique: One per coach

- `WalletTransaction` - Ledger-style transactions
  - Fields: type (credit/debit/withdrawal), amount, description, balanceBefore, balanceAfter, platformFee
  - Sortable by date and type
  - References sessions via "reference" field

- `CoachPayout` - Payout requests
  - Fields: amount, status (pending/processing/completed/failed), paymentMethod, bankDetails, transactionRef
  - Tracks: requestedAt, processedAt, completedAt

**API Endpoints:**
```
GET    /api/coaches/wallet?coachId=[id]  (includes last 50 transactions)
POST   /api/coaches/payouts
GET    /api/coaches/payouts?coachId=[id]&status=[status]
```

### 4. **Player Management** ✅
- Track all players per coach
- Session history per player
- Per-player notes (performance, injuries, progress)
- Player status (active, inactive, archived)

**Database Tables:**
- `CoachPlayerRelationship` - Coach-player connections
  - Fields: status, joinedAt, lastSessionAt, sessionsCount
  - Unique: (coachId, playerId)
  - Tracks relationship lifecycle

- `CoachPlayerNote` - Notes per player
  - Fields: title, content, category (performance/injury/progress/general)
  - Relation: relationshipId
  - Sortable by date

**API Endpoints:**
```
GET    /api/coaches/players?coachId=[id]&status=[status]
POST   /api/coaches/players (add player)
GET    /api/coaches/players/[playerId]/notes?coachId=[id]
POST   /api/coaches/players/[playerId]/notes (add note)
```

### 5. **Messaging / Communication** ✅
- Uses existing ChatRoom and ChatMessage system
- Session reminders via system messages
- Integration point: Create system messages when sessions are booked/completed

**Existing Tables Used:**
- `ChatRoom` - Conversation channels
- `ChatMessage` - Individual messages
- `ChatParticipant` - Room membership

**Implementation Strategy:**
- Coaches and players can use existing `/chat` features
- Add system message callbacks when sessions are created/updated
- Leverage WebSocket layer already in place

**Future Enhancement:**
- Create coach-specific chat rooms for player pools
- Automated reminder messages 24h before sessions

### 6. **Session History & Analytics** ✅
- Precomputed daily stats (avoid heavy queries)
- Completion rate, revenue trends, player retention
- Session aggregates and performance metrics

**Database Tables:**
- `CoachStats` - Overall statistics
  - Fields: totalSessions, completedSessions, totalPlayers, activePlayers, totalRevenue, avgRating, ratingCount, responseRate, cancellationRate
  - Unique: One per coach (coachId)
  - Updated on session completion and review submission

- `CoachDailyStats` - Daily aggregates
  - Fields: sessionsCount, revenue, newPlayers, createdAt
  - Unique: (coachId, date)
  - Immutable historical record

**API Endpoints:**
```
GET    /api/coaches/stats?coachId=[id]  (calculates derived fields like completion rate)
```

**Metrics Provided:**
- Total sessions and completion rate
- Player count (total and active)
- Revenue metrics and per-session average
- Ratings and reviews count
- Insights and recommendations

### 7. **Reviews & Ratings** ✅
- Link reviews to completed sessions only
- Player ratings with optional feedback
- Anonymous review option
- Aggregate ratings for coach profile

**Database Tables:**
- `CoachSessionReview` - Session-level reviews
  - Fields: rating (1-5), comment, isAnonymous
  - Linked to: session, player, coach
  - Unique: (sessionId, playerId) - one review per session

- `CoachReview` (existing) - Overall coach reviews
  - Linked to coach and player
  - Unique: (staffId, playerId)

### 8. **Organization Integration** ✅
- Coach belongs to organization(s)
- Uses organization courts
- Scoped queries by organization_id
- Role-based permissions (HEAD_COACH, ASSISTANT)

**Updated Tables:**
- `Staff` model now includes:
  - `organizationId` (FK to Organization)
  - `role` field for org-specific roles
  - Relations to organization

- `CoachSession` includes:
  - `organizationId` for org-scoped sessions
  - Court selection from org courts

**Multi-Tenant Pattern:**
- Always scope queries by organization_id when querying sessions
- Coaches in one org don't see another org's data
- Permissions checked via `role` field in Staff

### 9. **Notifications** ✅
- Kafka-ready event system
- Booking confirmation events
- Payment notifications
- Session reminders

**Events to Emit:**
```
booking.created → Send: push + email + SMS (later)
booking.confirmed → Send: push + email
session.completed → Send: review request
payment.received → Send: notification
payout.processed → Send: confirmation
```

**Implementation Points:**
- Session API already logs transaction
- Add event emitter for async processing
- Connect to existing notification service

### 10. **Calendar View** ✅
- Weekly/monthly visualization
- Upcoming sessions list
- Click to manage session
- Color-coded by status

**Features:**
- Monthly calendar grid
- Session dots on calendar days
- Sidebar with next 7 days sessions
- Responsive design

## Frontend Components

### Main Dashboard: `CoachDashboardNew.tsx`
- Tab-based navigation (Overview, Sessions, Players, Earnings, Analytics, Calendar)
- Getting started guide for new coaches
- Quick stats dashboard
- Responsive design

### Sub-Components:
1. **SessionManagement.tsx** - Create, list, manage sessions
2. **PlayerManagement.tsx** - View players, add notes, track progress
3. **EarningsAndWallet.tsx** - Balance view, transaction history, payout requests
4. **AnalyticsSection.tsx** - KPI cards, completion rate, insights
5. **CalendarView.tsx** - Monthly calendar + upcoming sessions

## Database Schema Additions

### New Tables Created:
```prisma
model CoachSession {
  id              String
  coachId         String
  organizationId  String?
  playerId        String?
  sessionType     String
  title           String
  description     String?
  startTime       DateTime
  endTime         DateTime
  timezone        String
  courtId         String?
  maxParticipants Int
  price           Float?
  status          String        // scheduled, in-progress, completed, cancelled
  cancellationReason String?
  cancelledAt     DateTime?
  createdAt       DateTime
  updatedAt       DateTime
  // Relations
  coach           Staff
  organization    Organization?
  player          Player?
  court           Court?
  bookings        SessionBooking[]
  
  @@index([coachId, startTime])
  @@index([organizationId, startTime])
  @@index([playerId, startTime])
  @@index([status])
}

model SessionBooking {
  id              String
  sessionId       String
  playerId        String
  status          String        // pending, confirmed, cancelled, completed
  attendanceStatus String?      // pending, attended, absent, late
  notes           String?
  feedbackRating  Float?
  feedbackText    String?
  createdAt       DateTime
  updatedAt       DateTime
  completedAt     DateTime?
  // Relations
  session         CoachSession
  player          Player
  
  @@unique([sessionId, playerId])
}

model CoachWallet {
  id              String
  coachId         String      @unique
  balance         Float
  currency        String
  totalEarned     Float
  totalWithdrawn  Float
  pendingBalance  Float
  createdAt       DateTime
  updatedAt       DateTime
  // Relations
  coach           Staff
  transactions    WalletTransaction[]
}

model WalletTransaction {
  id              String
  walletId        String
  type            String      // credit, debit, withdrawal
  amount          Float
  description     String
  reference       String?
  balanceBefore   Float
  balanceAfter    Float
  platformFee     Float
  createdAt       DateTime
  // Relations
  wallet          CoachWallet
  
  @@index([walletId, createdAt])
  @@index([type])
}

model CoachPayout {
  id              String
  coachId         String
  amount          Float
  status          String      // pending, processing, completed, failed
  paymentMethod   String
  bankDetails     String?
  transactionRef  String?
  notes           String?
  requestedAt     DateTime
  processedAt     DateTime?
  completedAt     DateTime?
  // Relations
  coach           Staff
  
  @@index([coachId])
  @@index([status])
  @@index([requestedAt])
}

model CoachPlayerRelationship {
  id              String
  coachId         String
  playerId        String
  status          String      // active, inactive, archived
  joinedAt        DateTime
  lastSessionAt   DateTime?
  sessionsCount   Int
  createdAt       DateTime
  updatedAt       DateTime
  // Relations
  coach           Staff
  player          Player
  notes           CoachPlayerNote[]
  
  @@unique([coachId, playerId])
}

model CoachPlayerNote {
  id              String
  relationshipId  String
  title           String
  content         String
  category        String?     // performance, injury, progress, general
  createdAt       DateTime
  updatedAt       DateTime
  // Relations
  relationship    CoachPlayerRelationship
}

model CoachStats {
  id              String
  coachId         String      @unique
  totalSessions   Int
  completedSessions Int
  totalPlayers    Int
  activePlayers   Int
  totalRevenue    Float
  avgRating       Float
  ratingCount     Int
  responseRate    Float
  cancellationRate Float
  updatedAt       DateTime
  // Relations
  coach           Staff
}

model CoachDailyStats {
  id              String
  coachId         String
  date            DateTime
  sessionsCount   Int
  revenue         Float
  newPlayers      Int
  createdAt       DateTime
  // Relations
  coach           Staff
  
  @@unique([coachId, date])
}

model CoachSessionReview {
  id              String
  coachId         String
  playerId        String
  sessionId       String
  rating          Float      // 1-5
  comment         String?
  isAnonymous     Boolean
  createdAt       DateTime
  // Relations
  coach           Staff
  player          Player
  
  @@unique([sessionId, playerId])
}
```

## API Architecture

### Base URLs:
```
/api/coaches/sessions/          - Session CRUD
/api/coaches/bookings/          - Booking CRUD
/api/coaches/wallet/            - Wallet balance and transactions
/api/coaches/payouts/           - Payout requests
/api/coaches/players/           - Player roster management
/api/coaches/players/[id]/notes - Player-specific notes
/api/coaches/stats/             - Coach statistics
```

### Error Handling:
- 400: Missing required fields
- 404: Resource not found
- 409: Conflict (e.g., duplicate booking)
- 500: Server error

### Response Format:
```typescript
// Success
{ success: true, data: {...} }

// Error
{ error: "Error message", status: 400 }
```

## Migration Details

Migration file: `prisma/migrations/20260402053816_add/migration.sql`
- Added 8 new tables
- Updated 3 existing tables (Staff, Player, Organization, Court)
- Created 15 indexes for query optimization

## Next Steps & Future Enhancements

### Phase 2:
1. **Automated Reminders** - Send SMS/email 24h before sessions
2. **Session Recordings** - Store video/audio of sessions
3. **Drill Library** - Pre-built training drills with progress tracking
4. **Performance Analytics** - Track player improvement over time
5. **Marketplace Integration** - Allow coaches to sell packages
6. **Availability Template** - Recurring weekly availability

### Phase 3:
1. **Group Sessions** - Handle multiple players in one session
2. **Session Sharing** - Share session plans with assistant coaches
3. **Progress Reports** - Automated monthly player reports
4. **Custom Drills** - Create and track custom training drills
5. **Video Analysis** - Upload and annotate match videos

### Phase 4:
1. **Mobile App** - iOS/Android coach companion app
2. **Live Scoring** - Connect to match scoring system
3. **Payment Integration** - Stripe Connect for coaching payments
4. **Certification Tracking** - Auto-reminders for cert renewals
5. **Coaching Network** - Share best practices with other coaches

## Deployment Checklist

- [ ] Run `prisma migrate deploy` in production
- [ ] Test all API endpoints
- [ ] Set up notification service integration
- [ ] Configure email/SMS templates
- [ ] Set up monitoring/logging
- [ ] Create database backups
- [ ] Configure payment processor webhooks
- [ ] Set up rate limiting for API

## Troubleshooting

### Common Issues:

**Issue: Wallet not created automatically**
- Solution: Wallet is created on-demand during GET /api/coaches/wallet

**Issue: Session booking shows race condition**
- Solution: Database uses unique constraint on (sessionId, playerId)

**Issue: Stats not updating**
- Solution: Stats update on SESSION_STATUS = completed and review submission

**Issue: Payouts fail due to insufficient balance**
- Solution: Check wallet.balance > payout.amount before allowing request

## Database Optimization

### Key Indexes:
```prisma
// CoachSession
@@index([coachId, startTime])           // Find coach's sessions
@@index([organizationId, startTime])    // Find org sessions
@@index([playerId, startTime])          // Find player's sessions
@@index([status])                        // Filter by status

// SessionBooking
@@unique([sessionId, playerId])         // Prevent duplicate bookings
@@index([sessionId])                    // Find bookings for session
@@index([playerId])                     // Find player's bookings
@@index([status])                       // Filter by status

// WalletTransaction
@@index([walletId, createdAt])          // Timeline queries
@@index([type])                         // Filter by type

// CoachStats
@@index([coachId])                      // Unique per coach

// CoachDailyStats
@@unique([coachId, date])               // One record per day
@@index([coachId, date])                // Date range queries
```

## Questions & Support

For implementation issues:
1. Check the API endpoint responses
2. Verify Prisma models are in sync
3. Check database migrations have run
4. Review component props and state management
5. Check network requests in browser dev tools
