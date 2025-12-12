// lib/services/notificationService.tsx (frontend)
import { useEffect } from "react";
import type { MessagePayload } from "firebase/messaging";
import { app } from "./firebase"; // Your Firebase app configuration
import { useNotifications } from "@/providers/notification-provider";

/**
 * Request notification permission and get FCM token
 */
export const requestNotificationPermission = async (): Promise<
  string | null
> => {
  // Check if we're in a browser environment and if Firebase is supported
  if (typeof window === "undefined" || !app) {
    console.log("Firebase not initialized on server or missing app");
    return null;
  }

  // Import Firebase messaging dynamically to ensure it's only imported in browser environment
  const { getMessaging, isSupported } = await import("firebase/messaging");

  // Check if Firebase Messaging is supported in the current environment
  const messagingSupported = await isSupported();
  if (!messagingSupported) {
    console.log("Firebase Messaging is not supported in this browser");
    return null;
  }

  try {
    // Initialize messaging only in browser
    const messaging = getMessaging(app);

    // Request permission to show notifications
    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      let token: string | null = null;
      try {
        // Get registration token
        token = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        });
      } catch (tokenErr) {
        console.warn(
          "Failed to get FCM token (this is normal in development):",
          tokenErr,
        );
        // In development, especially with HTTP or self-signed certs, token retrieval may fail
        // but we can still use Socket.IO for real-time messaging
      }

      // Send token to your backend to store against user
      if (token) {
        await registerTokenWithBackend(token);
      } else {
        console.log(
          "Notification permission granted, but no FCM token obtained (this is OK for development)",
        );
      }

      return token;
    } else {
      console.log("Notification permission denied");
      return null;
    }
  } catch (err) {
    console.error("Error getting notification permission:", err);
    // Still allow the app to function without notifications
    return null;
  }
};

/**
 * Register the token with your backend
 */
const registerTokenWithBackend = async (token: string): Promise<void> => {
  try {
    // Get the auth token from localStorage directly to ensure it's available
    const authToken =
      typeof window !== "undefined"
        ? localStorage.getItem("zawaj_auth_token")
        : null;

    if (!authToken) {
      throw new Error("No auth token available for FCM token registration");
    }

    // Use fetch directly with proper authorization header
    const response = await fetch("/api/notifications/register-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Failed to register token: ${response.status} ${response.statusText}, ${JSON.stringify(errorData)}`,
      );
    }

    const data = await response.json();
    if (data.success) {
      console.log("FCM token registered with backend successfully");
    } else {
      console.error("Failed to register token with backend:", data);
    }
  } catch (error: any) {
    console.error("Error registering token with backend:", error);
    // Enhanced error logging to track 401 errors specifically
    if (
      error.message?.includes("401") ||
      error.message?.includes("Unauthorized")
    ) {
      console.error(
        "Authentication error when registering FCM token - token may not be properly stored",
      );
    }
    throw error; // Re-throw to be handled by the calling function
  }
};

/**
 * Listen for foreground messages
 */
export const listenForForegroundMessages = async (): Promise<void> => {
  // Check if we're in a browser environment
  if (typeof window === "undefined" || !app) {
    console.log("Firebase not initialized on server or missing app");
    return;
  }

  try {
    const { getMessaging, onMessage, isSupported } =
      await import("firebase/messaging");

    // Check if Firebase Messaging is supported in the current environment
    const messagingSupported = await isSupported();
    if (!messagingSupported) {
      console.log("Firebase Messaging is not supported in this browser");
      return;
    }

    const messaging = getMessaging(app);
    onMessage(messaging, (payload: MessagePayload) => {
      console.log("Foreground message received: ", payload);

      // Handle the message - you can show a toast notification, etc.
      showNotificationInUI(payload);
    });
  } catch (err) {
    console.error("Error setting up foreground message listener:", err);
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
  console.log("Foreground notification:", notification, data);

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
      if (typeof window === "undefined") {
        console.log("Notification setup only runs in browser environment");
        return;
      }

      // Request permission and get token
      const token = await requestNotificationPermission();

      // Set up foreground message listener
      await listenForForegroundMessages();

      console.log("Notification setup complete, token:", token);
    };

    setupNotifications();
  }, [addNotification]);
};

/**
 * Send test notification to current user
 * This would typically only be used for testing purposes
 */
export const sendTestNotification = async (
  title: string,
  body: string,
): Promise<void> => {
  try {
    const response = await fetch("/api/notifications/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("auth_token")}`, // Include user's auth token
      },
      body: JSON.stringify({ title, body }),
    });

    if (!response.ok) {
      throw new Error("Failed to send test notification");
    }

    console.log("Test notification sent successfully");
  } catch (error) {
    console.error("Error sending test notification:", error);
  }
};
