# 📋 Vico Pilot Testing Infrastructure

**Complete guide to the new pilot test suite for Saturday's real user testing.**

---

## What's New?

A **comprehensive automated test suite** that validates the 5 critical user flows:

1. ✅ Complete booking → payment → confirmation
2. ✅ Double booking prevention (race conditions)
3. ✅ Payment failure handling (clear error messages)
4. ✅ Network timeouts (retries, idempotency)
5. ✅ Admin dashboard (bookings view & management)

## Why This Matters

### Without This
- 😰 Pilot day = high risk
- 👤 One user hitting a bug = pilot fails
- 📉 Admin confused = no adoption
- 🚨 Can't find bugs beforehand

### With This
- ✅ Confidence that core flows work
- 🔍 Catches regressions automatically
- 📊 Clear pass/fail status before pilot
- 🎯 Focus on user experience, not firefighting

---

## Quick Reference

### Run All Tests
```bash
npm run test:pilot
```

### Run One Scenario
```bash
npm run test:pilot:s1  # Booking → Payment → Confirmation
npm run test:pilot:s2  # Double Booking Prevention
npm run test:pilot:s3  # Payment Failure Handling
npm run test:pilot:s4  # Network & Timeout Handling
npm run test:pilot:s5  # Admin Bookings View
```

### View Reports
```bash
open tests/reports/pilot-report.html  # Visual dashboard
cat tests/reports/pilot-summary.md    # Technical summary
cat tests/reports/pilot-results.json  # Raw data
```

---

## Directory Structure

```
tests/
├── pilot-scenarios/                    # Core test files
│   ├── 01-booking-payment-confirmation.test.ts
│   ├── 02-double-booking-prevention.test.ts
│   ├── 03-payment-failure-handling.test.ts
│   ├── 04-network-timeout-handling.test.ts
│   └── 05-admin-bookings-view.test.ts
├── reports/                            # Auto-generated reports
│   ├── pilot-results.json              # Machine-readable
│   ├── pilot-summary.md                # Markdown summary
│   └── pilot-report.html               # Visual dashboard
├── PILOT_TEST_SUITE.md                 # Full documentation
├── QUICK_START.md                      # Get started fast
└── run-pilot-scenarios.ts              # Test runner & report generator
```

---

## Each Scenario Explained

### Scenario 1: Booking → Payment → Confirmation
**Tests:** The complete user journey

**What it does:**
1. Checks available time slots are visible
2. Verifies court details shown
3. Creates booking with correct price
4. Initiates M-Pesa payment
5. Simulates payment callback
6. Confirms booking complete
7. Measures performance (< 30 seconds)

**Why it's critical:**
This is the ENTIRE pilot product. If this breaks, pilot fails.

**Key assertions:**
- ✅ Slots available with pricing
- ✅ Booking created in database
- ✅ Payment initiated successfully
- ✅ Booking confirmed after payment
- ✅ User sees confirmation details

---

### Scenario 2: Double Booking Prevention
**Tests:** Race condition prevention

**What it does:**
1. First user books 3-4 PM
2. Second user tries same time
3. System detects conflict
4. Second booking rejected
5. First user gets later time slot

**Why it's critical:**
Without this, users lose trust immediately.

**Key assertions:**
- ✅ First booking succeeds
- ✅ Conflicting booking prevented
- ✅ API rejects overlap
- ✅ Slot marked unavailable
- ✅ User sees clear message

---

### Scenario 3: Payment Failure Handling
**Tests:** Graceful error handling

**What it does:**
1. Simulate payment timeout
2. Simulate invalid M-Pesa number
3. Simulate user cancellation
4. Simulate M-Pesa error callback
5. Verify booking persists
6. Verify user sees retry option

**Why it's critical:**
Kenya's network isn't perfect. Must handle failures.

**Key assertions:**
- ✅ Failed payment marked in DB
- ✅ Booking still exists (no data loss)
- ✅ User gets clear error message
- ✅ Retry option available
- ✅ No duplicate charges

---

### Scenario 4: Network & Timeout Handling
**Tests:** Resilience under stress

**What it does:**
1. Simulate 2 second latency
2. Test idempotency (duplicate requests)
3. Simulate timeout and retry
4. Handle concurrent requests
5. Verify data consistency
6. Show progress feedback

**Why it's critical:**
Real users on 3G experience delays and retries.

**Key assertions:**
- ✅ Requests complete despite latency
- ✅ Duplicate requests handled (idempotent)
- ✅ Retries work correctly
- ✅ Data not lost on timeout
- ✅ UI shows progress

---

### Scenario 5: Admin Bookings View
**Tests:** Club admin experience

**What it does:**
1. Create sample bookings
2. Verify admin sees list
3. Check columns: Player | Time | Status | Price
4. Test filtering by status
5. Verify manual confirmation works
6. Test revenue calculation
7. Show failed payments alert

**Why it's critical:**
If admin is confused, they won't adopt the system.

**Key assertions:**
- ✅ All bookings visible
- ✅ Required columns present
- ✅ Payment status clear
- ✅ Filtering works
- ✅ Manual override available
- ✅ Revenue calculation correct

---

## How Tests Work

### Test Flow
```
1. Setup: Create test data (court, users, org)
2. Test: Execute scenario steps
3. Assert: Verify expected outcomes
4. Cleanup: Delete test data
5. Report: Aggregate results
```

### Test Framework
- **Framework:** Vitest
- **Test Runner:** `npx vitest run`
- **Database:** Direct Prisma queries
- **API Calls:** Fetch (Node.js)

### Test Isolation
Each scenario:
- ✅ Creates its own test data
- ✅ Runs independently
- ✅ Cleans up after itself
- ✅ Won't affect other tests

---

## Reports Explained

### JSON Report (`pilot-results.json`)
```json
{
  "timestamp": "2026-04-29T10:30:00Z",
  "overallStatus": "READY_FOR_PILOT",
  "totalScenarios": 5,
  "passedScenarios": 5,
  "totalTests": 42,
  "totalPassed": 40,
  "totalFailed": 0,
  "scenarios": [...]
}
```
Machine-readable format for CI/CD integration.

### Markdown Report (`pilot-summary.md`)
Human-readable summary with:
- Executive summary
- Per-scenario results
- Pilot readiness checklist
- Next steps

### HTML Report (`pilot-report.html`)
Visual dashboard:
- 🟢 Status indicator
- 📊 Test counts
- ⏱️ Performance metrics
- ✓ Passing scenarios
- ✗ Failing scenarios
- 📋 Checklist

---

## Troubleshooting

### Q: Tests pass locally but fail in CI?
**A:** Check environment variables:
- `TEST_BASE_URL` - set to `http://localhost:3000`
- Database connection active
- M-Pesa mock service available

### Q: Payment tests timeout?
**A:** Payment worker may be unavailable (expected). Tests skip gracefully.

### Q: "Cannot find module"?
**A:** Run `npm install` and ensure working directory is root.

### Q: Reports not generating?
**A:** Ensure `tests/reports/` directory exists or creates it. Check file permissions.

### Q: Test database dirty?
**A:** Manual cleanup:
```bash
npx prisma db push  # Sync schema
npm run seed        # Reseed if needed
```

---

## Extending Tests

### Add a New Scenario

1. Create file: `tests/pilot-scenarios/06-new-scenario.test.ts`
2. Copy structure from existing test
3. Add to `scenarios` array in `run-pilot-scenarios.ts`
4. Add NPM script: `"test:pilot:s6": "npx vitest run tests/pilot-scenarios/06-..."`

### Add a Test to Existing Scenario

```typescript
it('should verify something specific', async () => {
  // Your test here
  expect(something).toBe(true);
});
```

### Enable/Disable Tests

```typescript
// Disable temporarily
it.skip('should verify...', () => {});

// Run only this test
it.only('should verify...', () => {});
```

---

## Integration with CI/CD

### GitHub Actions Example
```yaml
name: Pilot Tests
on: [push, pull_request]

jobs:
  pilot:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run test:pilot
      - name: Upload reports
        uses: actions/upload-artifact@v2
        with:
          name: pilot-reports
          path: tests/reports/
```

---

## Performance Targets

Each scenario should complete in:
- **Scenario 1:** < 10 seconds
- **Scenario 2:** < 8 seconds
- **Scenario 3:** < 10 seconds
- **Scenario 4:** < 15 seconds (includes delays)
- **Scenario 5:** < 10 seconds

**Total suite:** < 60 seconds

If slower, investigate database indexes or API performance.

---

## Saturday Pilot Checklist

### Friday Before Pilot
- [ ] Run: `npm run test:pilot`
- [ ] All 5 scenarios pass ✅
- [ ] Review: `tests/reports/pilot-report.html`
- [ ] Check logs for warnings
- [ ] Team briefing on test results

### Saturday Morning (Before Going Live)
- [ ] Final test run: `npm run test:pilot`
- [ ] Verify production deployment ready
- [ ] Have team on standby
- [ ] Monitor real-time errors

### During Pilot
- [ ] Log user feedback
- [ ] Monitor error dashboard
- [ ] Prepare post-pilot analysis

### After Pilot
- [ ] Review failures
- [ ] Plan improvements
- [ ] Update tests for new features

---

## Key Success Metrics

- ✅ All 5 scenarios pass
- ✅ < 60 seconds total runtime
- ✅ Clear error messages visible
- ✅ Admin can manage bookings
- ✅ M-Pesa flow works end-to-end
- ✅ No double bookings possible

---

## Questions?

1. **How do I run tests?** → `npm run test:pilot`
2. **What if a test fails?** → Check test output, fix the code, rerun
3. **Where are reports?** → `tests/reports/`
4. **Can I modify tests?** → Yes, but keep core scenarios
5. **How do I add new tests?** → Copy existing scenario structure

---

## Remember

These tests are your **confidence** for Saturday.

- ✅ They're not about perfection
- ✅ They're about **knowing** the system works
- ✅ They catch regressions **before** users find them
- ✅ They give the team confidence to go live

**Status check before pilot = low stress on pilot day.**

Good luck! 🚀

---

**Last Updated:** April 29, 2026
**Test Framework Version:** Vitest
**Prisma Version:** 6.16.2
**Node Version:** 18+
