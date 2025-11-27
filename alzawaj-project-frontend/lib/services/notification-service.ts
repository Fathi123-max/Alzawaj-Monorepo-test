import { getFCMToken } from './firebase';
import { notificationsApi } from '../api';
import { Notification } from '../types';

/**
 * Register device token (FCM) for the user
 */
export const registerDeviceToken = async (): Promise<void> => {
  try {
    // Get FCM token
    const token = await getFCMToken();

    if (!token) {
      console.log('Could not get FCM token');
      return;
    }

    // Send token to backend
    await notificationsApi.registerDeviceToken({ token });
    console.log('Device token registered successfully');
  } catch (error) {
    console.error('Error registering device token:', error);
  }
};

/**
 * Request notification permissions and register device
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      await registerDeviceToken();
      return true;
    }
  }
  return false;
};

/**
 * Handle incoming notification from Socket.IO
 */
export const handleSocketNotification = (notification: any): void => {
  // Add notification to UI
  // This should trigger the UI update via context

  // Show browser notification if not already focused on the app
  if (Notification.permission === 'granted' && !isAppFocused()) {
    new Notification(notification.title, {
      body: notification.message,
      icon: '/logo.png', // Use your app's logo
    });
  }
};

/**
 * Check if the app is currently focused/visible
 */
const isAppFocused = (): boolean => {
  return document.visibilityState === 'visible';
};

/**
 * Send a notification from the client side (for testing purposes)
 */
export const sendTestNotification = async (userId: string, title: string, message: string): Promise<void> => {
  try {
    // This would typically be triggered by an API call
    await notificationsApi.sendNotification({
      userId,
      title,
      message,
      type: 'system'
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
  }
};

/**
 * Subscribe user to notification topics
 */
export const subscribeToTopics = async (topics: string[]): Promise<void> => {
  try {
    for (const topic of topics) {
      // Subscribe to each topic
      // Implementation depends on your backend API
      console.log(`Subscribed to topic: ${topic}`);
    }
  } catch (error) {
    console.error('Error subscribing to topics:', error);
  }
};

/**
 * Unsubscribe user from notification topics
 */
export const unsubscribeFromTopics = async (topics: string[]): Promise<void> => {
  try {
    for (const topic of topics) {
      // Unsubscribe from each topic
      // Implementation depends on your backend API
      console.log(`Unsubscribed from topic: ${topic}`);
    }
  } catch (error) {
    console.error('Error unsubscribing from topics:', error);
  }
};