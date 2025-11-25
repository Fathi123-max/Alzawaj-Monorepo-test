"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  User,
  Edit3,
  Save,
  X,
  MapPin,
  Calendar,
  Heart,
  Shield,
  Home,
} from "lucide-react";
import {
  ApiProfile,
  Profile,
  isMaleProfile,
  isFemaleProfile,
  isMaleApiProfile,
  isFemaleApiProfile,
} from "@/lib/types/auth.types";
import { getCurrentUserProfile, updateProfileFlat } from "@/lib/api/profile";
import {
  MARITAL_STATUS_OPTIONS,
  RELIGIOUS_LEVEL_OPTIONS,
  EDUCATION_LEVEL_OPTIONS,
  SKIN_COLOR_OPTIONS,
  BODY_TYPE_OPTIONS,
  FINANCIAL_SITUATION_OPTIONS,
  PRAYING_LOCATION_OPTIONS,
  FEMALE_PRAYING_LOCATION_OPTIONS,
  CLOTHING_STYLE_OPTIONS,
  WORK_AFTER_MARRIAGE_OPTIONS,
  PARENTS_ALIVE_OPTIONS,
  WANTS_CHILDREN_OPTIONS,
  YES_NO_OPTIONS,
  getMaritalStatusLabel,
  getReligiousLevelLabel,
  getEducationLevelLabel,
  getFinancialSituationLabel,
} from "@/lib/constants/profile-options";
import { useSelectorData } from "@/lib/hooks/use-selector-data";

export function ProfileView() {
  const [profile, setProfile] = useState<ApiProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState<string | null>(null);
  const [isGlobalEdit, setIsGlobalEdit] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Load selector data for dropdowns
  const { data: selectorData, loading: selectorLoading } = useSelectorData();
  
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("يرجى اختيار ملف صورة");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("حجم الصورة يجب أن يكون أقل من 5 ميجابايت");
      return;
    }

    setUploadingPhoto(true);
    setError(null);
    
    try {
      const { uploadProfilePicture } = await import("@/lib/api/profile");
      await uploadProfilePicture(file);
      await loadProfile();
    } catch (error: any) {
      setError("فشل في رفع الصورة");
    } finally {
      setUploadingPhoto(false);
    }
  };
  
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      // Check if user is authenticated
      const token = localStorage.getItem("zawaj_auth_token");
      if (!token) {
        setError("AUTH_REQUIRED");
        setLoading(false);
        return;
      }

      // Fetch profile from API
      const profileData = await getCurrentUserProfile();

      if (profileData) {
        setProfile(profileData);
      } else {
        setError("لم يتم العثور على الملف الشخصي");
      }
    } catch (error: any) {
      console.error("Error loading profile:", error);

      // Handle different types of errors
      if (error?.status === 401 || error?.error === "NO_TOKEN") {
        setError("AUTH_REQUIRED");
      } else if (error?.status === 404) {
        setError("لم يتم العثور على الملف الشخصي");
      } else if (error?.status === 500) {
        setError("خطأ في الخادم. يرجى المحاولة لاحقاً");
      } else {
        setError(error?.message || "حدث خطأ في تحميل الملف الشخصي");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGlobalEdit = () => {
    setIsGlobalEdit(true);
    const initialData = { ...profile };
    // Fix legacy data
    if ((initialData.maritalStatus as string) === "single") {
      initialData.maritalStatus = "single";
    }
    setEditData(initialData);
  };

  const handleCancelEdit = () => {
    setIsGlobalEdit(false);
    setEditData({});
  };

  const handleSaveAll = async () => {
    setSubmitting(true);
    setError(null);
    try {
      // Prepare all profile data for update
      const updateData: any = {};

      // Basic info
      if (editData.name && editData.name.trim()) {
        updateData.name = editData.name;
      }
      if (editData.age) {
        updateData.age = editData.age;
      }
      if (editData.country && editData.country.trim()) {
        updateData.country = editData.country;
      }
      if (editData.city && editData.city.trim()) {
        updateData.city = editData.city;
      }
      if (editData.nationality && editData.nationality.trim()) {
        updateData.nationality = editData.nationality;
      }
      if (editData.maritalStatus && editData.maritalStatus.trim()) {
        updateData.maritalStatus = editData.maritalStatus;
      }
      if (editData.education && editData.education.trim()) {
        updateData.education = editData.education;
      }
      if (editData.occupation && editData.occupation.trim()) {
        updateData.occupation = editData.occupation;
      }

      // Physical info
      if (editData.height) {
        updateData.height = editData.height;
      }
      if (editData.weight) {
        updateData.weight = editData.weight;
      }
      if (editData.bodyType && editData.bodyType.trim()) {
        updateData.bodyType = editData.bodyType;
      }
      if (editData.skinColor && editData.skinColor.trim()) {
        updateData.skinColor = editData.skinColor;
      }

      // Religious info
      if (editData.religiousLevel && editData.religiousLevel.trim()) {
        updateData.religiousLevel = editData.religiousLevel;
      }
      if (editData.isPrayerRegular !== undefined) {
        updateData.isPrayerRegular = editData.isPrayerRegular;
      }
      if (editData.areParentsAlive && editData.areParentsAlive.trim()) {
        updateData.areParentsAlive = editData.areParentsAlive;
      }
      if (editData.wantsChildren && editData.wantsChildren.trim()) {
        updateData.wantsChildren = editData.wantsChildren;
      }

      // Gender-specific religious fields
      if (profile?.gender === "m" || editData.gender === "m") {
        if (editData.hasBeard !== undefined) {
          updateData.hasBeard = editData.hasBeard;
        }
        if (editData.prayingLocation && editData.prayingLocation.trim()) {
          updateData.prayingLocation = editData.prayingLocation;
        }
        if (editData.isRegularAtMosque !== undefined) {
          updateData.isRegularAtMosque = editData.isRegularAtMosque;
        }
        if (editData.smokes !== undefined) {
          updateData.smokes = editData.smokes;
        }
      } else if (profile?.gender === "f" || editData.gender === "f") {
        if (editData.wearHijab !== undefined) {
          updateData.wearHijab = editData.wearHijab;
        }
        if (editData.wearNiqab !== undefined) {
          updateData.wearNiqab = editData.wearNiqab;
        }
        if (editData.clothingStyle && editData.clothingStyle.trim()) {
          updateData.clothingStyle = editData.clothingStyle;
        }
        if (editData.workAfterMarriage && editData.workAfterMarriage.trim()) {
          updateData.workAfterMarriage = editData.workAfterMarriage;
        }
        if (editData.mahramAvailable !== undefined) {
          updateData.mahramAvailable = editData.mahramAvailable;
        }
      }

      // Personal info
      if (editData.bio && editData.bio.trim()) {
        updateData.bio = editData.bio;
      }
      if (editData.interests && Array.isArray(editData.interests)) {
        updateData.interests = editData.interests;
      }
      if (editData.marriageGoals && editData.marriageGoals.trim()) {
        updateData.marriageGoals = editData.marriageGoals;
      }
      if (
        editData.personalityDescription &&
        editData.personalityDescription.trim()
      ) {
        updateData.personalityDescription = editData.personalityDescription;
      }

      // Financial/Housing info (for males)
      if (editData.financialSituation && editData.financialSituation.trim()) {
        updateData.financialSituation = editData.financialSituation;
      }
      if (editData.monthlyIncome) {
        updateData.monthlyIncome = editData.monthlyIncome;
      }
      if (editData.housingType && editData.housingType.trim()) {
        updateData.housingType = editData.housingType;
      }
      if (editData.housingLocation && editData.housingLocation.trim()) {
        updateData.housingLocation = editData.housingLocation;
      }
      if (editData.housingOwnership && editData.housingOwnership.trim()) {
        updateData.housingOwnership = editData.housingOwnership;
      }

      console.log("Sending complete profile update:", updateData);

      // Call API to update profile with flat field structure
      const updatedProfile = await updateProfileFlat(updateData);
      setProfile(updatedProfile);
      setIsGlobalEdit(false);
      setEditData({});
      console.log("Profile updated successfully:", updatedProfile);
    } catch (error: any) {
      console.error("Error saving profile:", error);

      // Handle different types of errors
      if (error?.status === 401) {
        setError("انتهت صلاحية جلسة المستخدم. يرجى تسجيل الدخول مرة أخرى");
      } else if (error?.status === 403) {
        setError("ليس لديك صلاحية لتعديل هذا الملف الشخصي");
      } else if (error?.status === 400) {
        setError(
          "البيانات المدخلة غير صحيحة. يرجى المراجعة والمحاولة مرة أخرى",
        );
      } else {
        setError(error?.message || "حدث خطأ في حفظ الملف الشخصي");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setEditMode(null);
    setEditData({});
  };

  const renderBasicInfo = () => {
    const isEditing = isGlobalEdit;

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <User className="h-5 w-5" />
            المعلومات الأساسية
          </h3>
        </CardHeader>
        <CardContent>
          {!isEditing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    الاسم
                  </label>
                  <p className="text-lg font-medium">
                    {profile?.name || "غير محدد"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    العمر
                  </label>
                  <p className="text-lg">
                    {profile?.age ? `${profile.age} سنة` : "غير محدد"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    الجنسية
                  </label>
                  <p className="text-lg">
                    {profile?.nationality && profile.nationality !== "Unknown"
                      ? profile.nationality
                      : "غير محدد"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    الحالة الاجتماعية
                  </label>
                  <Badge variant="secondary">
                    {getMaritalStatusLabel(profile?.maritalStatus || "")}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    المكان
                  </label>
                  <p className="text-lg flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {profile?.city &&
                    profile?.country &&
                    profile.city !== "Unknown" &&
                    profile.country !== "Unknown"
                      ? `${profile.city}, ${profile.country}`
                      : "غير محدد"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    الوضع المالي
                  </label>
                  <p className="text-lg">
                    {getFinancialSituationLabel(
                      profile?.financialSituation || "",
                    )}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    الاسم
                  </label>
                  <Input
                    value={editData.name || profile?.name || ""}
                    onChange={(e) =>
                      setEditData({ ...editData, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    العمر
                  </label>
                  <Input
                    type="number"
                    value={editData.age || profile?.age || ""}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        age: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    الدولة
                  </label>
                  <Select
                    value={editData.country || profile?.country || ""}
                    onValueChange={(value) =>
                      setEditData({ ...editData, country: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الدولة" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectorData.countries.map((country) => (
                        <SelectItem key={country.value} value={country.value}>
                          {country.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    المدينة
                  </label>
                  <Select
                    value={editData.city || profile?.city || ""}
                    onValueChange={(value) =>
                      setEditData({ ...editData, city: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المدينة" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectorData.cities
                        .filter(
                          (city) =>
                            !editData.country ||
                            city.group === editData.country ||
                            city.group === profile?.country,
                        )
                        .map((city) => (
                          <SelectItem key={city.value} value={city.value}>
                            {city.label}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    الجنسية
                  </label>
                  <Select
                    value={editData.nationality || profile?.nationality || ""}
                    onValueChange={(value) =>
                      setEditData({ ...editData, nationality: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الجنسية" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectorData.nationalities.map((nationality) => (
                        <SelectItem
                          key={nationality.value}
                          value={nationality.value}
                        >
                          {nationality.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    الحالة الاجتماعية
                  </label>
                  <Select
                    value={
                      editData.maritalStatus || profile?.maritalStatus || ""
                    }
                    onValueChange={(value) =>
                      setEditData({ ...editData, maritalStatus: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الحالة الاجتماعية" />
                    </SelectTrigger>
                    <SelectContent>
                      {MARITAL_STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    التعليم
                  </label>
                  <Input
                    value={editData.education || profile?.education || ""}
                    onChange={(e) =>
                      setEditData({ ...editData, education: e.target.value })
                    }
                    placeholder="مثال: بكالوريوس في علوم الحاسوب"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    المهنة
                  </label>
                  <Input
                    value={editData.occupation || profile?.occupation || ""}
                    onChange={(e) =>
                      setEditData({ ...editData, occupation: e.target.value })
                    }
                    placeholder="مثال: مهندس برمجيات"
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderPhysicalInfo = () => {
    const isEditing = isGlobalEdit;

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <h3 className="text-lg font-semibold">المظهر الجسدي</h3>
        </CardHeader>
        <CardContent>
          {!isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">
                  الطول
                </label>
                <p className="text-lg">
                  {profile?.height ? `${profile.height} سم` : "غير محدد"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  الوزن
                </label>
                <p className="text-lg">
                  {profile?.weight ? `${profile.weight} كغ` : "غير محدد"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  لون البشرة
                </label>
                <p className="text-lg">
                  {profile?.skinColor === "fair"
                    ? "فاتح"
                    : profile?.skinColor === "medium"
                      ? "متوسط"
                      : profile?.skinColor === "olive"
                        ? "زيتوني"
                        : profile?.skinColor === "dark"
                          ? "داكن"
                          : "غير محدد"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  نوع الجسم
                </label>
                <p className="text-lg">
                  {profile?.bodyType === "slim"
                    ? "نحيف"
                    : profile?.bodyType === "average"
                      ? "متوسط"
                      : profile?.bodyType === "athletic"
                        ? "رياضي"
                        : profile?.bodyType === "heavy"
                          ? "ممتلئ"
                          : "غير محدد"}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  الطول (سم)
                </label>
                <Input
                  type="number"
                  value={editData.height || profile?.height || ""}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      height: parseInt(e.target.value) || undefined,
                    })
                  }
                  placeholder="أدخل الطول بالسنتيمتر"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  الوزن (كغ)
                </label>
                <Input
                  type="number"
                  value={editData.weight || profile?.weight || ""}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      weight: parseInt(e.target.value) || undefined,
                    })
                  }
                  placeholder="أدخل الوزن بالكيلوجرام"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  لون البشرة
                </label>
                <Select
                  value={editData.skinColor || profile?.skinColor || ""}
                  onValueChange={(value) =>
                    setEditData({ ...editData, skinColor: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر لون البشرة" />
                  </SelectTrigger>
                  <SelectContent>
                    {SKIN_COLOR_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  نوع الجسم
                </label>
                <Select
                  value={editData.bodyType || profile?.bodyType || ""}
                  onValueChange={(value) =>
                    setEditData({ ...editData, bodyType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر نوع الجسم" />
                  </SelectTrigger>
                  <SelectContent>
                    {BODY_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderReligiousInfo = () => {
    const isEditing = isGlobalEdit;

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5" />
            المعلومات الدينية
          </h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {!isEditing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    مستوى التدين
                  </label>
                  <Badge className="block w-fit">
                    {getReligiousLevelLabel(profile?.religiousLevel || "")}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    انتظام الصلاة
                  </label>
                  <p className="text-lg">
                    {profile?.isPrayerRegular ? "منتظم" : "أحياناً"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    حالة الوالدين
                  </label>
                  <p className="text-lg">
                    {profile?.areParentsAlive === "both"
                      ? "كلاهما على قيد الحياة"
                      : profile?.areParentsAlive === "father"
                        ? "الأب فقط"
                        : profile?.areParentsAlive === "mother"
                          ? "الأم فقط"
                          : "كلاهما متوفي"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    رغبة في الأطفال
                  </label>
                  <Badge variant="outline">
                    {profile?.wantsChildren === "yes"
                      ? "نعم"
                      : profile?.wantsChildren === "no"
                        ? "لا"
                        : "ربما"}
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    مستوى التدين
                  </label>
                  <Select
                    value={
                      editData.religiousLevel || profile?.religiousLevel || ""
                    }
                    onValueChange={(value) =>
                      setEditData({ ...editData, religiousLevel: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر مستوى التدين" />
                    </SelectTrigger>
                    <SelectContent>
                      {RELIGIOUS_LEVEL_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    انتظام الصلاة
                  </label>
                  <Select
                    value={String(
                      editData.isPrayerRegular ??
                        profile?.isPrayerRegular ??
                        true,
                    )}
                    onValueChange={(value) =>
                      setEditData({
                        ...editData,
                        isPrayerRegular: value === "true",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر انتظام الصلاة" />
                    </SelectTrigger>
                    <SelectContent>
                      {YES_NO_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label === "نعم" ? "منتظم" : "أحياناً"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    حالة الوالدين
                  </label>
                  <Select
                    value={
                      editData.areParentsAlive || profile?.areParentsAlive || ""
                    }
                    onValueChange={(value) =>
                      setEditData({ ...editData, areParentsAlive: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر حالة الوالدين" />
                    </SelectTrigger>
                    <SelectContent>
                      {PARENTS_ALIVE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    رغبة في الأطفال
                  </label>
                  <Select
                    value={
                      editData.wantsChildren || profile?.wantsChildren || ""
                    }
                    onValueChange={(value) =>
                      setEditData({ ...editData, wantsChildren: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر رغبتك في الأطفال" />
                    </SelectTrigger>
                    <SelectContent>
                      {WANTS_CHILDREN_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Gender-specific fields for editing */}
                {profile && isMaleApiProfile(profile) && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        اللحية
                      </label>
                      <Select
                        value={String(
                          editData.hasBeard ?? profile?.hasBeard ?? false,
                        )}
                        onValueChange={(value) =>
                          setEditData({
                            ...editData,
                            hasBeard: value === "true",
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="هل لديك لحية؟" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">نعم، لدي لحية</SelectItem>
                          <SelectItem value="false">
                            لا، ليس لدي لحية
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        مكان الصلاة
                      </label>
                      <Select
                        value={
                          editData.prayingLocation ||
                          profile?.prayingLocation ||
                          ""
                        }
                        onValueChange={(value) =>
                          setEditData({ ...editData, prayingLocation: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="أين تصلي عادة؟" />
                        </SelectTrigger>
                        <SelectContent>
                          {PRAYING_LOCATION_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        التدخين
                      </label>
                      <Select
                        value={String(
                          editData.smokes ?? profile?.smokes ?? false,
                        )}
                        onValueChange={(value) =>
                          setEditData({ ...editData, smokes: value === "true" })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="هل تدخن؟" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="false">لا أدخن</SelectItem>
                          <SelectItem value="true">أدخن</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                {profile && isFemaleApiProfile(profile) && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        الحجاب
                      </label>
                      <Select
                        value={String(
                          editData.wearHijab ?? profile?.wearHijab ?? false,
                        )}
                        onValueChange={(value) =>
                          setEditData({
                            ...editData,
                            wearHijab: value === "true",
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="هل ترتدين الحجاب؟" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">
                            نعم، أرتدي الحجاب
                          </SelectItem>
                          <SelectItem value="false">
                            لا، لا أرتدي الحجاب
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        النقاب
                      </label>
                      <Select
                        value={String(
                          editData.wearNiqab ?? profile?.wearNiqab ?? false,
                        )}
                        onValueChange={(value) =>
                          setEditData({
                            ...editData,
                            wearNiqab: value === "true",
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="هل ترتدين النقاب؟" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">
                            نعم، أرتدي النقاب
                          </SelectItem>
                          <SelectItem value="false">
                            لا، لا أرتدي النقاب
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        أسلوب الملابس
                      </label>
                      <Select
                        value={
                          editData.clothingStyle || profile?.clothingStyle || ""
                        }
                        onValueChange={(value) =>
                          setEditData({ ...editData, clothingStyle: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختاري أسلوب الملابس" />
                        </SelectTrigger>
                        <SelectContent>
                          {CLOTHING_STYLE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        العمل بعد الزواج
                      </label>
                      <Select
                        value={
                          editData.workAfterMarriage ||
                          profile?.workAfterMarriage ||
                          ""
                        }
                        onValueChange={(value) =>
                          setEditData({ ...editData, workAfterMarriage: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="هل تريدين العمل بعد الزواج؟" />
                        </SelectTrigger>
                        <SelectContent>
                          {WORK_AFTER_MARRIAGE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Gender-specific religious info */}
            {profile && isMaleApiProfile(profile) && (
              <div className="bg-gradient-to-r from-primary-subtle to-primary-subtle/50 p-6 rounded-xl border border-primary-light">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-6 bg-primary rounded"></div>
                  <h4 className="font-semibold text-gray-800 text-lg">
                    معلومات خاصة بالأخ
                  </h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-white p-4 rounded-lg border">
                    <label className="text-sm font-medium text-gray-600 block mb-2">
                      اللحية
                    </label>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={profile.hasBeard ? "success" : "secondary"}
                        className="text-sm"
                      >
                        {profile.hasBeard ? "✓ لديه لحية" : "✗ ليس لديه لحية"}
                      </Badge>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg border">
                    <label className="text-sm font-medium text-gray-600 block mb-2">
                      مكان الصلاة المعتاد
                    </label>
                    <p className="text-sm font-medium">
                      {profile.prayingLocation === "mosque"
                        ? "🕌 في المسجد"
                        : profile.prayingLocation === "home"
                          ? "🏠 في البيت"
                          : "🕌🏠 في المسجد والبيت"}
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-lg border">
                    <label className="text-sm font-medium text-gray-600 block mb-2">
                      الانتظام في المسجد
                    </label>
                    <Badge
                      variant={
                        profile.isRegularAtMosque ? "success" : "secondary"
                      }
                      className="text-sm"
                    >
                      {profile.isRegularAtMosque ? "✓ منتظم" : "أحياناً"}
                    </Badge>
                  </div>

                  <div className="bg-white p-4 rounded-lg border">
                    <label className="text-sm font-medium text-gray-600 block mb-2">
                      التدخين
                    </label>
                    <Badge
                      variant={profile.smokes ? "error" : "success"}
                      className="text-sm"
                    >
                      {profile.smokes ? "🚬 يدخن" : "🚭 لا يدخن"}
                    </Badge>
                  </div>

                  <div className="bg-white p-4 rounded-lg border">
                    <label className="text-sm font-medium text-gray-600 block mb-2">
                      الوضع المادي
                    </label>
                    <Badge
                      variant={
                        profile.financialSituation === "excellent"
                          ? "success"
                          : profile.financialSituation === "good"
                            ? "secondary"
                            : profile.financialSituation === "average"
                              ? "outline"
                              : "error"
                      }
                      className="text-sm"
                    >
                      {profile.financialSituation === "excellent"
                        ? "💰 ممتاز"
                        : profile.financialSituation === "good"
                          ? "💵 جيد"
                          : profile.financialSituation === "average"
                            ? "💳 متوسط"
                            : "⚠️ صعب"}
                    </Badge>
                  </div>

                  <div className="bg-white p-4 rounded-lg border">
                    <label className="text-sm font-medium text-gray-600 block mb-2">
                      نوع السكن
                    </label>
                    <p className="text-sm font-medium">
                      {profile.housingType === "family"
                        ? "🏡 مستقل"
                        : profile.housingType === "with-family"
                          ? "👨‍👩‍👧‍👦 مع العائلة"
                          : "👥 مشترك"}
                    </p>
                  </div>
                </div>

                {/* Housing Details */}
                <div className="mt-6 p-4 bg-white rounded-lg border">
                  <h5 className="font-medium text-gray-800 mb-3">
                    تفاصيل السكن
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600 block mb-1">
                        موقع السكن
                      </label>
                      <p className="text-sm">{profile.housingLocation}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 block mb-1">
                        ملكية السكن
                      </label>
                      <p className="text-sm">
                        {profile.housingOwnership === "owned"
                          ? "🏠 ملك"
                          : profile.housingOwnership === "rented"
                            ? "🏠 إيجار"
                            : "👨‍👩‍👧‍👦 ملك العائلة"}
                      </p>
                    </div>
                    {profile.monthlyIncome && (
                      <div>
                        <label className="text-sm font-medium text-gray-600 block mb-1">
                          الدخل الشهري
                        </label>
                        <p className="text-sm font-semibold">
                          {profile.monthlyIncome.toLocaleString()} ريال
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {profile && isFemaleApiProfile(profile) && (
              <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-6 rounded-xl border border-pink-200">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-6 bg-pink-500 rounded"></div>
                  <h4 className="font-semibold text-gray-800 text-lg">
                    معلومات خاصة بالأخت
                  </h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-white p-4 rounded-lg border">
                    <label className="text-sm font-medium text-gray-600 block mb-2">
                      الحجاب
                    </label>
                    <Badge
                      variant={profile.wearHijab ? "success" : "secondary"}
                      className="text-sm"
                    >
                      {profile.wearHijab
                        ? "🧕 ترتدي الحجاب"
                        : "لا ترتدي الحجاب"}
                    </Badge>
                  </div>

                  <div className="bg-white p-4 rounded-lg border">
                    <label className="text-sm font-medium text-gray-600 block mb-2">
                      النقاب
                    </label>
                    <Badge
                      variant={profile.wearNiqab ? "success" : "secondary"}
                      className="text-sm"
                    >
                      {profile.wearNiqab
                        ? "👤 ترتدي النقاب"
                        : "لا ترتدي النقاب"}
                    </Badge>
                  </div>

                  <div className="bg-white p-4 rounded-lg border">
                    <label className="text-sm font-medium text-gray-600 block mb-2">
                      أسلوب الملابس
                    </label>
                    <p className="text-sm font-medium">
                      {profile.clothingStyle === "niqab-full" ||
                      profile.clothingStyle === "niqab-hands"
                        ? "نقاب"
                        : profile.clothingStyle === "khimar"
                          ? "خمار"
                          : profile.clothingStyle === "hijab-conservative"
                            ? "حجاب محافظ"
                            : profile.clothingStyle === "hijab-modest"
                              ? "حجاب محتشم"
                              : profile.clothingStyle === "hijab-modern"
                                ? "حجاب عصري"
                                : profile.clothingStyle === "loose-covering"
                                  ? "لباس فضفاض"
                                  : "لباس محتشم"}
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-lg border">
                    <label className="text-sm font-medium text-gray-600 block mb-2">
                      مكان الصلاة المعتاد
                    </label>
                    <p className="text-sm font-medium">
                      {profile.prayingLocation === "home"
                        ? "🏠 في البيت"
                        : "🕌 في المسجد عند الإمكان"}
                    </p>
                  </div>

                  {profile.workAfterMarriage && (
                    <div className="bg-white p-4 rounded-lg border">
                      <label className="text-sm font-medium text-gray-600 block mb-2">
                        العمل بعد الزواج
                      </label>
                      <Badge
                        variant={
                          profile.workAfterMarriage === "yes"
                            ? "secondary"
                            : profile.workAfterMarriage === "no"
                              ? "outline"
                              : "secondary"
                        }
                        className="text-sm"
                      >
                        {profile.workAfterMarriage === "yes"
                          ? "💼 تريد العمل"
                          : profile.workAfterMarriage === "no"
                            ? "🏠 تفضل البقاء في البيت"
                            : "🤔 لم تحدد بعد"}
                      </Badge>
                    </div>
                  )}

                  {profile.mahramAvailable !== undefined && (
                    <div className="bg-white p-4 rounded-lg border">
                      <label className="text-sm font-medium text-gray-600 block mb-2">
                        توفر المحرم
                      </label>
                      <Badge
                        variant={
                          profile.mahramAvailable ? "success" : "secondary"
                        }
                        className="text-sm"
                      >
                        {profile.mahramAvailable ? "✓ متوفر" : "غير متوفر"}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Guardian Information */}
                <div className="mt-6 p-4 bg-white rounded-lg border">
                  <h5 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-pink-600" />
                    معلومات ولي الأمر
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600 block mb-1">
                        اسم ولي الأمر
                      </label>
                      <p className="text-sm font-semibold">
                        {profile.guardianName}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 block mb-1">
                        صلة القرابة
                      </label>
                      <p className="text-sm">
                        {profile.guardianRelationship === "father"
                          ? "👨 الأب"
                          : profile.guardianRelationship === "brother"
                            ? "👨‍👦 الأخ"
                            : profile.guardianRelationship === "uncle"
                              ? "👨‍👦‍👦 العم/الخال"
                              : "👤 آخر"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 block mb-1">
                        رقم الهاتف
                      </label>
                      <p className="text-sm font-mono" dir="ltr">
                        {profile.guardianPhone}
                      </p>
                    </div>
                    {profile.guardianEmail && (
                      <div>
                        <label className="text-sm font-medium text-gray-600 block mb-1">
                          البريد الإلكتروني
                        </label>
                        <p className="text-sm font-mono" dir="ltr">
                          {profile.guardianEmail}
                        </p>
                      </div>
                    )}
                  </div>
                  {profile.guardianNotes && (
                    <div className="mt-4">
                      <label className="text-sm font-medium text-gray-600 block mb-1">
                        ملاحظات إضافية
                      </label>
                      <p className="text-sm bg-gray-50 p-3 rounded">
                        {profile.guardianNotes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderPersonalInfo = () => {
    const isEditing = isGlobalEdit;

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Heart className="h-5 w-5" />
            المعلومات الشخصية
          </h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Interests */}
            <div>
              <label className="text-sm font-medium text-gray-600">
                الاهتمامات
              </label>
              {!isEditing ? (
                <div className="flex flex-wrap gap-2 mt-2">
                  {profile?.interests?.map((interest, index) => (
                    <Badge key={index} variant="outline">
                      {interest}
                    </Badge>
                  ))}
                </div>
              ) : (
                <Input
                  value={editData.interests?.join(", ") || ""}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      interests: e.target.value
                        .split(",")
                        .map((i) => i.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="اكتب الاهتمامات مفصولة بالفاصلة"
                />
              )}
            </div>

            {/* Marriage Goals */}
            <div>
              <label className="text-sm font-medium text-gray-600">
                أهداف الزواج
              </label>
              {!isEditing ? (
                <p className="text-gray-800 mt-1">{profile?.marriageGoals}</p>
              ) : (
                <Textarea
                  value={editData.marriageGoals || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, marriageGoals: e.target.value })
                  }
                  rows={3}
                />
              )}
            </div>

            {/* Personality Description */}
            <div>
              <label className="text-sm font-medium text-gray-600">
                وصف الشخصية
              </label>
              {!isEditing ? (
                <p className="text-gray-800 mt-1">
                  {profile?.personalityDescription}
                </p>
              ) : (
                <Textarea
                  value={editData.personalityDescription || ""}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      personalityDescription: e.target.value,
                    })
                  }
                  rows={3}
                />
              )}
            </div>

            {/* Bio */}
            <div>
              <label className="text-sm font-medium text-gray-600">
                نبذة شخصية
              </label>
              {!isEditing ? (
                <p className="text-gray-800 mt-1">{profile?.bio}</p>
              ) : (
                <Textarea
                  value={editData.bio || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, bio: e.target.value })
                  }
                  rows={4}
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل الملف الشخصي...</p>
        </div>
      </div>
    );
  }

  if (error === "AUTH_REQUIRED") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 text-primary mb-4">
            <User className="h-full w-full" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            تسجيل الدخول مطلوب
          </h3>
          <p className="text-gray-600 mb-6">
            يرجى تسجيل الدخول أولاً لعرض ملفك الشخصي
          </p>
          <div className="space-y-2">
            <Button asChild className="w-full">
              <a href="/auth/login">تسجيل الدخول</a>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <a href="/auth/register">إنشاء حساب جديد</a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 text-red-400 mb-4">
            <X className="h-full w-full" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            خطأ في التحميل
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadProfile} variant="outline">
            إعادة المحاولة
          </Button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <User className="mx-auto h-16 w-16 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          لم يتم العثور على الملف الشخصي
        </h3>
        <p className="text-gray-600">لم يتم إنشاء ملف شخصي بعد</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Error Banner */}
      {error && !loading && profile && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <X className="h-5 w-5 text-red-500" />
              <p className="text-red-700">{error}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setError(null)}
                className="mr-auto text-red-500 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="relative">
              <div className="h-20 w-20 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 sm:flex hidden items-center justify-center overflow-hidden">
                {profile.profilePicture?.url ? (
                  <img src={profile.profilePicture.url} alt={profile.name} className="h-full w-full object-cover" />
                ) : (
                  <img src="/logo.png" alt="Logo" className="h-full w-full object-contain p-2" />
                )}
              </div>
              <label htmlFor="photo-upload" className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-1.5 cursor-pointer hover:bg-primary-600 transition-colors">
                <Edit3 className="h-3 w-3" />
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  disabled={uploadingPhoto}
                  className="hidden"
                />
              </label>
              {uploadingPhoto && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                </div>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">
                {profile.name}
              </h1>
              <div className="flex items-center gap-4 text-gray-600 mt-1">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {profile.age} سنة
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {profile.city}, {profile.country}
                </span>
                {profile.status === "approved" && (
                  <Badge className="bg-green-100 text-green-800">✓ موثق</Badge>
                )}
              </div>
            </div>
            {/* Global Edit Controls */}
            <div className="mt-4 flex gap-2">
              {!isGlobalEdit ? (
                <Button
                  onClick={handleGlobalEdit}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  تعديل كامل للملف الشخصي
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveAll}
                    disabled={submitting}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {submitting ? "جاري الحفظ..." : "حفظ جميع التغييرات"}
                  </Button>
                  <Button
                    onClick={handleCancelEdit}
                    variant="outline"
                    disabled={submitting}
                  >
                    <X className="h-4 w-4 mr-2" />
                    إلغاء
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Sections */}
      {renderBasicInfo()}
      {renderPhysicalInfo()}
      {renderReligiousInfo()}
      {renderPersonalInfo()}

      {/* Male-specific Housing Info */}
      {profile && isMaleApiProfile(profile) && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Home className="h-5 w-5" />
              معلومات السكن والمعيشة
            </h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">
                  مكان السكن
                </label>
                <p className="text-lg">{profile.housingLocation}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  ملكية السكن
                </label>
                <Badge>
                  {profile.housingOwnership === "owned"
                    ? "تمليك"
                    : profile.housingOwnership === "rented"
                      ? "إيجار"
                      : "ملك الأسرة"}
                </Badge>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  نوع السكن
                </label>
                <p className="text-lg">
                  {profile.housingType === "family"
                    ? "مستقل"
                    : profile.housingType === "with-family"
                      ? "مع الأسرة"
                      : "مشترك"}
                </p>
              </div>
              {profile.monthlyIncome && (
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    الدخل الشهري
                  </label>
                  <p className="text-lg">
                    {profile.monthlyIncome.toLocaleString()} جنيه
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
