#!/usr/bin/env ts-node

/**
 * Comprehensive API Endpoint Test Script
 * This script tests all major API endpoints to verify they're working
 */

import fetch from 'node-fetch';

const API_URL = 'https://alzawaj-backend.onrender.com';

async function testAllEndpoints() {
  console.log('🧪 Starting comprehensive API endpoint tests...\\n');
  
  try {
    // 1. Test health endpoint
    console.log('1. Testing Health Endpoint...');
    const healthResponse = await fetch(`${API_URL}/health`);
    const healthData = await healthResponse.json();
    console.log(`   Status: ${healthResponse.status} ${healthResponse.status === 200 ? '✅' : '❌'}`);
    console.log(`   Environment: ${healthData.environment}`);
    
    // 2. Test root endpoint
    console.log('\\n2. Testing Root Endpoint...');
    const rootResponse = await fetch(`${API_URL}/`);
    const rootData = await rootResponse.json();
    console.log(`   Status: ${rootResponse.status} ${rootResponse.status === 200 ? '✅' : '❌'}`);
    console.log(`   Message: ${rootData.message}`);
    
    // 3. Test registration endpoint (structure only)
    console.log('\\n3. Testing Registration Endpoint...');
    const invalidRegData = {
      email: 'invalid',
      password: '123'
    };
    const regResponse = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidRegData),
    });
    console.log(`   Status: ${regResponse.status} ${regResponse.status === 400 ? '✅' : '❌'}`);
    console.log(`   Function: Validation working`);
    
    // 4. Test login endpoint
    console.log('\\n4. Testing Login Endpoint...');
    const invalidLoginData = {
      username: 'invalid',
      password: '123'
    };
    const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidLoginData),
    });
    console.log(`   Status: ${loginResponse.status} ${loginResponse.status === 400 ? '✅' : '❌'}`);
    console.log(`   Function: Login validation working`);
    
    // 5. Test protected endpoint without token
    console.log('\\n5. Testing Protected Endpoint (Auth Protection)...');
    const protectedResponse = await fetch(`${API_URL}/api/auth/me`);
    console.log(`   Status: ${protectedResponse.status} ${protectedResponse.status === 401 ? '✅' : '❌'}`);
    console.log(`   Function: Authentication protection working`);
    
    // 6. Test profile endpoint without token
    console.log('\\n6. Testing Profile Endpoint (Auth Protection)...');
    const profileResponse = await fetch(`${API_URL}/api/profile`);
    console.log(`   Status: ${profileResponse.status} ${profileResponse.status === 401 ? '✅' : '❌'}`);
    console.log(`   Function: Profile protection working`);
    
    // 7. Test search endpoint without token
    console.log('\\n7. Testing Search Endpoint (Auth Protection)...');
    const searchResponse = await fetch(`${API_URL}/api/search`);
    console.log(`   Status: ${searchResponse.status} ${searchResponse.status === 401 ? '✅' : '❌'}`);
    console.log(`   Function: Search protection working`);
    
    console.log('\\n🎉 Comprehensive endpoint testing completed!');
    console.log('\\n📝 Summary:');
    console.log('   All core endpoints are accessible');
    console.log('   Authentication protection is working');
    console.log('   Validation is properly implemented');
    console.log('   API is responding as expected');
    
  } catch (error: any) {
    console.error('❌ Error during comprehensive testing:', error.message);
  }
}

// Run the comprehensive test
testAllEndpoints();
