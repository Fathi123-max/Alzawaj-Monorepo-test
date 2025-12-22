import mongoose from 'mongoose';
import { User } from './src/models/User';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../.env.local' });

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://mongodb:27017/alzawaj-dev';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ 
      $or: [
        { role: 'admin' },
        { email: 'admin@alzawajalsaeid.com' }
      ] 
    });

    if (existingAdmin) {
      console.log('Admin user already exists:', {
        email: existingAdmin.email,
        role: existingAdmin.role,
        id: existingAdmin._id
      });
      
      console.log('Exiting without creating new admin user.');
      process.exit(0);
    }

    // Create admin user
    const adminUserData = {
      email: 'admin@alzawajalsaeid.com',
      password: 'AdminPass123!', // Strong password
      firstname: 'Admin',
      lastname: 'Dashboard',
      role: 'admin' as const,
      status: 'active' as const,
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
    };

    const adminUser = new User(adminUserData);
    await adminUser.save();

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', adminUser.email);
    console.log('🔑 Role:', adminUser.role);
    console.log('🆔 ID:', adminUser._id);
    
    // Close connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
};

// Run the script
createAdminUser();