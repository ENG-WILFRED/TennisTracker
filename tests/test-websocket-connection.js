#!/usr/bin/env node

/**
 * Simple WebSocket Connection Test
 * Tests the integrated WebSocket server
 */

import WebSocket from 'ws';

const WS_URL = process.argv[2] || 'ws://localhost:3000/api/websocket?token=test-token';

console.log(`🔗 Testing WebSocket connection to: ${WS_URL}`);

const ws = new WebSocket(WS_URL);

ws.on('open', () => {
  console.log('✅ WebSocket connection opened');

  // Send authentication message
  ws.send(JSON.stringify({
    type: 'auth',
    token: 'test-jwt-token'
  }));

  // Send a ping message
  setTimeout(() => {
    ws.send(JSON.stringify({
      type: 'ping',
      data: { message: 'Hello from test client' }
    }));
  }, 1000);
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    console.log('📨 Received:', message);
  } catch (error) {
    console.log('📨 Received (raw):', data.toString());
  }
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error.message);
});

ws.on('close', (code, reason) => {
  console.log(`🔌 WebSocket closed: ${code} - ${reason.toString()}`);
});

// Timeout after 10 seconds
setTimeout(() => {
  console.log('⏰ Test timeout - closing connection');
  ws.close();
}, 10000);