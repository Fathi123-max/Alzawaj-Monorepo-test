"use client";

import { useEffect, useState } from "react";
import { ProfileCard } from "@/components/search/profile-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bookmark, ChevronLeft, ChevronRight } from "lucide-react";
import { bookmarkApi } from "@/lib/api/bookmark";
import { showToast } from "@/components/ui/toaster";
import { useAuth } from "@/providers/auth-provider";
import { Profile as MockProfile } from "@/lib/mock-data/profiles";

const toast = {
  success: (message: string) => showToast.success(message),
  error: (message: string) => showToast.error(message),
};

// Convert API profile to display format
const convertToDisplayProfile = (apiProfile: any): MockProfile => {
  const basicInfo = apiProfile.basicInfo || {};
  const personalInfo = apiProfile.personalInfo || {};
  const professional = apiProfile.professional || {};
  const religiousInfo = apiProfile.religiousInfo || {};
  const locationInfo = apiProfile.location || {};

  const fullName = basicInfo.fullName || `${apiProfile.firstname || ""} ${apiProfile.lastname || ""}`.trim() || "غير محدد";
  const nameParts = fullName.split(" ").filter((p: string) => p.length > 0);
  const firstName = nameParts[0] || "غير";
  const lastName = nameParts.slice(1).join(" ") || "محدد";

  const genderValue = apiProfile.gender || basicInfo.gender;
  const gender = genderValue === "f" || genderValue === "female" ? "female" : "male";

  return {
    id: apiProfile._id || apiProfile.id || "",
    firstname: firstName,
    lastname: lastName,
    age: apiProfile.age || basicInfo.age || 0,
    gender: gender as "male" | "female",
    location: `${locationInfo.city || "غير محدد"}, ${locationInfo.country || "غير محدد"}`,
    education: professional.educationLevel || apiProfile.education || "غير محدد",
    occupation: professional.occupation || apiProfile.occupation || "غير محدد",
    bio: personalInfo.about || apiProfile.bio || "لا توجد معلومات إضافية",
    profilePicture: apiProfile.profilePicture || (gender === "male" ? "/default-male-avatar.svg" : "/default-female-avatar.svg"),
    verified: Boolean(apiProfile.verification?.isVerified || apiProfile.isApproved || false),
    isOnline: Boolean(apiProfile.isOnline || false),
    lastActive: apiProfile.lastActive || "منذ ساعة",
    profileCompletion: apiProfile.completionPercentage || 50,
    interests: personalInfo.interests || apiProfile.interests || [],
    hasBeard: Boolean(apiProfile.hasBeard || false),
    wearHijab: Boolean(apiProfile.wearHijab || false),
    wearNiqab: Boolean(apiProfile.wearNiqab || false),
    height: personalInfo.height || apiProfile.height || 0,
    religiousLevel: religiousInfo.religiousLevel || "غير محدد",
    maritalStatus: basicInfo.maritalStatus || apiProfile.maritalStatus || "غير محدد",
    country: locationInfo.country || "غير محدد",
    city: locationInfo.city || "غير محدد",
    nationality: basicInfo.nationality || "غير محدد",
    wantsChildren: basicInfo.wantChildren ? "نعم" : "لا",
  } as unknown as MockProfile;
};

export default function BookmarksPage() {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<MockProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const fetchBookmarks = async (page = 1) => {
    setLoading(true);
    try {
      const response = await bookmarkApi.getAll(page, 12);
      const convertedProfiles = (response.bookmarks || []).map(convertToDisplayProfile);
      setBookmarks(convertedProfiles);
      setPagination(response.pagination);
    } catch (error: any) {
      toast.error(error.message || "فشل في تحميل الملفات المحفوظة");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookmarks(currentPage);
  }, [currentPage]);

  const handleSaveProfile = async (profileId: string, isSaved: boolean) => {
    try {
      if (!isSaved) {
        await bookmarkApi.remove(profileId);
        // Refresh the list after removing
        await fetchBookmarks(currentPage);
      }
    } catch (error: any) {
      throw new Error(error.message || "حدث خطأ");
    }
  };

  const handleSendRequest = async (profileId: string) => {
    // Handled by ProfileDialog
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      <div className="text-center mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          الملفات المحفوظة
        </h1>
        <p className="text-gray-600 text-sm md:text-base">
          الملفات الشخصية التي قمت بحفظها ({pagination.totalCount})
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : bookmarks.length > 0 ? (
        <div>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
            {bookmarks.map((profile) => (
              <ProfileCard
                key={profile.id}
                profile={{...profile, isSaved: true}}
                onSave={handleSaveProfile}
                onSendRequest={handleSendRequest}
                currentUserGender={user?.gender || "male"}
                userEmail={user?.email}
                userPhone={user?.phone}
              />
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={!pagination.hasPrevPage}
              >
                <ChevronRight className="h-4 w-4" />
                السابق
              </Button>

              <span className="px-3 py-1 text-sm text-gray-600">
                {currentPage} / {pagination.totalPages}
              </span>

              <Button
                variant="outline"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={!pagination.hasNextPage}
              >
                التالي
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Bookmark className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              لا توجد ملفات محفوظة
            </h3>
            <p className="text-gray-600 mb-4">
              لم تقم بحفظ أي ملفات شخصية بعد
            </p>
            <Button onClick={() => (window.location.href = "/dashboard/search")}>
              ابحث عن شريك الحياة
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
