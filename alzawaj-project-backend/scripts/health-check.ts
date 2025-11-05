#!/usr/bin/env ts-node

/**
 * Production API Health Check Script
 * This script can be used to verify that your production API is running correctly
 */

import fetch from 'node-fetch';

const API_URL = 'https://alzawaj-backend.onrender.com';
const timestamp = Date.now();

async function checkHealth() {
  try {
    console.log('Checking production API health...');
    
    // Test health endpoint
    const healthResponse = await fetch(`${API_URL}/health`);
    const healthData = await healthResponse.json();
    
    console.log('✅ Health Check:', healthResponse.status === 200 ? 'PASSED' : 'FAILED');
    console.log('  Status:', healthData.status);
    console.log('  Environment:', healthData.environment);
    console.log('  Version:', healthData.version);
    
    // Test root endpoint
    const rootResponse = await fetch(`${API_URL}/`);
    const rootData = await rootResponse.json();
    
    console.log('✅ Root Endpoint:', rootResponse.status === 200 ? 'PASSED' : 'FAILED');
    console.log('  Message:', rootData.message);
    console.log('  Status:', rootData.status);
    
    // Test auth endpoint (should return 401 without token)
    const authResponse = await fetch(`${API_URL}/api/auth/me`);
    
    console.log('✅ Auth Protection:', authResponse.status === 401 ? 'PASSED' : 'FAILED');
    console.log('  Status Code:', authResponse.status);
    
    console.log('\n🎉 All basic checks completed!');
    
  } catch (error: any) {
    console.error('❌ Error checking API health:', error.message);
    process.exit(1);
  }
}

// Registration test data for male user with unique email
const maleRegistrationData = {
  email: `test.male.${timestamp}@example.com`,
  phone: `+123456789${Math.floor(Math.random() * 10)}`,
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

// Registration test data for female user with unique email
const femaleRegistrationData = {
  email: `test.female.${timestamp}@example.com`,
  phone: `+123456788${Math.floor(Math.random() * 10)}`,
  password: 'TestPass123',
  confirmPassword: 'TestPass123',
  gender: 'f',
  basicInfo: {
    name: 'Test Female User',
    age: 25,
    guardianName: 'Test Guardian',
    guardianPhone: `+123456777${Math.floor(Math.random() * 10)}`,
    guardianRelationship: 'father',
    wearHijab: true,
    wearNiqab: false
  }
};

async function testRegistration() {
  try {
    console.log('\nTesting registration endpoints...');
    
    // Test male registration
    console.log('\n📝 Testing male user registration...');
    const maleRegResponse = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(maleRegistrationData),
    });
    
    const maleRegData = await maleRegResponse.json();
    console.log('  Male Registration Status:', maleRegResponse.status);
    if (maleRegResponse.status === 201) {
      console.log('  ✅ Male Registration: PASSED');
      console.log('  Message:', maleRegData.message);
      // Check if user object exists in response
      if (maleRegData.user) {
        console.log('  User ID:', maleRegData.user._id || 'Not available');
      }
    } else {
      console.log('  ⚠️  Male Registration: FAILED');
      console.log('  Error:', maleRegData.message || 'Unknown error');
    }
    
    // Test female registration
    console.log('\n📝 Testing female user registration...');
    const femaleRegResponse = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(femaleRegistrationData),
    });
    
    const femaleRegData = await femaleRegResponse.json();
    console.log('  Female Registration Status:', femaleRegResponse.status);
    if (femaleRegResponse.status === 201) {
      console.log('  ✅ Female Registration: PASSED');
      console.log('  Message:', femaleRegData.message);
      // Check if user object exists in response
      if (femaleRegData.user) {
        console.log('  User ID:', femaleRegData.user._id || 'Not available');
      }
    } else {
      console.log('  ⚠️  Female Registration: FAILED');
      console.log('  Error:', femaleRegData.message || 'Unknown error');
    }
    
    console.log('\n📋 Registration tests completed!');
    
  } catch (error: any) {
    console.error('❌ Error testing registration:', error.message);
  }
}

// Test login endpoint
async function testLogin() {
  try {
    console.log('\nTesting login endpoint...');
    
    // Test login with valid credentials (using the female user we just created)
    const loginData = {
      username: femaleRegistrationData.email,
      password: femaleRegistrationData.password
    };
    
    const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData),
    });
    
    const loginDataResponse = await loginResponse.json();
    console.log('  Login Status:', loginResponse.status);
    if (loginResponse.status === 200) {
      console.log('  ✅ Login: PASSED');
      console.log('  Message:', loginDataResponse.message);
      if (loginDataResponse.token) {
        console.log('  Token received: Yes');
      }
    } else {
      console.log('  ⚠️  Login: FAILED');
      console.log('  Error:', loginDataResponse.message || 'Unknown error');
    }
    
    console.log('\n🔐 Login test completed!');
    
  } catch (error: any) {
    console.error('❌ Error testing login:', error.message);
  }
}

// Run all tests
async function runAllTests() {
  await checkHealth();
  await testRegistration();
  await testLogin();
}

// Run the tests
runAllTests();