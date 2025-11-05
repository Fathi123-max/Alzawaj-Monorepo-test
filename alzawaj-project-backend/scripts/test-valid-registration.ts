#!/usr/bin/env ts-node

/**
 * Valid Registration Test Script
 * This script tests registration with valid data format but uses a temporary email
 * to check if the endpoint accepts properly formatted requests
 */

import fetch from 'node-fetch';

const API_URL = 'https://alzawaj-backend.onrender.com';
const timestamp = Date.now();

// Valid registration data for a male user
const validMaleRegistrationData = {
  email: `test.male.${timestamp}@example.com`,
  phone: '+1234567890',
  password: 'TestPass123',
  confirmPassword: 'TestPass123',
  gender: 'm',
  basicInfo: {
    name: 'Test Male User',
    age: 30,
    hasBeard: true,
    financialSituation: 'good',
    housingOwnership: 'owned'
  }
};

async function testValidRegistration() {
  try {
    console.log('Testing registration with valid data format...\\n');
    
    // Test registration with valid data
    const regResponse = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validMaleRegistrationData),
    });
    
    const regData = await regResponse.json();
    
    console.log('Valid Registration Test Results:');
    console.log('  Status Code:', regResponse.status);
    
    // Check different possible responses
    if (regResponse.status === 201) {
      console.log('  ✅ Registration SUCCESSFUL');
      console.log('  Message:', regData.message);
      if (regData.user) {
        console.log('  User created with ID:', regData.user._id);
      }
    } else if (regResponse.status === 429) {
      console.log('  ⚠️  Rate Limited');
      console.log('  Message:', regData.message);
      console.log('  This is expected if many tests have been run recently');
    } else if (regResponse.status === 400) {
      console.log('  ⚠️  Validation Error');
      console.log('  This might indicate the email is already registered');
      if (regData.errors && Array.isArray(regData.errors)) {
        console.log('  Number of validation errors:', regData.errors.length);
      }
    } else {
      console.log('  ❓ Unexpected Response');
      console.log('  Response:', JSON.stringify(regData, null, 2));
    }
    
    console.log('\\n📋 Valid registration test completed!');
    
  } catch (error: any) {
    console.error('❌ Error testing valid registration:', error.message);
  }
}

// Run the test
testValidRegistration();
