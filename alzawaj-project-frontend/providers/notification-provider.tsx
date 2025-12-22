"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { notificationsApi } from "@/lib/api";
import { showToast } from "@/components/ui/toaster";

// Define Notification interface locally to avoid import issues
interface Notification {
  id: string;
  userId: string;
  type: "marriage-request" | "message" | "profile-approved" | "system";
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  data?: any;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addNotification: (notification: Notification) => void;
  removeNotification: (notificationId: string) => void;
  notificationPermission: NotificationPermission;
  checkNotificationPermission: () => NotificationPermission;
  fetchUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>("default");

  // Check notification permission on mount and when window gains focus
  const checkNotificationPermission =
    useCallback((): NotificationPermission => {
      if (typeof window !== "undefined" && "Notification" in window) {
        const permission = Notification.permission;
        setNotificationPermission(permission);
        return permission;
      }
      return "denied";
    }, []);

  // Initialize notification permission on mount
  useEffect(() => {
    checkNotificationPermission();

    // Listen for focus events to re-check permission
    const handleFocus = () => {
      checkNotificationPermission();
    };

    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [checkNotificationPermission]);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await notificationsApi.getUnreadCount();
      if (response.success && response.data) {
        setUnreadCount(response.data.count);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await notificationsApi.getNotifications();
      if (response.success && response.data) {
        setNotifications(response.data.notifications);
        await fetchUnreadCount();
      }
    } catch (error: any) {
      showToast.error(error.message || "خطأ في تحميل الإشعارات");
    } finally {
      setIsLoading(false);
    }
  }, [fetchUnreadCount]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await notificationsApi.markAsRead(notificationId);

      // Update local state
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification,
        ),
      );

      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error: any) {
      showToast.error(error.message || "خطأ في تحديث الإشعار");
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationsApi.markAllAsRead();

      // Update local state
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, isRead: true })),
      );

      setUnreadCount(0);
      showToast.success("تم تمييز جميع الإشعارات كمقروءة");
    } catch (error: any) {
      showToast.error(error.message || "خطأ في تحديث الإشعارات");
    }
  }, []);

  const addNotification = useCallback((notification: Notification) => {
    setNotifications((prev) => [notification, ...prev]);
    if (!notification.isRead) {
      setUnreadCount((prev) => prev + 1);
    }
  }, []);

  const removeNotification = useCallback((notificationId: string) => {
    setNotifications((prev) => {
      const notification = prev.find((n) => n.id === notificationId);
      if (notification && !notification.isRead) {
        setUnreadCount((prevCount) => Math.max(0, prevCount - 1));
      }
      return prev.filter((n) => n.id !== notificationId);
    });
  }, []);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    addNotification,
    removeNotification,
    notificationPermission,
    checkNotificationPermission,
    fetchUnreadCount,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider",
    );
  }
  return context;
}
