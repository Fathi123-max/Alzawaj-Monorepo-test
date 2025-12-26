// lib/services/notification-service.tsx (frontend)
import { useEffect } from "react";
import type { MessagePayload } from "firebase/messaging";
import { app, getFCMToken, isFirebaseMessagingSupported } from "./firebase"; // Your Firebase app configuration
import { useNotifications } from "../../providers/notification-provider";
import { notificationsApi } from "../api";
import { getBackendApiUrl } from "../utils/api-utils";
import { STORAGE_KEYS } from "../constants";
import { showToast } from "@/components/ui/toaster";

/**
 * Register the token with your backend
 */
export const registerTokenWithBackend = async (token: string): Promise<void> => {
  try {
    // Attempt to use the notificationsApi first as it's more standardized
    try {
      await notificationsApi.registerDeviceToken({ token });
      console.log("FCM token registered with backend successfully via API client");
      return;
    } catch (apiError) {
      console.warn("Failed to register token via API client, falling back to direct fetch:", apiError);
    }

    // Fallback to direct fetch if API client fails or behaves unexpectedly
    const authToken =
      typeof window !== "undefined"
        ? localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
        : null;

    if (!authToken) {
      throw new Error("No auth token available for FCM token registration");
    }

    const response = await fetch(`${getBackendApiUrl()}/notifications/register-token`, {
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
      console.log("FCM token registered with backend successfully via fallback fetch");
    } else {
      console.error("Failed to register token with backend (fallback):", data);
    }
  } catch (error: any) {
    console.error("Error registering token with backend:", error);
    if (
      error.message?.includes("401") ||
      error.message?.includes("Unauthorized")
    ) {
      console.error(
        "Authentication error when registering FCM token - token may not be properly stored",
      );
    }
  }
};

/**
 * Request notification permission and get FCM token
 */
export const requestNotificationPermission = async (): Promise<
  string | null
> => {
  if (typeof window === "undefined") return null;

  try {
    const supported = isFirebaseMessagingSupported();
    if (!supported) {
      console.log("Firebase Messaging is not supported in this browser");
      showToast.warning("متصفحك لا يدعم الإشعارات الفورية.");
      return null;
    }

    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      const token = await getFCMToken();

      if (token) {
        await registerTokenWithBackend(token);
        showToast.success("تم تفعيل الإشعارات بنجاح.");
      } else {
        console.log("Notification permission granted, but no FCM token obtained");
        showToast.warning("فشل الحصول على رمز الإشعارات. يرجى المحاولة لاحقاً.");
      }

      return token;
    } else {
      console.log("Notification permission denied");
      showToast.error("تم رفض صلاحية الإشعارات. يرجى تفعيلها من إعدادات المتصفح.");
      return null;
    }
  } catch (err) {
    console.error("Error getting notification permission:", err);
    return null;
  }
};

/**
 * Listen for foreground messages
 */
export const listenForForegroundMessages = async (): Promise<void> => {
  if (typeof window === "undefined" || !app) {
    return;
  }

  try {
    const { getMessaging, onMessage, isSupported } =
      await import("firebase/messaging");

    const messagingSupported = await isSupported();
    if (!messagingSupported) return;

    const messaging = getMessaging(app);
    onMessage(messaging, (payload: MessagePayload) => {
      console.log("Foreground message received: ", payload);
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
  const { notification, data } = payload;
  console.log("Foreground notification:", notification, data);
  // Implementation for showing custom UI/toasts can be added here
};

/**
 * Hook to manage notification permissions and setup
 */
export const useNotificationSetup = (): void => {
  const { fetchUnreadCount } = useNotifications();

  useEffect(() => {
    const setupNotifications = async () => {
      if (typeof window === "undefined") return;

      // Only proceed if authenticated
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (!token) return;

      await requestNotificationPermission();
      await listenForForegroundMessages();
      
      // Also fetch initial unread count
      await fetchUnreadCount();
    };

    // Listen for messages from service worker (notification clicks)
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "NOTIFICATION_CLICK") {
        console.log("Received notification click message from service worker:", event.data);
        const { url, data } = event.data;
        
        // Navigate to the URL
        if (url) {
          window.location.href = url;
        }
      }
    };

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", handleServiceWorkerMessage);
    }

    setupNotifications();

    // Cleanup
    return () => {
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener("message", handleServiceWorkerMessage);
      }
    };
  }, [fetchUnreadCount]);
};

/**
 * Handle incoming notification from Socket.IO
 */
export const handleSocketNotification = (notification: any): void => {
  if (Notification.permission === "granted" && document.visibilityState !== "visible") {
    new Notification(notification.title || "الزواج السعيد", {
      body: notification.message || notification.body,
      icon: "/logo.png",
    });
  }
};

/**
 * Send test notification
 */
export const sendTestNotification = async (
  title: string,
  body: string,
): Promise<void> => {
  try {
    const response = await fetch(`${getBackendApiUrl()}/notifications/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)}`,
      },
      body: JSON.stringify({ title, body }),
    });

    if (!response.ok) throw new Error("Failed to send test notification");
    console.log("Test notification sent successfully");
  } catch (error) {
    console.error("Error sending test notification:", error);
  }
};

export const subscribeToTopics = async (topics: string[]): Promise<void> => {
  console.log("Subscribing to topics:", topics);
};

export const unsubscribeFromTopics = async (topics: string[]): Promise<void> => {
  console.log("Unsubscribing from topics:", topics);
};
