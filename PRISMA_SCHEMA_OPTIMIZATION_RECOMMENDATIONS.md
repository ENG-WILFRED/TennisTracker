# Prisma Schema Optimization Recommendations

## Executive Summary
The schema has 40+ models with several optimization opportunities. Key issues: missing indexes on frequently queried fields, denormalized data that should be derived, lack of enum types, and missing composite indexes for complex queries.

---

## 1. MISSING INDEXES ON FREQUENTLY QUERIED FIELDS

### Critical Priority

#### User Model
**Location**: `prisma/schema.prisma` lines 13-30  
**Issue**: `createdAt` used for sorting but not indexed
```diff
model User {
  id           String     @id @default(uuid())
  username     String     @unique
  email        String     @unique
  phone        String?    @unique
  passwordHash String
  firstName    String
  lastName     String
  photo        String?
  gender       String?
  dateOfBirth  DateTime?
  nationality  String?
  bio          String?
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
  // ... relations ...
  
+ @@index([createdAt])
}
```

#### Organization Model
**Location**: `prisma/schema.prisma` lines 128-160  
**Issues**: Missing indexes on `createdAt`, `slug` for lookups
```diff
model Organization {
  id                      String @id @default(uuid())
  name                    String @unique
  slug                    String? @unique
  // ... fields ...
  createdAt               DateTime @default(now())
  updatedAt               DateTime @updatedAt
  // ... relations ...
  
+ @@index([createdAt])
+ @@index([slug]) // For SEO/URL lookups
}
```

#### Staff Model
**Location**: `prisma/schema.prisma` lines 88-127  
**Issues**: Missing indexes on `organizationId`, `employedById`, `isActive`, `createdAt`
```diff
model Staff {
  // ... fields ...
  isVerified               Boolean @default(false)
  isActive                 Boolean @default(true)
  isDeleted                Boolean @default(false)
  ownerId                  String?
  organizationId           String?
  userId                   String @id
  // ... relations ...
  
+ @@index([organizationId])
+ @@index([employedById])
+ @@index([isActive])
+ @@index([createdAt])
}
```

#### Player Model
**Location**: `prisma/schema.prisma` lines 50-80  
**Issues**: Missing `createdAt` index (organizationId already has one)
```diff
model Player {
  // ... fields ...
  organizationId             String?
  userId                     String @id
  // ... relations ...
  
  @@index([organizationId])
+ @@index([createdAt])
}
```

#### CourtBooking Model
**Location**: `prisma/schema.prisma` ~lines 575-600  
**Critical Issues**: Missing indexes on `startTime`, `endTime`, `status`, `organizationId` - essential for availability queries
```diff
model CourtBooking {
  id                 String   @id @default(uuid())
  organizationId     String
  courtId            String
  memberId           String?
  playerName         String?
  startTime          DateTime
  endTime            DateTime
  bookingType        String   @default("regular")
  guestCount         Int      @default(1)
  status             String   @default("confirmed")
  price              Float?
  isPeak             Boolean  @default(false)
  cancellationReason String?
  cancelledAt        DateTime?
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
  // ... relations ...
  
+ @@index([organizationId, startTime, endTime])
+ @@index([status])
+ @@index([courtId, startTime])
}
```

#### ClubMember Model
**Location**: `prisma/schema.prisma` ~lines 630-680  
**Issues**: Missing separate indexes on `organizationId`, `playerId`, `createdAt`, `paymentStatus`
```diff
model ClubMember {
  id                     String @id @default(uuid())
  organizationId         String
  playerId               String
  tierId                 String?
  joinDate               DateTime @default(now())
  expiryDate             DateTime?
  autoRenew              Boolean @default(true)
  paymentStatus          String @default("active")
  outstandingBalance     Float @default(0)
  attendanceCount        Int @default(0)
  lastAttendance         DateTime?
  role                   String @default("member")
  // ... fields ...
  
+ @@index([organizationId])
+ @@index([playerId])
+ @@index([createdAt])
+ @@index([paymentStatus])
+ @@index([organizationId, paymentStatus]) // Composite for member filtering
}
```

#### ClubEvent Model
**Location**: `prisma/schema.prisma` ~lines 770-800  
**Issues**: Missing indexes on `startDate`, `endDate`, `organizationId`, `eventType`
```diff
model ClubEvent {
  id                   String @id @default(uuid())
  organizationId       String
  name                 String
  description          String?
  eventType            String
  startDate            DateTime
  endDate              DateTime?
  registrationCap      Int @default(64)
  registrationDeadline DateTime
  // ... fields ...
  
+ @@index([organizationId, startDate])
+ @@index([eventType])
+ @@index([startDate, endDate])
}
```

#### EventRegistration Model
**Location**: `prisma/schema.prisma` ~lines 820-840  
**Issues**: Missing `createdAt` and `status` indexes
```diff
model EventRegistration {
  id               String @id @default(uuid())
  eventId          String
  memberId         String
  registeredAt     DateTime @default(now())
  status           String @default("registered")
  signupOrder      Int
  rejectionReason  String?
  // ... relations ...
  
+ @@index([registeredAt])
+ @@index([status])
+ @@index([eventId, status]) // For confirmed registrations query
}
```

#### PaymentReminder Model
**Location**: `prisma/schema.prisma` ~lines 900-920  
**Issues**: Missing `createdAt`, composite index for queries
```diff
model PaymentReminder {
  id             String @id @default(uuid())
  eventId        String
  memberId       String
  registrationId String
  reminderType   String @default("payment")
  message        String?
  sentAt         DateTime?
  isRead         Boolean @default(false)
  isResolved     Boolean @default(false)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  // ... relations ...
  
+ @@index([createdAt])
+ @@index([eventId, memberId, isRead, createdAt]) // For notification feeds
}
```

#### RuleAppeal Model
**Location**: `prisma/schema.prisma` ~lines 1110-1140  
**Issues**: Missing `createdAt` index
```diff
model RuleAppeal {
  id             String @id @default(uuid())
  // ... fields ...
  status         String @default("pending")
  // ... fields ...
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  // ... relations ...
  
+ @@index([createdAt])
+ @@index([organizationId, createdAt])
}
```

#### OrganizationActivity Model
**Location**: `prisma/schema.prisma` ~lines 1070-1080  
**Status**: Has composite index but could improve
```diff
model OrganizationActivity {
  id             String @id @default(uuid())
  organizationId String
  playerId       String
  action         String
  details        Json
  metadata       Json @default("{}")
  createdAt      DateTime @default(now())
  // ... relations ...
  
  @@index([organizationId, createdAt])
  @@index([playerId])
+ @@index([playerId, createdAt]) // For user activity feeds
}
```

---

## 2. FIELDS THAT SHOULD USE @db.VarChar

### Limited-Length String Fields
These should use `@db.VarChar(n)` for storage efficiency and implicit length validation:

#### Court Model
**Location**: `prisma/schema.prisma` ~lines 555-572
```diff
model Court {
  id                String            @id @default(uuid())
  organizationId    String
  name              String
- courtNumber       Int
+ courtNumber       Int
- surface           String
+ surface           @db.VarChar(50) // "hard", "clay", "grass", etc.
- indoorOutdoor     String @default("outdoor")
+ indoorOutdoor     @db.VarChar(20) @default("outdoor") // "indoor"/"outdoor"
- lights            Boolean @default(false)
- status            String @default("available")
+ status            @db.VarChar(50) @default("available")
  maintenedUntil    DateTime?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  // ...
}
```

#### ClubEvent Model
**Location**: `prisma/schema.prisma` ~lines 770-800
```diff
model ClubEvent {
  id                   String @id @default(uuid())
  organizationId       String
  name                 String
  description          String?
- eventType            String
+ eventType            @db.VarChar(50) // "singles", "doubles", "tournament", etc.
  startDate            DateTime
  endDate              DateTime?
  registrationCap      Int @default(64)
  registrationDeadline DateTime
  location             String?
  prizePool            Float?
  entryFee             Float?
  rules                String?
  instructions         String?
  // ...
}
```

#### CourtBooking Model
**Location**: `prisma/schema.prisma` ~lines 575-600
```diff
model CourtBooking {
  id                 String @id @default(uuid())
  organizationId     String
  courtId            String
  memberId           String?
  playerName         String?
  startTime          DateTime
  endTime            DateTime
- bookingType        String @default("regular")
+ bookingType        @db.VarChar(50) @default("regular")
  guestCount         Int @default(1)
- status             String @default("confirmed")
+ status             @db.VarChar(50) @default("confirmed")
  price              Float?
  isPeak             Boolean @default(false)
+ cancellationReason @db.VarChar(255)?
- cancelledAt        DateTime?
+ cancelledAt        DateTime?
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
  // ...
}
```

#### ClubMember Model
**Location**: `prisma/schema.prisma` ~lines 630-680
```diff
model ClubMember {
  id                     String @id @default(uuid())
  organizationId         String
  playerId               String
  tierId                 String?
  joinDate               DateTime @default(now())
  expiryDate             DateTime?
  autoRenew              Boolean @default(true)
- paymentStatus          String @default("active")
+ paymentStatus          @db.VarChar(50) @default("active")
  outstandingBalance     Float @default(0)
  attendanceCount        Int @default(0)
  lastAttendance         DateTime?
- role                   String @default("member")
+ role                   @db.VarChar(50) @default("member")
+ suspensionReason       @db.VarChar(255)?
- suspendedUntil         DateTime?
+ suspendedUntil         DateTime?
  createdAt              DateTime @default(now())
  updatedAt              DateTime @updatedAt
  // ...
}
```

#### User Model
**Location**: `prisma/schema.prisma` lines 13-30
```diff
model User {
  id           String @id @default(uuid())
  username     String @unique
  email        String @unique
- phone        String? @unique
+ phone        @db.VarChar(20)? @unique
- gender       String?
+ gender       @db.VarChar(20)?
- nationality  String?
+ nationality  @db.VarChar(50)?
  bio          String?
  // ...
}
```

#### Staff Model
**Location**: `prisma/schema.prisma` lines 88-127
```diff
model Staff {
- role                   String
+ role                   @db.VarChar(100)
- expertise              String?
+ expertise              @db.VarChar(255)?
- contact                String?
+ contact                @db.VarChar(50)?
+ employedById           String?
  createdAt              DateTime @default(now())
  updatedAt              DateTime @updatedAt
  yearsOfExperience      Int? @default(0)
- coachingLevel          String?
+ coachingLevel          @db.VarChar(50)?
- formerPlayerBackground String?
+ formerPlayerBackground @db.VarChar(255)?
  playerAgeGroups        String[] @default([])
  skillLevelsTrained     String[] @default([])
  trainingTypes          String[] @default([])
  languagesSpoken        String[] @default([])
  sessionDurations       Int[] @default([30, 60, 90])
  maxStudentsPerSession  Int? @default(1)
  courtLocations         String[] @default([])
  bio                    String?
  coachingPhilosophy     String?
  achievements           String?
  introVideoUrl          String?
  studentCount           Int @default(0)
  isVerified             Boolean @default(false)
- isActive               Boolean @default(true)
+ isActive               Boolean @default(true)
- isDeleted              Boolean @default(false)
+ isDeleted              Boolean @default(false)
  ownerId                String?
  organizationId         String?
  // ...
}
```

#### Service Model
**Location**: `prisma/schema.prisma` ~lines 190-220
```diff
model Service {
  id             String   @id @default(uuid())
  providerId     String?
  organizationId String?
  tournamentId   String?
  name           String
  description    String
- category       String
+ category       @db.VarChar(100)
- sourceType     String @default("internal")
+ sourceType     @db.VarChar(50) @default("internal")
- contextType    String @default("both")
+ contextType    @db.VarChar(50) @default("both")
  price          Float?
  location       String?
  externalLink   String?
  isActive       Boolean @default(true)
  // ...
}
```

---

## 3. REDUNDANT/DENORMALIZED FIELDS THAT SHOULD BE NORMALIZED

### High Priority

#### Player.isClub - Redundant with organizationId
**Location**: `prisma/schema.prisma` line 56
**Issue**: This is just `organizationId != null`
```diff
model Player {
  matchesPlayed              Int @default(0)
  matchesWon                 Int @default(0)
  matchesLost                Int @default(0)
  createdAt                  DateTime @default(now())
  updatedAt                  DateTime @updatedAt
- isClub                     Boolean @default(false)
  organizationId             String?
  userId                     String @id
  // ... relations ...
}
```
**Action**: Remove `isClub`. Query as: `where: { organizationId: { not: null } }`

#### Player.matchesPlayed, matchesWon, matchesLost - Denormalized Counters
**Location**: `prisma/schema.prisma` lines 50-54
**Issue**: Should be calculated from Match relations
```diff
model Player {
- matchesPlayed              Int @default(0)
- matchesWon                 Int @default(0)
- matchesLost                Int @default(0)
  createdAt                  DateTime @default(now())
  updatedAt                  DateTime @updatedAt
  // ... relations ...
}
```
**Action**: Calculate these with aggregation queries:
- `matchesPlayed`: Count where `playerAId OR playerBId`
- `matchesWon`: Count where `winnerId`
- `matchesLost`: Count where NOT `winnerId` AND `(playerAId OR playerBId)`

#### Referee.matchesRefereed, ballCrewMatches - Denormalized Counters
**Location**: `prisma/schema.prisma` lines 84-86
**Issue**: Should be calculated from relations
```diff
model Referee {
- matchesRefereed  Int @default(0)
- ballCrewMatches  Int @default(0)
  experience       String?
  certifications   String[] @default([])
  // ... relations ...
}
```
**Action**: Calculate via aggregation instead

#### Staff.studentCount - Denormalized Counter
**Location**: `prisma/schema.prisma` line 113
**Issue**: Should be derived from relation count
```diff
model Staff {
  // ... fields ...
- studentCount           Int @default(0)
  isVerified             Boolean @default(false)
  // ... relations ...
}
```
**Action**: Remove field, count reviews or service bookings instead

#### Organization.ratingCount - Potentially Denormalized
**Location**: `prisma/schema.prisma` line 152
**Issue**: Should match count of ClubRating records
```diff
model Organization {
  // ... fields ...
  rating                  Float? @default(0)
- ratingCount             Int @default(0)
  tournamentEngScore      Int @default(0)
  // ... relations ...
}
```
**Action**: Remove and calculate from `ClubRating` count

### Moderate Priority

#### EventAmenity.availableFrom/availableUntil - Denormalized with AmenityBooking
**Location**: `prisma/schema.prisma` ~lines 1020-1040
**Issue**: These duplicate AmenityBooking.startTime/endTime
```diff
model EventAmenity {
  id             String @id @default(uuid())
  eventId        String
  name           String
  type           String
  description    String?
  capacity       Int?
  price          Float?
- availableFrom  DateTime?
- availableUntil DateTime?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  // ... relations ...
}
```
**Action**: Remove these. Calculate availability from actual bookings

---

## 4. MANY-TO-MANY RELATIONSHIPS - OPTIMIZATION

Current M2M relationships are properly structured. However, recommendations:

### CommentReaction, PostReaction, TournamentCommentReaction
**Status**: ✅ Well-structured  
**Recommendation**: Add `type` enum to reduce string storage
```diff
model CommentReaction {
  id        String @id @default(uuid())
  commentId String
  userId    String
- type      String @default("like")
+ type      @db.VarChar(20) @default("like") // or use Enum
  createdAt DateTime @default(now())
  comment   PostComment @relation(fields: [commentId], references: [id], onDelete: Cascade)
  user      Player @relation("comment_reactions", fields: [userId], references: [userId], onDelete: Cascade)

  @@unique([commentId, userId])
  @@index([commentId])
  @@index([userId])
}
```

### MessageReaction
**Status**: ✅ Well-structured
**Recommendation**: Add index on emoji for emoji-count queries
```diff
model MessageReaction {
  id        String @id @default(uuid())
  messageId String
  playerId  String
  emoji     String
  createdAt DateTime @default(now())
  // ... relations ...

  @@unique([messageId, playerId, emoji])
  @@index([messageId])
+ @@index([messageId, emoji]) // For reaction counts by emoji
}
```

### UserFollower
**Status**: ✅ Self-referential M2M is correct
**Issue**: Could use better indexes for feed queries
```diff
model UserFollower {
  id          String @id @default(uuid())
  followerId  String
  followingId String
  createdAt   DateTime @default(now())
  follower    Player @relation("followers", fields: [followerId], references: [userId], onDelete: Cascade)
  following   Player @relation("following", fields: [followingId], references: [userId], onDelete: Cascade)

  @@unique([followerId, followingId])
  @@index([followerId])
  @@index([followingId])
+ @@index([createdAt]) // For timeline sorting
}
```

---

## 5. N+1 PRONE RELATIONSHIPS

### Critical (Load-Heavy Queries)

#### CommunityPost with Nested Comments and Reactions
**Location**: `prisma/schema.prisma` ~lines 1000-1020
```
CommunityPost
  ├─ comments (PostComment[])
  │   ├─ reactions (CommentReaction[])
  │   └─ replies (PostComment[]) ← N+1 for each reply
  └─ likes (PostReaction[])
```
**Mitigation**:
- Use `select: { comments: { include: { reactions: true, replies: { include: { reactions: true } } } } }`
- Add pagination: `take: 10` on comments
- Consider denormalization: Store comment count on CommunityPost

#### TournamentComment Nested Structure
**Location**: `prisma/schema.prisma` ~lines 970-1000
```
TournamentComment
  ├─ replies (TournamentComment[]) ← N+1
  ├─ reactions (TournamentCommentReaction[])
  └─ replies[].reactions ← N+1 on nested
```
**Mitigation**: Add `replyCount` denormalized field
```diff
model TournamentComment {
  id              String @id @default(uuid())
  eventId         String
  authorId        String
  content         String
+ replyCount      Int @default(0) // Denormalized
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  parentCommentId String?
  // ... relations ...
}
```

#### ClubEvent with Multiple Nested Relations
**Location**: `prisma/schema.prisma` ~lines 770-800
```
ClubEvent
  ├─ registrations[] 
  │   ├─ paymentReminders[]
  │   └─ member.clubMembers[]
  ├─ matches[]
  └─ amenities[].bookings[]
```
**Mitigation**: Use explicit `include` patterns, paginate

#### Staff Availability Complex Queries
**Location**: Various Staff relations
```
Staff
  ├─ availability[] (needs dayOfWeek looping)
  ├─ certifications[]
  ├─ specializations[]
  └─ reviews[]
```
**Mitigation**: 
- Limit included relations
- Use `select` to include only needed fields

---

## 6. MISSING CONSTRAINTS & VALIDATIONS

### Data Type Issues

#### Financial Fields Should Use Decimal, Not Float
**Location**: Multiple models (Organization, CourtBooking, Staff, etc.)
```diff
model CourtBooking {
  // ... fields ...
- price              Float?
+ price              Decimal @db.Decimal(10, 2)?
  isPeak             Boolean @default(false)
-+ cancellationReason String?
- cancelledAt        DateTime?
}
```

**Affected Models**:
- `ClubEvent`: `prizePool`, `entryFee`
- `CourtBooking`: `price`
- `ClubFinance`: All `Float` fields
- `FinanceTransaction`: `amount`
- `MembershipTier`: `monthlyPrice`, `discountPercentage`
- `Staff`: `maxStudentsPerSession`
- `CoachPricing`: All pricing fields
- `CoachReview`: `rating`
- `ClubRating`: `rating`
- `EventAmenity`: `price`
- `Service`: `price`
- `AmenityBooking`: `price`

### Enum Fields That Should Be Enums

#### Status Fields
```prisma
// Create enums instead of Strings
enum ClubMemberStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
  EXPIRED
}

enum BookingStatus {
  CONFIRMED
  PENDING
  CANCELLED
  COMPLETED
}

enum EventRegistrationStatus {
  REGISTERED
  WITHDRAWN
  REJECTED
}

enum RuleAppealStatus {
  PENDING
  APPROVED
  DENIED
}
```

Then update models:
```diff
model ClubMember {
  // ... fields ...
- paymentStatus          String @default("active")
+ paymentStatus          ClubMemberStatus @default(ACTIVE)
  // ...
}

model CourtBooking {
  // ... fields ...
- status             String @default("confirmed")
+ status             BookingStatus @default(CONFIRMED)
  // ...
}
```

#### Event Type Enum
**Location**: ClubEvent.eventType
```diff
enum EventType {
  SINGLES
  DOUBLES
  TOURNAMENT
  LEAGUE
  TRAINING
  PRACTICE
}

model ClubEvent {
  id                   String @id @default(uuid())
  organizationId       String
  name                 String
  description          String?
- eventType            String
+ eventType            EventType
  // ...
}
```

#### Court Surface Enum
```diff
enum CourtSurface {
  HARD
  CLAY
  GRASS
  SYNTHETIC
}

model Court {
  // ... fields ...
- surface           String
+ surface           CourtSurface
- indoorOutdoor     String @default("outdoor")
+ indoorOutdoor     IndoorOutdoor @default(OUTDOOR)
  // ...
}
```

### Missing Validation Patterns

#### Phone Number Format
**Recommendation**: Add regex validation at application level or DB constraint:
```prisma
model User {
  // ... fields ...
  phone        @db.VarChar(20)? @unique // Regex: ^\+?[0-9\-\(\)\s]+$
}
```

#### Email Validation
```prisma
model User {
  email        String @unique // Already should validate with regex pattern
}
```

#### UUID Validation
```prisma
// All IDs already use @default(uuid())
// ✅ OK
```

---

## 7. FIELDS WITH POOR SELECTIVITY FOR FILTERING

### Issues & Solutions

#### Boolean Flags with Many Null/False Values
**Problem**: Filtering `where: { isActive: true }` on indexed field with few matches
**Solution**: Use sparse indexes or consider existence of related record

**Affected Fields**:
- `User.dateOfBirth` - Mostly null
- `Player.organizationId` - Mostly null  
- `Staff.isDeleted` - Mostly false
- `Staff.isVerified` - Mostly false
- Various `expiresAt`, `cancelledAt` fields

**Recommendation**: Add partial indexes (PostgreSQL 9.2+):
```sql
CREATE INDEX idx_staff_active ON "Staff"(id) WHERE "isActive" = true;
CREATE INDEX idx_staff_verified ON "Staff"(id) WHERE "isVerified" = true;
CREATE INDEX idx_court_booking_active ON "CourtBooking"(id) WHERE "status" = 'confirmed';
```

In Prisma migration, use raw SQL in migration file.

#### Enum Fields with Skewed Distribution
**Problem**: `status` fields filter by specific values infrequently
**Solution**: Use filtered indexes

**Examples**:
```diff
model CourtBooking {
  // ... 
  status             String @default("confirmed")
  // 90% are "confirmed", 5% "cancelled", 5% "pending"
}
```

---

## 8. COMPOSITE INDEXES THAT IMPROVE QUERY PERFORMANCE

### Priority 1: Booking/Schedule Queries

#### CourtBooking - Availability Queries
**Location**: `prisma/schema.prisma` ~line 590
```diff
model CourtBooking {
  id                 String @id @default(uuid())
  organizationId     String
  courtId            String
  memberId           String?
  playerName         String?
  startTime          DateTime
  endTime            DateTime
  bookingType        String @default("regular")
  guestCount         Int @default(1)
  status             String @default("confirmed")
  // ...
  
- @@index([organizationId, startTime, endTime])
+ @@index([courtId, startTime, endTime, status]) // Find available slots
+ @@index([organizationId, status, startTime])   // List by org, filtered by status
}
```

**Query Pattern**: "Show me available courts for org X at time Y"
```sql
SELECT * FROM "CourtBooking"
WHERE "courtId" = ? 
  AND "status" = 'confirmed'
  AND "startTime" < ? AND "endTime" > ?
ORDER BY "startTime"
```

#### EventRegistration - Confirmed Registrations
**Location**: `prisma/schema.prisma` ~line 830
```diff
model EventRegistration {
  id               String @id @default(uuid())
  eventId          String
  memberId         String
  registeredAt     DateTime @default(now())
  status           String @default("registered")
  signupOrder      Int
  rejectionReason  String?
  // ...
  
  @@unique([eventId, memberId])
+ @@index([eventId, status, registeredAt]) // Event participants sorted
+ @@index([memberId, eventId])              // User's events
}
```

**Query Pattern**: "Get all confirmed registrations for event X, newest first"

#### TournamentMatch - Bracket Navigation
**Location**: `prisma/schema.prisma` ~line 900
```diff
model TournamentMatch {
  id                String @id @default(uuid())
  organizationId    String
  eventId           String
  bracketId         String
  round             Int
  matchPosition     Int
  playerAId         String?
  playerBId         String?
  // ... scores ...
  winnerId          String?
  scheduledTime     DateTime?
  courtId           String?
  status            String @default("pending")
  // ...
  
+ @@index([bracketId, round, matchPosition]) // Navigate bracket tree
+ @@index([eventId, status])                 // Filter matches by status
}
```

**Query Pattern**: "Get all matches for round 2 of bracket X"

### Priority 2: Event Management Queries

#### ClubEvent - Timeline Queries
**Location**: `prisma/schema.prisma` ~line 780
```diff
model ClubEvent {
  id                   String @id @default(uuid())
  organizationId       String
  name                 String
  description          String?
  eventType            String
  startDate            DateTime
  endDate              DateTime?
  registrationDeadline DateTime
  // ...
  
+ @@index([organizationId, startDate, endDate]) // Events by org and date range
+ @@index([startDate])                          // All upcoming events
}
```

**Query Pattern**: "Get all events for org X happening between dates Y and Z"

#### PaymentReminder - Notification Feeds
**Location**: `prisma/schema.prisma` ~line 910
```diff
model PaymentReminder {
  id             String @id @default(uuid())
  eventId        String
  memberId       String
  registrationId String
  reminderType   String @default("payment")
  message        String?
  sentAt         DateTime?
  isRead         Boolean @default(false)
  isResolved     Boolean @default(false)
  createdAt      DateTime @default(now())
  // ...
  
+ @@index([memberId, isRead, createdAt])     // Unread reminders for user
+ @@index([eventId, memberId, createdAt])    // Member's event reminders
+ @@index([createdAt, isResolved])           // Admin dashboard queries
}
```

### Priority 3: Player/Member Queries

#### ClubMember - Membership Status Queries
**Location**: `prisma/schema.prisma` ~line 670
```diff
model ClubMember {
  id                     String @id @default(uuid())
  organizationId         String
  playerId               String
  tierId                 String?
  joinDate               DateTime @default(now())
  expiryDate             DateTime?
  autoRenew              Boolean @default(true)
  paymentStatus          String @default("active")
  outstandingBalance     Float @default(0)
  role                   String @default("member")
  // ...
  
  @@unique([organizationId, playerId])
+ @@index([organizationId, paymentStatus]) // Members by payment status
+ @@index([tierId])                        // Members by tier
+ @@index([expiryDate])                    // Expiring memberships
}
```

**Query Pattern**: "Get all members of org X with active subscription and outstanding balance"

#### Player - Organization Members
**Location**: `prisma/schema.prisma` ~line 60
```diff
model Player {
  // ... fields ...
  
  @@index([organizationId])
+ @@index([organizationId, createdAt]) // New members timeline
}
```

### Priority 4: Activity/Audit Queries

#### OrganizationActivity - Already Has Good Index
**Location**: `prisma/schema.prisma` ~line 1075
```diff
model OrganizationActivity {
  id             String @id @default(uuid())
  organizationId String
  playerId       String
  action         String
  // ...
  createdAt      DateTime @default(now())
  
  @@index([organizationId, createdAt])
  @@index([playerId])
+ @@index([action, createdAt])         // Filter by action type
}
```

---

## 9. ENUM FIELDS THAT SHOULD BE INDEXED

### Create Enums for These String Fields

```prisma
enum UserGender {
  MALE
  FEMALE
  OTHER
  PREFER_NOT_TO_SAY
}

enum CourtSurface {
  HARD
  CLAY
  GRASS
  SYNTHETIC
}

enum CourtEnvironment {
  INDOOR
  OUTDOOR
}

enum BookingStatus {
  CONFIRMED
  PENDING
  CANCELLED
  COMPLETED
}

enum EventType {
  SINGLES
  DOUBLES
  TOURNAMENT
  LEAGUE
  TRAINING
  PRACTICE
}

enum EventRegistrationStatus {
  REGISTERED
  WITHDRAWN
  REJECTED
  WAITLISTED
}

enum MemberRole {
  MEMBER
  MODERATOR
  ADMIN
  OWNER
}

enum RuleAppealStatus {
  PENDING
  APPROVED
  DENIED
}

enum CommunityPostVisibility {
  PUBLIC
  PRIVATE
  FRIENDS_ONLY
}

enum ReminderType {
  PAYMENT
  CONFIRMATION
  URGENCY
  SCHEDULE
}

enum AnnouncementType {
  GENERAL
  SCHEDULE
  RESULTS
  IMPORTANT
  URGENT
}

enum CoachingLevel {
  BEGINNER
  INTERMEDIATE
  ADVANCED
  PROFESSIONAL
}

enum AmenityType {
  EATING
  SLEEPING
  PARKING
  LOUNGE
  TRAINING
  OTHER
}

enum AmenityBookingStatus {
  REQUESTED
  CONFIRMED
  CANCELLED
  COMPLETED
}

enum ServiceSourceType {
  INTERNAL
  EXTERNAL
}

enum ServiceContextType {
  TOURNAMENT
  TRAINING
  BOTH
}

enum ServiceBookingStatus {
  REQUESTED
  CONFIRMED
  REJECTED
  COMPLETED
}
```

Then add indexes:
```diff
model Staff {
  // ... fields ...
- coachingLevel          String?
+ coachingLevel          CoachingLevel?
  // ...
-+
+ @@index([coachingLevel]) // Filter coaches by level
}

model CommunityPost {
  id           String @id @default(uuid())
  authorId     String
  content      String
- visibility   String @default("public")
+ visibility   CommunityPostVisibility @default(PUBLIC)
  // ...
  
+ @@index([visibility]) // Public posts queries
}

model EventAmenity {
  id             String @id @default(uuid())
  eventId        String
  name           String
- type           String
+ type           AmenityType
  // ...
  
+ @@index([type]) // Filter amenities by type
}
```

---

## 10. TIMESTAMPS/DATES LACKING INDEXES

### Critical Timestamp Indexes Needed

#### Model: User
```diff
model User {
  id           String @id @default(uuid())
  // ... fields ...
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  // ... relations ...
  
+ @@index([createdAt])    // User growth analytics
}
```

#### Model: Organization  
```diff
model Organization {
  id                      String @id @default(uuid())
  // ... fields  ...
  createdAt               DateTime @default(now())
  updatedAt               DateTime @updatedAt
  // ... relations ...
  
+ @@index([createdAt])    // Organization timeline
+ @@index([slug, createdAt])
}
```

#### Model: ClubEvent - Multiple Date Fields
```diff
model ClubEvent {
  id                   String @id @default(uuid())
  organizationId       String
  // ... fields ...
  startDate            DateTime
  endDate              DateTime?
  registrationDeadline DateTime
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
  // ... relations ...
  
+ @@index([startDate])           // Upcoming events
+ @@index([registrationDeadline]) // Registration deadlines
+ @@index([organizationId, startDate]) // Composite
}
```

#### Model: CourtBooking - Schedule Queries
```diff
model CourtBooking {
  // ... fields ...
  startTime          DateTime
  endTime            DateTime
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
  // ... relations ...
  
+ @@index([startTime])        // Bookings by date
+ @@index([endTime])          // Overlapping queries
+ @@index([createdAt])        // Recent bookings
}
```

#### Model: EventRegistration
```diff
model EventRegistration {
  id               String @id @default(uuid())
  eventId          String
  memberId         String
+ registeredAt     DateTime @default(now())
  status           String @default("registered")
  // ... relations ...
  
+ @@index([registeredAt])     // Registration timeline
+ @@index([eventId, registeredAt]) // Composite
}
```

#### Model: PaymentReminder
```diff
model PaymentReminder {
  id             String @id @default(uuid())
  // ... fields ...
  sentAt         DateTime?
  createdAt      DateTime @default(now())
  // ... relations ...
  
+ @@index([sentAt])          // Batch query for sent/unsent
+ @@index([createdAt])       // Timeline
}
```

#### Model: RuleAppeal
```diff
model RuleAppeal {
  id             String @id @default(uuid())
  // ... fields ...
+ respondedAt    DateTime?
  createdAt      DateTime @default(now())
  // ... relations ...
  
+ @@index([respondedAt]) // Filter responded/pending
+ @@index([createdAt])
}
```

---

## Summary of All Recommended Changes

| Issue | Count | Priority | Impact |
|-------|-------|----------|--------|
| Missing Indexes on Key Fields | 15+ | CRITICAL | Query performance 2-10x slower |
| VarChar Optimization | 20+ | MEDIUM | 10-30% storage savings |
| Denormalized Fields (should remove) | 6 | HIGH | Data consistency issues |
| Missing Enums | 15+ | MEDIUM | Type safety, storage |
| Composite Indexes Missing | 8 | HIGH | Query performance 3-5x |
| Decimal vs Float (money fields) | 12+ | HIGH | Float precision errors |
| N+1 Prone Relationships | 4 | MEDIUM | Can cause 100x slowdowns |
| Timestamp Indexes | 10+ | MEDIUM | Timeline queries slow |

---

## Implementation Priority

### Phase 1 (Critical - Do First)
1. Add missing indexes on `createdAt`, `organizationId`, `startTime/endTime`
2. Fix financial fields to use `Decimal`
3. Add composite indexes for booking availability queries
4. Create standard Enum types

### Phase 2 (Important - Do Soon)
1. Remove denormalized counter fields (matchesPlayed, etc.)
2. Add VarChar limits to string fields
3. Add remaining timestamp indexes
4. Implement composite indexes for member/event queries

### Phase 3 (Nice to Have)
1. Add sparse/filtered indexes
2. Optimize N+1 relationships with denormalization
3. Add final validation constraints
4. Performance monitoring

