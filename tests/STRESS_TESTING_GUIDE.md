# 🧪 Vico Sports - Stress Testing & Performance Suite

Complete testing suite for validating system resilience under high load and concurrent usage.

## 📁 Test Structure

```
tests/
├── stress/                          # Stress and load tests
│   ├── court-booking-stress.ts      # Court booking endpoints (50 concurrent users)
│   ├── auth-stress.ts               # Authentication system (100 concurrent users)
│   ├── websocket-stress.ts          # Real-time messaging (50 concurrent connections)
│   ├── payment-stress.ts            # Payment processing (30 concurrent payments)
│   └── ...
├── artillery/                       # HTTP load testing configs
│   └── vico-load-test.yml          # Artillery load test scenario
├── load/                            # Long-duration load tests
├── integration/                     # Integration tests
├── performance/                     # Performance benchmarks
├── run-all-tests.ts                # Master test runner
└── STRESS_TESTING_GUIDE.md         # This file
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install -D ts-node @types/node node-fetch ws
npm install -g artillery  # For HTTP load testing
```

### 2. Make sure your app is running

```bash
npm run dev
# Or in production mode
npm run build && npm start
```

### 3. Run Stress Tests

**Run all tests:**
```bash
npx ts-node tests/run-all-tests.ts --suite all
```

**Run specific test suite:**
```bash
npx ts-node tests/run-all-tests.ts --suite court-booking
npx ts-node tests/run-all-tests.ts --suite auth
npx ts-node tests/run-all-tests.ts --suite websocket
npx ts-node tests/run-all-tests.ts --suite payment
```

**Customize test parameters:**
```bash
npx ts-node tests/run-all-tests.ts \
  --suite all \
  --concurrent 100 \
  --duration 120 \
  --url http://localhost:3000
```

## 📊 Individual Test Scripts

### Court Booking Endpoints
Tests concurrent court reservation requests
```bash
CONCURRENT_USERS=50 REQUESTS_PER_USER=10 \
npx ts-node tests/stress/court-booking-stress.ts
```

**Metrics:**
- Successful booking rate
- Average response time
- Peak throughput (requests/second)

### Authentication System
Tests login and registration under load
```bash
# Test login
CONCURRENT_USERS=100 TEST_MODE=login \
npx ts-node tests/stress/auth-stress.ts

# Test registration
CONCURRENT_USERS=100 TEST_MODE=register \
npx ts-node tests/stress/auth-stress.ts
```

**Metrics:**
- Authentication success rate
- Session creation time
- Token generation throughput

### WebSocket Connections
Tests real-time messaging stability
```bash
CONCURRENT_CONNECTIONS=50 MESSAGES_PER_CONNECTION=20 TEST_DURATION=30 \
npx ts-node tests/stress/websocket-stress.ts
```

**Metrics:**
- Connection establishment rate
- Message delivery rate
- Average latency
- Connection stability

### Payment Processing
Tests payment endpoint resilience
```bash
CONCURRENT_PAYMENTS=30 \
npx ts-node tests/stress/payment-stress.ts
```

**Metrics:**
- Payment success rate
- Processing time
- Total revenue processed
- Payment failure types

## 🎯 Artillery Load Testing

Run realistic multi-user scenarios with think times and flow orchestration:

```bash
# Run load test
artillery run tests/artillery/vico-load-test.yml

# Generate HTML report
artillery run tests/artillery/vico-load-test.yml --output report.json
artillery report report.json
```

**Scenarios included:**
- Court booking flow
- Tournament registration
- Dashboard access
- Community interaction
- API health checks

## 📈 Performance Benchmarks

### Target Metrics (Based on 50 Concurrent Users)

| Metric | Target | Critical |
|--------|--------|----------|
| Court Booking Success Rate | >95% | <90% |
| Auth Success Rate | >99% | <98% |
| WebSocket Delivery Rate | >99% | <95% |
| Payment Success Rate | >99.5% | <99% |
| Avg Response Time | <500ms | >2000ms |
| WebSocket Latency | <100ms | >500ms |

### System Capacity Guidelines

**At 50 Concurrent Users:**
- 500-1000 requests/second typical
- <500ms p95 response time
- <100ms WebSocket latency

**At 100 Concurrent Users:**
- 1000-2000 requests/second typical
- <1000ms p95 response time
- <200ms WebSocket latency

## 🔧 Performance Optimizations

### 1. Database Connection Pooling
```typescript
// Configure in .env
DATABASE_POOL_MIN=5
DATABASE_POOL_MAX=20
```

### 2. Redis Caching
```typescript
// Enable caching for frequently accessed data
REDIS_URL=redis://localhost:6379
CACHE_TTL=300  // 5 minutes
```

### 3. API Response Compression
```typescript
// Already configured in next.config.ts
// Verify compression is enabled
```

### 4. Database Query Optimization
- Add indexes to frequently filtered columns
- Implement query result caching
- Use SELECT * sparingly; specify needed fields

### 5. WebSocket Optimization
- Connection pooling via Redis Adapter
- Message compression for large payloads
- Graceful connection handling

### 6. Rate Limiting
```typescript
// Limit requests per user
RATE_LIMIT=100  // requests per minute
```

## 📊 Reading Test Reports

Reports are saved in `tests/reports/` with format: `stress-test-report-{timestamp}.txt`

**Report includes:**
- Test configuration and parameters
- Individual test results (PASS/FAIL)
- Success rates and error counts
- Performance metrics (response times, latency)
- System health assessment
- Recommended optimizations

## 🚨 Stress Test Failure Troubleshooting

### High Auth Failures
- Check database connection limits
- Verify token generation efficiency
- Review password hashing algorithm

### WebSocket Connection Drops
- Monitor memory usage during test
- Check for WebSocket pool exhaustion
- Verify Redis connection stability

### Payment Processing Failures
- Validate payment provider credentials
- Check transaction database constraints
- Review payment timeout settings

### General High Response Times
- Monitor CPU and memory usage
- Check database query performance
- Review application logs for bottlenecks
- Consider horizontal scaling

## 🏗️ CI/CD Integration

### GitHub Actions Example

```yaml
name: Stress Tests

on: [push, pull_request]

jobs:
  stress-test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
      redis:
        image: redis:7
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm run build
      - run: npm start &
      - run: sleep 10
      - run: npx ts-node tests/run-all-tests.ts --suite all
```

## 📝 Custom Test Creation

Create custom stress tests by following this pattern:

```typescript
import fetch from 'node-fetch';

interface TestMetrics {
  totalRequests: number;
  successCount: number;
  failureCount: number;
  responseTimes: number[];
}

async function runCustomTest(): Promise<void> {
  const metrics: TestMetrics = { /* ... */ };
  
  // Your test logic here
  
  console.log(`Success Rate: ${(metrics.successCount / metrics.totalRequests * 100).toFixed(2)}%`);
}
```

## 🎓 Documentation

- [STRESS_TESTING_GUIDE.md](./STRESS_TESTING_GUIDE.md) - This file
- [API_ROUTES_AND_DATA_STRUCTURES.md](../documentation/API_ROUTES_AND_DATA_STRUCTURES.md) - API reference
- [WEBSOCKET_ARCHITECTURE.md](../documentation/WEBSOCKET_ARCHITECTURE.md) - WebSocket details
- [DEPLOYMENT.md](../documentation/DEPLOYMENT.md) - Production deployment

## ✅ Pre-Production Checklist

- [ ] Run full stress test suite
- [ ] Verify all metrics meet targets
- [ ] Load test with production-like data volume
- [ ] Monitor system during peak traffic simulation
- [ ] Review and address all warnings
- [ ] Test auto-scaling capabilities
- [ ] Validate monitoring and alerting
- [ ] Document performance characteristics

## 📞 Support

For issues or questions:
1. Check test output logs
2. Review system logs (`docker logs` or app logs)
3. Check database connection status
4. Verify network connectivity

---

**Last Updated:** April 15, 2026
**Version:** 1.0
