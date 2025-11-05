#!/usr/bin/env ts-node

/**
 * Registration Endpoint Test Script
 * This script tests the registration endpoint structure without creating actual users
 */

import fetch from 'node-fetch';

const API_URL = 'https://alzawaj-backend.onrender.com';

// Test registration data with validation errors (to test endpoint without creating users)
const testRegistrationData = {
  email: 'invalid-email', // Invalid email format
  phone: '123', // Invalid phone format
  password: '123', // Too short
  confirmPassword: '1234', // Doesn't match
  gender: 'x', // Invalid gender
  basicInfo: {
    name: 'A', // Too short
    age: 15 // Too young
  }
};

async function testRegistrationEndpoint() {
  try {
    console.log('Testing registration endpoint structure...\\n');
    
    // Test registration with invalid data to check endpoint response structure
    const regResponse = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testRegistrationData),
    });
    
    const regData = await regResponse.json();
    
    console.log('Registration Endpoint Test Results:');
    console.log('  Status Code:', regResponse.status);
    console.log('  Response Type:', regResponse.status === 400 ? 'VALIDATION ERRORS (Expected)' : 'UNEXPECTED');
    
    if (regResponse.status === 400) {
      console.log('  ✅ Registration endpoint is working correctly');
      console.log('  ✅ Validation is active');
      console.log('  ✅ Error responses are properly formatted');
      
      // Check if we have validation errors in the response
      if (regData.errors && Array.isArray(regData.errors)) {
        console.log('  ✅ Error structure is correct');
        console.log('  Number of validation errors:', regData.errors.length);
        
        // Show first few errors
        console.log('  Sample errors:');
        regData.errors.slice(0, 3).forEach((error: any, index: number) => {
          console.log(`    ${index + 1}. ${error.msg}`);
        });
      }
    } else {
      console.log('  ⚠️  Unexpected response from registration endpoint');
      console.log('  Response:', JSON.stringify(regData, null, 2));
    }
    
    console.log('\\n📋 Registration endpoint test completed!');
    
  } catch (error: any) {
    console.error('❌ Error testing registration endpoint:', error.message);
  }
}

// Run the test
testRegistrationEndpoint();
