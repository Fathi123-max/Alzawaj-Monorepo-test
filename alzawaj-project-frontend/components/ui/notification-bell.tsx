"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, X, Check, SquareCheckBig } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/providers/notification-provider";
import { formatTimeAgo } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  data?: {
    requestId?: string;
    chatRoomId?: string;
    profileId?: string;
    url?: string;
  };
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications();
  const router = useRouter();

  // Fetch notifications when component mounts
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleNotificationClick = (notification: NotificationItem) => {
    // Mark as read
    markAsRead(notification.id);

    // Navigate to relevant page based on notification type
    if (notification.data?.url) {
      router.push(notification.data.url);
    } else if (notification.data?.requestId) {
      router.push(`/dashboard/requests/${notification.data.requestId}`);
    } else if (notification.data?.chatRoomId) {
      router.push(`/dashboard/chat/${notification.data.chatRoomId}`);
    } else if (notification.data?.profileId) {
      router.push(`/dashboard/profile/${notification.data.profileId}`);
    }

    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className={`relative p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary rounded-full ${
          isOpen ? "text-primary" : ""
        }`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="الإشعارات"
      >
        <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex items-center justify-center rounded-full h-4 w-4 bg-red-500 text-xs text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 max-h-96 overflow-hidden bg-white rounded-lg shadow-lg z-50 border border-gray-200 transform origin-top-right transition-all">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold text-gray-900">الإشعارات</h3>
            <div className="flex items-center gap-2">
              {notifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="h-8 p-1 text-xs"
                  disabled={unreadCount === 0}
                >
                  <SquareCheckBig className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 p-1"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
                <p className="mt-2">جاري تحميل الإشعارات...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto text-gray-300" />
                <p className="mt-2">لا توجد إشعارات</p>
              </div>
            ) : (
              <ul>
                {notifications.map((notification) => (
                  <li
                    key={notification.id}
                    className={`p-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notification.isRead ? "bg-blue-50" : "bg-white"
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4
                            className={`text-sm font-medium truncate ${
                              !notification.isRead
                                ? "text-primary font-semibold"
                                : "text-gray-900"
                            }`}
                          >
                            {notification.title}
                          </h4>
                          {!notification.isRead && (
                            <Badge
                              variant="secondary"
                              className="h-5 px-1.5 py-0 text-xs"
                            >
                              جديد
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1 truncate">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatTimeAgo(new Date(notification.createdAt))}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-2 bg-gray-50 border-t text-center">
              <Button
                variant="link"
                className="text-xs text-primary hover:text-primary-hover p-0 h-auto"
                onClick={() => router.push("/dashboard/notifications")}
              >
                عرض جميع الإشعارات
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
