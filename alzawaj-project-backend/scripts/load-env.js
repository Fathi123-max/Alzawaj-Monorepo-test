const fs = require('fs');
const path = require('path');

// Function to load .env.local manually if not in process.env
function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    console.log('Loading environment from .env.local');
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^['"]|['"]$/g, ''); // Remove quotes
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  } else {
    // Check parent directory for .env.local (monorepo/root style)
    const rootEnvPath = path.resolve(__dirname, '../../.env.local');
    if (fs.existsSync(rootEnvPath)) {
        console.log('Loading environment from ../.env.local');
        const content = fs.readFileSync(rootEnvPath, 'utf8');
        content.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
              const key = match[1].trim();
              const value = match[2].trim().replace(/^['"]|['"]$/g, '');
              if (!process.env[key]) {
                process.env[key] = value;
              }
            }
          });
    }
  }
}

// Load environment variables
loadEnv();

// Verify critical environment variables are loaded
const requiredVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'FIREBASE_PRIVATE_KEY',
  'FIREBASE_CLIENT_EMAIL'
];

const missingVars = [];
requiredVars.forEach(varName => {
  if (!process.env[varName]) {
    missingVars.push(varName);
  }
});

if (missingVars.length > 0) {
  console.warn(`Warning: Missing critical environment variables: ${missingVars.join(', ')}`);
} else {
  console.log('✅ All critical environment variables loaded successfully');
}

// Export for use in other scripts if needed
module.exports = { loadEnv };