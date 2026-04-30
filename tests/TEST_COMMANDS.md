# 🧪 Complete Test Command Reference

**Organization:** All tests are now organized in the `tests/` folder with logical subfolders.

---

## 📁 Test Folder Structure

```
tests/
├── pilot-scenarios/              # 🚀 Saturday pilot tests (CRITICAL)
│   ├── 01-booking-payment-confirmation.test.ts
│   ├── 02-double-booking-prevention.test.ts
│   ├── 03-payment-failure-handling.test.ts
│   ├── 04-network-timeout-handling.test.ts
│   └── 05-admin-bookings-view.test.ts
├── integration/                  # 🔌 API integration tests
│   ├── test-courts-api.ts
│   ├── test-dashboard-api.ts
│   ├── test-org-members.js
│   └── test-referee-endpoints.js
├── coach/                        # 🏆 Coach dashboard tests
│   ├── test-coach-dashboard.ts
│   ├── test-coach-dashboard-debug.ts
│   ├── test-coach-dashboard-direct.ts
│   ├── test-coach-dashboard-load.ts
│   └── test-all-coaches.ts
├── connectivity/                 # 🔗 WebSocket & Socket tests
│   ├── test-websocket.sh
│   ├── test-websocket-connection.js
│   ├── test-socket-connection.js
│   └── test-comment-reactions.sh
├── auth/                         # 🔐 Authentication & roles tests
│   └── test-elena-login-roles.ts
├── data/                         # 💾 Data seeding & references
│   ├── test-seed.js
│   └── test_data.md
├── stress/                       # 💪 Stress & load testing
│   ├── court-booking-stress.ts
│   ├── auth-stress.ts
│   ├── websocket-stress.ts
│   └── payment-stress.ts
└── reports/                      # 📊 Generated reports
    ├── pilot-report.html
    ├── pilot-summary.md
    └── pilot-results.json
```

---

## 🚀 PILOT TESTS (Saturday Critical)

### Run All Pilot Scenarios
```bash
npm run test:pilot
```
**Output:** 3 reports in `tests/reports/` (HTML, Markdown, JSON)
**Time:** ~60 seconds
**Status:** Must be ✅ READY_FOR_PILOT before going live

### Individual Pilot Scenarios

**Scenario 1: Booking → Payment → Confirmation**
```bash
npm run test:pilot:s1
```
Tests user flow: see available slots → book → pay M-Pesa → get confirmation

**Scenario 2: Double-Booking Prevention**
```bash
npm run test:pilot:s2
```
Tests race condition safety: prevent simultaneous bookings of same slot

**Scenario 3: Payment Failure Handling**
```bash
npm run test:pilot:s3
```
Tests graceful errors: timeouts, invalid numbers, cancelled payments

**Scenario 4: Network & Timeout Handling**
```bash
npm run test:pilot:s4
```
Tests Kenya's 3G: latency simulation, retry logic, idempotency

**Scenario 5: Admin Bookings View**
```bash
npm run test:pilot:s5
```
Tests admin dashboard: view, filter, manage, revenue calculations

---

## 🔌 INTEGRATION TESTS

### Run All Integration Tests
```bash
npm run test:integration
```
Runs all API integration tests sequentially

### Individual Integration Tests

**Courts API Tests**
```bash
npm run test:integration:courts
```
Tests: Court listing, availability, booking endpoints

**Dashboard API Tests**
```bash
npm run test:integration:dashboard
```
Tests: Dashboard data endpoints, user data retrieval

**Organization Members Tests**
```bash
npm run test:integration:members
```
Tests: Member listing, roles, permissions

**Referee Endpoints Tests**
```bash
npm run test:integration:referees
```
Tests: Referee assignment, endpoints, management

**Community Messaging Tests**
```bash
npm run test:integration:community
```
Tests: Real-time messaging, notifications, community features

---

## 🏆 COACH DASHBOARD TESTS

### Run All Coach Tests
```bash
npm run test:coach:all
```
Tests all coach-related functionality

### Individual Coach Tests

**Basic Coach Dashboard**
```bash
npm run test:coach
```
Basic functionality and component rendering

**Coach Dashboard Debug**
```bash
npm run test:coach:debug
```
Detailed debugging and diagnostics

**Coach Dashboard Direct**
```bash
npm run test:coach:direct
```
Direct database queries and verification

**Coach Dashboard Load**
```bash
npm run test:coach:load
```
Performance and load testing under concurrent usage

---

## 🔗 CONNECTIVITY TESTS

### Run All Connectivity Tests
```bash
npm run test:connectivity
```
Tests WebSocket, Socket, and real-time features (runs main WebSocket test)

### Individual Connectivity Tests

**WebSocket Connection Test**
```bash
npm run test:connectivity:websocket
```
Tests WebSocket real-time connections

**Socket Connection Test**
```bash
npm run test:connectivity:socket
```
Tests Socket.io connections

**Comment Reactions Test**
```bash
npm run test:connectivity:comments
```
Tests real-time comment and reaction updates

**WebSocket Shell Test**
```bash
npm run test:connectivity
```
Shell-based comprehensive WebSocket testing

---

## 🔐 AUTHENTICATION TESTS

### Run Auth Tests
```bash
npm run test:auth
```
Tests Elena login roles, authentication flows, permission checking

---

## 💾 DATA TESTS

### Seed Database
```bash
npm run test:data:seed
```
Populates database with test data

### View Test Data Reference
```bash
cat tests/data/test_data.md
```
Reference for all test data structures and sample values

---

## 💪 STRESS TESTS

### Run All Stress Tests
```bash
npm run test:stress
```
Full stress suite with rate limiting

### Individual Stress Tests

**Court Booking Stress**
```bash
npm run test:stress:booking
```
Simulates high concurrent booking load

**Authentication Stress**
```bash
npm run test:stress:auth
```
Simulates high concurrent authentication requests

**WebSocket Stress**
```bash
npm run test:stress:websocket
```
Simulates high concurrent WebSocket connections

**Payment Stress**
```bash
npm run test:stress:payment
```
Simulates high concurrent payment processing

---

## 🎯 SMART TEST COMMANDS

### Run Everything
```bash
npm run test:all
```
Runs all test suites (pilot + integration + coach + connectivity + auth + stress)

### Pre-Pilot Verification
```bash
npm run test:pilot
```
Then check: `open tests/reports/pilot-report.html`

### Quick Integration Check
```bash
npm run test:integration && npm run test:coach && npm run test:connectivity
```
Validates core functionality before pilot

### Development Mode (Watch)
```bash
npx vitest watch tests/
```
Runs tests in watch mode, re-runs on file changes

---

## 📊 VIEW TEST RESULTS

### After Running Tests

**Visual Dashboard** (Recommended for stakeholders)
```bash
open tests/reports/pilot-report.html
```

**Markdown Report** (Developer friendly)
```bash
cat tests/reports/pilot-summary.md
```

**Raw JSON Data** (For CI/CD pipelines)
```bash
cat tests/reports/pilot-results.json | jq .
```

---

## 🔍 DEBUGGING FAILED TESTS

### Run Specific Test with Verbose Output
```bash
npx vitest run tests/pilot-scenarios/01-booking-payment-confirmation.test.ts --reporter=verbose
```

### Run Test in Watch Mode (Auto-rerun on changes)
```bash
npx vitest watch tests/pilot-scenarios/01-booking-payment-confirmation.test.ts
```

### Run Tests with Full Stack Traces
```bash
npx vitest run tests/pilot-scenarios/ --reporter=verbose --reporter=default
```

### Check Specific Integration Test
```bash
npx tsx tests/integration/test-courts-api.ts
```

---

## ✅ FRIDAY BEFORE SATURDAY PILOT CHECKLIST

```bash
# 1. Run pilot tests
npm run test:pilot

# 2. Verify all 5 scenarios pass
# Check: tests/reports/pilot-report.html

# 3. Run integration tests
npm run test:integration

# 4. Run stress tests (optional but recommended)
npm run test:stress

# 5. Check auth and connectivity
npm run test:auth
npm run test:connectivity

# 6. View final report
open tests/reports/pilot-report.html
```

**If all green (✅) → Ready for Saturday!**

---

## 🚀 SATURDAY MORNING CHECKLIST

```bash
# 1. Final pilot verification
npm run test:pilot

# 2. Check status
cat tests/reports/pilot-summary.md

# 3. Decision: 
# - All ✅ READY_FOR_PILOT → Deploy!
# - Any ❌ → Do NOT deploy, investigate
```

---

## 📋 QUICK REFERENCE TABLE

| Command | Category | Purpose | Duration |
|---------|----------|---------|----------|
| `test:pilot` | Pilot 🚀 | All 5 pilot scenarios | ~60s |
| `test:pilot:s1` | Pilot | Booking flow | ~10s |
| `test:pilot:s2` | Pilot | Double booking | ~8s |
| `test:pilot:s3` | Pilot | Payment failures | ~10s |
| `test:pilot:s4` | Pilot | Network handling | ~15s |
| `test:pilot:s5` | Pilot | Admin view | ~10s |
| `test:integration` | Integration 🔌 | All API tests | ~25s |
| `test:integration:courts` | Integration | Courts API | ~5s |
| `test:integration:dashboard` | Integration | Dashboard API | ~5s |
| `test:integration:members` | Integration | Members API | ~5s |
| `test:integration:referees` | Integration | Referees API | ~5s |
| `test:integration:community` | Integration | Community messaging | ~5s |
| `test:coach:all` | Coach 🏆 | All coach tests | ~30s |
| `test:connectivity` | Connectivity 🔗 | WebSocket tests | ~15s |
| `test:auth` | Auth 🔐 | Login & roles | ~10s |
| `test:data:seed` | Data 💾 | Seed database | ~5s |
| `test:stress` | Stress 💪 | Full load test | ~120s |
| `test:all` | All 🎯 | Everything | ~3min |

---

## 🛠️ TROUBLESHOOTING

### Command not found: `npm run`
```bash
npm install
npm run test:pilot
```

### Permission denied on shell scripts
```bash
chmod +x tests/connectivity/*.sh
npm run test:connectivity
```

### Database connection errors
```bash
npx prisma db push
npm run test:pilot
```

### Port already in use (WebSocket tests)
```bash
# Kill existing process
lsof -ti:3000 | xargs kill -9

# Then re-run
npm run test:connectivity
```

### Reports folder doesn't exist
```bash
mkdir -p tests/reports
npm run test:pilot
```

---

## 📚 DOCUMENTATION REFERENCES

- **[INDEX.md](./INDEX.md)** - Navigation & quick reference
- **[QUICK_START.md](./QUICK_START.md)** - 5-minute overview
- **[PILOT_TEST_SUITE.md](./PILOT_TEST_SUITE.md)** - Detailed pilot scenarios
- **[INFRASTRUCTURE_GUIDE.md](./INFRASTRUCTURE_GUIDE.md)** - Technical architecture
- **[README_IMPLEMENTATION.md](./README_IMPLEMENTATION.md)** - Implementation guide
- **[TEST_COMMANDS.md](./TEST_COMMANDS.md)** - This file

---

## 🎓 LEARNING PATHS

### For New Developers
1. Read: `INDEX.md`
2. Run: `npm run test:pilot`
3. View: `tests/reports/pilot-report.html`
4. Read: `QUICK_START.md`

### For Test Engineers
1. Read: `PILOT_TEST_SUITE.md`
2. Read: `INFRASTRUCTURE_GUIDE.md`
3. Run: Individual test commands
4. Explore: Test files in `tests/`

### For Project Leads
1. Run: `npm run test:pilot`
2. View: `open tests/reports/pilot-report.html`
3. Check: Status (🟢 = Ready, 🟡 = Fix, 🔴 = Critical)

---

**Last Updated:** April 29, 2026
**Pilot Date:** Saturday (This Weekend!)
**Status:** All tests organized and ready ✅
