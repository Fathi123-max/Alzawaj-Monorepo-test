"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/providers/auth-provider";
import { showToast } from "@/components/ui/toaster";

// Types for notification settings
interface NotificationSettings {
  email: {
    enabled: boolean;
    notifications: {
      messages: boolean;
      marriageRequests: boolean;
      profileViews: boolean;
      matches: boolean;
      system: boolean;
    };
  };
  push: {
    enabled: boolean;
    notifications: {
      messages: boolean;
      marriageRequests: boolean;
      profileViews: boolean;
      matches: boolean;
      system: boolean;
    };
  };
  inApp: {
    enabled: boolean;
    notifications: {
      messages: boolean;
      marriageRequests: boolean;
      profileViews: boolean;
      matches: boolean;
      system: boolean;
    };
  };
  sms?: {
    enabled: boolean;
    phoneNumber?: string;
  };
  timezone: string;
  dailyDigest: boolean;
  weeklyDigest: boolean;
  doNotDisturb: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
}

export default function NotificationSettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<NotificationSettings>({
    email: {
      enabled: true,
      notifications: {
        messages: true,
        marriageRequests: true,
        profileViews: false,
        matches: true,
        system: true,
      },
    },
    push: {
      enabled: true,
      notifications: {
        messages: true,
        marriageRequests: true,
        profileViews: true,
        matches: true,
        system: true,
      },
    },
    inApp: {
      enabled: true,
      notifications: {
        messages: true,
        marriageRequests: true,
        profileViews: true,
        matches: true,
        system: true,
      },
    },
    sms: {
      enabled: false,
      phoneNumber: "",
    },
    timezone: "Asia/Riyadh",
    dailyDigest: false,
    weeklyDigest: true,
    doNotDisturb: {
      enabled: false,
      startTime: "22:00",
      endTime: "07:00",
    },
  });

  // Load settings from API when component mounts
  useEffect(() => {
    // In a real implementation, you would fetch user settings from the API
    // fetchNotificationSettings();
  }, []);

  const handleSaveSettings = async () => {
    try {
      // In a real implementation, you would save settings to the API
      // await saveNotificationSettings(settings);

      showToast.success("تم تحديث إعدادات الإشعارات بنجاح");
    } catch (error) {
      showToast.error("حدث خطأ أثناء تحديث إعدادات الإشعارات");
      console.error("Error saving notification settings:", error);
    }
  };

  const updateSettings = (path: string, value: any) => {
    setSettings((prev) => {
      const updated = { ...prev };
      const [category, subCategory, field] = path.split(".");

      if (subCategory === undefined) {
        // Update top-level field
        (updated as any)[category] = value;
      } else if (field === undefined) {
        // Update category.subCategory
        (updated as any)[category][subCategory] = value;
      } else {
        // Update category.subCategory.field
        (updated as any)[category][subCategory][field] = value;
      }

      return updated;
    });
  };

  const notificationTypes = [
    { id: "messages", label: "الرسائل" },
    { id: "marriageRequests", label: "طلبات الزواج" },
    { id: "profileViews", label: "عرض الملف الشخصي" },
    { id: "matches", label: "المطابقات" },
    { id: "system", label: "النظام" },
  ];

  const channels = [
    { id: "email", label: "البريد الإلكتروني", icon: "✉️" },
    { id: "push", label: "الإشعارات الفورية", icon: "🔔" },
    { id: "inApp", label: "الإشعارات داخل التطبيق", icon: "📱" },
  ];

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">إعدادات الإشعارات</CardTitle>
          <CardDescription>
            قم بإدارة كيفية وتلقيك للإشعارات في منصتك
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Notification Channels */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium">قنوات الإشعارات</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {channels.map((channel) => (
                <Card key={channel.id} className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{channel.icon}</span>
                      <span className="font-medium">{channel.label}</span>
                    </div>
                    <Switch
                      checked={
                        settings[channel.id as keyof NotificationSettings]
                          .enabled
                      }
                      onCheckedChange={(checked) =>
                        updateSettings(`${channel.id}.enabled`, checked)
                      }
                    />
                  </div>

                  <Separator className="my-3" />

                  <div className="space-y-3">
                    <h4 className="text-sm font-medium">نوع الإشعارات</h4>
                    {notificationTypes.map((type) => (
                      <div
                        key={type.id}
                        className="flex items-center justify-between"
                      >
                        <Label
                          htmlFor={`${channel.id}-${type.id}`}
                          className="text-sm"
                        >
                          {type.label}
                        </Label>
                        <Switch
                          id={`${channel.id}-${type.id}`}
                          checked={
                            settings[channel.id as keyof NotificationSettings]
                              .notifications[
                              type.id as keyof typeof settings.email.notifications
                            ]
                          }
                          onCheckedChange={(checked) =>
                            updateSettings(
                              `${channel.id}.notifications.${type.id}`,
                              checked,
                            )
                          }
                        />
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Digest Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">ملخصات الإشعارات</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label htmlFor="daily-digest" className="font-medium">
                    ملخص يومي
                  </Label>
                  <p className="text-sm text-gray-500">
                    تلقي ملخص يومي للإشعارات
                  </p>
                </div>
                <Switch
                  id="daily-digest"
                  checked={settings.dailyDigest}
                  onCheckedChange={(checked) =>
                    updateSettings("dailyDigest", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label htmlFor="weekly-digest" className="font-medium">
                    ملخص أسبوعي
                  </Label>
                  <p className="text-sm text-gray-500">
                    تلقي ملخص أسبوعي للإشعارات
                  </p>
                </div>
                <Switch
                  id="weekly-digest"
                  checked={settings.weeklyDigest}
                  onCheckedChange={(checked) =>
                    updateSettings("weeklyDigest", checked)
                  }
                />
              </div>
            </div>
          </div>

          {/* Do Not Disturb */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">عدم الإزعاج</h3>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <Label htmlFor="do-not-disturb" className="font-medium">
                    تفعيل وضع عدم الإزعاج
                  </Label>
                  <p className="text-sm text-gray-500">
                    عدم تلقي الإشعارات بين الفترات المحددة
                  </p>
                </div>
                <Switch
                  id="do-not-disturb"
                  checked={settings.doNotDisturb.enabled}
                  onCheckedChange={(checked) =>
                    updateSettings("doNotDisturb.enabled", checked)
                  }
                />
              </div>

              {settings.doNotDisturb.enabled && (
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label htmlFor="start-time">من</Label>
                    <input
                      type="time"
                      id="start-time"
                      value={settings.doNotDisturb.startTime}
                      onChange={(e) =>
                        updateSettings("doNotDisturb.startTime", e.target.value)
                      }
                      className="w-full p-2 border rounded mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-time">إلى</Label>
                    <input
                      type="time"
                      id="end-time"
                      value={settings.doNotDisturb.endTime}
                      onChange={(e) =>
                        updateSettings("doNotDisturb.endTime", e.target.value)
                      }
                      className="w-full p-2 border rounded mt-1"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Timezone */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">المنطقة الزمنية</h3>
            <div className="p-4 border rounded-lg">
              <Label htmlFor="timezone">اختر منطقتك الزمنية</Label>
              <select
                id="timezone"
                value={settings.timezone}
                onChange={(e) => updateSettings("timezone", e.target.value)}
                className="w-full p-2 border rounded mt-2"
              >
                <option value="UTC">UTC</option>
                <option value="Asia/Riyadh">السعودية (UTC+3)</option>
                <option value="Asia/Dubai">UAE (UTC+4)</option>
                <option value="Asia/Baghdad">العراق (UTC+3)</option>
                <option value="Asia/Kuwait">الكويت (UTC+3)</option>
                <option value="Asia/Qatar">قطر (UTC+3)</option>
                <option value="Asia/Bahrain">البحرين (UTC+3)</option>
                <option value="Asia/Muscat">عمان (UTC+4)</option>
              </select>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <Button onClick={handleSaveSettings}>حفظ الإعدادات</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
