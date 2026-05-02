# Test Results System - Complete Implementation Guide

## Overview

The Test Results System is now fully integrated with your TennisTracker application. All tests run with the `test:db` command automatically save their results to the database, making them accessible via the Developer Dashboard.

## Quick Start

### 1. Run Tests and Save Results to Database

```bash
# Run all tests and save to database
npm run test:db

# Run specific test suite (court-booking, auth, websocket, payment)
npm run test:db:suite court-booking

# With options
npx tsx tests/test-runner-with-db.ts --suite all --concurrent 100 --duration 120
```

### 2. Access Test Results in Developer Dashboard

Navigate to: `http://localhost:3000/dashboard` → Click on "Test Reports" tab

**What you'll see:**
- Test statistics from the last 7 days
- Pass/fail rates by percentage
- List of recent test runs with detailed results
- Latest failures with error messages

### 3. Query Test Results Programmatically

```bash
# View test results statistics
npx tsx tests/test-results-queries.ts
```

## Architecture

### Database Schema

#### TestRun Model
Represents a complete test execution session.

```prisma
model TestRun {
  id            String      @id @default(uuid())
  name          String      // Display name
  runType       String      // "unit" | "integration" | "e2e" | "stress" | "pilot"
  status        String      // "RUNNING" | "PASSED" | "FAILED" | "INCOMPLETE"
  startTime     DateTime    @default(now())
  endTime       DateTime?
  duration      Int?        // milliseconds
  totalTests    Int         @default(0)
  passedTests   Int         @default(0)
  failedTests   Int         @default(0)
  skippedTests  Int         @default(0)
  environment   String      @default("development")
  nodeVersion   String?
  appVersion    String?
  triggeredBy   String?     // "manual" | "automated" | "ci-cd"
  results       TestResult[]
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
}
```

#### TestResult Model
Individual test execution results.

```prisma
model TestResult {
  id                String      @id @default(uuid())
  suiteName         String      // "pilot-scenarios", "integration", "stress", etc.
  testName          String      // Specific test identifier
  status            String      // "PASS" | "FAIL" | "PENDING" | "SKIPPED" | "ERROR"
  startTime         DateTime
  endTime           DateTime
  duration          Int         // milliseconds
  message           String?     // Success/error message
  error             String?     // Full error trace
  output            String?     @db.Text // Console output
  
  // Metrics (for stress tests)
  requestsCompleted Int?
  requestsFailed    Int?
  avgResponseTime   Float?      // milliseconds
  minResponseTime   Float?
  maxResponseTime   Float?
  throughput        Float?      // requests per second
  
  // Environment & context
  environment       String      @default("development")
  nodeVersion       String?
  appVersion        String?
  testRunId         String?
  tags              String[]    @default([])
  metadata          Json?       // Custom data
  
  testRun           TestRun?    @relation(fields: [testRunId], references: [id])
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
  
  @@index([suiteName])
  @@index([status])
  @@index([createdAt])
  @@index([testRunId])
}
```

## API Endpoints

### Get Test Results
```
GET /api/developer/test-results
  ?testRunId=<id>     // Filter by test run
  &suite=<name>       // Filter by suite name
  &status=<status>    // Filter by status
  &limit=100          // Results per page
  &offset=0           // Pagination offset
```

**Response:**
```json
{
  "data": [
    {
      "id": "...",
      "suiteName": "auth",
      "testName": "Authentication - Login",
      "status": "PASS",
      "duration": 2500,
      "testRun": {
        "id": "...",
        "name": "Test run - all - 2026-04-30T...",
        "passedTests": 3,
        "failedTests": 2
      }
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 100,
    "offset": 0,
    "hasMore": true
  }
}
```

### Get Specific Test Run
```
GET /api/developer/test-results/[id]
```

**Response:**
```json
{
  "testRun": {
    "id": "...",
    "name": "Test run - all - ...",
    "runType": "integration",
    "status": "FAILED",
    "totalTests": 5,
    "passedTests": 3,
    "failedTests": 2,
    "skippedTests": 0,
    "results": [...]
  },
  "stats": {
    "passRate": 60,
    "failRate": 40,
    "avgDuration": 1614
  }
}
```

### Get Test Statistics
```
GET /api/developer/test-results/stats?days=7
```

**Response:**
```json
{
  "testRuns": [...],
  "suiteStats": [
    {
      "suiteName": "auth",
      "status": "PASS",
      "_count": { "id": 20 },
      "_avg": { "duration": 1500 }
    }
  ],
  "overallStats": {
    "totalResults": 100,
    "passedResults": 60,
    "failedResults": 40,
    "passRate": 60,
    "failRate": 40,
    "dateRange": {
      "from": "2026-04-23T...",
      "to": "2026-04-30T...",
      "days": 7
    }
  },
  "latestFailures": [...]
}
```

## File Structure

```
tests/
├── test-runner-with-db.ts          # Enhanced test runner that saves to DB
├── test-results-queries.ts         # Query utilities for test results
└── [existing test files]

src/
├── app/api/developer/
│   └── test-results/
│       ├── route.ts                # List & delete test results
│       ├── [id]/route.ts           # Get specific test run
│       └── stats/route.ts          # Get statistics
├── components/dashboards/
│   └── DeveloperDashboard.tsx       # Updated to show test results
└── [existing files]
```

## Usage Examples

### Run All Tests
```bash
npm run test:db
```

Output shows:
- Test run ID created in database
- Pass/fail counts
- Link to view in dashboard
- Summary statistics

### Run Specific Test Suite
```bash
npm run test:db:suite auth
```

### Query Test Results
```bash
# View all test statistics
npx tsx tests/test-results-queries.ts

# In your code:
import { getTestStatistics, getFailedTests } from './tests/test-results-queries.ts';

const stats = await getTestStatistics({ days: 7, suite: 'auth' });
const failures = await getFailedTests({ days: 7, limit: 10 });
```

### Access via API (in Dashboard or External Tools)
```javascript
// Fetch recent test runs
const response = await fetch('/api/developer/test-results/stats?days=7');
const data = await response.json();

console.log(`Pass Rate: ${data.overallStats.passRate.toFixed(1)}%`);
console.log(`Latest Failures: ${data.latestFailures.length}`);
```

## Developer Dashboard Integration

The Developer Dashboard now displays:

1. **Test Statistics Card** (Last 7 days):
   - Total Passed tests
   - Total Failed tests
   - Pass Rate percentage
   - Total Results count

2. **Recent Test Runs List**:
   - Test run name and status
   - Pass/fail/skip counts
   - Duration in seconds
   - Timestamp

3. **Latest Failures Section**:
   - Test name that failed
   - Error message
   - Execution duration
   - Link to detailed run

## Monitoring & Maintenance

### Automatic Cleanup
Old test results can be deleted to maintain database performance:

```bash
# Delete test results older than 30 days
curl -X DELETE "http://localhost:3000/api/developer/test-results?daysOld=30"

# Delete specific test run
curl -X DELETE "http://localhost:3000/api/developer/test-results?testRunId=<id>"
```

### Performance Tips
- Keep test results for 7-14 days in production
- Archive older results to separate storage
- Use pagination when fetching many results
- Index queries by `createdAt` for faster lookups

## Troubleshooting

### Tests Run But Not Saving to Database
1. Verify database migration: `npx prisma migrate status`
2. Check if Prisma client is generated: `npx prisma generate`
3. Verify DATABASE_URL in `.env`

### No Data Showing in Dashboard
1. Confirm test run was created: Check `TestRun` table count
2. Verify API endpoint: `curl http://localhost:3000/api/developer/test-results/stats`
3. Check browser console for errors
4. Ensure developer role is assigned to user

### API Returns Empty Results
1. Check date range: `?days=7` might be too short
2. Verify test run ID if filtering: `?testRunId=<id>`
3. Check table indexes for performance: `@@index([createdAt])`

## Next Steps

1. **Integrate with CI/CD**: Add `npm run test:db` to CI pipeline
2. **Set Alerts**: Create notifications for test failures
3. **Generate Reports**: Export test statistics to PDF/CSV
4. **Historical Analysis**: Track pass rate trends over time
5. **Performance Dashboards**: Monitor test execution times

## Related Documentation

- [API Routes Reference](./API_ROUTES_AND_DATA_STRUCTURES.md)
- [Stress Testing Guide](./STRESS_TESTING_GUIDE.md)
- [Developer Dashboard Quick Start](./COACH_DASHBOARD_QUICK_START.md)
- [Database Schema](../prisma/schema.prisma)

---

**Last Updated**: April 30, 2026
**Version**: 1.0.0
