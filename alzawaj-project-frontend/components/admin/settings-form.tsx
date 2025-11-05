"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  adminApiService,
  AdminSettings,
  handleApiError,
} from "@/lib/services/admin-api-service";
import { showToast } from "@/components/ui/toaster";
import {
  Settings,
  Save,
  RefreshCw,
  MessageSquare,
  Shield,
  Palette,
  Sliders,
} from "lucide-react";

export function SettingsForm() {
  const [settings, setSettings] = useState<AdminSettings>({
    messageLimits: {
      perHour: 10,
      perDay: 50,
      maxConcurrentChats: 5,
    },
    chatSettings: {
      defaultExpiryDays: 14,
      maxExtensions: 2,
      extensionDays: 7,
    },
    moderationSettings: {
      autoApproveMessages: false,
      autoApproveProfiles: false,
      abusiveWords: [],
      arabicAbusiveWords: [],
      moderationThreshold: 0.7,
    },
    registrationSettings: {
      requirePhoneVerification: true,
      requireEmailVerification: true,
      minimumAge: 18,
      maximumAge: 80,
      allowedCountries: [],
    },
    privacyDefaults: {
      female: {
        profileVisibility: "verified-only",
        showProfilePicture: "matches-only",
        requireGuardianApproval: true,
      },
      male: {
        profileVisibility: "everyone",
        showProfilePicture: "everyone",
      },
    },
    emailTemplates: {
      welcome: { subject: "", body: "" },
      otp: { subject: "", body: "" },
      profileApproved: { subject: "", body: "" },
      marriageRequest: { subject: "", body: "" },
    },
    smsTemplates: {
      otp: "",
      welcome: "",
      marriageRequest: "",
    },
    themeSettings: {
      primaryColor: "#3B82F6",
      secondaryColor: "#10B981",
      accentColor: "#F59E0B",
      backgroundColor: "#FFFFFF",
    },
    rateLimits: {
      loginAttempts: { maxAttempts: 5, windowMinutes: 15 },
      registration: { maxPerIP: 3, windowHours: 24 },
      searchRequests: { maxPerHour: 100 },
    },
    features: {
      enableChat: true,
      enableVideoCall: false,
      enableProfileViews: true,
      enableReports: true,
      maintenanceMode: false,
    },
    _id: "",
    createdAt: "",
    updatedAt: "",
    __v: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const response = await adminApiService.getAdminSettings();

      if (response.success && response.data) {
        setSettings(response.data);
      } else {
        throw new Error("Failed to load admin settings");
      }
    } catch (error: any) {
      console.error("Error loading admin settings:", error);
      const errorMessage = handleApiError(error);
      showToast.error(errorMessage);

      // Fallback to default settings for development
      setSettings({
        messageLimits: {
          perHour: 10,
          perDay: 50,
          maxConcurrentChats: 5,
        },
        chatSettings: {
          defaultExpiryDays: 14,
          maxExtensions: 2,
          extensionDays: 7,
        },
        moderationSettings: {
          autoApproveMessages: false,
          autoApproveProfiles: false,
          abusiveWords: ["inappropriate", "offensive", "bad"],
          arabicAbusiveWords: ["غير لائق", "سيء", "خطأ"],
          moderationThreshold: 0.7,
        },
        registrationSettings: {
          requirePhoneVerification: true,
          requireEmailVerification: true,
          minimumAge: 18,
          maximumAge: 80,
          allowedCountries: [
            "Egypt",
            "Saudi Arabia",
            "Jordan",
            "Lebanon",
            "United Arab Emirates",
          ],
        },
        privacyDefaults: {
          female: {
            profileVisibility: "verified-only",
            showProfilePicture: "matches-only",
            requireGuardianApproval: true,
          },
          male: {
            profileVisibility: "everyone",
            showProfilePicture: "everyone",
          },
        },
        emailTemplates: {
          welcome: {
            subject: "Welcome to Islamic Marriage Platform",
            body: "Dear {name}, welcome to our Islamic marriage platform.",
          },
          otp: {
            subject: "Your OTP Code",
            body: "Your OTP code is {otp} and it is valid for 10 minutes.",
          },
          profileApproved: {
            subject: "Your Profile Has Been Approved",
            body: "Dear {name}, your profile has been approved.",
          },
          marriageRequest: {
            subject: "New Marriage Request",
            body: "Dear {name}, you have received a new marriage request.",
          },
        },
        smsTemplates: {
          otp: "Your OTP code is {otp} and it is valid for 10 minutes.",
          welcome:
            "Welcome to Islamic Marriage Platform. Your account has been created successfully.",
          marriageRequest:
            "You have received a new marriage request. Please check your dashboard.",
        },
        themeSettings: {
          primaryColor: "#3B82F6",
          secondaryColor: "#10B981",
          accentColor: "#F59E0B",
          backgroundColor: "#FFFFFF",
        },
        rateLimits: {
          loginAttempts: { maxAttempts: 5, windowMinutes: 15 },
          registration: { maxPerIP: 3, windowHours: 24 },
          searchRequests: { maxPerHour: 100 },
        },
        features: {
          enableChat: true,
          enableVideoCall: false,
          enableProfileViews: true,
          enableReports: true,
          maintenanceMode: false,
        },
        _id: "",
        createdAt: "",
        updatedAt: "",
        __v: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const response = await adminApiService.updateAdminSettings(settings);

      if (response.success) {
        showToast.success(response.message || "تم حفظ الإعدادات بنجاح");
      } else {
        throw new Error(response.message || "فشل في حفظ الإعدادات");
      }
    } catch (error: any) {
      console.error("Error saving admin settings:", error);
      const errorMessage = handleApiError(error);
      showToast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (
    category: keyof AdminSettings,
    key: string,
    value: any,
  ) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...((prev[category] as any) || {}),
        [key]: value,
      },
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-600">جاري التحميل...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Settings className="w-5 h-5" />
              إعدادات النظام
            </h2>
            <div className="flex gap-2">
              <Button
                onClick={loadSettings}
                disabled={loading}
                variant="outline"
                size="sm"
              >
                <RefreshCw
                  className={`w-4 h-4 ml-1 ${loading ? "animate-spin" : ""}`}
                />
                تحديث
              </Button>
              <Button onClick={handleSaveSettings} disabled={saving} size="sm">
                <Save
                  className={`w-4 h-4 ml-1 ${saving ? "animate-spin" : ""}`}
                />
                حفظ الإعدادات
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Message Limits Settings */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            حدود الرسائل
          </h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="perDay">الحد اليومي للرسائل</Label>
              <Input
                id="perDay"
                type="number"
                value={settings.messageLimits.perDay || 50}
                onChange={(e) =>
                  updateSetting(
                    "messageLimits",
                    "perDay",
                    parseInt(e.target.value),
                  )
                }
                min="1"
                max="200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="perHour">الحد بالساعة للرسائل</Label>
              <Input
                id="perHour"
                type="number"
                value={settings.messageLimits.perHour || 10}
                onChange={(e) =>
                  updateSetting(
                    "messageLimits",
                    "perHour",
                    parseInt(e.target.value),
                  )
                }
                min="1"
                max="50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxConcurrentChats">
                الحد الأقصى للمحادثات المتزامنة
              </Label>
              <Input
                id="maxConcurrentChats"
                type="number"
                value={settings.messageLimits.maxConcurrentChats || 5}
                onChange={(e) =>
                  updateSetting(
                    "messageLimits",
                    "maxConcurrentChats",
                    parseInt(e.target.value),
                  )
                }
                min="1"
                max="20"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chat Settings */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            إعدادات المحادثة
          </h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="defaultExpiryDays">
                انتهاء صلاحية المحادثة الافتراضية (أيام)
              </Label>
              <Input
                id="defaultExpiryDays"
                type="number"
                value={settings.chatSettings.defaultExpiryDays || 14}
                onChange={(e) =>
                  updateSetting(
                    "chatSettings",
                    "defaultExpiryDays",
                    parseInt(e.target.value),
                  )
                }
                min="1"
                max="365"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxExtensions">العدد الأقصى للتمديدات</Label>
              <Input
                id="maxExtensions"
                type="number"
                value={settings.chatSettings.maxExtensions || 2}
                onChange={(e) =>
                  updateSetting(
                    "chatSettings",
                    "maxExtensions",
                    parseInt(e.target.value),
                  )
                }
                min="0"
                max="10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="extensionDays">أيام التمديد</Label>
              <Input
                id="extensionDays"
                type="number"
                value={settings.chatSettings.extensionDays || 7}
                onChange={(e) =>
                  updateSetting(
                    "chatSettings",
                    "extensionDays",
                    parseInt(e.target.value),
                  )
                }
                min="1"
                max="30"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Moderation Settings */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Shield className="w-5 h-5" />
            إعدادات الإشراف
          </h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Switch
                id="autoApproveMessages"
                checked={
                  settings.moderationSettings.autoApproveMessages || false
                }
                onCheckedChange={(checked) =>
                  updateSetting(
                    "moderationSettings",
                    "autoApproveMessages",
                    checked,
                  )
                }
              />
              <Label htmlFor="autoApproveMessages">
                الموافقة التلقائية على الرسائل
              </Label>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <Switch
                id="autoApproveProfiles"
                checked={
                  settings.moderationSettings.autoApproveProfiles || false
                }
                onCheckedChange={(checked) =>
                  updateSetting(
                    "moderationSettings",
                    "autoApproveProfiles",
                    checked,
                  )
                }
              />
              <Label htmlFor="autoApproveProfiles">
                الموافقة التلقائية على الملفات الشخصية
              </Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="moderationThreshold">عتبة الإشراف</Label>
              <Input
                id="moderationThreshold"
                type="number"
                step="0.1"
                value={settings.moderationSettings.moderationThreshold || 0.7}
                onChange={(e) =>
                  updateSetting(
                    "moderationSettings",
                    "moderationThreshold",
                    parseFloat(e.target.value),
                  )
                }
                min="0.1"
                max="1.0"
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="abusiveWords">
                الكلمات المسيئة (باللغة الإنجليزية)
              </Label>
              <Input
                id="abusiveWords"
                type="text"
                value={
                  settings.moderationSettings.abusiveWords?.join(", ") || ""
                }
                onChange={(e) =>
                  updateSetting(
                    "moderationSettings",
                    "abusiveWords",
                    e.target.value
                      .split(",")
                      .map((word) => word.trim())
                      .filter(Boolean),
                  )
                }
                placeholder="أدخل الكلمات مفصولة بفاصلة"
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="arabicAbusiveWords">
                الكلمات المسيئة (باللغة العربية)
              </Label>
              <Input
                id="arabicAbusiveWords"
                type="text"
                value={
                  settings.moderationSettings.arabicAbusiveWords?.join(", ") ||
                  ""
                }
                onChange={(e) =>
                  updateSetting(
                    "moderationSettings",
                    "arabicAbusiveWords",
                    e.target.value
                      .split(",")
                      .map((word) => word.trim())
                      .filter(Boolean),
                  )
                }
                placeholder="أدخل الكلمات مفصولة بفاصلة"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Theme Settings */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Palette className="w-5 h-5" />
            إعدادات المظهر
          </h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primaryColor">اللون الأساسي</Label>
              <div className="flex gap-2">
                <Input
                  id="primaryColor"
                  type="color"
                  value={settings.themeSettings.primaryColor || "#3B82F6"}
                  onChange={(e) =>
                    updateSetting(
                      "themeSettings",
                      "primaryColor",
                      e.target.value,
                    )
                  }
                  className="w-20"
                />
                <Input
                  type="text"
                  value={settings.themeSettings.primaryColor || "#3B82F6"}
                  onChange={(e) =>
                    updateSetting(
                      "themeSettings",
                      "primaryColor",
                      e.target.value,
                    )
                  }
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="secondaryColor">اللون الثانوي</Label>
              <div className="flex gap-2">
                <Input
                  id="secondaryColor"
                  type="color"
                  value={settings.themeSettings.secondaryColor || "#10B981"}
                  onChange={(e) =>
                    updateSetting(
                      "themeSettings",
                      "secondaryColor",
                      e.target.value,
                    )
                  }
                  className="w-20"
                />
                <Input
                  type="text"
                  value={settings.themeSettings.secondaryColor || "#10B981"}
                  onChange={(e) =>
                    updateSetting(
                      "themeSettings",
                      "secondaryColor",
                      e.target.value,
                    )
                  }
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="accentColor">اللون المميز</Label>
              <div className="flex gap-2">
                <Input
                  id="accentColor"
                  type="color"
                  value={settings.themeSettings.accentColor || "#F59E0B"}
                  onChange={(e) =>
                    updateSetting(
                      "themeSettings",
                      "accentColor",
                      e.target.value,
                    )
                  }
                  className="w-20"
                />
                <Input
                  type="text"
                  value={settings.themeSettings.accentColor || "#F59E0B"}
                  onChange={(e) =>
                    updateSetting(
                      "themeSettings",
                      "accentColor",
                      e.target.value,
                    )
                  }
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="backgroundColor">لون الخلفية</Label>
              <div className="flex gap-2">
                <Input
                  id="backgroundColor"
                  type="color"
                  value={settings.themeSettings.backgroundColor || "#FFFFFF"}
                  onChange={(e) =>
                    updateSetting(
                      "themeSettings",
                      "backgroundColor",
                      e.target.value,
                    )
                  }
                  className="w-20"
                />
                <Input
                  type="text"
                  value={settings.themeSettings.backgroundColor || "#FFFFFF"}
                  onChange={(e) =>
                    updateSetting(
                      "themeSettings",
                      "backgroundColor",
                      e.target.value,
                    )
                  }
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-end">
            <Button
              onClick={handleSaveSettings}
              disabled={saving}
              className="w-full md:w-auto"
            >
              <Save
                className={`w-4 h-4 ml-2 ${saving ? "animate-spin" : ""}`}
              />
              {saving ? "جاري الحفظ..." : "حفظ جميع الإعدادات"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
