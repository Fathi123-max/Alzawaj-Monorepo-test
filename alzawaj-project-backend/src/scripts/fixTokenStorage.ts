import mongoose from 'mongoose';
import { User } from '../models/User';
import crypto from 'crypto';

// Load environment variables
require('dotenv').config();

async function fixTokenStorage() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('Connected to database');

    // Find the user we just created
    const user = await User.findOne({
      email: 'testverify@example.com'
    }).select('+emailVerificationToken');

    if (!user) {
      console.log('User not found');
      await mongoose.connection.close();
      return;
    }

    console.log('Current token:', user.emailVerificationToken);

    // Hash the current token and update it
    const hashedToken = crypto.createHash('sha256').update(user.emailVerificationToken || "").digest('hex');
    console.log('Hashed token:', hashedToken);

    // Update the user with the hashed token
    user.emailVerificationToken = hashedToken;
    await user.save();

    console.log('Token updated to hashed version');

    // Verify the update
    const updatedUser = await User.findOne({
      email: 'testverify@example.com'
    }).select('+emailVerificationToken');
    
    console.log('Updated token length:', updatedUser?.emailVerificationToken?.length);
    console.log('Is token now a hash?', updatedUser?.emailVerificationToken?.length === 64);

    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the function
fixTokenStorage();