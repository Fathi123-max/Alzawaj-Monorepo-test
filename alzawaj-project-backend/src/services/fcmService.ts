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
    // Fetch the user from the database
    const User = (await import('../models/User')).User;
    const user = await User.findById(userId);

    if (!user || !user.fcmToken) {
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
      token: user.fcmToken, // Use the actual FCM token from the user's profile
    };

    const response = await messaging.send(message);
    logger.info(`Successfully sent message to user ${userId}: ${response}`);
    return true;
  } catch (error) {
    logger.error(`Error sending push notification to user ${userId}:`, error);
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
    // Fetch users from the database
    const User = (await import('../models/User')).User;
    const users = await User.find({ _id: { $in: userIds } });

    // Get tokens from users who have them
    const tokens = users
      .filter(user => user.fcmToken)
      .map(user => user.fcmToken as string);

    if (tokens.length === 0) {
      logger.warn(`No FCM tokens found for any of the ${userIds.length} users`);
      return { successCount: 0, failureCount: userIds.length };
    }

    // For multiple tokens, we need to send individual notifications
    const results = await Promise.allSettled(
      tokens.map(token => {
        return messaging.send({
          notification: {
            title,
            body,
          },
          data: data || {},
          token, // Individual token
        });
      })
    );

    const successCount = results.filter(result => result.status === 'fulfilled').length;
    const failureCount = results.filter(result => result.status === 'rejected').length;

    logger.info(`Successfully sent ${successCount} out of ${tokens.length} multicast notifications`);

    return {
      successCount,
      failureCount,
    };
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