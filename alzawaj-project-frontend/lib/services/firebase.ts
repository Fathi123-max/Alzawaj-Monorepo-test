import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
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

// Check if we're in development environment
const isDevelopment = process.env.NODE_ENV === "development";

// Validate Firebase configuration
const validateFirebaseConfig = (): { valid: boolean; missing: string[] } => {
  const requiredVars = [
    "NEXT_PUBLIC_FIREBASE_API_KEY",
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    "NEXT_PUBLIC_FIREBASE_APP_ID",
  ];

  const missingVars: string[] = [];

  requiredVars.forEach((varName) => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });

  return {
    valid: missingVars.length === 0,
    missing: missingVars,
  };
};

// Log configuration validation result
const configValidation = validateFirebaseConfig();
if (!configValidation.valid) {
  console.warn(
    `Firebase configuration incomplete. Missing variables: ${configValidation.missing.join(
      ", "
    )}`
  );
  if (isDevelopment) {
    console.info(
      "Running in development mode - push notifications may not work without proper Firebase configuration."
    );
  }
}

// Initialize Firebase app only on the client
let app: FirebaseApp | null = null;
let messaging: any;

// Check if Firebase Messaging is supported in the current environment
const isFirebaseMessagingSupported = (): boolean => {
  if (typeof window === "undefined") {
    return false; // Not in browser environment
  }

  // Check if required APIs are available
  if (
    !("serviceWorker" in navigator) ||
    !("PushManager" in window) ||
    !("Notification" in window)
  ) {
    return false; // Required APIs not available
  }

  // Additional check for IndexedDB (Firebase uses this)
  if (!("indexedDB" in window)) {
    return false;
  }

  return true;
};

if (typeof window !== "undefined" && isFirebaseMessagingSupported()) {
  // Initialize Firebase app only if not already initialized
  const existingApps = getApps();
  if (existingApps.length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    // Use type assertion since we've confirmed the array has items
    app = existingApps[0]!;
  }

  // Initialize Firebase Messaging only if supported
  messaging = getMessaging(app);
} else {
  // Set app to null when Firebase is not supported
  app = null;
  messaging = null;
}

/**
 * Get FCM token for the current user
 */
export const getFCMToken = async (): Promise<string | null> => {
  // Check if we're in a browser environment and if Firebase is supported
  if (
    typeof window === "undefined" ||
    !app ||
    !messaging ||
    !isFirebaseMessagingSupported()
  ) {
    console.log(
      "Firebase not initialized on server or missing app/messaging, or browser doesn't support required APIs"
    );
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
        // Check if service worker is already registered
        const existingRegistration =
          await navigator.serviceWorker.getRegistration();

        let registration;
        if (existingRegistration) {
          registration = existingRegistration;
          console.log(
            "Using existing service worker registration with scope:",
            registration.scope
          );
        } else {
          // Register new service worker
          registration = await navigator.serviceWorker.register(
            "/firebase-messaging-sw.js"
          );
          console.log(
            "Firebase messaging service worker registered with scope:",
            registration.scope
          );
        }

        // Wait for the service worker to be active with retry logic
        const waitForActiveServiceWorker = async (
          registration: ServiceWorkerRegistration,
          maxRetries = 3,
          retryDelay = 200
        ): Promise<boolean> => {
          for (let attempt = 1; attempt <= maxRetries; attempt++) {
            if (registration.active) {
              console.log("Service worker is already active");
              return true;
            }

            if (registration.waiting) {
              console.log("Service worker is waiting to become active");
              // Try to activate it
              try {
                await registration.waiting.postMessage({
                  type: "SKIP_WAITING",
                });
                console.log("Sent SKIP_WAITING message to service worker");
              } catch (activateError) {
                console.warn(
                  "Could not send SKIP_WAITING message:",
                  activateError
                );
              }
            }

            if (registration.installing) {
              console.log("Service worker is installing");
              try {
                // Wait for the service worker to become active
                await new Promise<void>((resolve, reject) => {
                  const timeout = setTimeout(
                    () =>
                      reject(new Error("Service worker activation timeout")),
                    5000
                  );

                  const serviceWorker = registration.installing;
                  if (
                    serviceWorker &&
                    typeof serviceWorker.addEventListener === "function"
                  ) {
                    serviceWorker.addEventListener("statechange", (event) => {
                      const target = event.target as ServiceWorker;
                      if (target.state === "activated") {
                        clearTimeout(timeout);
                        console.log("Service worker is now active");
                        resolve();
                      } else if (target.state === "redundant") {
                        clearTimeout(timeout);
                        reject(new Error("Service worker became redundant"));
                      }
                    });
                  } else {
                    clearTimeout(timeout);
                    resolve();
                  }
                });
                return true;
              } catch (installError) {
                console.warn(
                  `Service worker installation attempt ${attempt} failed:`,
                  installError
                );
                if (attempt < maxRetries) {
                  await new Promise((resolve) =>
                    setTimeout(resolve, retryDelay)
                  );
                  continue;
                }
                return false;
              }
            }

            // If we get here, no service worker is active/waiting/installing
            // Wait a bit and check again
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
          }
          return false;
        };

        const serviceWorkerActive =
          await waitForActiveServiceWorker(registration);
        if (!serviceWorkerActive) {
          console.warn(
            "Service worker failed to become active after multiple attempts"
          );
          return null;
        }

        // Wait a bit more to ensure the service worker is fully ready
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (swError) {
        console.warn(
          "Service worker registration failed, push notifications will not be available in this environment:",
          swError
        );

        // Provide specific guidance based on error type
        if (swError instanceof Error) {
          if (swError.message.includes("Failed to register a ServiceWorker")) {
            console.info(
              "Service worker registration failed. This often happens in development environments. " +
                "For push notifications to work, you need HTTPS and proper service worker configuration."
            );
          } else if (swError.message.includes("network")) {
            console.info(
              "Network error during service worker registration. Check your internet connection."
            );
          }
        }

        // In development, service worker registration often fails for various reasons (HTTPS required, etc.)
        // We can still use Socket.IO for real-time messaging
        return null;
      }
    } else {
      console.log("Service Worker not supported in this browser");
      return null;
    }

    // Check if we're in development environment and provide guidance
    if (isDevelopment) {
      console.info(
        "Development mode detected. Push notifications may not work properly without HTTPS. " +
          "Consider using a tool like ngrok for local HTTPS testing."
      );

      // Check if we're on HTTP (common development issue)
      if (
        typeof window !== "undefined" &&
        window.location.protocol === "http:"
      ) {
        console.warn(
          "Running on HTTP in development mode. Firebase push notifications require HTTPS. " +
            "This is expected in development, but notifications will only work via Socket.IO."
        );
      }
    }

    // Get token - Firebase will use the registered service worker
    let token;
    try {
      const vapidKey = process.env["NEXT_PUBLIC_FIREBASE_VAPID_KEY"];
      token = await getToken(messaging, vapidKey ? { vapidKey } : {});

      // Log token acquisition success with environment context
      if (token) {
        console.log(
          `FCM token acquired successfully${isDevelopment ? " (development mode)" : ""}:`,
          token.substring(0, 20) + "..."
        );
      }
    } catch (tokenError) {
      console.warn("Failed to get FCM token:", tokenError);

      // Provide specific guidance based on error type
      if (tokenError instanceof Error) {
        if (tokenError.message.includes("messaging/token-unavailable")) {
          console.info(
            "FCM token unavailable. This can happen if the service worker is not properly registered " +
              "or if there are network connectivity issues."
          );
        } else if (
          tokenError.message.includes("messaging/permission-blocked")
        ) {
          console.info(
            "Notification permission was blocked by the user. " +
              "The user needs to manually enable notifications in browser settings."
          );
        } else if (tokenError.message.includes("messaging/invalid-vapid-key")) {
          console.info(
            "Invalid VAPID key. Check your NEXT_PUBLIC_FIREBASE_VAPID_KEY environment variable."
          );
        }
      }

      // This commonly fails in development environments (HTTP vs HTTPS, etc.)
      // but we can still function with Socket.IO for real-time messaging
      return null;
    }

    if (token) {
      console.log("FCM Registration token:", token.substring(0, 20) + "...");
      return token;
    } else {
      console.log(
        "No registration token available. Request permission to generate one."
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
        err.message
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
  // Check if we're in a browser environment and if Firebase is supported
  if (
    typeof window === "undefined" ||
    !app ||
    !messaging ||
    !isFirebaseMessagingSupported()
  ) {
    console.log(
      "Firebase not initialized on server or missing app/messaging, or browser doesn't support required APIs"
    );
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
  // Check if we're in a browser environment and if Firebase is supported
  if (
    typeof window === "undefined" ||
    !app ||
    !messaging ||
    !isFirebaseMessagingSupported()
  ) {
    console.log(
      "Firebase not initialized on server or missing app/messaging, or browser doesn't support required APIs"
    );
    return Promise.resolve(null);
  }

  return new Promise((resolve, reject) => {
    onMessage(messaging, (payload) => {
      console.log("Foreground message received: ", payload);
      resolve(payload);
    });
  });
};

/**
 * Get Firebase initialization status and configuration health
 */
export const getFirebaseStatus = (): {
  initialized: boolean;
  supported: boolean;
  configValid: boolean;
  missingConfigVars: string[];
  environment: string;
  httpsRequired: boolean;
} => {
  return {
    initialized: !!app,
    supported: isFirebaseMessagingSupported(),
    configValid: configValidation.valid,
    missingConfigVars: configValidation.missing,
    environment: isDevelopment ? "development" : "production",
    httpsRequired:
      typeof window !== "undefined" &&
      window.location.protocol === "http:" &&
      isDevelopment,
  };
};

/**
 * Check if push notifications are available in the current environment
 */
export const arePushNotificationsAvailable = (): boolean => {
  const status = getFirebaseStatus();
  return (
    status.initialized &&
    status.supported &&
    status.configValid &&
    !status.httpsRequired
  );
};

export { messaging, app };
