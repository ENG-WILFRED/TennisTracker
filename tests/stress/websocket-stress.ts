/**
 * WebSocket Connection - Stress Testing
 * Tests real-time messaging and updates under concurrent load
 * 
 * Run: npx ts-node tests/stress/websocket-stress.ts
 */

import { io } from 'socket.io-client';
import { writeStressReport } from './reporting';

const BASE_URL = process.env.STRESS_TEST_URL || 'http://localhost:3000';
const WS_ENDPOINT = BASE_URL;
const CONCURRENT_CONNECTIONS = parseInt(process.env.CONCURRENT_CONNECTIONS || '50', 10);
const MESSAGES_PER_CONNECTION = parseInt(process.env.MESSAGES_PER_CONNECTION || '20', 10);
const TEST_DURATION = parseInt(process.env.TEST_DURATION || '30', 10); // seconds
const REPORT_NAME = 'websocket-stress';

interface WebSocketMetrics {
  totalConnections: number;
  successfulConnections: number;
  failedConnections: number;
  totalMessagesReceived: number;
  totalMessagesSent: number;
  averageLatency: number;
  minLatency: number;
  maxLatency: number;
  connectionErrors: Record<string, number>;
  latencies: number[];
}

const metrics: WebSocketMetrics = {
  totalConnections: 0,
  successfulConnections: 0,
  failedConnections: 0,
  totalMessagesReceived: 0,
  totalMessagesSent: 0,
  averageLatency: 0,
  minLatency: Infinity,
  maxLatency: 0,
  connectionErrors: {},
  latencies: [],
};

/**
 * Simulate WebSocket connection and messaging
 */
function simulateWebSocketConnection(clientId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    metrics.totalConnections++;

    try {
      const mockToken = 'test-jwt-token-for-stress-testing';
      const socket = io(WS_ENDPOINT, {
        path: '/api/socketio',
        transports: ['websocket'],
        timeout: 10000,
        reconnection: false,
      });

      let messageCount = 0;
      const connectionStart = Date.now();
      let sendInterval: NodeJS.Timeout | null = null;
      let timeoutHandle: NodeJS.Timeout | null = null;

      const cleanup = () => {
        if (sendInterval) {
          clearInterval(sendInterval);
        }
        if (timeoutHandle) {
          clearTimeout(timeoutHandle);
        }
        socket.close();
      };

      socket.on('connect', () => {
        metrics.successfulConnections++;
        console.log(`✅ Client ${clientId} connected`);

        socket.emit('auth', { token: mockToken });

        sendInterval = setInterval(() => {
          if (messageCount >= MESSAGES_PER_CONNECTION) {
            cleanup();
            resolve();
            return;
          }

          const message = {
            type: 'ping',
            clientId,
            messageId: messageCount,
            timestamp: new Date().toISOString(),
          };

          socket.emit('ping', message);
          metrics.totalMessagesSent++;
          messageCount++;
        }, 100);

        timeoutHandle = setTimeout(() => {
          cleanup();
          resolve();
        }, TEST_DURATION * 1000);
      });

      socket.on('pong', (data) => {
        metrics.totalMessagesReceived++;
        if (data?.timestamp) {
          const latency = Date.now() - new Date(data.timestamp).getTime();
          metrics.latencies.push(latency);
        }
      });

      socket.on('auth_error', (error) => {
        const errorMsg = typeof error === 'string' ? error : error?.message || 'auth_error';
        metrics.connectionErrors[errorMsg] = (metrics.connectionErrors[errorMsg] || 0) + 1;
        metrics.failedConnections++;
        cleanup();
        reject(new Error(errorMsg));
      });

      socket.on('connect_error', (error) => {
        const errorMsg = error?.message || 'connect_error';
        metrics.connectionErrors[errorMsg] = (metrics.connectionErrors[errorMsg] || 0) + 1;
        metrics.failedConnections++;
        cleanup();
        reject(new Error(errorMsg));
      });

      socket.on('disconnect', (reason) => {
        if (messageCount >= MESSAGES_PER_CONNECTION) {
          resolve();
        } else {
          if (!timeoutHandle) {
            resolve();
          }
        }
      });
    } catch (error) {
      metrics.failedConnections++;
      const errorMsg = error instanceof Error ? error.message : String(error);
      metrics.connectionErrors[errorMsg] = (metrics.connectionErrors[errorMsg] || 0) + 1;
      reject(error);
    }
  });
}

/**
 * Calculate metrics
 */
function calculateMetrics(): void {
  if (metrics.latencies.length > 0) {
    metrics.minLatency = Math.min(...metrics.latencies);
    metrics.maxLatency = Math.max(...metrics.latencies);
    metrics.averageLatency = metrics.latencies.reduce((a, b) => a + b, 0) / metrics.latencies.length;
  }
}

/**
 * Print results
 */
function printResults(): void {
  calculateMetrics();

  console.log('\n========================================');
  console.log('WEBSOCKET STRESS TEST - RESULTS');
  console.log('========================================\n');

  console.log('📊 Test Configuration:');
  console.log(`  • Concurrent Connections: ${CONCURRENT_CONNECTIONS}`);
  console.log(`  • Messages per Connection: ${MESSAGES_PER_CONNECTION}`);
  console.log(`  • Test Duration: ${TEST_DURATION}s\n`);

  console.log('✅ Connection Results:');
  console.log(`  • Total Connections: ${metrics.totalConnections}`);
  console.log(`  • Successful: ${metrics.successfulConnections}`);
  console.log(`  • Failed: ${metrics.failedConnections}`);
  console.log(`  • Success Rate: ${((metrics.successfulConnections / metrics.totalConnections) * 100).toFixed(2)}%\n`);

  console.log('📨 Messaging:');
  console.log(`  • Messages Sent: ${metrics.totalMessagesSent}`);
  console.log(`  • Messages Received: ${metrics.totalMessagesReceived}`);
  console.log(`  • Delivery Rate: ${((metrics.totalMessagesReceived / metrics.totalMessagesSent) * 100).toFixed(2)}%\n`);

  console.log('⏱️  Latency Metrics:');
  console.log(`  • Min Latency: ${metrics.minLatency}ms`);
  console.log(`  • Max Latency: ${metrics.maxLatency}ms`);
  console.log(`  • Avg Latency: ${metrics.averageLatency.toFixed(2)}ms\n`);

  if (Object.keys(metrics.connectionErrors).length > 0) {
    console.log('⚠️  Error Summary:');
    Object.entries(metrics.connectionErrors).forEach(([error, count]) => {
      console.log(`  • ${error}: ${count}`);
    });
    console.log();
  }

  console.log('🏥 System Health:');
  if (metrics.successfulConnections / metrics.totalConnections > 0.95) {
    console.log('  ✅ PASS: WebSocket system handles concurrent connections well');
  } else {
    console.log('  ⚠️  WARNING: Connection stability concerns detected');
  }
}

/**
 * Main WebSocket stress test
 */
async function runWebSocketStressTest(): Promise<void> {
  console.log('\n🚀 Starting WebSocket Stress Test...');
  console.log(`📍 Target: ${BASE_URL}`);
  console.log(`🔌 Concurrent Connections: ${CONCURRENT_CONNECTIONS}`);
  console.log(`💬 Messages per Connection: ${MESSAGES_PER_CONNECTION}\n`);

  const connectionPromises: Promise<void>[] = [];

  for (let i = 0; i < CONCURRENT_CONNECTIONS; i++) {
    connectionPromises.push(simulateWebSocketConnection(`client-${i}`));
    // Stagger connection attempts
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  try {
    await Promise.all(connectionPromises);
    printResults();
    writeStressReport(
      {
        testName: REPORT_NAME,
        testType: 'WebSocket',
        baseUrl: BASE_URL,
        concurrent: CONCURRENT_CONNECTIONS,
        durationSeconds: TEST_DURATION,
        extraConfig: { messagesPerConnection: MESSAGES_PER_CONNECTION },
      },
      {
        totalConnections: metrics.totalConnections,
        successfulConnections: metrics.successfulConnections,
        failedConnections: metrics.failedConnections,
        totalMessagesSent: metrics.totalMessagesSent,
        totalMessagesReceived: metrics.totalMessagesReceived,
        averageLatency: metrics.averageLatency,
        minLatency: metrics.minLatency,
        maxLatency: metrics.maxLatency,
      },
      metrics.connectionErrors,
      metrics.latencies,
      ['WebSocket stress test completed']
    );
  } catch (error) {
    writeStressReport(
      {
        testName: REPORT_NAME,
        testType: 'WebSocket',
        baseUrl: BASE_URL,
        concurrent: CONCURRENT_CONNECTIONS,
        durationSeconds: TEST_DURATION,
        extraConfig: { messagesPerConnection: MESSAGES_PER_CONNECTION },
      },
      {
        totalConnections: metrics.totalConnections,
        successfulConnections: metrics.successfulConnections,
        failedConnections: metrics.failedConnections,
        totalMessagesSent: metrics.totalMessagesSent,
        totalMessagesReceived: metrics.totalMessagesReceived,
        averageLatency: metrics.averageLatency,
        minLatency: metrics.minLatency,
        maxLatency: metrics.maxLatency,
      },
      metrics.connectionErrors,
      metrics.latencies,
      [`WebSocket stress test failed: ${error instanceof Error ? error.message : String(error)}`]
    );
    console.error('❌ WebSocket stress test failed:', error);
    process.exit(1);
  }
}

runWebSocketStressTest().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
