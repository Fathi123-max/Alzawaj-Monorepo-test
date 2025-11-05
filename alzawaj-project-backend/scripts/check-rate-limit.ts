#!/usr/bin/env ts-node

/**
 * Quick Rate Limit Check
 * This script checks if the rate limit has reset
 */

import fetch from 'node-fetch';

const API_URL = 'https://alzawaj-backend.onrender.com';

async function checkRateLimitStatus() {
  console.log('Checking if rate limit has reset...\n');
  
  try {
    // Test a simple auth endpoint
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com' }),
    });
    
    const data = await response.json();
    
    if (response.status === 429) {
      console.log('⏳ Rate limit is still active');
      console.log('Message:', data.message);
      console.log('Please wait 15 minutes from the last test run');
    } else if (response.status === 400) {
      console.log('✅ Rate limit has reset!');
      console.log('Registration endpoint is accepting requests');
      console.log('(Got 400 because of invalid data, which is expected)');
    } else {
      console.log('❓ Unexpected response:', response.status);
      console.log('Message:', data.message);
    }
    
  } catch (error: any) {
    console.error('Error checking rate limit:', error.message);
  }
}

checkRateLimitStatus();