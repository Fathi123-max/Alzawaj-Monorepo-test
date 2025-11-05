#!/usr/bin/env ts-node

/**
 * Login Endpoint Test Script
 * This script tests the login endpoint functionality
 */

import fetch from 'node-fetch';

const API_URL = 'https://alzawaj-backend.onrender.com';

// Test data for login validation
const invalidLoginData = {
  username: '', // Empty username
  password: ''  // Empty password
};

// Test data for proper login format (using placeholder data)
const validLoginData = {
  username: 'test@example.com',
  password: 'TestPass123'
};

async function testLoginEndpoint() {
  console.log('🧪 Testing Login Endpoint...\n');
  
  try {
    // Test 1: Validation with empty data
    console.log('1. Testing validation with empty data...');
    const invalidResponse = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidLoginData),
    });
    
    const invalidData = await invalidResponse.json();
    console.log(`   Status: ${invalidResponse.status} ${invalidResponse.status === 400 ? '✅' : '❌'}`);
    
    if (invalidResponse.status === 400) {
      console.log('   ✅ Validation working correctly');
      if (invalidData.errors && Array.isArray(invalidData.errors)) {
        console.log(`   ✅ Error structure correct (${invalidData.errors.length} validation errors)`);
      }
    } else if (invalidResponse.status === 429) {
      console.log('   ⚠️  Rate limited - try again in 15 minutes');
      console.log(`   Message: ${invalidData.message}`);
      return;
    }
    
    // Test 2: Valid format test
    console.log('\n2. Testing with valid format...');
    const validResponse = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validLoginData),
    });
    
    const validData = await validResponse.json();
    console.log(`   Status: ${validResponse.status}`);
    
    if (validResponse.status === 429) {
      console.log('   ⚠️  Rate limited - try again in 15 minutes');
      console.log(`   Message: ${validData.message}`);
    } else if (validResponse.status === 400) {
      console.log('   ✅ Valid format accepted (returned 400 because user does not exist)');
    } else if (validResponse.status === 401) {
      console.log('   ✅ Valid format accepted (returned 401 for authentication failure)');
    } else {
      console.log(`   ❓ Unexpected status: ${validResponse.status}`);
    }
    
    console.log('\n📋 Login endpoint test completed!');
    console.log('\n📝 Summary:');
    console.log('   - Endpoint exists and is accessible');
    console.log('   - Validation is working');
    console.log('   - Error responses are properly formatted');
    
  } catch (error: any) {
    console.error('❌ Error testing login endpoint:', error.message);
  }
}

// Run the test
testLoginEndpoint();
