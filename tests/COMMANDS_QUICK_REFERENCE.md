# 🧪 Test Commands Quick Reference Card

**Print this or bookmark it** — Quick access to all test commands

---

## 🚀 PILOT TESTS (Critical for Saturday)

```bash
npm run test:pilot              # All 5 pilot scenarios (60 seconds)
npm run test:pilot:s1           # Booking → Payment → Confirmation
npm run test:pilot:s2           # Double-Booking Prevention  
npm run test:pilot:s3           # Payment Failure Handling
npm run test:pilot:s4           # Network Timeout Handling
npm run test:pilot:s5           # Admin Bookings View
```

**View Results After Running:**
```bash
open tests/reports/pilot-report.html       # Visual dashboard ⭐
cat tests/reports/pilot-summary.md         # Markdown report
cat tests/reports/pilot-results.json       # Raw data
```

---

## 🔌 INTEGRATION TESTS (API)

```bash
npm run test:integration           # All API tests
npm run test:integration:courts    # Courts API
npm run test:integration:dashboard # Dashboard API
npm run test:integration:members   # Members API
npm run test:integration:referees  # Referees API
npm run test:integration:community # Community messaging
```

---

## 🏆 COACH TESTS (Dashboard)

```bash
npm run test:coach                 # Basic dashboard
npm run test:coach:debug           # Debug mode
npm run test:coach:direct          # Direct queries
npm run test:coach:load            # Load testing
npm run test:coach:all             # All coach tests
```

---

## 🔗 CONNECTIVITY TESTS (WebSocket)

```bash
npm run test:connectivity                  # All WebSocket tests
npm run test:connectivity:socket           # Socket connections
npm run test:connectivity:websocket        # WebSocket connections
npm run test:connectivity:comments         # Comment reactions
```

---

## 🔐 OTHER TESTS

```bash
npm run test:auth                  # Authentication & roles
npm run test:data:seed             # Seed database
npm run test:all                   # Run everything
npm run test:stress                # Full stress suite
```

---

## 📚 DOCUMENTATION

```bash
cat tests/INDEX.md                          # Start here (navigation)
cat tests/TEST_COMMANDS.md                  # Full command reference
cat tests/QUICK_START.md                    # 5-minute guide
cat tests/PILOT_TEST_SUITE.md               # Detailed scenarios
cat tests/INFRASTRUCTURE_GUIDE.md           # Technical deep-dive
```

---

## 📁 WHERE TESTS ARE

```
tests/
├── pilot-scenarios/       (5 scenarios)
├── integration/           (5 API tests)
├── coach/                 (5 coach tests)
├── connectivity/          (4 WebSocket tests)
├── auth/                  (1 auth test)
├── data/                  (2 data files)
├── stress/                (4+ load tests)
└── reports/               (auto-generated)
```

---

## ⚡ FASTEST SHORTCUTS

```bash
# Run pilot and check status in one go
npm run test:pilot && open tests/reports/pilot-report.html

# Run all integration tests
npm run test:integration

# Test everything
npm run test:all

# Watch mode (auto-rerun on changes)
npx vitest watch tests/
```

---

## 🎯 BEFORE SATURDAY PILOT

**Friday Evening:**
```bash
npm run test:pilot
# Check: tests/reports/pilot-report.html
# All ✅ green? → Deploy Saturday
```

**Saturday Morning:**
```bash
npm run test:pilot
# Check status
# All ✅ green? → Go live!
```

---

## 🐛 DEBUGGING

```bash
# Run with verbose output
npx vitest run tests/pilot-scenarios/01-booking-payment-confirmation.test.ts --reporter=verbose

# Run specific test in watch mode
npx vitest watch tests/pilot-scenarios/

# Run with detailed errors
npx vitest run tests/pilot-scenarios/ --reporter=default
```

---

## 📊 REPORT SUMMARY

| Format | File | View With |
|--------|------|-----------|
| Visual | `tests/reports/pilot-report.html` | `open` or browser |
| Markdown | `tests/reports/pilot-summary.md` | `cat` or editor |
| JSON | `tests/reports/pilot-results.json` | `jq` or editor |

---

## ✅ SUCCESS CHECKLIST

- [ ] `npm run test:pilot` runs without errors
- [ ] All 5 scenarios complete
- [ ] Report shows ✅ READY_FOR_PILOT
- [ ] No failing tests
- [ ] Performance acceptable (< 60 seconds total)
- [ ] Share HTML report with stakeholders
- [ ] Ready for Saturday deployment!

---

## 🔧 TROUBLESHOOTING

| Problem | Solution |
|---------|----------|
| Command not found | `npm install` then try again |
| Port in use | `lsof -ti:3000 \| xargs kill -9` |
| DB errors | `npx prisma db push` then retry |
| Reports missing | `mkdir -p tests/reports` then rerun |
| Permission denied | `chmod +x tests/connectivity/*.sh` |

---

## 📱 MOBILE QUICK VIEW

**COPY & PASTE THESE:**

All tests:
```
npm run test:all
```

Pilot only:
```
npm run test:pilot
```

Integration tests:
```
npm run test:integration
```

View results:
```
open tests/reports/pilot-report.html
```

---

**Created:** April 29, 2026  
**Pilot Date:** Saturday  
**Status:** ✅ Ready

Print this card or save as bookmark for quick access! 🚀
