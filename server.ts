#!/usr/bin/env node

/**
 * Custom Next.js Server with Socket.IO Integration
 *
 * This server runs Next.js with integrated Socket.IO support
 * for real-time features while maintaining the same API routes.
 */

import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { initializeSocketIO } from './src/lib/socket.js';
import { collectDeveloperMetrics } from './src/lib/developerMetrics.js';
import { initProducer, closeProducer } from './src/app/api/notification/producer.js';

declare global {
  namespace NodeJS {
    interface Process {
      metricsInterval?: NodeJS.Timeout;
    }
  }
}

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

// Initialize Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Prepare Next.js
await app.prepare();

// Create HTTP server
const server = createServer((req, res) => {
  try {
    const parsedUrl = parse(req.url || '/', true);
    handle(req, res, parsedUrl);
  } catch (err) {
    console.error('HTTP Server Error:', err);
    res.statusCode = 500;
    res.end('Internal Server Error');
  }
});

// Initialize Socket.IO
initializeSocketIO(server);

// Metrics are now pushed via websocket events when updates occur.
// The internal broadcast endpoint remains available for external services to notify connected developers.

// Start server
server.listen(port, hostname, async () => {
  console.log(`🚀 Server running at http://${hostname}:${port}`);
  console.log(`🔗 Socket.IO endpoint: ws://${hostname}:${port}/api/socketio`);
  console.log(`📊 Environment: ${dev ? 'development' : 'production'}`);
  
  // Initialize Kafka producer
  try {
    await initProducer();
  } catch (err) {
    console.warn('[KAFKA] Producer initialization warning:', err instanceof Error ? err.message : err);
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  if (process.metricsInterval) clearInterval(process.metricsInterval);
  await closeProducer();
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  if (process.metricsInterval) clearInterval(process.metricsInterval);
  await closeProducer();
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});