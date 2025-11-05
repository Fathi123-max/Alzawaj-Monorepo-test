#!/usr/bin/env ts-node

/**
 * Rate Limit Monitor
 * This script monitors when the rate limit resets by periodically checking
 */

import fetch from 'node-fetch';

const API_URL = 'https://alzawaj-backend.onrender.com';
const CHECK_INTERVAL = 60000; // 1 minute

async function checkRateLimitStatus() {
  try {
    // Test a simple auth endpoint
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com' }),
    });
    
    const data = await response.json();
    const timestamp = new Date().toLocaleTimeString();
    
    if (response.status === 429) {
      console.log(`[${timestamp}] ⏳ Rate limit still active - ${data.message}`);
      return false;
    } else if (response.status === 400) {
      console.log(`[${timestamp}] ✅ Rate limit has reset! Registration endpoint is accepting requests.`);
      console.log(`[${timestamp}] (Got 400 because of invalid data, which is expected)`);
      return true;
    } else {
      console.log(`[${timestamp}] ❓ Unexpected response: ${response.status} - ${data.message}`);
      return false;
    }
    
  } catch (error: any) {
    console.error(`[${new Date().toLocaleTimeString()}] Error checking rate limit:`, error.message);
    return false;
  }
}

async function monitorRateLimit() {
  console.log('🔍 Starting rate limit monitoring...');
  console.log('This script will check every minute if the rate limit has reset.\n');
  console.log('Press Ctrl+C to stop monitoring.\n');
  
  // Initial check
  const initialStatus = await checkRateLimitStatus();
  if (initialStatus) {
    console.log('\n🎉 Rate limit has reset! You can now run your tests.');
    process.exit(0);
  }
  
  // Set up periodic checking
  const intervalId = setInterval(async () => {
    const status = await checkRateLimitStatus();
    if (status) {
      console.log('\n🎉 Rate limit has reset! You can now run your tests.');
      clearInterval(intervalId);
      process.exit(0);
    }
  }, CHECK_INTERVAL);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Monitoring stopped.');
  process.exit(0);
});

// Start monitoring
monitorRateLimit();