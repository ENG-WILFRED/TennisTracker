# 🚀 Quick Start: Running Pilot Tests

## TL;DR - Run This Now

```bash
cd /home/wilfred/TennisTracker
npm run test:pilot
```

That's it. Tests run. Reports generate automatically.

---

## What Happened?

### 5 Test Scenarios Created
✅ Each scenario tests ONE critical user path

1. **Booking → Payment → Confirmation** (Scenario 1)
   - User books court, pays with M-Pesa, sees confirmation
   - Location: `tests/pilot-scenarios/01-booking-payment-confirmation.test.ts`

2. **Double Booking Prevention** (Scenario 2)
   - System prevents two users booking same slot
   - Location: `tests/pilot-scenarios/02-double-booking-prevention.test.ts`

3. **Payment Failure Handling** (Scenario 3)
   - User sees clear message when payment fails
   - Location: `tests/pilot-scenarios/03-payment-failure-handling.test.ts`

4. **Network Timeout Handling** (Scenario 4)
   - System survives slow networks and retries
   - Location: `tests/pilot-scenarios/04-network-timeout-handling.test.ts`

5. **Admin Bookings View** (Scenario 5)
   - Admin can see bookings clearly
   - Location: `tests/pilot-scenarios/05-admin-bookings-view.test.ts`

---

## Test Commands

### Run All Tests
```bash
npm run test:pilot
```
Runs all 5 scenarios, generates reports.

### Run One Scenario
```bash
npm run test:pilot:s1  # Scenario 1 only
npm run test:pilot:s2  # Scenario 2 only
npm run test:pilot:s3  # Scenario 3 only
npm run test:pilot:s4  # Scenario 4 only
npm run test:pilot:s5  # Scenario 5 only
```

### Run with More Details
```bash
npx vitest run tests/pilot-scenarios/*.test.ts --reporter=verbose
```

---

## Reports & Results

### After Running Tests
Reports appear in: **`tests/reports/`**

```
tests/reports/
├── pilot-results.json       ← Machine readable
├── pilot-summary.md         ← Tech summary
└── pilot-report.html        ← Open in browser 🌐
```

### View Results
```bash
# Open HTML dashboard
open tests/reports/pilot-report.html  # macOS
xdg-open tests/reports/pilot-report.html  # Linux

# Or read markdown
cat tests/reports/pilot-summary.md
```

---

## What the Tests Check

### For Each Scenario
- ✅ Correct data stored
- ✅ No race conditions
- ✅ Clear error messages
- ✅ Performance acceptable (< 30 seconds)
- ✅ Mobile-friendly (where applicable)

### Overall Status
- 🟢 **READY FOR PILOT** - Deploy!
- 🟡 **NEEDS FIXES** - Fix failing scenario
- 🔴 **CRITICAL FAIL** - Do not pilot yet

---

## If Tests Fail

### Scenario 1 Fails (Booking Flow)
❌ Core user journey broken
- Check: M-Pesa integration working?
- Check: Database writing bookings?
- Check: Pricing calculation correct?

### Scenario 2 Fails (Double Booking)
❌ Race condition vulnerability
- Check: Unique index on (court_id, start_time)?
- Check: Conflict detection logic?

### Scenario 3 Fails (Payment Failure)
❌ Users see vague errors
- Check: Error messages clear and helpful?
- Check: Booking persists after failure?

### Scenario 4 Fails (Network Handling)
❌ System fails under stress
- Check: Timeouts configured?
- Check: Retry logic in place?
- Check: Idempotency keys working?

### Scenario 5 Fails (Admin View)
❌ Admin confused
- Check: Bookings query returning data?
- Check: UI columns correct?
- Check: Manual override working?

---

## Before Saturday

### Friday (Day Before)
```bash
# Final check
npm run test:pilot

# Verify all 5 scenarios pass ✅
# If any fail ❌, fix them

# Check reports
open tests/reports/pilot-report.html
```

### Saturday Morning (Before Pilot)
```bash
# Last-minute sanity check
npm run test:pilot

# Verify all pass
# Deploy to production
# Go live!
```

---

## File Locations

| What | Where |
|------|-------|
| Scenario tests | `tests/pilot-scenarios/` |
| Test runner | `tests/run-pilot-scenarios.ts` |
| Test docs | `tests/PILOT_TEST_SUITE.md` |
| Reports | `tests/reports/` |
| NPM scripts | `package.json` |

---

## Questions?

1. **Test failing?** → Check error message in console output
2. **Report not generating?** → Ensure `tests/reports/` directory exists
3. **Unsure what test does?** → Read comments in test file
4. **Need to add test?** → Copy existing scenario, modify

---

## Key Takeaways

- 🎯 **One command**: `npm run test:pilot`
- 📊 **Automatic reports** in `tests/reports/`
- ✅ **All 5 scenarios must pass** before Saturday
- 🚀 **Ready to deploy** when dashboard shows green

Good luck! 🍀
