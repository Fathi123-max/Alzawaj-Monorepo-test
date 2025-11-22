import mongoose from 'mongoose';
import { User } from '../models/User';

// Load environment variables
require('dotenv').config();

async function checkUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('Connected to database');

    const user = await User.findOne({ email: 'jayde_dach@hotmail.com' });
    if (user) {
      console.log('User found:', {
        id: user._id,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        emailVerificationToken: !!user.emailVerificationToken,
        createdAt: user.createdAt
      });
    } else {
      console.log('User not found');
    }

    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error:', error);
  }
}

checkUser();