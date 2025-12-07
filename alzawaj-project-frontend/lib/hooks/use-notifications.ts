import { useEffect } from "react";
import { useNotifications } from "@/providers/notification-provider";

/**
 * Custom hook to set up real-time notification listeners
 * This hook connects to Socket.IO events and updates notifications in real-time
 * It should be used in a component that's within the NotificationProvider context
 */
export const useRealTimeNotifications = () => {
  const { fetchNotifications } = useNotifications();

  useEffect(() => {
    // Fetch notifications when component mounts
    fetchNotifications();
  }, [fetchNotifications]);

  // Currently, the real-time functionality is handled by the chat provider
  // which listens to Socket.IO events and updates the notification context
  // This hook provides a clean interface for components to ensure notifications
  // are properly initialized when they mount
};

/**
 * Custom hook to get notification count
 * Provides easy access to notification counts for UI indicators
 */
export const useNotificationCount = () => {
  const { notifications, unreadCount, isLoading } = useNotifications();

  return {
    notifications,
    unreadCount,
    isLoading,
    hasUnread: unreadCount > 0,
    totalNotifications: notifications.length,
  };
};
