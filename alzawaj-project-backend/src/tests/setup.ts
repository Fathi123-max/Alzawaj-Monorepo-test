import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Set environment to test
process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret';

let mongoServer: MongoMemoryServer;

/**
 * Setup in-memory MongoDB for testing
 */
export const setupTestDB = async () => {
  // For production testing, we might want to use a different approach
  if (process.env.NODE_ENV === 'production') {
    console.log('Running in production mode - skipping database setup');
    return;
  }
  
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  await mongoose.connect(mongoUri);
};

/**
 * Disconnect and cleanup MongoDB
 */
export const teardownTestDB = async () => {
  if (process.env.NODE_ENV === 'production') {
    console.log('Running in production mode - skipping database teardown');
    return;
  }
  
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
};

/**
 * Clear database collections
 */
export const clearTestDB = async () => {
  if (process.env.NODE_ENV === 'production') {
    console.log('Running in production mode - skipping database clearing');
    return;
  }
  
  const collections = mongoose.connection.collections;
  
  for (const key in collections) {
    const collection = collections[key];
    if (collection) {
      await collection.deleteMany({});
    }
  }
};

// Setup and teardown for all tests
beforeAll(async () => {
  await setupTestDB();
});

afterAll(async () => {
  await teardownTestDB();
});

beforeEach(async () => {
  await clearTestDB();
});