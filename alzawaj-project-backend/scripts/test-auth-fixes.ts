#!/usr/bin/env node
/**
 * Simple test script to verify authentication fixes
 * This script tests the basic authentication flow after our fixes
 */

import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { User } from '../src/models/User';
import { connectDB } from '../src/config/database';

// Test environment variables
console.log('Testing environment variables...');
if (!process.env.JWT_SECRET) {
  console.error('ERROR: JWT_SECRET is not set');
  process.exit(1);
}

if (!process.env.JWT_REFRESH_SECRET) {
  console.error('ERROR: JWT_REFRESH_SECRET is not set');
  process.exit(1);
}

console.log('✓ Environment variables are set');

// Test database connection
console.log('Testing database connection...');
connectDB().then(async () => {
  console.log('✓ Database connected successfully');
  
  // Test token generation
  console.log('Testing token generation...');
  
  try {
    // Create a test user
    const testUser = new User({
      email: 'test@example.com',
      phone: '+1234567890',
      password: 'TestPass123',
      firstname: 'Test',
      lastname: 'User',
      role: 'user',
      status: 'active'
    });
    
    // Test access token generation
    const accessToken = testUser.generateAccessToken();
    console.log('✓ Access token generated successfully');
    
    // Test refresh token generation
    const refreshToken = testUser.generateRefreshToken();
    console.log('✓ Refresh token generated successfully');
    
    console.log('All tests passed! Authentication system should now work correctly.');
    
    // Clean up and exit
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('ERROR:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}).catch(error => {
  console.error('Failed to connect to database:', error);
  process.exit(1);
});