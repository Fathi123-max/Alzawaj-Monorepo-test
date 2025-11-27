// lib/services/notificationService.tsx (frontend)
import { useEffect } from 'react';
import { getMessaging, getToken, onMessage, MessagePayload } from 'firebase/messaging';
import { app } from './firebase'; // Your Firebase app configuration
import { useNotifications } from '@/providers/notification-provider';

/**
 * Request notification permission and get FCM token
 */
export const requestNotificationPermission = async (): Promise<string | null> => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || !app) {
    console.log('Firebase not initialized on server or missing app');
    return null;
  }

  try {
    // Initialize messaging only in browser
    const messaging = getMessaging(app);

    // Request permission to show notifications
    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      // Get registration token
      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      });

      // Send token to your backend to store against user
      if (token) {
        await registerTokenWithBackend(token);
      }

      return token;
    } else {
      console.log('Notification permission denied');
      return null;
    }
  } catch (err) {
    console.error('Error getting notification permission:', err);
    return null;
  }
};

/**
 * Register the token with your backend
 */
const registerTokenWithBackend = async (token: string): Promise<void> => {
  try {
    const response = await fetch('/api/notifications/register-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`, // Include user's auth token
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      throw new Error('Failed to register token with backend');
    }

    console.log('FCM token registered with backend successfully');
  } catch (error) {
    console.error('Error registering token with backend:', error);
  }
};

/**
 * Listen for foreground messages
 */
export const listenForForegroundMessages = (): void => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || !app) {
    console.log('Firebase not initialized on server or missing app');
    return;
  }

  try {
    const messaging = getMessaging(app);
    onMessage(messaging, (payload: MessagePayload) => {
      console.log('Foreground message received: ', payload);

      // Handle the message - you can show a toast notification, etc.
      showNotificationInUI(payload);
    });
  } catch (err) {
    console.error('Error setting up foreground message listener:', err);
  }
};

/**
 * Show notification in UI when received in foreground
 */
const showNotificationInUI = (payload: MessagePayload): void => {
  // Extract notification data
  const { notification, data } = payload;

  // Use the notification provider to add to in-app notifications
  // The exact implementation depends on your notification provider
  console.log('Foreground notification:', notification, data);

  // Example of showing a toast notification
  // toast.info(notification?.body || 'New notification received');
};

/**
 * Hook to manage notification permissions and setup
 */
export const useNotificationSetup = (): void => {
  const { addNotification } = useNotifications();

  useEffect(() => {
    const setupNotifications = async () => {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        console.log('Notification setup only runs in browser environment');
        return;
      }

      // Request permission and get token
      const token = await requestNotificationPermission();

      // Set up foreground message listener
      listenForForegroundMessages();

      console.log('Notification setup complete, token:', token);
    };

    setupNotifications();
  }, [addNotification]);
};

/**
 * Send test notification to current user
 * This would typically only be used for testing purposes
 */
export const sendTestNotification = async (title: string, body: string): Promise<void> => {
  try {
    const response = await fetch('/api/notifications/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`, // Include user's auth token
      },
      body: JSON.stringify({ title, body }),
    });

    if (!response.ok) {
      throw new Error('Failed to send test notification');
    }

    console.log('Test notification sent successfully');
  } catch (error) {
    console.error('Error sending test notification:', error);
  }
};