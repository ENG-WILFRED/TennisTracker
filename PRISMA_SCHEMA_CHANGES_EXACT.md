# Prisma Schema - Exact Implementation Changes

## Quick Reference: All Changes Needed

### PART 1: ADD CRITICAL INDEXES

#### Change 1: User Model - Add createdAt Index
**File**: `prisma/schema.prisma`  
**Current** (lines 13-30):
```prisma
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
  player       Player?
  referee      Referee?
  spectator    Spectator?
  staff        Staff?
}
```

**Change To**:
```prisma
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
  player       Player?
  referee      Referee?
  spectator    Spectator?
  staff        Staff?

  @@index([createdAt])
}
```

#### Change 2: Organization Model - Add Indexes
**File**: `prisma/schema.prisma`  
**Current** (lines 128-160):
```prisma
model Organization {
  id                      String                   @id @default(uuid())
  name                    String                   @unique
  slug                    String?                  @unique
  description             String?
  address                 String?
  city                    String?
  country                 String?
  phone                   String?
  email                   String?
  logo                    String?
  primaryColor            String?
  createdBy               String?
  createdAt               DateTime                 @default(now())
  updatedAt               DateTime                 @updatedAt
  // ... relations ...
}
```

**Change To** (add at end of model, before closing `}`):
```prisma
  @@index([createdAt])
  @@index([slug])
```

#### Change 3: Staff Model - Add Missing Indexes
**File**: `prisma/schema.prisma`  
**Current** (lines 88-127): Find end of Staff model

**Add Before Closing Brace**:
```prisma
  @@index([organizationId])
  @@index([employedById])
  @@index([isActive])
  @@index([createdAt])
```

#### Change 4: Player Model - Add createdAt Index
**File**: `prisma/schema.prisma`  
**Current** (line 80 - end of Player model):
```prisma
  @@index([organizationId])
}
```

**Change To**:
```prisma
  @@index([organizationId])
  @@index([createdAt])
}
```

#### Change 5: CourtBooking Model - Add Critical Indexes
**File**: `prisma/schema.prisma`  
**Location**: Find `model CourtBooking` (~line 575)  
**Add At End** (before closing `}`):
```prisma
  @@index([organizationId, startTime, endTime])
  @@index([status])
  @@index([courtId, startTime])
  @@index([createdAt])
```

#### Change 6: ClubMember Model - Add Multiple Indexes
**File**: `prisma/schema.prisma`  
**Location**: Find `model ClubMember` (~line 630)  
**Current** (line 680):
```prisma
  @@unique([organizationId, playerId])
}
```

**Change To**:
```prisma
  @@unique([organizationId, playerId])
  @@index([organizationId])
  @@index([playerId])
  @@index([createdAt])
  @@index([paymentStatus])
  @@index([organizationId, paymentStatus])
}
```

#### Change 7: ClubEvent Model - Add Date/Organization Indexes
**File**: `prisma/schema.prisma`  
**Location**: Find `model ClubEvent` (~line 770)  
**Add At End**:
```prisma
  @@index([organizationId, startDate])
  @@index([eventType])
  @@index([startDate, endDate])
}
```

#### Change 8: EventRegistration Model - Add Status & Date Index
**File**: `prisma/schema.prisma`  
**Location**: Find `model EventRegistration` (~line 820)  
**Current** (line 840):
```prisma
  @@unique([eventId, memberId])
}
```

**Change To**:
```prisma
  @@unique([eventId, memberId])
  @@index([registeredAt])
  @@index([status])
  @@index([eventId, status])
}
```

#### Change 9: PaymentReminder Model - Add Intelligent Indexes
**File**: `prisma/schema.prisma`  
**Location**: Find `model PaymentReminder` (~line 900)  
**Add At End**:
```prisma
  @@index([createdAt])
  @@index([memberId, isRead, createdAt])
  @@index([eventId, memberId, createdAt])
}
```

#### Change 10: RuleAppeal Model - Add Remaining Indexes
**File**: `prisma/schema.prisma`  
**Location**: Find `model RuleAppeal` (~line 1110)  
**Current** (line 1135-1142):
```prisma
  @@index([eventId])
  @@index([organizationId])
  @@index([userId])
  @@index([status])
}
```

**Change To**:
```prisma
  @@index([eventId])
  @@index([organizationId])
  @@index([userId])
  @@index([status])
  @@index([createdAt])
  @@index([organizationId, createdAt])
}
```

#### Change 11: OrganizationActivity Model - Add Better Indexes
**File**: `prisma/schema.prisma`  
**Location**: Find `model OrganizationActivity` (~line 1070)  
**Current**:
```prisma
  @@index([organizationId, createdAt])
  @@index([playerId])
}
```

**Change To**:
```prisma
  @@index([organizationId, createdAt])
  @@index([playerId])
  @@index([playerId, createdAt])
  @@index([action, createdAt])
}
```

#### Change 12: CommentReaction Model - Add Emoji Index
**File**: `prisma/schema.prisma`  
**Location**: Find `model CommentReaction` (~line 930)  
**Current**:
```prisma
  @@unique([commentId, userId])
  @@index([commentId])
  @@index([userId])
}
```

**Change To**:
```prisma
  @@unique([commentId, userId])
  @@index([commentId])
  @@index([userId])
  @@index([commentId, type])
}
```

#### Change 13: MessageReaction Model - Add Emoji Index
**File**: `prisma/schema.prisma`  
**Location**: Find `model MessageReaction` (~line 885)  
**Current**:
```prisma
  @@unique([messageId, playerId, emoji])
  @@index([messageId])
}
```

**Change To**:
```prisma
  @@unique([messageId, playerId, emoji])
  @@index([messageId])
  @@index([messageId, emoji])
}
```

#### Change 14: UserFollower Model - Add Timeline Index
**File**: `prisma/schema.prisma`  
**Location**: Find `model UserFollower` (~lines 1000-1010)  
**Current**:
```prisma
  @@unique([followerId, followingId])
  @@index([followerId])
  @@index([followingId])
}
```

**Change To**:
```prisma
  @@unique([followerId, followingId])
  @@index([followerId])
  @@index([followingId])
  @@index([createdAt])
}
```

#### Change 15: TournamentMatch Model - Add Bracket Indexes
**File**: `prisma/schema.prisma`  
**Location**: Find `model TournamentMatch` (~line 900)  
**Add At End**:
```prisma
  @@index([bracketId, round, matchPosition])
  @@index([eventId, status])
}
```

---

### PART 2: CONVERT STRING FIELDS TO @db.VarChar

#### Change 16: User Model - VarChar for Personal Data
**File**: `prisma/schema.prisma` (lines 13-30)

**Current**:
```prisma
  phone        String?    @unique
  // ...
  gender       String?
  // ...
  nationality  String?
```

**Change To**:
```prisma
  phone        @db.VarChar(20)?    @unique
  // ...
  gender       @db.VarChar(20)?
  // ...
  nationality  @db.VarChar(50)?
```

#### Change 17: Court Model - VarChar for Type Fields
**File**: `prisma/schema.prisma` (Find `model Court`)

**Current**:
```prisma
  surface           String
  indoorOutdoor     String            @default("outdoor")
  // ...
  status            String            @default("available")
```

**Change To**:
```prisma
  surface           @db.VarChar(50)
  indoorOutdoor     @db.VarChar(20) @default("outdoor")
  // ...
  status            @db.VarChar(50) @default("available")
```

#### Change 18: CourtBooking Model - VarChar for Status/Type
**File**: `prisma/schema.prisma` (Find `model CourtBooking`)

**Current**:
```prisma
  bookingType        String       @default("regular")
  // ...
  status             String       @default("confirmed")
  // ...
  cancellationReason String?
```

**Change To**:
```prisma
  bookingType        @db.VarChar(50) @default("regular")
  // ...
  status             @db.VarChar(50) @default("confirmed")
  // ...
  cancellationReason @db.VarChar(255)?
```

#### Change 19: ClubMember Model - VarChar for Status/Role
**File**: `prisma/schema.prisma` (Find `model ClubMember`)

**Current**:
```prisma
  paymentStatus          String               @default("active")
  // ...
  role                   String               @default("member")
  suspensionReason       String?
```

**Change To**:
```prisma
  paymentStatus          @db.VarChar(50) @default("active")
  // ...
  role                   @db.VarChar(50) @default("member")
  suspensionReason       @db.VarChar(255)?
```

#### Change 20: ClubEvent Model - VarChar for Type
**File**: `prisma/schema.prisma` (Find `model ClubEvent`)

**Current**:
```prisma
  eventType            String
```

**Change To**:
```prisma
  eventType            @db.VarChar(50)
```

#### Change 21: Staff Model - VarChar for Multiple Fields
**File**: `prisma/schema.prisma` (Find `model Staff`)

**Current**:
```prisma
  role                   String
  expertise              String?
  contact                String?
  // ...
  coachingLevel          String?
  formerPlayerBackground String?
```

**Change To**:
```prisma
  role                   @db.VarChar(100)
  expertise              @db.VarChar(255)?
  contact                @db.VarChar(50)?
  // ...
  coachingLevel          @db.VarChar(50)?
  formerPlayerBackground @db.VarChar(255)?
```

#### Change 22: Service Model - VarChar for Category/Type
**File**: `prisma/schema.prisma` (Find `model Service`)

**Current**:
```prisma
  category       String
  sourceType     String   @default("internal")
  contextType    String   @default("both")
```

**Change To**:
```prisma
  category       @db.VarChar(100)
  sourceType     @db.VarChar(50) @default("internal")
  contextType    @db.VarChar(50) @default("both")
```

---

### PART 3: CONVERT Float TO Decimal FOR FINANCIAL FIELDS

#### Change 23: CourtBooking Model
**File**: `prisma/schema.prisma` (Find `model CourtBooking`)

**Current**:
```prisma
  price              Float?
```

**Change To**:
```prisma
  price              Decimal @db.Decimal(10, 2)?
```

#### Change 24: ClubEvent Model
**File**: `prisma/schema.prisma` (Find `model ClubEvent`)

**Current**:
```prisma
  prizePool            Float?
  entryFee             Float?
```

**Change To**:
```prisma
  prizePool            Decimal @db.Decimal(12, 2)?
  entryFee             Decimal @db.Decimal(10, 2)?
```

#### Change 25: ClubFinance Model
**File**: `prisma/schema.prisma` (Find `model ClubFinance`)

**Current**:
```prisma
  membershipRevenue   Float                @default(0)
  courtBookingRevenue Float                @default(0)
  coachCommissions    Float                @default(0)
  eventRevenue        Float                @default(0)
  totalRevenue        Float                @default(0)
  totalExpenses       Float                @default(0)
  netProfit           Float                @default(0)
```

**Change To**:
```prisma
  membershipRevenue   Decimal @db.Decimal(12, 2) @default("0")
  courtBookingRevenue Decimal @db.Decimal(12, 2) @default("0")
  coachCommissions    Decimal @db.Decimal(12, 2) @default("0")
  eventRevenue        Decimal @db.Decimal(12, 2) @default("0")
  totalRevenue        Decimal @db.Decimal(12, 2) @default("0")
  totalExpenses       Decimal @db.Decimal(12, 2) @default("0")
  netProfit           Decimal @db.Decimal(12, 2) @default("0")
```

#### Change 26: FinanceTransaction Model
**File**: `prisma/schema.prisma` (Find `model FinanceTransaction`)

**Current**:
```prisma
  amount          Float
```

**Change To**:
```prisma
  amount          Decimal @db.Decimal(12, 2)
```

#### Change 27: MembershipTier Model
**File**: `prisma/schema.prisma` (Find `model MembershipTier`)

**Current**:
```prisma
  monthlyPrice          Float
  discountPercentage    Float?       @default(0)
```

**Change To**:
```prisma
  monthlyPrice          Decimal @db.Decimal(10, 2)
  discountPercentage    Decimal @db.Decimal(5, 2)? @default("0")
```

#### Change 28: CoachPricing Model
**File**: `prisma/schema.prisma` (Find `model CoachPricing`)

**Current**:
```prisma
  pricePerSession      Float
  package3Sessions     Float?
  package10Sessions    Float?
  juniorDiscount       Float?   @default(0)
  groupSessionDiscount Float?   @default(0)
  commissionRate       Float?   @default(0)
```

**Change To**:
```prisma
  pricePerSession      Decimal @db.Decimal(10, 2)
  package3Sessions     Decimal @db.Decimal(10, 2)?
  package10Sessions    Decimal @db.Decimal(10, 2)?
  juniorDiscount       Decimal @db.Decimal(5, 2)? @default("0")
  groupSessionDiscount Decimal @db.Decimal(5, 2)? @default("0")
  commissionRate       Decimal @db.Decimal(5, 2)? @default("0")
```

#### Change 29: CoachReview Model
**File**: `prisma/schema.prisma` (Find `model CoachReview`)

**Current**:
```prisma
  rating     Float
```

**Change To**:
```prisma
  rating     Decimal @db.Decimal(3, 2)
```

#### Change 30: OrganizationModel - Rating Field
**File**: `prisma/schema.prisma` (Find `model Organization`)

**Current**:
```prisma
  rating                  Float?                   @default(0)
```

**Change To**:
```prisma
  rating                  Decimal @db.Decimal(3, 2)? @default("0")
```

#### Change 31: ClubRating Model
**File**: `prisma/schema.prisma` (Find `model ClubRating`)

**Current**:
```prisma
  rating         Float
```

**Change To**:
```prisma
  rating         Decimal @db.Decimal(3, 2)
```

#### Change 32: EventAmenity & AmenityBooking Models
**File**: `prisma/schema.prisma` (Find both models)

**Current** in EventAmenity:
```prisma
  price          Float?
```

**Change To**:
```prisma
  price          Decimal @db.Decimal(10, 2)?
```

**Current** in AmenityBooking:
```prisma
  price     Float?
```

**Change To**:
```prisma
  price     Decimal @db.Decimal(10, 2)?
```

#### Change 33: Service Model
**File**: `prisma/schema.prisma` (Find `model Service`)

**Current**:
```prisma
  price          Float?
```

**Change To**:
```prisma
  price          Decimal @db.Decimal(10, 2)?
```

#### Change 34: ClubMember Model - Outstanding Balance
**File**: `prisma/schema.prisma` (Find `model ClubMember`)

**Current**:
```prisma
  outstandingBalance     Float @default(0)
```

**Change To**:
```prisma
  outstandingBalance     Decimal @db.Decimal(10, 2) @default("0")
```

---

### PART 4: REMOVE DENORMALIZED FIELDS (TO NORMALIZE DATA)

#### Change 35: Player Model - Remove isClub Field
**File**: `prisma/schema.prisma` (Find `model Player`)

**Current** (line ~56):
```prisma
model Player {
  matchesPlayed              Int                         @default(0)
  matchesWon                 Int                         @default(0)
  matchesLost                Int                         @default(0)
  createdAt                  DateTime                    @default(now())
  updatedAt                  DateTime                    @updatedAt
  isClub                     Boolean                     @default(false)
  organizationId             String?
```

**Change To** (remove isClub line):
```prisma
model Player {
  matchesPlayed              Int                         @default(0)
  matchesWon                 Int                         @default(0)
  matchesLost                Int                         @default(0)
  createdAt                  DateTime                    @default(now())
  updatedAt                  DateTime                    @updatedAt
  organizationId             String?
```

**Why**: `isClub` is redundant with `organizationId != null`. Calculate as: `where: { organizationId: { not: null } }`

---

#### Change 36: Player Model - Remove Match Counters (OPTIONAL - More Complex)
**Note**: This requires migrating logic to aggregations. Only do if performance testing shows it's worth it.

**Current**:
```prisma
  matchesPlayed              Int                         @default(0)
  matchesWon                 Int                         @default(0)
  matchesLost                Int                         @default(0)
```

**Change To** (if migrating - remove these fields and compute dynamically):
```prisma
// Remove these three fields
// INSTEAD, use @select or aggregation queries:
// matchesPlayed: await prisma.match.count({ where: { OR: [{ playerAId: id }, { playerBId: id }] } })
// matchesWon: await prisma.match.count({ where: { winnerId: id } })
// matchesLost: await prisma.match.count({ where: { AND: [{ OR: [{ playerAId: id }, { playerBId: id }] }, { winnerId: { not: id } }] } })
```

---

#### Change 37: Referee Model - Remove Match Counters (OPTIONAL)
**File**: `prisma/schema.prisma` (Find `model Referee`)

**Current** (lines ~84-86):
```prisma
model Referee {
  matchesRefereed  Int             @default(0)
  ballCrewMatches  Int             @default(0)
  experience       String?
```

**Change To** (OPTIONAL migration):
```prisma
model Referee {
  // OPTIONALLY remove:
  // matchesRefereed  Int             @default(0)
  // ballCrewMatches  Int             @default(0)
  experience       String?
  // Calculate from: prisma.match.count({ where: { refereeId: id } })
  // Calculate from: prisma.matchBallCrew.count({ where: { refereeId: id } })
```

---

#### Change 38: Staff Model - Remove studentCount (OPTIONAL)
**File**: `prisma/schema.prisma` (Find `model Staff`)

**Current** (line ~113):
```prisma
  studentCount           Int              @default(0)
```

**Change To** (OPTIONAL - remove if migrating to computed):
```prisma
// Remove studentCount
// Calculate instead: prisma.coachReview.count({ where: { staffId: id } })
// OR: distinct playerId from serviceBookings where providerId = coach's provider profile
```

---

#### Change 39: Organization Model - Remove ratingCount (OPTIONAL)
**File**: `prisma/schema.prisma` (Find `model Organization`)

**Current**:
```prisma
  rating                  Float?                   @default(0)
  ratingCount             Int                      @default(0)
```

**Change To** (OPTIONAL - remove):
```prisma
  rating                  Decimal @db.Decimal(3, 2)? @default("0")
  // Remove ratingCount - recalculate: prisma.clubRating.count({ where: { organizationId: id } })
```

---

#### Change 40: EventAmenity Model - Remove Duplicate Date Fields
**File**: `prisma/schema.prisma` (Find `model EventAmenity`)

**Current**:
```prisma
model EventAmenity {
  id             String           @id @default(uuid())
  eventId        String
  name           String
  type           String
  description    String?
  capacity       Int?
  price          Float?
  availableFrom  DateTime?
  availableUntil DateTime?
  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt
  event          ClubEvent        @relation(fields: [eventId], references: [id], onDelete: Cascade)
  bookings       AmenityBooking[]

  @@index([eventId])
}
```

**Change To** (OPTIONAL - remove date fields):
```prisma
model EventAmenity {
  id             String           @id @default(uuid())
  eventId        String
  name           String
  type           String
  description    String?
  capacity       Int?
  price          Decimal @db.Decimal(10, 2)?
  // REMOVE: availableFrom  DateTime?
  // REMOVE: availableUntil DateTime?
  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt
  event          ClubEvent        @relation(fields: [eventId], references: [id], onDelete: Cascade)
  bookings       AmenityBooking[]

  @@index([eventId])
}
```

**Why**: Keep startTime/endTime in AmenityBooking, calculate availability from actual bookings.

---

### PART 5: ADD DENORMALIZED FIELDS (FOR PERFORMANCE)

#### Change 41: PostComment Model - Add replyCount
**File**: `prisma/schema.prisma` (Find `model PostComment`)

**Current**:
```prisma
model PostComment {
  id              String            @id @default(uuid())
  postId          String
  authorId        String
  content         String
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  parentCommentId String?
  reactions       CommentReaction[]
  // ... relations ...
}
```

**Add**:
```prisma
  reactionCount   Int @default(0) // Denormalized for performance
```

#### Change 42: TournamentComment Model - Add reactionCount & replyCount
**File**: `prisma/schema.prisma` (Find `model TournamentComment`)

**Add To Model**:
```prisma
  reactionCount   Int @default(0) // Denormalized
  replyCount      Int @default(0) // Denormalized
```

---

### SUMMARY OF ALL CHANGES BY FILE

**Total Changes**: 42+ modifications  
**Files Affected**: `prisma/schema.prisma` only  
**Migration Strategy**:
1. Add indexes first (backward compatible)
2. Add VarChar conversions (backward compatible)
3. Convert Float → Decimal (backward compatible with auto-casting)
4. Remove denormalized fields (requires data migration)
5. Add new denormalized fields (optional performance tuning)

**Testing After Changes**:
```bash
# 1. Run migration to generate
npx prisma migrate dev --name schema_optimizations

# 2. Test all queries in your API
npm run test

# 3. Verify indexes exist
# In PostgreSQL:
# SELECT * FROM pg_indexes WHERE tablename = 'CourtBooking';

# 4. Run query explain to see plans using new indexes
# EXPLAIN ANALYZE SELECT * FROM "CourtBooking" WHERE "organizationId" = '...' AND status = 'confirmed';
```

