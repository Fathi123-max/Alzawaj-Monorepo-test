"use client";

import React, { Suspense, useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { SearchFiltersComponent } from "@/components/search/search-filters";
import { ProfileCard } from "@/components/search/profile-card";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Search,
  Users,
  Heart,
  ChevronLeft,
  ChevronRight,
  X,
  SlidersHorizontal,
} from "lucide-react";
import { Profile } from "@/lib/types";
import { Profile as MockProfile } from "@/lib/mock-data/profiles";
import {
  searchProfiles,
  quickSearch,
  SearchFilters,
  SearchResponse,
  QuickSearchResponse,
} from "@/lib/api/search";
import { useAuth } from "@/providers/auth-provider";
import { requestsApiService } from "@/lib/services/requests-api-service";

// Helper function to get default profile picture based on gender
const getDefaultProfilePicture = (gender: "male" | "female") => {
  return gender === "male"
    ? "/default-male-avatar.svg"
    : "/default-female-avatar.svg";
};

// Helper function to safely extract nested properties
const getNestedValue = (obj: any, path: string, defaultValue: any = "") => {
  return (
    path.split(".").reduce((current, key) => current?.[key], obj) ||
    defaultValue
  );
};

// Adapter function to convert API Profile to MockProfile for display
const convertToMockProfile = (apiProfile: Profile): MockProfile => {
  console.log("🔍 Converting API profile:", apiProfile);

  // Handle nested structure from API response - try multiple possible structures
  const basicInfo =
    (apiProfile as any).basicInfo || (apiProfile as any).basic_info || {};
  const personalInfo =
    (apiProfile as any).personalInfo || (apiProfile as any).personal_info || {};
  const professional =
    (apiProfile as any).professional ||
    (apiProfile as any).professional_info ||
    {};
  const religiousInfo =
    (apiProfile as any).religiousInfo ||
    (apiProfile as any).religious_info ||
    {};
  const locationInfo =
    (apiProfile as any).location || basicInfo.currentLocation || {};

  // Get full name - try multiple possible fields
  const fullName =
    basicInfo.fullName ||
    basicInfo.full_name ||
    apiProfile.name ||
    (apiProfile as any).fullName ||
    `${(apiProfile as any).firstName || ""} ${(apiProfile as any).lastName || ""}`.trim() ||
    "غير محدد";

  const nameParts = fullName
    .split(" ")
    .filter((part: string) => part.length > 0);
  const firstName = nameParts[0] || "غير";
  const lastName = nameParts.slice(1).join(" ") || "محدد";

  // Determine gender - handle multiple possible formats
  const genderValue = (apiProfile as any).gender || apiProfile.gender;
  const gender =
    genderValue === "f" || genderValue === "female" || genderValue === "F"
      ? "female"
      : "male";

  // Map marital status from API format to display format
  const mapMaritalStatus = (status: string) => {
    if (!status) return "غير محدد";
    const statusMap: { [key: string]: string } = {
      never_married: "أعزب/عزباء",
      single: "أعزب/عزباء",
      divorced: "مطلق/مطلقة",
      widowed: "أرمل/أرملة",
      married: "متزوج/متزوجة",
    };
    return statusMap[status.toLowerCase()] || status;
  };

  // Map education level from API format to display format
  const mapEducation = (education: string) => {
    if (!education) return "غير محدد";
    const educationMap: { [key: string]: string } = {
      primary: "ابتدائي",
      secondary: "ثانوي",
      "high-school": "ثانوي",
      highschool: "ثانوي",
      bachelor: "بكالوريوس",
      master: "ماجستير",
      masters: "ماجستير",
      doctorate: "دكتوراه",
      phd: "دكتوراه",
      other: "أخرى",
    };
    return educationMap[education.toLowerCase()] || education;
  };

  // Map religious level from API format to display format
  const mapReligiousLevel = (level: string) => {
    if (!level) return "غير محدد";
    const levelMap: { [key: string]: string } = {
      basic: "أساسي",
      moderate: "معتدل",
      practicing: "ملتزم",
      "very-religious": "متدين جداً",
      very_religious: "متدين جداً",
    };
    return levelMap[level.toLowerCase()] || level;
  };

  // Get age - handle multiple possible fields
  const age =
    apiProfile.age ||
    getNestedValue(basicInfo, "age") ||
    ((apiProfile as any).dateOfBirth
      ? new Date().getFullYear() -
        new Date((apiProfile as any).dateOfBirth).getFullYear()
      : 0);

  // Get location information
  const city =
    apiProfile.city ||
    locationInfo.city ||
    getNestedValue(basicInfo, "currentLocation.city") ||
    "غير محدد";

  const country =
    apiProfile.country ||
    locationInfo.country ||
    getNestedValue(basicInfo, "currentLocation.country") ||
    "غير محدد";

  // Get profile picture with fallback to default
  const profilePicture =
    apiProfile.profilePicture ||
    (apiProfile as any).profile_picture ||
    (apiProfile as any).avatar ||
    getDefaultProfilePicture(gender);

  const convertedProfile = {
    id:
      (apiProfile as any).userId ||
      apiProfile.id ||
      (apiProfile as any)._id ||
      "",
    firstname: firstName,
    lastname: lastName,
    age: age,
    gender: gender as "male" | "female",
    location: `${city}${city !== "غير محدد" && country !== "غير محدد" ? ", " + country : ""}`,
    education: mapEducation(
      apiProfile.education ||
        (professional as any).education ||
        (professional as any).educationLevel ||
        "",
    ),
    occupation:
      apiProfile.occupation ||
      (professional as any).occupation ||
      (professional as any).job ||
      "غير محدد",
    bio:
      apiProfile.bio ||
      (personalInfo as any).about ||
      (personalInfo as any).description ||
      (apiProfile as any).description ||
      "لا توجد معلومات إضافية",
    profilePicture: profilePicture,
    verified: Boolean(
      (apiProfile as any).verification?.isVerified ||
        apiProfile.isApproved ||
        (apiProfile as any).verified ||
        false,
    ),
    isOnline: Boolean((apiProfile as any).isOnline || false),
    lastActive: (apiProfile as any).lastActive || "منذ ساعة",
    profileCompletion:
      (apiProfile as any).completionPercentage ||
      (apiProfile.isComplete ? 100 : 50) ||
      50,
    interests:
      (personalInfo as any).interests || (apiProfile as any).interests || [],
    hasBeard: Boolean((apiProfile as any).hasBeard || false),
    wearHijab: Boolean((apiProfile as any).wearHijab || false),
    wearNiqab: Boolean((apiProfile as any).wearNiqab || false),
    height: (personalInfo as any).height || apiProfile.height || 0,
    religiousLevel: mapReligiousLevel(
      (religiousInfo as any).religiousLevel ||
        (apiProfile as any).religiousLevel ||
        "",
    ),
    maritalStatus: mapMaritalStatus(
      (basicInfo as any).maritalStatus || apiProfile.maritalStatus || "",
    ),
    country: country,
    city: city,
    nationality:
      (basicInfo as any).nationality ||
      (apiProfile as any).nationality ||
      "غير محدد",
    wantsChildren: (basicInfo as any).wantChildren ? "نعم" : "لا",
  };

  console.log("✅ Converted profile:", convertedProfile);
  return convertedProfile as unknown as MockProfile;
};
import { Badge } from "@/components/ui/badge";
import { showToast } from "@/components/ui/toaster";

// Use actual toast notifications
const toast = {
  success: (message: string) => showToast.success(message),
  error: (message: string) => showToast.error(message),
  info: (message: string) => showToast.info(message),
};

// Force logout function
function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [showFilters, setShowFilters] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResponse["data"]>({
    profiles: [],
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalCount: 0,
      hasNextPage: false,
      hasPrevPage: false,
      limit: 12,
    },
    searchCriteria: {},
  });
  const [quickSearchResult, setQuickSearchResult] = useState<
    QuickSearchResponse["data"]
  >({
    profiles: [],
  });
  const [loading, setLoading] = useState(true);
  const [quickSearchLoading, setQuickSearchLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [quickSearchQuery, setQuickSearchQuery] = useState("");

  // Get user's gender to filter opposite gender profiles
  const userGender = user?.gender;

  // Parse filters from URL
  const filters: SearchFilters = useMemo(() => {
    const parsedFilters: SearchFilters = {
      page: currentPage,
      limit: 12,
    };

    searchParams.forEach((value, key) => {
      switch (key) {
        case "ageMin":
        case "ageMax":
        case "heightMin":
        case "heightMax":
          (parsedFilters as any)[key] = Number(value);
          break;
        case "isPrayerRegular":
        case "hasBeard":
        case "wearHijab":
        case "wearNiqab":
        case "hasChildren":
        case "wantsChildren":
        case "verified":
          (parsedFilters as any)[key] = value === "true";
          break;
        default:
          if (value && key !== "page") {
            (parsedFilters as any)[key] = value;
          }
      }
    });

    // Automatically add gender filter to show opposite gender
    if (userGender) {
      // If user is male, show female profiles (f)
      // If user is female, show male profiles (m)
      parsedFilters.gender = userGender === "m" ? "f" : "m";
    }

    return parsedFilters;
  }, [searchParams, currentPage, userGender]);

  useEffect(() => {
    const fetchSearchResults = async () => {
      console.log(
        "🔍 SearchPage: Fetching search results with filters:",
        filters,
      );
      setLoading(true);
      try {
        const result = await searchProfiles(filters);
        console.log("🔍 SearchPage: Search result:", result);
        if (result.success && result.data) {
          setSearchResult(result.data);
        } else {
          console.error("Search failed:", result);
          toast.error("فشل في البحث");
        }
      } catch (error) {
        console.error("Search error:", error);
        toast.error("فشل في البحث");
      } finally {
        setLoading(false);
      }
    };

    console.log("🔍 SearchPage: useEffect triggered, filters:", filters);
    fetchSearchResults();
  }, [filters]);

  const handleFiltersChange = (newFilters: SearchFilters) => {
    // Update URL with new filters
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== "" &&
        key !== "page" &&
        key !== "limit"
      ) {
        params.set(key, value.toString());
      }
    });

    router.push(`/dashboard/search?${params.toString()}`);
    setCurrentPage(1);
  };

  const handleSearch = () => {
    setCurrentPage(1);
    // Search will be triggered by useEffect when filters change
  };

  const handleReset = () => {
    router.push("/dashboard/search");
    setCurrentPage(1);
    setQuickSearchQuery("");
    setQuickSearchResult({ profiles: [] });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleQuickSearch = async (query: string) => {
    if (!query.trim()) {
      toast.error("يرجى إدخال نص للبحث");
      return;
    }

    setQuickSearchLoading(true);
    setQuickSearchQuery(query);

    try {
      console.log("Performing quick search with query:", query);
      const result = await quickSearch(query, { limit: 20, fuzzy: true });
      console.log("Quick search result:", result);

      if (result.success && result.data) {
        // Ensure profiles is always an array
        const safeData = {
          ...result.data,
          profiles: result.data.profiles || [],
        };
        setQuickSearchResult(safeData);
        toast.success(`تم العثور على ${safeData.profiles.length} نتيجة`);
      } else {
        console.error("Quick search failed:", result);
        toast.error("فشل في البحث السريع");
      }
    } catch (error) {
      console.error("Quick search error:", error);
      toast.error("فشل في البحث السريع");
    } finally {
      setQuickSearchLoading(false);
    }
  };

  // Note: Request handling is now done through ProfileDialog

  const handleLikeProfile = async (profileId: string) => {
    try {
      // TODO: Implement like profile API
      console.log("Like profile:", profileId);
      toast.success("تم الإعجاب بالملف الشخصي");
    } catch (error) {
      toast.error("حدث خطأ في الإعجاب");
    }
  };

  const handleSaveProfile = async (profileId: string) => {
    try {
      // TODO: Implement save profile API
      console.log("Save profile:", profileId);
      toast.success("تم حفظ الملف الشخصي");
    } catch (error) {
      toast.error("حدث خطأ في الحفظ");
    }
  };

  const handleSendRequest = async (profileId: string) => {
    try {
      console.log("Sending request to profile:", profileId);
      const response = await requestsApiService.sendRequest({
        receiverId: profileId,
        message:
          "السلام عليكم ورحمة الله وبركاته، أهتم بالتعرف عليك لمعرفة إمكانية الزواج إن شاء الله. أرجو من الله أن يجمع بيننا في خير وبركة",
        contactInfo: {
          phone: user?.phone || "+1234567890",
          email: user?.email || "example@email.com",
          preferredContactMethod: "phone",
        },
      });
      if (response.success) {
        toast.success("تم إرسال طلب الزواج بنجاح!");
      }
    } catch (error: any) {
      console.error("Send request error:", error);
      toast.error(error.message || "حدث خطأ في إرسال الطلب");
    }
  };

  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    if (key === "page" || key === "limit") return false;
    return value !== undefined && value !== null && value !== "";
  }).length;

  // Get dashboard stats - TODO: implement from API
  const stats = {
    totalProfiles: searchResult.pagination.totalCount,
    newProfiles: 0,
    matches: 0,
    messages: 0,
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="text-center mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          البحث عن شريك الحياة
        </h1>
        <p className="text-gray-600 text-sm md:text-base">
          استخدم الفلاتر للعثور على الشريك المناسب وفقاً لمعاييرك
        </p>
      </div>



      {/* Search Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
        <Card>
          <CardContent className="p-3 md:p-4 text-center">
            <Users className="h-6 w-6 md:h-8 md:w-8 text-primary mx-auto mb-2" />
            <p className="text-xl md:text-2xl font-bold text-gray-900">
              {stats.totalProfiles}
            </p>
            <p className="text-xs md:text-sm text-gray-600">إجمالي الملفات</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4 text-center">
            <Search className="h-6 w-6 md:h-8 md:w-8 text-green-500 mx-auto mb-2" />
            <p className="text-xl md:text-2xl font-bold text-gray-900">
              {searchResult.pagination.totalCount}
            </p>
            <p className="text-xs md:text-sm text-gray-600">نتائج البحث</p>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Filter Toggle */}
      <div className="lg:hidden mb-4 md:mb-6">
        <Button
          onClick={() => setShowFilters(!showFilters)}
          variant="outline"
          className="w-full flex items-center justify-center gap-2 py-4 text-base font-medium shadow-lg border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 bg-gradient-to-r from-white to-blue-50/50"
        >
          <SlidersHorizontal className="h-5 w-5 text-blue-600" />
          <span className="text-blue-800 font-semibold">
            {showFilters ? "إخفاء الفلاتر" : "إظهار الفلاتر"}
          </span>
          {activeFilterCount > 0 && (
            <Badge
              variant="secondary"
              className="ml-2 bg-blue-100 text-blue-800 border-blue-200"
            >
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
        {/* Filters Sidebar */}
        <div
          className={`lg:col-span-1 ${showFilters ? "block" : "hidden lg:block"}`}
        >
          <aside
            className="
            lg:sticky
            lg:top-4 
            xl:top-6 
            2xl:top-8
            lg:h-[calc(100vh-1rem)] 
            2xl:h-[calc(100vh-2rem)]
            lg:max-h-[calc(100vh-1rem)] 
            2xl:max-h-[calc(100vh-2rem)]
            lg:overflow-y-auto 
            lg:overflow-x-hidden
            mb-6 lg:mb-0
            lg:scrollbar-thin 
            lg:scrollbar-thumb-blue-300/60 
            lg:scrollbar-track-blue-50/30
            hover:lg:scrollbar-thumb-blue-400/80
            lg:scroll-smooth
            lg:pb-4
          "
          >
            <div className="lg:pr-2">
              <SearchFiltersComponent
                filters={filters}
                onFiltersChange={handleFiltersChange}
                onSearch={handleSearch}
                onReset={handleReset}
                user={user}
                className="shadow-lg border-0 transform transition-all duration-300 ease-in-out hover:shadow-xl lg:sticky lg:top-0 bg-white/95 backdrop-blur-sm"
              />
            </div>
          </aside>
        </div>

        {/* Results */}
        <div className="lg:col-span-3">
          {loading ? (
            // Loading skeleton
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
              {[...Array(12)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto"></div>
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 rounded"></div>
                        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                      </div>
                      <div className="flex gap-2">
                        <div className="h-8 bg-gray-200 rounded flex-1"></div>
                        <div className="h-8 bg-gray-200 rounded w-16"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (quickSearchQuery &&
              (quickSearchResult.profiles?.length || 0) > 0) ||
            searchResult.profiles.length > 0 ? (
            <div>
              {/* Results Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 md:mb-6 gap-3">
                <div>
                  <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                    {quickSearchQuery ? "نتائج البحث السريع" : "نتائج البحث"}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {quickSearchQuery ? (
                      `تم العثور على ${quickSearchResult.profiles?.length || 0} نتيجة`
                    ) : (
                      <>
                        تم العثور على {searchResult.pagination.totalCount} ملف
                        شخصي
                        {activeFilterCount > 0 &&
                          ` مع ${activeFilterCount} فلتر نشط`}
                      </>
                    )}
                  </p>
                </div>

                {/* Active Filters - Only show for filter-based search, not quick search */}
                {!quickSearchQuery && activeFilterCount > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(filters).map(([key, value]) => {
                      if (key === "page" || key === "limit" || !value)
                        return null;

                      let displayValue = value.toString();
                      if (key === "ageMin") displayValue = `العمر من ${value}`;
                      else if (key === "ageMax")
                        displayValue = `العمر حتى ${value}`;
                      else if (typeof value === "boolean")
                        displayValue = value ? "نعم" : "لا";

                      return (
                        <Badge
                          key={key}
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          {displayValue}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => {
                              const newFilters = { ...filters };
                              delete newFilters[key as keyof SearchFilters];
                              handleFiltersChange(newFilters);
                            }}
                          />
                        </Badge>
                      );
                    })}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleReset}
                      className="h-6 px-2 text-xs"
                    >
                      مسح الكل
                    </Button>
                  </div>
                )}
              </div>

              {/* Profile Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                {quickSearchQuery &&
                (quickSearchResult.profiles?.length || 0) > 0
                  ? // Show quick search results
                    quickSearchResult.profiles.map((profile) => (
                      <ProfileCard
                        key={profile.id}
                        profile={convertToMockProfile(profile)}
                        onLike={handleLikeProfile}
                        onSave={handleSaveProfile}
                        onSendRequest={handleSendRequest}
                        currentUserGender="male"
                        compatibilityScore={0}
                        canSendRequest={true}
                        userEmail={user?.email}
                        userPhone={user?.phone}
                      />
                    ))
                  : // Show filter-based search results (only when no quick search is active)
                    !quickSearchQuery &&
                    searchResult.profiles.map((profileData) => (
                      <ProfileCard
                        key={profileData.profile.id}
                        profile={convertToMockProfile(profileData.profile)}
                        onLike={handleLikeProfile}
                        onSave={handleSaveProfile}
                        onSendRequest={handleSendRequest}
                        currentUserGender="male"
                        compatibilityScore={profileData.compatibilityScore}
                        canSendRequest={profileData.canSendRequest}
                        userEmail={user?.email}
                        userPhone={user?.phone}
                      />
                    ))}
              </div>

              {/* Pagination - Only show for filter-based search, not quick search */}
              {!quickSearchQuery && searchResult.pagination.totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
                  {/* Mobile: Compact pagination */}
                  <div className="flex items-center gap-2 sm:hidden">
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={!searchResult.pagination.hasPrevPage}
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <ChevronRight className="h-4 w-4" />
                      السابق
                    </Button>

                    <span className="px-3 py-1 text-sm text-gray-600 bg-gray-100 rounded">
                      {currentPage} / {searchResult.pagination.totalPages}
                    </span>

                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={!searchResult.pagination.hasNextPage}
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      التالي
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Desktop: Full pagination */}
                  <div className="hidden sm:flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={!searchResult.pagination.hasPrevPage}
                      className="flex items-center gap-2"
                    >
                      <ChevronRight className="h-4 w-4" />
                      السابق
                    </Button>

                    <div className="flex gap-1">
                      {/* Show page numbers */}
                      {Array.from(
                        {
                          length: Math.min(
                            5,
                            searchResult.pagination.totalPages,
                          ),
                        },
                        (_, i) => {
                          const pageNum = i + 1;
                          if (searchResult.pagination.totalPages <= 5) {
                            return (
                              <Button
                                key={pageNum}
                                variant={
                                  pageNum === currentPage
                                    ? "secondary"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() => handlePageChange(pageNum)}
                                className="w-10"
                              >
                                {pageNum}
                              </Button>
                            );
                          }
                          // For more than 5 pages, show smart pagination
                          let pageToShow = pageNum;
                          if (currentPage > 3) {
                            pageToShow = currentPage - 2 + i;
                          }
                          if (pageToShow > searchResult.pagination.totalPages)
                            return null;

                          return (
                            <Button
                              key={pageToShow}
                              variant={
                                pageToShow === currentPage
                                  ? "secondary"
                                  : "outline"
                              }
                              size="sm"
                              onClick={() => handlePageChange(pageToShow)}
                              className="w-10"
                            >
                              {pageToShow}
                            </Button>
                          );
                        },
                      )}
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={!searchResult.pagination.hasNextPage}
                      className="flex items-center gap-2"
                    >
                      التالي
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // No results
            <Card>
              <CardContent className="p-12 text-center">
                <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  لا توجد نتائج
                </h3>
                <p className="text-gray-600 mb-4">
                  لم نجد أي ملفات شخصية تطابق معايير البحث الخاصة بك
                </p>
                <Button variant="outline" onClick={handleReset}>
                  مسح معايير البحث
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
