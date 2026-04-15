# 🧪 Vico Sports Testing Suite

Complete testing infrastructure for stress testing, load testing, and performance optimization of the Vico Sports platform.

## 📁 Folder Structure

```
tests/
├── stress/
│   ├── court-booking-stress.ts      # Court booking API stress test
│   ├── auth-stress.ts               # Authentication system stress test
│   ├── websocket-stress.ts          # WebSocket connection stress test
│   ├── payment-stress.ts            # Payment processing stress test
│   └── README.md                    # Stress tests documentation
│
├── artillery/
│   ├── vico-load-test.yml          # Artillery load test configuration
│   └── README.md                    # Artillery documentation
│
├── load/                            # Long-duration load tests (upcoming)
├── integration/                     # Integration tests (upcoming)
├── performance/                     # Performance benchmarks (upcoming)
├── reports/                         # Test reports and results
│
├── run-all-tests.ts                # Master test runner script
├── STRESS_TESTING_GUIDE.md          # Comprehensive stress testing guide
├── PERFORMANCE_OPTIMIZATIONS.ts     # Performance optimization recommendations
└── README.md                        # This file
```

## 🚀 Quick Start (5 minutes)

### 1. Prerequisites
```bash
# Install dependencies
npm install -D ts-node @types/node node-fetch ws

# Optional: Install Artillery for HTTP load testing
npm install -g artillery
```

### 2. Start the Application
```bash
# In one terminal
npm run dev
# Wait for "ready - started server on 0.0.0.0:3000"
```

### 3. Run Stress Tests
```bash
# In another terminal - run all stress tests
npx ts-node tests/run-all-tests.ts --suite all

# Or run specific tests
npx ts-node tests/run-all-tests.ts --suite court-booking
npx ts-node tests/run-all-tests.ts --suite auth
npx ts-node tests/run-all-tests.ts --suite websocket
npx ts-node tests/run-all-tests.ts --suite payment
```

### 4. Review Reports
```bash
# Check the latest test report
cat tests/reports/stress-test-report-*.txt | tail -100
```

## 📊 Available Tests

### 1. Court Booking Stress Test
**What it tests:** Multiple users booking courts concurrently
```bash
CONCURRENT_USERS=50 npx ts-node tests/stress/court-booking-stress.ts
```
**Metrics tracked:** Success rate, response time, throughput (requests/sec)
**Target:** >95% success rate, <500ms avg response time

### 2. Authentication Stress Test
**What it tests:** Login and registration under concurrent load
```bash
# Test login
CONCURRENT_USERS=100 TEST_MODE=login npx ts-node tests/stress/auth-stress.ts

# Test registration
CONCURRENT_USERS=100 TEST_MODE=register npx ts-node tests/stress/auth-stress.ts
```
**Metrics tracked:** Auth success rate, token generation time
**Target:** >99% success rate, <100ms avg auth time

### 3. WebSocket Stress Test
**What it tests:** Real-time messaging with many concurrent connections
```bash
CONCURRENT_CONNECTIONS=50 npx ts-node tests/stress/websocket-stress.ts
```
**Metrics tracked:** Connection stability, message delivery, latency
**Target:** >99% message delivery, <100ms latency

### 4. Payment Processing Stress Test
**What it tests:** Payment API resilience
```bash
CONCURRENT_PAYMENTS=30 npx ts-node tests/stress/payment-stress.ts
```
**Metrics tracked:** Payment success rate, processing time
**Target:** >99.5% success rate, <2000ms processing time

### 5. Artillery HTTP Load Test
**What it tests:** End-to-end user workflows with realistic think times
```bash
artillery run tests/artillery/vico-load-test.yml
```
**Scenarios:** Court booking, tournament registration, dashboard access, community
**Waves:** Ramp-up → Sustained → Spike load profile

## 🎯 Test Parameters

Customize test behavior:

```bash
npx ts-node tests/run-all-tests.ts \
  --suite all                    # Test suite: all, court-booking, auth, websocket, payment
  --concurrent 100               # Concurrent users/connections
  --duration 120                 # Test duration in seconds
  --url http://localhost:3000    # Base URL
```

## 📈 Understanding Results

### Success Metrics
- ✅ **PASS**: Test completed without failures
- ⚠️ **WARNING**: Test passed but with issues
- ❌ **FAIL**: Test failed, needs investigation

### Key Metrics

| Metric | Good | Warning | Critical |
|--------|------|---------|----------|
| Success Rate | >95% | 90-95% | <90% |
| Avg Response Time | <500ms | 500-2000ms | >2000ms |
| WebSocket Latency | <100ms | 100-500ms | >500ms |
| Payment Success | >99.5% | 99-99.5% | <99% |

### Reading the Report

```
✅ PASS | Court Booking Endpoints           | 45.23s
❌ FAIL | Authentication - Registration    | 52.10s
   └─ Error: Connection timeout

Total Tests:     4
Passed:          3 (75%)
Failed:          1 (25%)
Total Duration:  180.45s

System Health: ⚠️ WARNING: Some tests failed. Review logs above.
```

## 🔧 Performance Optimization Steps

### Immediate Actions (If Tests Fail)

1. **Check Application Logs**
   ```bash
   # Review error messages
   tail -f .next/logs/app.log
   ```

2. **Monitor System Resources**
   ```bash
   # Watch CPU, memory, disk
   top
   # or
   htop
   ```

3. **Check Database Status**
   ```bash
   # Verify database connectivity
   npm run prisma:status
   ```

4. **Scale Connection Pools**
   - Increase `DATABASE_POOL_MAX` in .env
   - Increase Redis connection limit
   - Restart application

### Medium-Term Optimizations

- ✅ Add database indexes (see PERFORMANCE_OPTIMIZATIONS.ts)
- ✅ Enable Redis caching
- ✅ Implement query result caching
- ✅ Add API response compression
- ✅ Setup rate limiting

### Long-Term Improvements

- ✅ Horizontal scaling (multiple app instances)
- ✅ Load balancer setup
- ✅ Advanced caching strategies
- ✅ Database replication
- ✅ CDN for static content

## 📊 Monitoring During Tests

### Watch Real-Time Metrics

```bash
# Terminal 1: Run test
npx ts-node tests/stress/court-booking-stress.ts

# Terminal 2: Monitor system
watch 'ps aux | grep node'
```

### Check Database Load

```bash
# Check active connections
SELECT count(*) FROM pg_stat_activity;

# Check slow queries
SELECT query, mean_time FROM pg_stat_statements ORDER BY mean_time DESC;
```

### Monitor WebSocket Connections

```bash
# Check open sockets
netstat -an | grep ESTABLISHED | wc -l
```

## 🐛 Troubleshooting

### Common Issues

**Connection Refused**
```bash
# Ensure app is running
npm run dev
# Or check if port 3000 is in use
lsof -i :3000
```

**High Memory Usage**
- Reduce concurrent users: `--concurrent 20`
- Check for memory leaks in application
- Monitor garbage collection

**Timeout Errors**
- Increase timeout values in test files
- Check network connectivity
- Verify database is responsive

**WebSocket Connection Failures**
- Ensure WebSocket support is enabled
- Check for reverse proxy issues
- Verify Redis connection if using adapter

## 📚 Documentation

- **[STRESS_TESTING_GUIDE.md](./STRESS_TESTING_GUIDE.md)** - Detailed stress testing guide
- **[PERFORMANCE_OPTIMIZATIONS.ts](./PERFORMANCE_OPTIMIZATIONS.ts)** - Optimization strategies
- **[stress/README.md](./stress/)** - Stress test details
- **[artillery/README.md](./artillery/)** - Artillery load testing

## 🚀 CI/CD Integration

### Git Pre-commit Hook
```bash
#!/bin/bash
# Run quick smoke test before commit
npx ts-node tests/run-all-tests.ts --suite court-booking --concurrent 10
```

### GitHub Actions
```yaml
name: Stress Tests
on: [push]
jobs:
  stress-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run build
      - run: npm start &
      - run: sleep 10
      - run: npx ts-node tests/run-all-tests.ts --suite all
```

## 📈 Performance Goals

**By Load Level:**

| Users | Requests/sec | Avg Response | Success Rate |
|-------|-------------|--------------|--------------|
| 50 | 500-1000 | <500ms | >95% |
| 100 | 1000-2000 | <1000ms | >90% |
| 200 | 2000-4000 | <2000ms | >85% |

## ✅ Pre-Production Checklist

Before deploying to production:

- [ ] Run full stress test suite
- [ ] All tests passing
- [ ] Load test with 100+ concurrent users
- [ ] Monitor system metrics during peak load
- [ ] Database queries optimized
- [ ] Caching configured and working
- [ ] Rate limiting enabled
- [ ] Error handling verified
- [ ] Monitoring and alerting configured
- [ ] Rollback plan documented

## 🎓 Learning Resources

- [Node.js Performance Best Practices](https://nodejs.org/en/docs/guides/nodejs-performance/)
- [PostgreSQL Optimization](https://www.postgresql.org/docs/current/performance.html)
- [Redis Patterns](https://redis.io/docs/)
- [WebSocket Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)

## 📞 Support & Issues

For questions or issues:
1. Check test output carefully
2. Review system logs
3. Run individual test with detailed output
4. Check documentation files
5. Monitor database and system resources

---

**Last Updated:** April 15, 2026  
**Created By:** Vico Sports  
**Version:** 1.0  
**Stability:** Production Ready
