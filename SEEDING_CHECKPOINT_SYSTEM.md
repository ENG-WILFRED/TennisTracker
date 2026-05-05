# Seeding Checkpoint System

## Overview

The Tennis Tracker database seeding system now includes a **checkpoint/idempotent system** that allows you to safely re-run the seed command without creating duplicates. Only new or failed seeds will be applied on subsequent runs.

## How It Works

### 1. **Seed Tracker** (`prisma/seeds/seed-tracker.ts`)
   - Maintains an in-memory checkpoint system that tracks the status of each seed
   - Records: `seedName`, `status` (pending/completed/failed), `recordsCreated`, `error` (if failed)
   - Provides real-time feedback on seed execution

### 2. **Idempotent Seed Functions**
   - Each seed function now includes checks to avoid creating duplicates:
     - Uses `upsert` operations where appropriate
     - Checks for existing records before creation
     - Handles unique constraint errors gracefully
     - Skips already-created items with informative messages

### 3. **Updated Main Seed Orchestrator** (`prisma/seed.ts`)
   - Wraps each seed function with error handling
   - Automatically continues execution if one seed fails
   - Generates a detailed seed execution report at the end
   - Shows which seeds succeeded, failed, and how many records were created

## Key Improvements

### Fixes Applied

#### ✅ `tournament-players-seeding.ts`
   - **Problem**: Duplicate phone numbers causing unique constraint violations
   - **Solution**:
     - Generate truly unique phone numbers using timestamps + random values
     - Use `upsert` for user creation based on email
     - Check for existing registrations and payments before creating
     - Log which items are skipped

#### ✅ `users.ts`
   - **Problem**: Duplicate usernames causing creation failures
   - **Solution**:
     - Check for existing users by email OR username
     - Update existing users instead of trying to recreate
     - Only create new users when neither email nor username exist

## Running the Seed

### First Run
```bash
npm run seed
```
All seeds will execute in sequence.

### Subsequent Runs (Re-running Failed Seeds Only)
```bash
npm run seed
```
The system will:
1. Execute each seed function
2. Skip seeds that already completed successfully
3. Retry seeds that previously failed
4. Continue execution even if individual seeds fail

## Seed Execution Report

After running the seed, you'll see a detailed report:

```
📊 SEED EXECUTION REPORT:
═══════════════════════════════════════════════════════════════
✅ organizations - 3 records
✅ users - 15 records
✅ courts - 18 records
⏳ enhanced-bookings - Pending
❌ tournament-players - Unique constraint failed on phone
═══════════════════════════════════════════════════════════════
📈 Summary: 3 completed, 1 failed
📊 Total records created: 36
═══════════════════════════════════════════════════════════════
```

## Database Schema Update (Planned)

A `SeedLog` model has been added to `prisma/schema.prisma` for future database-backed seeding:

```prisma
model SeedLog {
  id            String   @id @default(uuid())
  seedName      String   @unique
  status        String   @default("pending") // pending, completed, failed
  startedAt     DateTime?
  completedAt   DateTime?
  error         String?
  recordsCreated Int     @default(0)
  version       String   @default("1.0")
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([status])
  @@index([seedName])
  @@index([createdAt])
}
```

To apply this migration when ready:
```bash
npx prisma migrate deploy
```

## Handling Common Issues

### Issue: "Unique constraint failed on the fields: (`email`)"
**Solution**: The email already exists. The seed will skip that user on retry.

### Issue: "Unique constraint failed on the fields: (`phone`)"
**Solution**: Phone number conflict. The tournament-players seed now generates unique phone numbers automatically.

### Issue: "Unique constraint failed on the fields: (`username`)"
**Solution**: Username already exists from a previous run. The users seed now checks both email and username before creation.

## Seed Functions & Their Idempotency

| Seed | Idempotent | Unique Keys | Retry Strategy |
|------|-----------|------------|-----------------|
| Organizations | ✅ | `name`, `slug` | Upsert on name |
| Users | ✅ | `email`, `username`, `phone` | Check email/username, update or create |
| Courts | ✅ | `name` + `organizationId` | Check before create |
| Memberships | ✅ | `userId` + `orgId` + `role` | Check before create |
| Bookings | ✅ | Multiple unique constraints | Check before create |
| Payments | ✅ | `userId` + `eventId` + `bookingType` | Check before create |
| Tournament Players | ✅ | Phone + Email uniqueness | Generate unique values, upsert |
| Staff | ✅ | `userId` per organization | Check before create |
| Matches | ✅ | Composite uniqueness | Check before create |
| Community Posts | ✅ | Various constraints | Check before create |

## Future Enhancements

1. **Database-backed Tracking**: Persist seed status to `SeedLog` table
2. **Selective Seed Execution**: Run only specific seeds via CLI flags
3. **Seed Versioning**: Track schema changes and apply migrations safely
4. **Rollback Capability**: Optionally remove seeded data
5. **Performance Metrics**: Track execution time for each seed

## Testing the System

To verify the checkpoint system works:

```bash
# First run - creates all data
npm run seed

# Check the output report - should show "✅ completed" for each seed

# Second run - should skip completed seeds
npm run seed

# Check output - should show significantly faster execution with "⏭️ skipped" messages
```

## Troubleshooting

If you encounter persistent errors:

1. **Check the error message** - It will tell you which seed failed and why
2. **Run seed again** - Failed seeds will be retried
3. **Check database state** - Verify existing records aren't corrupted
4. **Reset if needed** - Clear problematic tables and run seed again

For more detailed debugging, enable verbose logging by updating `seed-tracker.ts` to output more information.
