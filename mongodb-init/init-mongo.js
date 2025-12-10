// MongoDB initialization script
// This script runs once when MongoDB starts for the first time

// Create a dedicated user for the application with readWrite permissions in the admin database
db = db.getSiblingDB('admin');
db.createUser({
  user: 'alzawaj_user',
  pwd: 'alzawaj_password', // Using fixed password that matches the .env file
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

// Switch to the alzawaj database to create collections and indexes
db = db.getSiblingDB('alzawaj');

// Create collections and indexes if needed
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "phone": 1 }, { unique: true });
db.profiles.createIndex({ "userId": 1 });

console.log('MongoDB application user and database initialized');