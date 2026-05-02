#!/usr/bin/env node

/**
 * Test script for login notification functionality
 * This script simulates sending a login notification to verify the Kafka producer works
 */

import { notify } from '../src/app/api/notification/producer.ts';

async function testLoginNotification() {
  console.log('🧪 Testing login notification...');

  try {
    // Simulate login notification data
    const testData = {
      to: 'test@example.com',
      channel: 'email',
      template: 'login',
      data: {
        name: 'John',
        dashboard_link: 'https://app.vicotennis.com/dashboard/player/123'
      }
    };

    console.log('📤 Sending test login notification:', testData);

    const result = await notify(testData);

    console.log('✅ Login notification sent successfully!');
    console.log('📋 Notification ID:', result.id);
    console.log('🔍 Check server logs for Kafka producer messages');

  } catch (error) {
    console.error('❌ Failed to send login notification:', error);
  }
}

// Run the test
testLoginNotification().catch(console.error);