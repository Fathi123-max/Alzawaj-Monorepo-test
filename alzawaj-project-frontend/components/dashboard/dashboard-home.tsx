"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getUserFromLocalStorage } from "@/lib/utils/localstorage";
import { getStoredToken } from "@/lib/utils/auth.utils";
import { searchService, DashboardStats } from "@/lib/services/search-service";
import { searchApiService } from "@/lib/services/search-api-service";
import { ProfileCard } from "@/components/search/profile-card";
import { Profile, mockCurrentUser } from "@/lib/mock-data/profiles";
import { Eye, Users, MessageCircle } from "lucide-react";

export function DashboardHome() {
  const user = getUserFromLocalStorage();
  const [stats, setStats] = useState<DashboardStats>({
    profileViews: 0,
    totalRequests: 0,
    pendingRequests: 0,
    activeChats: 0,
    totalProfiles: 0,
    onlineProfiles: 0,
    todayViews: 0,
    newMatches: 0,
  });
  const [featuredProfiles, setFeaturedProfiles] = useState<Profile[]>([]);
  const [recentProfiles, setRecentProfiles] = useState<Profile[]>([]);
  const [onlineProfiles, setOnlineProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load dashboard data - try API first, fallback to service
    const loadDashboardData = async () => {
      try {
        setLoading(true);

        // Try to fetch from API, but handle errors gracefully
        let apiDataFetched = false;

        try {
          // Fetch real data from backend API
          const [recommendationsRes, searchStatsRes] = await Promise.allSettled(
            [
              searchApiService.getRecommendations(3),
              searchApiService.getSearchStats(),
            ],
          );

          // Handle recommendations
          if (
            recommendationsRes.status === "fulfilled" &&
            recommendationsRes.value?.success
          ) {
            const profiles =
              (recommendationsRes.value.data as any).recommendations ||
              (recommendationsRes.value.data as any).profiles ||
              [];

            if (Array.isArray(profiles)) {
              // Transform backend profiles to match frontend interface
              const transformedProfiles = profiles.map((profile: any) => {
                // Safely extract name
                const fullName =
                  profile?.basicInfo?.name || profile?.firstname || "غير محدد";
                const nameParts = String(fullName).split(" ");
                const firstname = nameParts[0] || "غير محدد";
                const lastname = nameParts.slice(1).join(" ");

                return {
                  id: profile?.id || profile?._id || `temp-${Math.random()}`,
                  firstname,
                  lastname,
                  age: profile?.age || profile?.basicInfo?.age || 25,
                  city: profile?.city || profile?.location?.city || "غير محدد",
                  country:
                    profile?.country ||
                    profile?.location?.country ||
                    "غير محدد",
                  gender: profile?.gender || "m",
                  profilePicture: profile?.profilePicture || "",
                  verified: profile?.verified || false,
                  profileCompletion: profile?.completionPercentage || 0,
                  isOnline: Math.random() > 0.5,
                  joinDate: profile?.createdAt || new Date().toISOString(),
                };
              });

              setFeaturedProfiles(transformedProfiles as any);
              setRecentProfiles(transformedProfiles as any);
              setOnlineProfiles(transformedProfiles.slice(0, 4) as any);
              apiDataFetched = true;
            }
          }
        } catch (apiError) {
          console.warn("API fetch failed, will use fallback:", apiError);
        }

        // Handle stats
        try {
          // Fetch stats, pending requests, and active chats in parallel
          const [searchStatsRes, receivedRequestsRes, chatRoomsRes] = await Promise.allSettled([
            searchApiService.getSearchStats(),
            // Fetch received requests to get pending count
            fetch("/api/requests/received?page=1&limit=100", {
              headers: {
                "Authorization": `Bearer ${getStoredToken()}`,
              },
            }).then(res => res.json()),
            // Fetch chat rooms to get active chats count
            fetch("/api/chat/rooms", {
              headers: {
                "Authorization": `Bearer ${getStoredToken()}`,
              },
            }).then(res => res.json()),
          ]);

          // Handle search stats
          if (searchStatsRes.status === "fulfilled" && searchStatsRes.value?.success) {
            const searchData = searchStatsRes.value.data as any;
            setStats({
              profileViews: searchData?.totalViews || 0,
              totalRequests: searchData?.totalMatches || 0,
              totalProfiles: searchData?.totalProfiles || 0,
              onlineProfiles: searchData?.onlineProfiles || 0,
              todayViews: searchData?.todayViews || 0,
              newMatches: searchData?.newMatches || 0,
              pendingRequests: 0,
              activeChats: 0,
            });
          }

          // Handle pending requests
          if (receivedRequestsRes.status === "fulfilled" && receivedRequestsRes.value?.success) {
            const requests = receivedRequestsRes.value.data?.requests || [];
            const pendingCount = requests.filter((r: any) => r.status === "pending").length;
            setStats(prev => ({
              ...prev,
              pendingRequests: pendingCount,
            }));
          }

          // Handle active chats
          if (chatRoomsRes.status === "fulfilled" && chatRoomsRes.value?.success) {
            const chatRooms = chatRoomsRes.value.data || [];
            setStats(prev => ({
              ...prev,
              activeChats: chatRooms.length,
            }));
          }

          apiDataFetched = true;
        } catch (statsError) {
          console.warn("Stats API fetch failed:", statsError);
        }

        // If API failed, use fallback service
        if (!apiDataFetched) {
          const [
            fallbackStats,
            fallbackFeatured,
            fallbackRecent,
            fallbackOnline,
          ] = await Promise.allSettled([
            searchService.getDashboardStats(),
            searchService.getFeaturedProfiles(3),
            searchService.getRecentProfiles(3),
            searchService.getOnlineProfiles(4),
          ]);

          if (fallbackStats.status === "fulfilled") {
            setStats(fallbackStats.value);
          }
          if (
            fallbackFeatured.status === "fulfilled" &&
            Array.isArray(fallbackFeatured.value)
          ) {
            setFeaturedProfiles(fallbackFeatured.value);
          }
          if (
            fallbackRecent.status === "fulfilled" &&
            Array.isArray(fallbackRecent.value)
          ) {
            setRecentProfiles(fallbackRecent.value);
          }
          if (
            fallbackOnline.status === "fulfilled" &&
            Array.isArray(fallbackOnline.value)
          ) {
            setOnlineProfiles(fallbackOnline.value);
          }
        }
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        // Keep default empty state
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const handleSendRequest = async (profileId: string): Promise<void> => {
    try {
      const result = await searchService.sendConnectionRequest(profileId);
      console.log(result.success ? "✅" : "❌", result.message);
    } catch (error) {
      console.log("❌", "حدث خطأ في إرسال الطلب");
    }
  };

  const handleLikeProfile = async (profileId: string): Promise<void> => {
    try {
      const result = await searchService.likeProfile(profileId);
      console.log(result.success ? "✅" : "❌", result.message);
    } catch (error) {
      console.log("❌", "حدث خطأ في الإعجاب");
    }
  };

  const handleSaveProfile = async (profileId: string): Promise<void> => {
    try {
      const result = await searchService.saveProfile(profileId);
      console.log(result.success ? "✅" : "❌", result.message);
    } catch (error) {
      console.log("❌", "حدث خطأ في الحفظ");
    }
  };

  const quickActions = [
    {
      title: "البحث عن شريك",
      description: "ابحث عن الشريك المناسب باستخدام الفلاتر",
      href: "/dashboard/search",
      icon: "🔍",
      gradient: "from-primary to-primary-hover",
      bgColor: "bg-gradient-to-br from-primary-subtle to-primary-subtle/50",
      hoverColor: "hover:from-primary-subtle/70 hover:to-primary-subtle",
    },
    {
      title: "طلبات الزواج",
      description: "إدارة الطلبات المرسلة والمستلمة",
      href: "/dashboard/requests",
      icon: "💍",
      gradient: "from-pink-500 to-rose-600",
      bgColor: "bg-gradient-to-br from-pink-50 to-rose-100",
      hoverColor: "hover:from-pink-100 hover:to-rose-200",
      badge:
        stats.pendingRequests > 0
          ? stats.pendingRequests.toString()
          : undefined,
    },
    {
      title: "المحادثات",
      description: "تابع محادثاتك النشطة",
      href: "/dashboard/chat",
      icon: "💬",
      gradient: "from-green-500 to-emerald-600",
      bgColor: "bg-gradient-to-br from-green-50 to-emerald-100",
      hoverColor: "hover:from-green-100 hover:to-emerald-200",
      badge: stats.activeChats > 0 ? stats.activeChats.toString() : undefined,
    },
    {
      title: "الملف الشخصي",
      description: "عرض وتحديث معلوماتك الشخصية",
      href: "/dashboard/profile",
      icon: "👤",
      gradient: "from-purple-500 to-indigo-600",
      bgColor: "bg-gradient-to-br from-purple-50 to-indigo-100",
      hoverColor: "hover:from-purple-100 hover:to-indigo-200",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Welcome Section */}
      <div className="text-center sm:text-right px-1">
        <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 mb-2">
          مرحباً،
          {user?.firstname} {user?.lastname}
          👋
        </h1>
        <p className="text-xs sm:text-sm lg:text-base text-gray-600 max-w-2xl mx-auto sm:mx-0 leading-relaxed">
          إليك نظرة عامة على نشاطك في منصة الزواج الإسلامية. نسأل الله أن يبارك
          لك ويوفقك في إيجاد شريك حياتك.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 xl:gap-6">
        <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 badge-primary rounded-xl flex items-center justify-center text-white text-base sm:text-lg lg:text-xl xl:text-2xl shadow-lg">
                📊
              </div>
              <div className="mr-2 sm:mr-3 lg:mr-4 min-w-0 flex-1">
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-primary truncate font-display">
                  {stats.profileViews}
                </p>
                <p className="text-body-small text-text-secondary truncate arabic-optimized">
                  مشاهدات الملف
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center text-white text-base sm:text-lg lg:text-xl xl:text-2xl shadow-lg">
                💍
              </div>
              <div className="mr-2 sm:mr-3 lg:mr-4 min-w-0 flex-1">
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-pink-600 truncate font-display">
                  {stats.totalRequests}
                </p>
                <p className="text-body-small text-text-secondary truncate arabic-optimized">
                  إجمالي الطلبات
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center text-white text-base sm:text-lg lg:text-xl xl:text-2xl shadow-lg">
                ⏳
              </div>
              <div className="mr-2 sm:mr-3 lg:mr-4 min-w-0 flex-1">
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-600 truncate font-display">
                  {stats.pendingRequests}
                </p>
                <p className="text-body-small text-text-secondary truncate arabic-optimized">
                  طلبات معلقة
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-white text-base sm:text-lg lg:text-xl xl:text-2xl shadow-lg">
                💬
              </div>
              <div className="mr-2 sm:mr-3 lg:mr-4 min-w-0 flex-1">
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600 truncate">
                  {stats.activeChats}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 truncate">
                  محادثات نشطة
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        {/* Quick Actions */}
        <div className="xl:col-span-2">
          <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 lg:mb-6 px-1">
            الإجراءات السريعة
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
            {quickActions.map((action, index) => (
              <Link key={index} href={action.href}>
                <Card
                  className={`${action.bgColor} ${action.hoverColor} transition-all duration-300 cursor-pointer hover:shadow-xl hover:-translate-y-2 border-0 overflow-hidden`}
                >
                  <CardContent className="p-3 sm:p-4 lg:p-6">
                    <div className="flex items-start justify-between mb-2 sm:mb-3 lg:mb-4">
                      <div className="text-xl sm:text-2xl lg:text-3xl">
                        {action.icon}
                      </div>
                      {action.badge && (
                        <Badge
                          variant="error"
                          className="text-xs bg-red-500 text-white shadow-lg animate-pulse"
                        >
                          {action.badge}
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2 text-xs sm:text-sm lg:text-base">
                      {action.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 leading-relaxed">
                      {action.description}
                    </p>
                    <div className="mt-2 sm:mt-3 lg:mt-4">
                      <div
                        className={`w-6 sm:w-8 h-0.5 sm:h-1 bg-gradient-to-r ${action.gradient} rounded-full`}
                      ></div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 lg:mb-6 px-1">
            النشاط الأخير
          </h2>
          <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="space-y-3 sm:space-y-4 lg:space-y-6">
                <div className="flex items-center text-xs sm:text-sm">
                  <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 badge-primary rounded-full flex items-center justify-center text-sm sm:text-base lg:text-lg text-white shadow-md">
                    👁️
                  </div>
                  <div className="mr-2 sm:mr-3 flex-1 min-w-0">
                    <p className="text-gray-900 font-medium truncate text-xs sm:text-sm">
                      تم عرض ملفك الشخصي
                    </p>
                    <p className="text-gray-500 text-xs">منذ ساعتين</p>
                  </div>
                </div>

                <div className="flex items-center text-xs sm:text-sm">
                  <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-pink-500 to-rose-600 rounded-full flex items-center justify-center text-sm sm:text-base lg:text-lg text-white shadow-md">
                    💌
                  </div>
                  <div className="mr-2 sm:mr-3 flex-1 min-w-0">
                    <p className="text-gray-900 font-medium truncate text-xs sm:text-sm">
                      طلب تعارف جديد
                    </p>
                    <p className="text-gray-500 text-xs">منذ 5 ساعات</p>
                  </div>
                </div>

                <div className="flex items-center text-xs sm:text-sm">
                  <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-sm sm:text-base lg:text-lg text-white shadow-md">
                    💬
                  </div>
                  <div className="mr-2 sm:mr-3 flex-1 min-w-0">
                    <p className="text-gray-900 font-medium truncate text-xs sm:text-sm">
                      رسالة جديدة
                    </p>
                    <p className="text-gray-500 text-xs">أمس</p>
                  </div>
                </div>

                <div className="flex items-center text-xs sm:text-sm">
                  <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-sm sm:text-base lg:text-lg text-white shadow-md">
                    ✅
                  </div>
                  <div className="mr-2 sm:mr-3 flex-1 min-w-0">
                    <p className="text-gray-900 font-medium truncate text-xs sm:text-sm">
                      تم تحديث الملف الشخصي
                    </p>
                    <p className="text-gray-500 text-xs">منذ يومين</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-100">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full hover:bg-gray-50 transition-colors text-xs sm:text-sm"
                >
                  عرض جميع الأنشطة
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tips and Guidelines */}
      <Card className="shadow-xl border-0 bg-gradient-to-br from-white via-gray-50 to-primary-subtle overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary to-primary-600 text-white p-3 sm:p-4 lg:p-6">
          <h3 className="text-base sm:text-lg lg:text-xl font-semibold flex items-center">
            <span className="text-lg sm:text-xl lg:text-2xl ml-2">💡</span>
            نصائح وإرشادات
          </h3>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 lg:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            <div className="text-center p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-primary-subtle to-primary-subtle/50 rounded-xl border border-primary-light hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 badge-primary rounded-full flex items-center justify-center text-lg sm:text-xl lg:text-2xl text-white mx-auto mb-2 sm:mb-3 shadow-lg">
                📝
              </div>
              <h4 className="font-semibold mb-1 sm:mb-2 text-xs sm:text-sm lg:text-base">
                أكمل ملفك الشخصي
              </h4>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                الملفات المكتملة تحصل على مشاهدات أكثر
              </p>
            </div>

            <div className="text-center p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl border border-green-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-lg sm:text-xl lg:text-2xl text-white mx-auto mb-2 sm:mb-3 shadow-lg">
                🔒
              </div>
              <h4 className="font-semibold mb-1 sm:mb-2 text-xs sm:text-sm lg:text-base">
                حافظ على خصوصيتك
              </h4>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                لا تشارك معلومات شخصية حساسة في الرسائل
              </p>
            </div>

            <div className="text-center p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-purple-50 to-indigo-100 rounded-xl border border-purple-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 sm:col-span-2 lg:col-span-1">
              <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-lg sm:text-xl lg:text-2xl text-white mx-auto mb-2 sm:mb-3 shadow-lg">
                🤝
              </div>
              <h4 className="font-semibold mb-1 sm:mb-2 text-xs sm:text-sm lg:text-base">
                كن محترماً
              </h4>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                تعامل مع الآخرين بأدب واحترام في جميع التفاعلات
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Featured Profiles Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        <div className="xl:col-span-2">
          <Card className="shadow-xl border-0 bg-gradient-to-br from-white via-gray-50 to-primary-subtle overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary to-primary-600 text-white p-3 sm:p-4 lg:p-6">
              <h3 className="text-base sm:text-lg lg:text-xl font-semibold flex items-center">
                <Eye className="w-5 h-5 ml-2" />
                ملفات مميزة
              </h3>
              <p className="text-sm text-primary-100 mt-1">
                أعضاء موثقون بملفات مكتملة
              </p>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 lg:p-6">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="bg-gray-200 h-48 rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {featuredProfiles.map((profile) => (
                    <ProfileCard
                      key={profile.id}
                      profile={profile}
                      onSendRequest={handleSendRequest}
                      onLike={handleLikeProfile}
                      onSave={handleSaveProfile}
                      currentUserGender={mockCurrentUser.gender}
                      compact={true}
                    />
                  ))}
                </div>
              )}

              <div className="mt-4 text-center">
                <Link href="/dashboard/search">
                  <Button variant="outline" className="w-full sm:w-auto">
                    عرض المزيد من الملفات
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Online Members */}
        <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-green-50">
          <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-3 sm:p-4">
            <h3 className="text-base sm:text-lg font-semibold flex items-center">
              <Users className="w-5 h-5 ml-2" />
              الأعضاء المتصلون
            </h3>
            <p className="text-sm text-green-100 mt-1">
              {stats.onlineProfiles} عضو متصل الآن
            </p>
          </CardHeader>
          <CardContent className="p-3 sm:p-4">
            <div className="space-y-3">
              {onlineProfiles.slice(0, 4).map((profile) => (
                <div
                  key={profile.id}
                  className="flex items-center p-3 bg-white rounded-lg border border-green-100 hover:shadow-md transition-shadow"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold mr-3">
                    {profile.firstname.charAt(0)}
                    {profile.lastname.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">
                      {profile.firstname}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {profile.age} سنة • {profile.city}
                    </p>
                  </div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
              ))}
            </div>
            <Link href="/dashboard/search?online=true" className="block mt-4">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-green-700 border-green-200 hover:bg-green-50"
              >
                عرض جميع المتصلين
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Profiles Section */}
      <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-blue-50">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base sm:text-lg font-semibold flex items-center">
                <MessageCircle className="w-5 h-5 ml-2" />
                انضموا حديثاً
              </h3>
              <p className="text-sm text-blue-100 mt-1">أعضاء جدد في المنصة</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 h-32 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentProfiles.map((profile) => (
                <ProfileCard
                  key={profile.id}
                  profile={profile}
                  onSendRequest={handleSendRequest}
                  onLike={handleLikeProfile}
                  onSave={handleSaveProfile}
                  currentUserGender={mockCurrentUser.gender}
                  compact={true}
                />
              ))}
            </div>
          )}

          <div className="mt-4 text-center">
            <Link href="/dashboard/search?sort=newest">
              <Button
                variant="outline"
                className="w-full sm:w-auto text-blue-700 border-blue-200 hover:bg-blue-50"
              >
                عرض المزيد من الأعضاء الجدد
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
