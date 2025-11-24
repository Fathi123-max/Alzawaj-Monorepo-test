"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/providers/auth-provider";
import { showToast } from "@/components/ui/toaster";
import { PrivacySettingsComponent } from "./privacy-settings";
import { PrivacySettings, Profile } from "@/lib/types";
import { updatePrivacySettings, getProfile } from "@/lib/api/profile";
import { authApi } from "@/lib/api";

export function SettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: true,
      newMessages: true,
      newRequests: true,
    },
    privacy: {
      profileVisibility: "everyone" as "everyone" | "matches-only" | "none",
      allowMessages: "everyone" as "everyone" | "matches-only" | "none",
    },
    account: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profileData = await getProfile();
        if (profileData) {
          setProfile(profileData as any);
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      }
    };
    loadProfile();
  }, []);

  const handleSaveNotifications = async () => {
    setLoading(true);
    try {
      // TODO: Implement notification settings endpoint when backend is ready
      showToast.success("تم حفظ إعدادات التنبيهات");
    } catch (error) {
      showToast.error("خطأ في حفظ الإعدادات");
    } finally {
      setLoading(false);
    }
  };

  const handleSavePrivacy = async (privacySettings: PrivacySettings) => {
    setLoading(true);
    try {
      console.log("Settings Page - Saving privacy settings:", privacySettings);
      const response = await updatePrivacySettings(privacySettings);
      console.log("Settings Page - Save response:", response);
      
      // Wait a moment for the database to update
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Reload profile to get updated values
      const updatedProfile = await getProfile();
      if (updatedProfile) {
        console.log("Settings Page - Updated profile:", updatedProfile);
        console.log("Settings Page - Updated privacy:", updatedProfile.privacy);
        setProfile(updatedProfile as any);
      }
      showToast.success("تم حفظ إعدادات الخصوصية");
    } catch (error) {
      console.error("Settings Page - Error saving privacy settings:", error);
      showToast.error("خطأ في حفظ الإعدادات");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (settings.account.newPassword !== settings.account.confirmPassword) {
      showToast.error("كلمة المرور الجديدة غير متطابقة");
      return;
    }

    setLoading(true);
    try {
      await authApi.changePassword({
        currentPassword: settings.account.currentPassword,
        newPassword: settings.account.newPassword,
      });
      showToast.success("تم تغيير كلمة المرور");
      setSettings((prev) => ({
        ...prev,
        account: {
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        },
      }));
    } catch (error) {
      showToast.error("خطأ في تغيير كلمة المرور");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Privacy Settings - Hidden */}
      {/* <PrivacySettingsComponent
        key={profile?._id || 'no-profile'}
        profile={profile as any}
        onSave={handleSavePrivacy}
      /> */}

      {/* Account Security */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">أمان الحساب</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="كلمة المرور الحالية"
            type="password"
            value={settings.account.currentPassword}
            onChange={(e) =>
              setSettings((prev) => ({
                ...prev,
                account: { ...prev.account, currentPassword: e.target.value },
              }))
            }
            placeholder="أدخل كلمة المرور الحالية"
          />

          <Input
            label="كلمة المرور الجديدة"
            type="password"
            value={settings.account.newPassword}
            onChange={(e) =>
              setSettings((prev) => ({
                ...prev,
                account: { ...prev.account, newPassword: e.target.value },
              }))
            }
            placeholder="أدخل كلمة المرور الجديدة"
          />

          <Input
            label="تأكيد كلمة المرور الجديدة"
            type="password"
            value={settings.account.confirmPassword}
            onChange={(e) =>
              setSettings((prev) => ({
                ...prev,
                account: { ...prev.account, confirmPassword: e.target.value },
              }))
            }
            placeholder="أكد كلمة المرور الجديدة"
          />

          <div className="pt-4">
            <Button
              onClick={handleChangePassword}
              disabled={
                loading ||
                !settings.account.currentPassword ||
                !settings.account.newPassword ||
                !settings.account.confirmPassword
              }
            >
              تغيير كلمة المرور
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account Actions */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">إجراءات الحساب</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-yellow-50 p-4 rounded-md">
            <h4 className="font-medium text-yellow-800 mb-2">تصدير البيانات</h4>
            <p className="text-sm text-yellow-700 mb-3">
              احصل على نسخة من جميع بياناتك الشخصية
            </p>
            <Button variant="outline" size="sm">
              تصدير البيانات
            </Button>
          </div>

          <div className="bg-red-50 p-4 rounded-md">
            <h4 className="font-medium text-red-800 mb-2">حذف الحساب</h4>
            <p className="text-sm text-red-700 mb-3">
              حذف حسابك نهائياً مع جميع البيانات المرتبطة به
            </p>
            <Button variant="destructive" size="sm">
              حذف الحساب
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
