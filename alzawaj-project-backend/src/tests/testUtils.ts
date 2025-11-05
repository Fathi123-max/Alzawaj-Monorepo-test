import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';

/**
 * Generate a test user
 */
export const createTestUser = async (userData: any = {}) => {
  // We'll import User inside the function to avoid circular dependencies
  const { User } = await import('../models/User');
  
  const defaultUserData = {
    email: 'test@example.com',
    phone: '+1234567890',
    password: 'Password123',
    firstname: 'Test',
    lastname: 'User',
    role: 'user',
    isEmailVerified: true,
    isPhoneVerified: true,
    isActive: true
  };

  const user = new User({ ...defaultUserData, ...userData });
  await user.save();

  return user;
};

/**
 * Generate JWT token for authentication
 */
export const generateToken = (userId: string, role: string = 'user') => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_ACCESS_SECRET || 'test-secret',
    { expiresIn: '15m' }
  );
};

/**
 * Create authenticated request headers
 */
export const authHeaders = (token: string) => {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};