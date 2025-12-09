"use client";

import { useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { formatTimeAgo } from "@/lib/utils";
import { useNotifications } from "@/providers/notification-provider";
import { useRouter } from "next/navigation";

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications();
  const router = useRouter();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleNotificationClick = (notification: any) => {
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
  };

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-4xl">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">الإشعارات</CardTitle>
              <CardDescription>جميع إشعارات منصتك في مكان واحد</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                {unreadCount} إشعار غير مقروء
              </span>
              {notifications.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllAsRead}
                  disabled={unreadCount === 0}
                >
                  تعليم الكل كمقروء
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center">
                <svg
                  className="h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                لا توجد إشعارات
              </h3>
              <p className="mt-2 text-gray-500">
                ستظهر الإشعارات هنا عندما تتلقى أحداث جديدة
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border transition-all hover:shadow-md cursor-pointer ${
                    !notification.isRead
                      ? "bg-primary/5 border-primary/30"
                      : "bg-white border-gray-200"
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4
                          className={`font-medium ${
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
                      <p className="mt-1 text-gray-600">
                        {notification.message}
                      </p>
                      <p className="mt-2 text-xs text-gray-400">
                        {formatTimeAgo(new Date(notification.createdAt))}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notification.id);
                      }}
                      className="h-8 w-8 p-0"
                      disabled={notification.isRead}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
