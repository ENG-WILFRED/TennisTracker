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

// Set up metrics broadcast interval (every 5 seconds instead of polling every client)
const broadcastMetrics = async () => {
  try {
    const response = await fetch(`http://${hostname}:${port}/api/developer/metrics`, {
      method: 'GET',
    });
    
    if (response.ok) {
      const metrics = await response.json();
      // Use internal endpoint to broadcast
      await fetch(`http://${hostname}:${port}/api/developer/metrics-broadcast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.INTERNAL_API_TOKEN || 'internal-broadcast-token'}`
        },
        body: JSON.stringify({ metrics })
      }).catch(err => console.warn('Failed to broadcast metrics:', err));
    }
  } catch (err) {
    console.warn('Failed to fetch metrics for broadcast:', err);
  }
};

// Start metrics broadcast every 5 seconds
const metricsInterval = setInterval(broadcastMetrics, 5000);
console.log('📊 Metrics broadcast interval started (every 5 seconds)');

// Store interval reference for cleanup
process.metricsInterval = metricsInterval;

// Start server
server.listen(port, hostname, () => {
  console.log(`🚀 Server running at http://${hostname}:${port}`);
  console.log(`🔗 Socket.IO endpoint: ws://${hostname}:${port}/api/socketio`);
  console.log(`📊 Environment: ${dev ? 'development' : 'production'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  if (process.metricsInterval) clearInterval(process.metricsInterval);
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  if (process.metricsInterval) clearInterval(process.metricsInterval);
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});