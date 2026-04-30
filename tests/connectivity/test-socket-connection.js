#!/usr/bin/env node

/**
 * Simple Socket.IO Connection Test
 * Tests the integrated Socket.IO server
 */

import { io } from 'socket.io-client';

const SOCKET_URL = process.argv[2] || 'http://localhost:3000';

console.log(`🔗 Testing Socket.IO connection to: ${SOCKET_URL}`);

const socket = io(SOCKET_URL, {
  path: '/api/socketio',
  transports: ['websocket', 'polling']
});

socket.on('connect', () => {
  console.log('✅ Socket.IO connection opened');

  // Send authentication message
  socket.emit('auth', {
    token: 'test-jwt-token-for-integration-test'
  });
});

socket.on('authenticated', (data) => {
  console.log('✅ Authentication successful:', data);

  // Send a ping message
  setTimeout(() => {
    socket.emit('ping', { message: 'Hello from test client' });
  }, 1000);
});

socket.on('pong', (data) => {
  console.log('🏓 Pong received:', data);
});

socket.on('auth_error', (error) => {
  console.error('❌ Authentication error:', error);
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error.message);
});

socket.on('disconnect', (reason) => {
  console.log(`🔌 Socket.IO disconnected: ${reason}`);
});

// Timeout after 10 seconds
setTimeout(() => {
  console.log('⏰ Test timeout - closing connection');
  socket.close();
}, 10000);