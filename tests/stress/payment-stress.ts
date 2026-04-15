/**
 * Payment Processing - Stress Testing
 * Tests payment API endpoints under concurrent load
 * 
 * Run: npx ts-node tests/stress/payment-stress.ts
 */

import fetch from 'node-fetch';
import { writeStressReport } from './reporting';

const BASE_URL = process.env.STRESS_TEST_URL || 'http://localhost:3000';
const CONCURRENT_PAYMENTS = parseInt(process.env.CONCURRENT_PAYMENTS || '30', 10);
const PAYMENT_AMOUNT = 50; // USD
const REPORT_NAME = 'payment-stress';

interface PaymentMetrics {
  totalPayments: number;
  successfulPayments: number;
  failedPayments: number;
  totalRevenue: number;
  averageProcessingTime: number;
  minProcessingTime: number;
  maxProcessingTime: number;
  successRate: number;
  errorCounts: Record<string, number>;
  processingTimes: number[];
}

const metrics: PaymentMetrics = {
  totalPayments: 0,
  successfulPayments: 0,
  failedPayments: 0,
  totalRevenue: 0,
  averageProcessingTime: 0,
  minProcessingTime: Infinity,
  maxProcessingTime: 0,
  successRate: 0,
  errorCounts: {},
  processingTimes: [],
};

/**
 * Simulate payment processing
 */
async function processPayment(paymentId: string, userId: string): Promise<{ success: boolean; processingTime: number; error?: string }> {
  const requestStart = Date.now();

  try {
    const response = await fetch(`${BASE_URL}/api/payments/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer token-${userId}`,
      },
      body: JSON.stringify({
        paymentId,
        userId,
        amount: PAYMENT_AMOUNT,
        currency: 'USD',
        method: 'stripe', // or 'paypal', 'mpesa'
        description: `Stress test payment ${paymentId}`,
      }),
    }) as any;

    const processingTime = Date.now() - requestStart;
    metrics.processingTimes.push(processingTime);
    metrics.totalPayments++;

    if (response.ok) {
      const data = await response.json();
      if (data.status === 'completed' || data.status === 'success') {
        metrics.successfulPayments++;
        metrics.totalRevenue += PAYMENT_AMOUNT;
        return { success: true, processingTime };
      }
    }

    const errorMsg = `HTTP ${response.status}`;
    metrics.failedPayments++;
    metrics.errorCounts[errorMsg] = (metrics.errorCounts[errorMsg] || 0) + 1;
    return { success: false, processingTime, error: errorMsg };
  } catch (error) {
    const processingTime = Date.now() - requestStart;
    const errorMsg = error instanceof Error ? error.message : String(error);
    metrics.failedPayments++;
    metrics.errorCounts[errorMsg] = (metrics.errorCounts[errorMsg] || 0) + 1;
    metrics.totalPayments++;
    return { success: false, processingTime, error: errorMsg };
  }
}

/**
 * Calculate metrics
 */
function calculateMetrics(): void {
  if (metrics.processingTimes.length > 0) {
    metrics.minProcessingTime = Math.min(...metrics.processingTimes);
    metrics.maxProcessingTime = Math.max(...metrics.processingTimes);
    metrics.averageProcessingTime = metrics.processingTimes.reduce((a, b) => a + b, 0) / metrics.processingTimes.length;
    metrics.successRate = (metrics.successfulPayments / metrics.totalPayments) * 100;
  }
}

/**
 * Print results
 */
function printResults(): void {
  calculateMetrics();

  console.log('\n========================================');
  console.log('PAYMENT PROCESSING STRESS TEST - RESULTS');
  console.log('========================================\n');

  console.log('📊 Test Configuration:');
  console.log(`  • Concurrent Payments: ${CONCURRENT_PAYMENTS}`);
  console.log(`  • Payment Amount: $${PAYMENT_AMOUNT}\n`);

  console.log('💳 Payment Results:');
  console.log(`  • Total Payments: ${metrics.totalPayments}`);
  console.log(`  • Successful: ${metrics.successfulPayments}`);
  console.log(`  • Failed: ${metrics.failedPayments}`);
  console.log(`  • Success Rate: ${metrics.successRate.toFixed(2)}%`);
  console.log(`  • Total Revenue: $${metrics.totalRevenue}\n`);

  console.log('⏱️  Processing Time Metrics:');
  console.log(`  • Min Processing Time: ${metrics.minProcessingTime}ms`);
  console.log(`  • Max Processing Time: ${metrics.maxProcessingTime}ms`);
  console.log(`  • Avg Processing Time: ${metrics.averageProcessingTime.toFixed(2)}ms\n`);

  if (Object.keys(metrics.errorCounts).length > 0) {
    console.log('⚠️  Error Summary:');
    Object.entries(metrics.errorCounts).forEach(([error, count]) => {
      console.log(`  • ${error}: ${count}`);
    });
    console.log();
  }

  console.log('🏥 System Health:');
  if (metrics.successRate > 99.5) {
    console.log('  ✅ PASS: Payment system is highly reliable');
  } else if (metrics.successRate > 99) {
    console.log('  ✅ GOOD: Payment system is reliable');
  } else if (metrics.successRate > 95) {
    console.log('  ⚠️  WARNING: Some payment failures detected');
  } else {
    console.log('  ❌ FAIL: High payment failure rate - investigate immediately');
  }
}

/**
 * Main payment stress test
 */
async function runPaymentStressTest(): Promise<void> {
  console.log('\n🚀 Starting Payment Processing Stress Test...');
  console.log(`📍 Target: ${BASE_URL}`);
  console.log(`💳 Concurrent Payments: ${CONCURRENT_PAYMENTS}`);
  console.log(`💰 Amount per Payment: $${PAYMENT_AMOUNT}\n`);

  const paymentPromises: Promise<any>[] = [];

  for (let i = 0; i < CONCURRENT_PAYMENTS; i++) {
    paymentPromises.push(
      processPayment(`payment-${i}`, `user-${i}`)
    );
  }

  try {
    await Promise.all(paymentPromises);
    printResults();
    writeStressReport(
      {
        testName: REPORT_NAME,
        testType: 'Payment Processing',
        baseUrl: BASE_URL,
        concurrent: CONCURRENT_PAYMENTS,
        extraConfig: { paymentAmount: PAYMENT_AMOUNT },
      },
      {
        totalPayments: metrics.totalPayments,
        successfulPayments: metrics.successfulPayments,
        failedPayments: metrics.failedPayments,
        totalRevenue: metrics.totalRevenue,
        averageProcessingTime: metrics.averageProcessingTime,
        minProcessingTime: metrics.minProcessingTime,
        maxProcessingTime: metrics.maxProcessingTime,
        successRate: metrics.successRate,
      },
      metrics.errorCounts,
      metrics.processingTimes,
      ['Payment stress test completed']
    );
  } catch (error) {
    writeStressReport(
      {
        testName: REPORT_NAME,
        testType: 'Payment Processing',
        baseUrl: BASE_URL,
        concurrent: CONCURRENT_PAYMENTS,
        extraConfig: { paymentAmount: PAYMENT_AMOUNT },
      },
      {
        totalPayments: metrics.totalPayments,
        successfulPayments: metrics.successfulPayments,
        failedPayments: metrics.failedPayments,
        totalRevenue: metrics.totalRevenue,
        averageProcessingTime: metrics.averageProcessingTime,
        minProcessingTime: metrics.minProcessingTime,
        maxProcessingTime: metrics.maxProcessingTime,
        successRate: metrics.successRate,
      },
      metrics.errorCounts,
      metrics.processingTimes,
      [`Payment stress test failed: ${error instanceof Error ? error.message : String(error)}`]
    );
    console.error('❌ Payment stress test failed:', error);
    process.exit(1);
  }
}

runPaymentStressTest().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
