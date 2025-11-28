import { initializeApp, getApps } from "firebase/app";
import {
  getMessaging,
  getToken,
  onMessage,
  deleteToken,
} from "firebase/messaging";
import type { Notification } from "../types";

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env["NEXT_PUBLIC_FIREBASE_API_KEY"] || "",
  authDomain: process.env["NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"] || "",
  projectId: process.env["NEXT_PUBLIC_FIREBASE_PROJECT_ID"] || "",
  storageBucket: process.env["NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"] || "",
  messagingSenderId:
    process.env["NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"] || "",
  appId: process.env["NEXT_PUBLIC_FIREBASE_APP_ID"] || "",
  measurementId: process.env["NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID"] || "",
};

// Initialize Firebase app only on the client
let app;
let messaging: any;

if (typeof window !== "undefined") {
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
  if (typeof window === "undefined" || !messaging) {
    console.log("Firebase not initialized on server or missing messaging");
    return null;
  }

  try {
    // Request notification permission first
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("Notification permission not granted.");
      return null;
    }

    // Ensure service worker is supported and registered
    if ("serviceWorker" in navigator) {
      try {
        // Wait for service worker to be ready before getting token
        // This ensures proper initialization for Firebase Messaging
        const registration = await navigator.serviceWorker.register(
          "/firebase-messaging-sw.js",
        );
        console.log(
          "Firebase messaging service worker registered with scope:",
          registration.scope,
        );

        // Wait for the service worker to be active
        if (registration.waiting) {
          console.log("Service worker is waiting to become active");
        } else if (registration.active) {
          console.log("Service worker is already active");
        } else if (registration.installing) {
          console.log("Service worker is installing");
          // Wait for the service worker to become active
          await new Promise((resolve) => {
            const serviceWorker = registration.installing;
            if (serviceWorker) {
              serviceWorker.addEventListener("statechange", (event) => {
                const target = event.target as ServiceWorker;
                if (target.state === "activated") {
                  console.log("Service worker is now active");
                  resolve(void 0);
                }
              });
            } else {
              resolve(void 0);
            }
          });
        }

        // Wait a bit more to ensure the service worker is fully ready
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (swError) {
        console.warn(
          "Service worker registration failed, push notifications will not be available in this environment:",
          swError,
        );
        // In development, service worker registration often fails for various reasons (HTTPS required, etc.)
        // We can still use Socket.IO for real-time messaging
        return null;
      }
    } else {
      console.log("Service Worker not supported in this browser");
      return null;
    }

    // Get token - Firebase will use the registered service worker
    let token;
    try {
      token = await getToken(messaging, {
        vapidKey: process.env["NEXT_PUBLIC_FIREBASE_VAPID_KEY"] || undefined,
      });
    } catch (tokenError) {
      console.warn("Failed to get FCM token:", tokenError);
      // This commonly fails in development environments (HTTP vs HTTPS, etc.)
      // but we can still function with Socket.IO for real-time messaging
      return null;
    }

    if (token) {
      console.log("FCM Registration token:", token.substring(0, 20) + "...");
      return token;
    } else {
      console.log(
        "No registration token available. Request permission to generate one.",
      );
      return null;
    }
  } catch (err) {
    console.log("An error occurred while retrieving token:", err);
    // Check if it's specifically a service worker registration or FCM error
    if (
      err instanceof Error &&
      (err.message.includes("ServiceWorker") ||
        err.message.includes("Messaging") ||
        err.message.includes("push service"))
    ) {
      console.log(
        "Service worker or messaging registration failed:",
        err.message,
      );
      // This error can occur in certain environments (development, HTTP vs HTTPS)
      // Just return null instead of failing completely
    }
    return null;
  }
};

/**
 * Delete FCM token
 */
export const deleteFCMToken = async (): Promise<boolean> => {
  // Check if we're in a browser environment
  if (typeof window === "undefined" || !messaging) {
    console.log("Firebase not initialized on server or missing messaging");
    return false;
  }

  try {
    await deleteToken(messaging);
    return true;
  } catch (err) {
    console.log("An error occurred while deleting token:", err);
    return false;
  }
};

/**
 * Listen for foreground messages
 */
export const onForegroundMessage = (): Promise<any> => {
  // Check if we're in a browser environment
  if (typeof window === "undefined" || !messaging) {
    console.log("Firebase not initialized on server or missing messaging");
    return Promise.resolve(null);
  }

  return new Promise((resolve, reject) => {
    onMessage(messaging, (payload) => {
      console.log("Foreground message received: ", payload);
      resolve(payload);
    });
  });
};

export { messaging, app };
