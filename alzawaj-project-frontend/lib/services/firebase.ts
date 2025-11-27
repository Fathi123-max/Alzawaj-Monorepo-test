import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage, deleteToken } from 'firebase/messaging';
import type { Notification } from '../types';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || ""
};

// Initialize Firebase app only on the client
let app;
let messaging;

if (typeof window !== 'undefined') {
  // Initialize Firebase app only if not already initialized
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

  // Initialize Firebase Messaging
  messaging = getMessaging(app);
}

/**
 * Get FCM token for the current user
 */
export const getFCMToken = async (): Promise<string | null> => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || !messaging) {
    console.log('Firebase not initialized on server or missing messaging');
    return null;
  }

  try {
    // Register service worker first
    await navigator.serviceWorker.register('/firebase-messaging-sw.js');

    // Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission not granted.');
      return null;
    }

    // Get token
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || undefined,
    });

    if (token) {
      console.log('FCM Registration token:', token);
      return token;
    } else {
      console.log('No registration token available. Request permission to generate one.');
      return null;
    }
  } catch (err) {
    console.log('An error occurred while retrieving token:', err);
    return null;
  }
};

/**
 * Delete FCM token
 */
export const deleteFCMToken = async (): Promise<boolean> => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || !messaging) {
    console.log('Firebase not initialized on server or missing messaging');
    return false;
  }

  try {
    await deleteToken(messaging);
    return true;
  } catch (err) {
    console.log('An error occurred while deleting token:', err);
    return false;
  }
};

/**
 * Listen for foreground messages
 */
export const onForegroundMessage = (): Promise<any> => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || !messaging) {
    console.log('Firebase not initialized on server or missing messaging');
    return Promise.resolve(null);
  }

  return new Promise((resolve, reject) => {
    onMessage(messaging, (payload) => {
      console.log('Foreground message received: ', payload);
      resolve(payload);
    });
  });
};

export { messaging, app };