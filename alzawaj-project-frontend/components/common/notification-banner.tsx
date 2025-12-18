"use client";

import React from "react";
import { Bell, X } from "lucide-react";
import { useNotifications } from "@/providers/notification-provider";
import { requestNotificationPermission } from "@/lib/services/notification-service";
import { Button } from "@/components/ui/button";

export function NotificationBanner() {
  const { notificationPermission, checkNotificationPermission } =
    useNotifications();

  // Don't show banner if notifications are granted or if we don't have notification support
  if (
    notificationPermission === "granted" ||
    typeof window === "undefined" ||
    !("Notification" in window)
  ) {
    return null;
  }

  const handleEnableNotifications = async () => {
    try {
      const granted = await requestNotificationPermission();
      if (granted) {
        checkNotificationPermission(); // Refresh permission state
      }
    } catch (error) {
      console.error("Error enabling notifications:", error);
    }
  };

  const handleDismiss = () => {
    // Hide banner for this session by storing dismissal in sessionStorage
    sessionStorage.setItem("notification-banner-dismissed", "true");
    // Force re-render by triggering a state update
    checkNotificationPermission();
  };

  // Check if banner was dismissed in this session
  if (
    typeof window !== "undefined" &&
    sessionStorage.getItem("notification-banner-dismissed")
  ) {
    return null;
  }

  return (
    <div className="bg-blue-50 border-b border-blue-200 px-4 py-3">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-3 space-x-reverse">
          <Bell className="h-5 w-5 text-blue-600" />
          <div className="text-sm">
            <p className="font-medium text-blue-900">تفعيل الإشعارات</p>
            <p className="text-blue-700">
              احصل على إشعارات فورية عند وصول رسائل جديدة أو تحديثات مهمة
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 space-x-reverse">
          <Button
            onClick={handleEnableNotifications}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            تفعيل
          </Button>
          <Button
            onClick={handleDismiss}
            variant="ghost"
            size="sm"
            className="text-blue-600 hover:text-blue-800 hover:bg-blue-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
