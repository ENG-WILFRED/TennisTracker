# Prisma Schema Optimization - Developer Implementation Checklist

## PRE-IMPLEMENTATION CHECKLIST

### Environment Setup
- [ ] Clone latest main branch
- [ ] `npm install` to update dependencies
- [ ] Create local database backup: `pg_dump $DATABASE_URL > backup.sql`
- [ ] Create feature branch: `git checkout -b optimize/prisma-schema`
- [ ] Have PRISMA_SCHEMA_CHANGES_EXACT.md open for reference

### Team Communication
- [ ] Schedule code review (2-3 people minimum)
- [ ] Notify devops about planned deployment
- [ ] Set up monitoring alerts for query performance
- [ ] Plan maintenance window if needed (optional for Phase 1)

---

## PHASE 1: CRITICAL INDEXES + FINANCIAL FIX (1-2 Days)

### A. Prepare Schema Changes

#### Step 1: Add Indexes to Core Models
**File**: `prisma/schema.prisma`

- [ ] User Model (line ~13): Add `@@index([createdAt])`
- [ ] Organization Model (line ~128): Add `@@index([createdAt])` + `@@index([slug])`
- [ ] Staff Model (line ~88): Add 4 indexes (organizationId, employedById, isActive, createdAt)
- [ ] Player Model (line ~50): Add `@@index([createdAt])`
- [ ] CourtBooking Model (line ~575): Add 3 indexes (critical for booking searches)
- [ ] ClubMember Model (line ~630): Add 5 indexes
- [ ] ClubEvent Model (line ~770): Add 3 indexes
- [ ] EventRegistration Model (line ~820): Add 3 indexes
- [ ] PaymentReminder Model (line ~900): Add 3 indexes
- [ ] RuleAppeal Model (line ~1110): Add 2 indexes
- [ ] OrganizationActivity Model (line ~1070): Add 2 indexes
- [ ] Other models: CommentReaction, MessageReaction, UserFollower, TournamentMatch

**Verification**:
```bash
# Quick check - count total index additions
grep -c "@@index" prisma/schema.prisma
# Should count existing + ~42 new indexes
```

#### Step 2: Convert Float to Decimal (Financial Fields)
**File**: `prisma/schema.prisma`

- [ ] CourtBooking: `price` (line ~595)
  - [ ] Change: `Float?` → `Decimal @db.Decimal(10, 2)?`
- [ ] ClubEvent: `prizePool`, `entryFee` (line ~785)
  - [ ] Change: `Float?` → `Decimal @db.Decimal(12, 2)?`
- [ ] ClubFinance: All 7 Float fields (line ~935)
  - [ ] Change all to: `Decimal @db.Decimal(12, 2) @default("0")`
- [ ] FinanceTransaction: `amount` (line ~960)
  - [ ] Change: `Float` → `Decimal @db.Decimal(12, 2)`
- [ ] MembershipTier: `monthlyPrice`, `discountPercentage` (line ~620)
- [ ] CoachPricing: All 6 Float fields (line ~200)
- [ ] CoachReview: `rating` (line ~210)
- [ ] Organization: `rating` (line ~152)
- [ ] ClubRating: `rating` (line ~985)
- [ ] EventAmenity: `price` (line ~1025)
- [ ] AmenityBooking: `price` (line ~1045)
- [ ] Service: `price` (line ~175)
- [ ] ClubMember: `outstandingBalance` (line ~665)

**Decimal Format Guide**:
- Prices: `@db.Decimal(10, 2)` - up to 99,999,999.99
- Large amounts: `@db.Decimal(12, 2)` - up to 9,999,999,999.99
- Ratings: `@db.Decimal(3, 2)` - up to 9.99
- Percentages: `@db.Decimal(5, 2)` - up to 999.99

**Verification**:
```bash
# Count Decimal conversions
grep -c "@db.Decimal" prisma/schema.prisma
# Should be ~15-20 total
```

### B. Generate Migration

- [ ] Run: `npx prisma migrate dev --name phase1_indexes_and_decimals`
- [ ] Review generated file: `prisma/migrations/*/migration.sql`
  - [ ] Contains CREATE INDEX statements
  - [ ] Contains ALTER TABLE changes for Decimal
  - [ ] No DROP statements for important fields
- [ ] Check file size: Should be moderate (<2000 lines)

**Save this file for reference**: `_migration_phase1.sql`

### C. Test Locally

#### Unit Testing
```bash
# Build schema
npx prisma generate
- [ ] No `@prisma/client` errors

# Run existing tests
npm run test
- [ ] All tests pass
- [ ] No model-specific failures
```

#### Manual Testing

**Test 1: Booking Availability Query**
```typescript
// Save as test-booking-perf.ts
import { prisma } from "@/lib/prisma";
import { performance } from "perf_hooks";

async function testBookingPerformance() {
  const start = performance.now();
  
  const bookings = await prisma.courtBooking.findMany({
    where: {
      courtId: "test-court-id",
      status: "confirmed",
      startTime: { gte: new Date() },
      endTime: { lte: new Date(Date.now() + 24*60*60*1000) }
    },
    take: 50
  });
  
  const duration = performance.now() - start;
  console.log(`Query took: ${duration}ms`);
  
  // Target: <20ms
  if (duration > 50) {
    console.warn("⚠️ Query slower than expected");
  } else {
    console.log("✅ Query performance acceptable");
  }
}

await testBookingPerformance();
```

- [ ] Run query 5 times, average response time
- [ ] Target: <20ms (was 500-1500ms)
- [ ] If slower, check: `EXPLAIN ANALYZE` in psql

**Test 2: Member Filtering**
```typescript
async function testMemberQuery() {
  const start = performance.now();
  
  const members = await prisma.clubMember.findMany({
    where: {
      organizationId: "org-123",
      paymentStatus: "active"
    },
    take: 100
  });
  
  const duration = performance.now() - start;
  console.log(`Member query: ${duration}ms`);
  // Target: <20ms
}
```

- [ ] Run 5 times average
- [ ] Verify database using correct indexes

**Test 3: Decimal Precision**
```typescript
async function testDecimalPrecision() {
  // Test: 99.99 + 0.01 = 100.00 (not 100.00000001)
  
  const booking = await prisma.courtBooking.create({
    data: {
      price: new Decimal("99.99"),
      // ... other required fields
    }
  });
  
  await prisma.courtBooking.update({
    where: { id: booking.id },
    data: {
      price: new Decimal("99.99").plus(new Decimal("0.01"))
    }
  });
  
  const updated = await prisma.courtBooking.findUnique({
    where: { id: booking.id }
  });
  
  console.log(`Price: ${updated.price}`);
  // Should print: 100.00 (not 100.00000001)
  
  if (updated.price.toString() === "100.00") {
    console.log("✅ Decimal precision correct");
  } else {
    console.warn("⚠️ Decimal precision issue");
  }
}
```

- [ ] Add Decimal.js import: `import Decimal from "decimal.js"`
- [ ] Verify all calculations use Decimal
- [ ] No implicit float conversions

### D. Deploy to Staging

```bash
# Set staging database URL
export DATABASE_URL="postgres://staging-user:pass@staging-host/tennis_tracker_staging"

# Apply migration
- [ ] npx prisma migrate deploy
- [ ] Check: "✓ Your database has been successfully migrated"

# Verify indexes exist
- [ ] psql $DATABASE_URL -c "SELECT * FROM pg_indexes WHERE tablename IN ('CourtBooking', 'ClubMember') ORDER BY tablename;"
- [ ] Count indexes: should match expected
```

### E. Staging Testing (2-4 Hours)

- [ ] Deploy latest API code to staging
- [ ] Load test: `npm run test:load` (if available)
- [ ] Monitor database: Check CPU, memory, connections
- [ ] Query monitoring: Review slow query log
  - [ ] Should see dramatic improvement in previously slow queries
  - [ ] No regression in other queries
- [ ] All booking searches: <20ms target ✅
- [ ] All member queries: <25ms target ✅
- [ ] Financial calculations preserve precision ✅

**If Issues Found**:
- [ ] Check migration.sql for errors
- [ ] Verify all Decimal conversions using Decimal.js library
- [ ] Check for type mismatches in code
- [ ] Rollback: `npx prisma migrate resolve --rolled-back`

### F. Production Deployment

**Pre-Deployment**:
- [ ] Final code review completed and approved
- [ ] Staging tests all passing
- [ ] Backup created: `pg_dump $PROD_DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql`
- [ ] Monitoring set up:
  ```bash
  # Monitor query performance
  SELECT query, calls, total_time, mean_time 
  FROM pg_stat_statements 
  ORDER BY mean_time DESC 
  LIMIT 20;
  ```
- [ ] Team notified: Deployment time, expected improvement
- [ ] Rollback plan documented (link to this checklist)

**Deployment**:
```bash
export DATABASE_URL="postgres://prod-user:pass@prod-host/tennis_tracker"

# Apply migration (runs in transaction, safe to interrupt)
- [ ] npx prisma migrate deploy
- [ ] Verify: "✓ Your database has been successfully migrated to `xxx_phase1_indexes`"

# Verify deployment
- [ ] Check indexes exist: psql query
- [ ] Check for errors: systemctl status (or equivalent)
- [ ] Check API is responsive: `curl https://api.example.com/health`
```

**Post-Deployment Monitoring (24 Hours)**:
- [ ] Error rate: Should not increase
- [ ] Database CPU: Should NOT spike (indices may even reduce CPU)
- [ ] Database memory: Should not increase significantly
- [ ] Query times: Should see 80-95% improvement
- [ ] User complaints: Check Slack/support inbox

```bash
# Sample monitoring query 1 hour after deployment
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
WHERE query LIKE '%CourtBooking%'
ORDER BY calls DESC;
```

---

## PHASE 2: TYPE OPTIMIZATION + DEDUPLICATION (2-3 Days)

### A. String to VarChar Conversion

**File**: `prisma/schema.prisma`

- [ ] Court Model: Convert `surface`, `indoorOutdoor`, `status`
- [ ] CourtBooking Model: Convert `bookingType`, `status`, `cancellationReason`
- [ ] ClubMember Model: Convert `paymentStatus`, `role`, `suspensionReason`
- [ ] ClubEvent Model: Convert `eventType`
- [ ] Staff Model: Convert `role`, `expertise`, `contact`, `coachingLevel`, `formerPlayerBackground`
- [ ] Service Model: Convert `category`, `sourceType`, `contextType`
- [ ] User Model: Convert `phone`, `gender`, `nationality`

**Example Conversion**:
```diff
model Court {
  // Before
  surface           String
  indoorOutdoor     String            @default("outdoor")
  status            String            @default("available")
  
  // After
  surface           @db.VarChar(50)
  indoorOutdoor     @db.VarChar(20)  @default("outdoor")
  status            @db.VarChar(50)  @default("available")
}
```

- [ ] Count total VarChar conversions: `grep -c "@db.VarChar" prisma/schema.prisma`
- [ ] Should be ~20-30 conversions

### B. Remove isClub Field (Data Normalization)

**Step 1: Code Audit**
```bash
# Find all references to isClub
- [ ] grep -r "isClub" src/
# Should find patterns like: { isClub: true }, { isClub: false }
```

**Step 2: Replace in Code**
- [ ] Search: `{ isClub: true }` 
- [ ] Replace: `{ organizationId: { not: null } }`
- [ ] Search: `{ isClub: false }`
- [ ] Replace: `{ organizationId: null }`
- [ ] Search: `.isClub` (in templates/displays)
- [ ] Replace: `?.organizationId !== null`

**Step 3: Remove from Schema**
```diff
model Player {
  matchesPlayed              Int                         @default(0)
  matchesWon                 Int                         @default(0)
  matchesLost                Int                         @default(0)
  createdAt                  DateTime                    @default(now())
  updatedAt                  DateTime                    @updatedAt
- isClub                     Boolean                     @default(false)
  organizationId             String?
```

- [ ] Remove the line completely
- [ ] Verify schema is valid: `npx prisma validate`

### C. Generate Migration

- [ ] Run: `npx prisma migrate dev --name phase2_varchar_and_dedup`
- [ ] Review migration.sql
- [ ] Should only contain VARCHAR conversions and column drops

### D. Test Phase 2

**Code Testing**:
```bash
# Ensure all isClub references updated
- [ ] grep -r "isClub" src/ | wc -l
# Should return 0 (no more references)

# Run tests
- [ ] npm run test
- [ ] All tests should pass
```

**Database Testing**:
```sql
-- Verify VarChar columns created
SELECT column_name, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'Court' AND data_type = 'character varying';

-- Verify isClub column removed
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'Player' AND column_name = 'isClub';
-- Should return 0 rows
```

- [ ] Storage check: Database size should decrease 5-15%
- [ ] Query performance: Should remain same or improve

### E. Deploy Phase 2

- [ ] Staging deployment and testing (same as Phase 1)
- [ ] Production deployment with rollback plan
- [ ] Monitor for errors (should have none)

---

## PHASE 3: PERFORMANCE DENORMALIZATION (3-7 Days) - OPTIONAL

### A. Add reactionCount Fields (Optional)

**File**: `prisma/schema.prisma`

- [ ] PostComment Model: Add `reactionCount Int @default(0)`
- [ ] TournamentComment Model: Add `reactionCount Int @default(0)` + `replyCount Int @default(0)`

### B. Add Cache Invalidation Logic

**File**: `src/lib/reactions.ts` (or equivalent)

- [ ] When CommentReaction created: Increment related PostComment.reactionCount
- [ ] When CommentReaction deleted: Decrement related PostComment.reactionCount
- [ ] Use transactions to ensure consistency

**Implementation**:
```typescript
import { prisma } from "@/lib/prisma";

export async function addCommentReaction(commentId: string, userId: string, type: string) {
  return await prisma.$transaction(async (tx) => {
    // Create reaction
    const reaction = await tx.commentReaction.create({
      data: { commentId, userId, type }
    });
    
    // Increment counter
    await tx.postComment.update({
      where: { id: commentId },
      data: { reactionCount: { increment: 1 } }
    });
    
    return reaction;
  });
}

export async function removeCommentReaction(reactionId: string) {
  return await prisma.$transaction(async (tx) => {
    // Get comment ID first
    const reaction = await tx.commentReaction.findUnique({
      where: { id: reactionId }
    });
    
    if (!reaction) throw new Error("Reaction not found");
    
    // Delete reaction
    await tx.commentReaction.delete({ where: { id: reactionId } });
    
    // Decrement counter
    await tx.postComment.update({
      where: { id: reaction.commentId },
      data: { reactionCount: { decrement: 1 } }
    });
  });
}
```

- [ ] Add tests for transaction atomicity
- [ ] Verify counter consistency with data
- [ ] Handle edge cases (concurrent reactions, deletions)

---

## POST-IMPLEMENTATION VALIDATION

### Performance Dashboard

Create monitoring dashboard to track:

```typescript
// lib/performance-metrics.ts
export async function captureMetrics() {
  const metrics = {
    timestamp: new Date(),
    
    // Query performance
    bookingSearch: await measureQuery("CourtBooking search"),
    memberFilter: await measureQuery("ClubMember filter"),
    eventList: await measureQuery("ClubEvent list"),
    
    // Database health
    indexHealth: await checkIndexHealth(),
    totalSize: await getDatabaseSize(),
    
    // Financial accuracy
    decimalPrecision: await verifyDecimalPrecision()
  };
  
  return metrics;
}

async function measureQuery(name: string) {
  const start = performance.now();
  // ... execute query
  const duration = performance.now() - start;
  return { name, duration };
}
```

**Metrics to Track**:
- [ ] Query response times (should be 80-95% faster)
- [ ] Database size (should be 15-25% smaller after Phase 2)
- [ ] Financial calculation accuracy (should be 100%)
- [ ] Index usage (verify indices are being used)
- [ ] Error rates (should not increase)

### Documentation Update

- [ ] Update database schema docs with new indexes
- [ ] Document Decimal field handling in API responses
- [ ] Update API response types to use Decimal where needed
- [ ] Update query patterns documentation
- [ ] Add performance optimization guide for future devs

---

## TROUBLESHOOTING GUIDE

### Issue: Query Still Slow After Index Creation
**Solution**:
```bash
# Check if index is actually being used
EXPLAIN ANALYZE SELECT * FROM "CourtBooking" 
WHERE "organizationId" = '...' AND status = 'confirmed';

# Should show: "Bitmap Index Scan" or "Index Scan" (not "Seq Scan")

# If still Seq Scan, try:
ANALYZE;  # Update statistics
REINDEX INDEX idx_name;  # Rebuild index
```

### Issue: Decimal Precision Still not Working
**Solution**:
```typescript
// Ensure Decimal.js is used throughout
import Decimal from "decimal.js";

// ❌ Wrong
const price = 99.99 + 0.01;  // JavaScript float

// ✅ Correct
const price = new Decimal("99.99").plus(new Decimal("0.01"));

// When getting from Prisma
const booking = await prisma.courtBooking.findUnique(...);
const price = new Decimal(booking.price.toString());
```

### Issue: Rollback Needed - What to do?

**Rollback Commands**:
```bash
# 1. Stop current deployment
# 2. Revert schema changes
git revert HEAD

# 3. Rollback migration
npx prisma migrate resolve --rolled-back

# 4. Redeploy previous version
npx prisma migrate deploy

# 5. Restore from backup if data corruption
psql $DATABASE_URL < backup_YYYYMMDD.sql
```

---

## SIGN-OFF

- [ ] All checklist items completed
- [ ] Code reviewed by (names): ________________
- [ ] Performance tests passed
- [ ] Monitoring set up and verified
- [ ] Documentation updated
- [ ] Team notified of deployment

**Implementation Date**: _______________  
**Deployed By**: _______________  
**Status**: ☐ Not Started ☐ In Progress ☐ Complete ☐ Rolled Back

