# 🎯 Vico Pilot Test Suite

**For Saturday Pilot Success - March 2026**

---

## Overview

This test suite validates that the **Vico court booking system** is ready for real users. It focuses on the 5 critical scenarios that will make or break the pilot.

## The 5 Pilot Scenarios

### Scenario 1: Complete Booking → Payment → Confirmation Flow ✅
**What it tests:** The core user journey
- User sees available courts and time slots with pricing
- User can book a court (< 30 seconds)
- Payment is initiated (M-Pesa)
- User gets clear confirmation

**Why it matters:** If this breaks, pilot fails immediately.

### Scenario 2: Double Booking Prevention ✅
**What it tests:** Race condition protection
- First user books 3-4 PM
- Second user tries same time
- System prevents double booking
- Second user sees "slot unavailable" clearly

**Why it matters:** Users lose trust if they can double-book. System breaks.

### Scenario 3: Payment Failure Handling ✅
**What it tests:** Graceful error handling
- User doesn't enter M-Pesa PIN
- Payment times out
- Network fails
- System shows CLEAR message: "Payment failed. Retry or contact support."

**Why it matters:** Users forgive bugs, not confusion.

### Scenario 4: Network & Timeout Handling ✅
**What it tests:** Kenya's variable network conditions
- High latency requests still complete
- Duplicate requests don't create duplicates (idempotency)
- Retries work correctly
- Data isn't lost on timeout

**Why it matters:** Real users have 3G/4G. Must survive drops.

### Scenario 5: Admin Bookings View ✅
**What it tests:** Club admin experience
- Admin sees all bookings in a clear list
- Admin sees: Player | Time | Status | Price
- Admin can manually confirm (fallback for cash)
- Admin sees payment status

**Why it matters:** If admin is confused, they won't adopt.

---

## Running Tests

### Quick Start
```bash
# Run all pilot scenarios
npm run test:pilot

# Run specific scenario
npm run test:pilot -- tests/pilot-scenarios/01-booking-payment-confirmation.test.ts

# Run with detailed output
npm run test:pilot -- --reporter=verbose
```

### Reports Generated
Tests automatically create 3 reports:

1. **pilot-results.json** - Machine-readable test data
2. **pilot-summary.md** - Human-readable summary
3. **pilot-report.html** - Visual dashboard

Location: `tests/reports/`

---

## Test Structure

```
tests/pilot-scenarios/
├── 01-booking-payment-confirmation.test.ts
├── 02-double-booking-prevention.test.ts
├── 03-payment-failure-handling.test.ts
├── 04-network-timeout-handling.test.ts
└── 05-admin-bookings-view.test.ts

tests/reports/
├── pilot-results.json
├── pilot-summary.md
└── pilot-report.html
```

---

## Pilot Readiness Checklist

**Before Saturday:**

- [ ] Scenario 1: Booking flow works end-to-end
- [ ] Scenario 2: No double bookings possible
- [ ] Scenario 3: Payment failures show clear messages
- [ ] Scenario 4: Network delays don't break system
- [ ] Scenario 5: Admin dashboard is clear and usable
- [ ] All 5 scenarios pass locally
- [ ] All 5 scenarios pass in staging/production
- [ ] Team can interpret test failures
- [ ] Mobile view tested by human tester
- [ ] Live monitoring set up for Saturday

---

## Key Test Data

### Users
- Admin user with staff role
- 5-10 player users
- Test mobile numbers in 254XXXXXXXXX format

### Courts
- 1-2 test courts with hourly rate (500-1200 KES)
- Peak vs non-peak pricing (if applicable)

### Bookings
- Confirmed bookings
- Pending bookings
- Failed payment scenarios
- Various time slots

---

## Expected Results

### ✅ All Pass
System is ready for pilot. Deploy on Friday evening.

### ⚠️ Some Fail
Fix failing scenarios before pilot. Re-run tests.

### ❌ Critical Fail
Do NOT pilot. Debug and fix before attempting again.

---

## How to Interpret Results

### Test Output Symbols
- ✅ **Pass** - Test succeeded
- ❌ **Fail** - Test failed, needs fix
- ⊙ **Skip** - Test skipped (usually expected)

### Report Dashboard
Open `tests/reports/pilot-report.html` in browser to see:
- Visual status (green = ready, yellow = needs attention)
- Scenario breakdown
- Pass/fail counts
- Duration of each test
- Error messages

---

## Troubleshooting

### Payment Tests Fail
**Cause:** M-Pesa worker service not available (expected in development)
**Action:** These tests may skip gracefully. Check stderr for details.

### Database Tests Fail
**Cause:** Test data cleanup incomplete or DB connection issue
**Action:** Verify Prisma connection, check database permissions

### Timeout Tests Fail
**Cause:** Local environment too fast (good news!) or networking issue
**Action:** Check internet connection, verify API endpoints

### "Tests not found"
**Cause:** Vitest not installed or tests not in PATH
**Action:** Run `npm install` and ensure working directory is `/home/wilfred/TennisTracker`

---

## Before & After Comparison

### Old Testing (❌ Not scalable)
- Manual user testing
- Inconsistent coverage
- No automated reports
- Can't catch regressions
- Pilot day = high risk

### New Testing (✅ Pilot ready)
- Automated 5 core scenarios
- Consistent every time
- Machine-readable reports
- Catches regressions immediately
- Pilot day = low risk

---

## Saturday Pilot Day

### Morning (6 AM)
- [ ] Run full test suite: `npm run test:pilot`
- [ ] Verify all 5 scenarios pass
- [ ] Check `tests/reports/pilot-report.html`
- [ ] Team meeting: review any warnings

### During Pilot (9 AM - 5 PM)
- [ ] Real-time error monitoring active
- [ ] Team on-call for issues
- [ ] Collect user feedback
- [ ] Screenshot any bugs

### Post-Pilot (5 PM+)
- [ ] Analyze feedback
- [ ] Plan fixes for next iteration
- [ ] Document what worked vs needs improvement

---

## Key Files

| File | Purpose |
|------|---------|
| `tests/pilot-scenarios/*.test.ts` | Test implementations |
| `tests/run-pilot-scenarios.ts` | Test runner & report generator |
| `tests/reports/pilot-*.html` | Visual dashboard for stakeholders |
| `tests/reports/pilot-*.md` | Technical summary |

---

## Contact

Questions about tests? Check:
1. Test source code (most complete)
2. Scenario description above
3. Error messages in test output
4. Console logs (each test logs progress)

---

**Remember:** These tests are **not about perfection**, they're about **confidence for Saturday**.

Good luck! 🚀
