"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProfileDialog } from "@/components/profile/profile-dialog";
import {
  Eye,
  MapPin,
  Calendar,
  User,
  Shield,
  Lock,
  MessageCircle,
  Bookmark,
  GraduationCap,
  Briefcase,
  Clock,
} from "lucide-react";
import { Profile } from "@/lib/mock-data/profiles";
// Toast functionality - can be replaced with your preferred toast library
const toast = {
  success: (message: string) => console.log("✅", message),
  error: (message: string) => console.log("❌", message),
};

interface ProfileCardProps {
  profile: Profile;
  onSendRequest?: (profileId: string) => Promise<void>;
  onSave?: (profileId: string, isSaved: boolean) => Promise<void>;
  currentUserGender: "male" | "female";
  compact?: boolean;
  showActions?: boolean;
  compatibilityScore?: number | null;
  canSendRequest?: boolean;
  userEmail?: string | undefined;
  userPhone?: string | undefined;
}

export function ProfileCard({
  profile,
  onSendRequest,
  onSave,
  currentUserGender,
  compact = false,
  showActions = true,
  compatibilityScore,
  canSendRequest = true,
  userEmail,
  userPhone,
}: ProfileCardProps) {
  const router = useRouter();
  const [isSaved, setIsSaved] = useState((profile as any).isSaved || false);
  const [isRequestSent, setIsRequestSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [dialogDefaultTab, setDialogDefaultTab] = useState<
    "profile" | "request"
  >("profile");

  console.log("🎴 ProfileCard rendering:", {
    profileId: profile.id,
    profilePicture: profile.profilePicture,
    firstname: profile.firstname,
    lastname: profile.lastname,
  });

  const handleSave = async () => {
    try {
      setLoading(true);
      const newSavedState = !isSaved;
      if (onSave) {
        await onSave(profile.id, newSavedState);
      }
      setIsSaved(newSavedState);
      toast.success(newSavedState ? "تم حفظ الملف الشخصي" : "تم إلغاء الحفظ");
    } catch (error) {
      toast.error("حدث خطأ، حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async () => {
    // Open the profile dialog with request tab
    setDialogDefaultTab("request");
    setShowProfileDialog(true);
  };

  const handleViewProfile = () => {
    // Open the profile dialog with profile tab
    setDialogDefaultTab("profile");
    setShowProfileDialog(true);
  };

  const getInitials = (firstname: string, lastname: string) => {
    return (firstname.charAt(0) + lastname.charAt(0)).toUpperCase();
  };

  const getOnlineStatus = () => {
    if (profile.isOnline) {
      return (
        <Badge
          variant="secondary"
          className="bg-green-100 text-green-800 border-green-200"
        >
          <div className="w-2 h-2 bg-green-500 rounded-full ml-1"></div>
          متصل الآن
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="bg-gray-100 text-gray-600">
        <Clock className="w-3 h-3 ml-1" />
        {profile.lastActive}
      </Badge>
    );
  };

  const getAppearanceBadges = () => {
    const badges = [];

    if (profile.gender === "male" && profile.hasBeard) {
      badges.push(
        <Badge key="beard" variant="outline" className="text-xs">
          لديه لحية
        </Badge>,
      );
    }

    if (profile.gender === "female") {
      if (profile.wearHijab) {
        badges.push(
          <Badge key="hijab" variant="outline" className="text-xs">
            محجبة
          </Badge>,
        );
      }
      if (profile.wearNiqab) {
        badges.push(
          <Badge key="niqab" variant="outline" className="text-xs">
            منتقبة
          </Badge>,
        );
      }
    }

    return badges;
  };

  if (compact) {
    return (
      <Card className="overflow-hidden hover:shadow-md transition-all duration-200 group">
        <CardContent className="p-4">
          <div className="flex items-start space-x-4 space-x-reverse">
            {/* Avatar */}
            <Avatar className="w-16 h-16 flex-shrink-0 border-2 border-gray-100">
              <AvatarImage
                src={profile.profilePicture}
                alt={`${profile.firstname} ${profile.lastname}`}
                className="object-cover"
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
              />
              <AvatarFallback
                className={`text-white text-lg font-semibold ${
                  profile.gender === "female" ? "bg-pink-500" : "bg-blue-500"
                }`}
              >
                {getInitials(profile.firstname, profile.lastname)}
              </AvatarFallback>
            </Avatar>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-gray-900 truncate">
                    {profile.firstname} {profile.lastname}
                  </h3>
                  <p className="text-sm text-gray-600">{profile.age} سنة</p>
                </div>
                {profile.verified && (
                  <Shield className="w-4 h-4 text-blue-500 flex-shrink-0" />
                )}
              </div>

              <div className="flex items-center text-sm text-gray-600 mb-2">
                <MapPin className="w-4 h-4 ml-1" />
                {profile.city}, {profile.country}
              </div>

              <p className="text-sm text-gray-700 line-clamp-2 mb-3">
                {profile.bio}
              </p>

              {showActions && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={handleSendRequest}
                    disabled={isRequestSent || loading || !canSendRequest}
                  >
                    <MessageCircle className="w-4 h-4 ml-1" />
                    {!canSendRequest
                      ? "غير متاح"
                      : isRequestSent
                        ? "تم الإرسال"
                        : "تواصل"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSave}
                    disabled={loading}
                  >
                    <Bookmark
                      className={`w-4 h-4 ${isSaved ? "fill-blue-500 text-blue-500" : ""}`}
                    />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
        {/* Header with online status */}
        <div className="p-4 pb-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {getOnlineStatus()}
              {compatibilityScore !== null &&
                compatibilityScore !== undefined && (
                  <Badge
                    variant="secondary"
                    className="bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-green-300"
                  >
                    <Heart className="w-3 h-3 ml-1" />
                    {Math.round(compatibilityScore)}% تطابق
                  </Badge>
                )}
            </div>
            {profile.verified && (
              <div className="flex items-center text-blue-600">
                <Shield className="w-4 h-4 ml-1" />
                <span className="text-xs">موثق</span>
              </div>
            )}
          </div>
        </div>

        <CardContent className="p-4 pt-0">
          {/* Main Profile Info */}
          <div className="text-center mb-4">
            <Avatar className="w-24 h-24 mx-auto mb-3 ring-4 ring-white shadow-lg">
              <AvatarImage
                src={profile.profilePicture}
                alt={`${profile.firstname} ${profile.lastname}`}
                className="object-cover"
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
              />
              <AvatarFallback
                className={`text-white text-xl font-semibold ${
                  profile.gender === "female"
                    ? "bg-gradient-to-br from-pink-400 to-pink-600"
                    : "bg-gradient-to-br from-blue-400 to-blue-600"
                }`}
              >
                {getInitials(profile.firstname, profile.lastname)}
              </AvatarFallback>
            </Avatar>

            <h3 className="text-xl font-bold text-gray-900 mb-1">
              {profile.firstname} {profile.lastname}
            </h3>

            <p className="text-gray-600 mb-2">{profile.age} سنة</p>

            <div className="flex items-center justify-center text-gray-600 mb-3">
              <MapPin className="w-4 h-4 ml-1" />
              <span className="text-sm">
                {profile.city}, {profile.country}
              </span>
            </div>

            {/* Completion Progress */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${profile.profileCompletion}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500">
              اكتمال الملف {profile.profileCompletion}%
            </p>
          </div>

          {/* Key Information */}
          <div className="space-y-3 mb-4">
            <div className="flex items-center text-sm">
              <User className="w-4 h-4 ml-2 text-gray-400" />
              <span className="font-medium ml-2">الحالة:</span>
              <span
                className={`${profile.maritalStatus === "غير محدد" ? "text-gray-400 italic" : "text-gray-700"}`}
              >
                {profile.maritalStatus}
              </span>
            </div>

            <div className="flex items-center text-sm">
              <GraduationCap className="w-4 h-4 ml-2 text-gray-400" />
              <span className="font-medium ml-2">التعليم:</span>
              <span
                className={`${profile.education === "غير محدد" ? "text-gray-400 italic" : "text-gray-700"}`}
              >
                {profile.education}
              </span>
            </div>

            <div className="flex items-center text-sm">
              <Briefcase className="w-4 h-4 ml-2 text-gray-400" />
              <span className="font-medium ml-2">المهنة:</span>
              <span
                className={`${profile.occupation === "غير محدد" ? "text-gray-400 italic" : "text-gray-700"}`}
              >
                {profile.occupation}
              </span>
            </div>

            <div className="flex items-center text-sm">
              <Calendar className="w-4 h-4 ml-2 text-gray-400" />
              <span className="font-medium ml-2">الديانة:</span>
              <span
                className={`${profile.religiousLevel === "غير محدد" ? "text-gray-400 italic" : "text-gray-700"}`}
              >
                {profile.religiousLevel}
              </span>
            </div>
          </div>

          {/* Bio */}
          <div className="mb-4">
            <p className="text-sm text-gray-700 line-clamp-3 leading-relaxed">
              {profile.bio && profile.bio !== "لا توجد معلومات إضافية"
                ? profile.bio
                : "لم يتم إضافة وصف شخصي بعد..."}
            </p>
          </div>

          {/* Appearance Badges */}
          {getAppearanceBadges().length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {getAppearanceBadges()}
            </div>
          )}

          {/* Interests */}
          {profile.interests.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-500 mb-2">
                الاهتمامات:
              </p>
              <div className="flex flex-wrap gap-1">
                {profile.interests.slice(0, 3).map((interest, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {interest}
                  </Badge>
                ))}
                {profile.interests.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{profile.interests.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {showActions && (
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSendRequest}
                disabled={isRequestSent || loading || !canSendRequest}
                className="flex-1"
              >
                <MessageCircle className="w-4 h-4 ml-1" />
                {!canSendRequest
                  ? "غير متاح"
                  : isRequestSent
                    ? "تم الإرسال"
                    : "طلب تواصل"}
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={handleSave}
                disabled={loading}
                className="w-12"
              >
                <Bookmark
                  className={`w-4 h-4 ${isSaved ? "fill-blue-500 text-blue-500" : ""}`}
                />
              </Button>
            </div>
          )}

          {/* View Profile Link */}
          <div className="mt-3 pt-3 border-t border-gray-100">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-primary hover:text-primary-hover"
              onClick={handleViewProfile}
            >
              <Eye className="w-4 w-4 ml-1" />
              عرض الملف الكامل
            </Button>
          </div>
        </CardContent>
      </Card>

      <ProfileDialog
        userId={profile.id}
        open={showProfileDialog}
        onOpenChange={(open) => {
          setShowProfileDialog(open);
          if (!open) {
            setDialogDefaultTab("profile");
          }
        }}
        openToTab={dialogDefaultTab}
        {...(userEmail && { userEmail })}
        {...(userPhone && { userPhone })}
      />
    </>
  );
}
