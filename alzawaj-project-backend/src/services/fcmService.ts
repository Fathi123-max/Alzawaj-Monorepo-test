import admin from 'firebase-admin';
import { getMessaging } from 'firebase-admin/messaging';
import { IUser } from '../types';
import { logger } from '../config/logger';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    // For production use, set the path to your service account key file
    let serviceAccount: admin.ServiceAccount | null = null;

    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      };
    }

    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else {
      // Use application default credentials in production if available
      admin.initializeApp();
    }
  } catch (error) {
    logger.error('Firebase Admin initialization error:', error);
  }
}

const messaging = getMessaging();

/**
 * Send push notification to a specific user/device
 */
export const sendPushNotification = async (
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<boolean> => {
  try {
    // In a real application, you'd fetch the FCM token from the user's profile
    // This is a simplified version
    // Example: const user = await User.findById(userId); 
    // const fcmToken = user.fcmToken;

    // Since we don't have real tokens stored, we'll use a mock token for testing
    // In production, replace this with the real FCM token from the user's profile
    const mockToken = process.env.FIREBASE_MOCK_TOKEN || null;

    if (!mockToken) {
      logger.warn(`No FCM token found for user ${userId}`);
      return false;
    }

    const message = {
      notification: {
        title,
        body,
      },
      data: {
        ...data,
        userId, // Include user ID in the data payload
      },
      token: mockToken, // Replace with actual user FCM token
    };

    const response = await messaging.send(message);
    logger.info(`Successfully sent message: ${response}`);
    return true;
  } catch (error) {
    logger.error(`Error sending push notification:`, error);
    return false;
  }
};

/**
 * Send multicast push notifications to multiple users
 */
export const sendMulticastNotification = async (
  userIds: string[],
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<{ successCount: number; failureCount: number }> => {
  try {
    // In a real application, you'd fetch FCM tokens for all users
    // const users = await User.find({ _id: { $in: userIds } });
    // const tokens = users.map(user => user.fcmToken).filter(token => token);

    // For now, we'll return a mock response
    logger.info(`Sending multicast notification to ${userIds.length} users`);
    return { successCount: userIds.length, failureCount: 0 };
  } catch (error) {
    logger.error(`Error sending multicast notification:`, error);
    return { successCount: 0, failureCount: userIds.length };
  }
};

/**
 * Send notification to a topic
 */
export const sendTopicNotification = async (
  topic: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<boolean> => {
  try {
    const message = {
      notification: {
        title,
        body,
      },
      data: data || {},
      topic: `/${topic}`, // FCM topic format
    };

    const response = await messaging.send(message);
    logger.info(`Successfully sent topic message: ${response}`);
    return true;
  } catch (error) {
    logger.error(`Error sending topic notification:`, error);
    return false;
  }
};

/**
 * Subscribe user to a topic
 */
export const subscribeToTopic = async (token: string, topic: string): Promise<boolean> => {
  try {
    const response = await messaging.subscribeToTopic([token], topic);
    logger.info(`Successfully subscribed to topic: ${response}`);
    return true;
  } catch (error) {
    logger.error(`Error subscribing to topic:`, error);
    return false;
  }
};

/**
 * Unsubscribe user from a topic
 */
export const unsubscribeFromTopic = async (token: string, topic: string): Promise<boolean> => {
  try {
    const response = await messaging.unsubscribeFromTopic([token], topic);
    logger.info(`Successfully unsubscribed from topic: ${response}`);
    return true;
  } catch (error) {
    logger.error(`Error unsubscribing from topic:`, error);
    return false;
  }
};