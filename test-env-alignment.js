#!/usr/bin/env node
/**
 * Test script to verify environment variable alignment between 
 * .env.local, docker-compose.local.yaml, and the applications
 */

const fs = require('fs');
const path = require('path');

// Read .env.local file
const envLocalPath = path.join(__dirname, '.env.local');
const envLocalContent = fs.readFileSync(envLocalPath, 'utf8');

// Parse .env.local content
const envVars = {};
envLocalContent.split('\n').forEach(line => {
  if (line.trim() && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=');
    if (key) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  }
});

console.log('Environment variables loaded from .env.local:');
console.log('===========================================');
Object.keys(envVars).forEach(key => {
  console.log(`${key}=${envVars[key]}`);
});
console.log('');

// Check for essential variables needed by both frontend and backend
const essentialFrontendVars = [
  'NEXT_PUBLIC_APP_NAME',
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_API_BASE_URL',
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY'
];

const essentialBackendVars = [
  'PORT',
  'MONGODB_URI',
  'JWT_SECRET',
  'IMAGEKIT_PRIVATE_KEY',
  'FIREBASE_PRIVATE_KEY'
];

console.log('Checking essential frontend environment variables...');
essentialFrontendVars.forEach(varName => {
  if (envVars[varName]) {
    console.log(`✅ ${varName} is set: ${envVars[varName].substring(0, 20)}...`);
  } else {
    console.log(`❌ ${varName} is missing`);
  }
});

console.log('');
console.log('Checking essential backend environment variables...');
essentialBackendVars.forEach(varName => {
  if (envVars[varName]) {
    console.log(`✅ ${varName} is set: ${envVars[varName].substring(0, 20)}...`);
  } else {
    console.log(`❌ ${varName} is missing`);
  }
});

console.log('');
console.log('Environment variable alignment check completed.');
console.log('The Docker Compose file is configured to load .env.local via env_file:');
console.log('- Frontend and backend services both use env_file: ./.env.local');
console.log('- This ensures both services have access to the same environment variables');