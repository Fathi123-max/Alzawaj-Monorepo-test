// app/notifications-provider-client.tsx
"use client";

import { useEffect } from "react";
// import { listenForForegroundMessages } from "@/lib/services/notification-service"; // This refers to the .tsx file

// Client-side component to initialize notification system
export default function NotificationsProviderClient({
  children,
}: {
  children: React.ReactNode;
}) {
  // Only set up foreground message listening, don't automatically request permissions
  // Notification permissions are requested specifically during login

  useEffect(() => {
    // Only set up foreground message listening if we have Firebase app initialized
    if (typeof window !== "undefined") {
      // Delay the foreground message setup slightly to avoid conflicts with auth flow
      const timer = setTimeout(() => {
        // listenForForegroundMessages();
      }, 1000); // Wait 1 second after component mounts

      return () => clearTimeout(timer);
    }
    return undefined;
  }, []);

  return <>{children}</>;
}
