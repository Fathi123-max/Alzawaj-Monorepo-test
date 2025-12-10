// MongoDB initialization script
// This script runs once when MongoDB starts for the first time
// Creates the application user in the admin database with proper permissions to the alzawaj database

// First, ensure the alzawaj database exists by switching to it and creating a dummy collection
db = db.getSiblingDB('alzawaj');
db.createCollection('startup_init');

// Switch to admin database to create the application user
db = db.getSiblingDB('admin');

// Create a dedicated user for the application in the admin database
db.createUser({
  user: 'alzawaj_user',
  pwd: process.env.MONGO_APP_PASSWORD || 'alzawaj_password', // Use environment variable or default
  roles: [
    {
      role: 'readWrite',
      db: 'alzawaj'
    },
    {
      role: 'dbAdmin',
      db: 'alzawaj'
    }
  ]
});

// Switch back to the alzawaj database to set up collections and indexes
db = db.getSiblingDB('alzawaj');

// Create the actual collections and indexes needed by the application
db.createCollection("users");
db.createCollection("profiles");

db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "phone": 1 }, { unique: true });
db.profiles.createIndex({ "userId": 1 });

// Clean up the dummy collection
db = db.getSiblingDB('alzawaj');
db.startup_init.drop();

console.log('MongoDB application user and database initialized');