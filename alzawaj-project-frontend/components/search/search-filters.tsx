"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X, Filter, RotateCcw } from "lucide-react";
import { SearchFilters } from "@/lib/api/search";
import { filterOptions } from "@/lib/mock-data/profiles";
import { User, Profile } from "@/lib/types";

interface SearchFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onSearch: () => void;
  onReset: () => void;
  className?: string;
  showTitle?: boolean;
  compact?: boolean;
  user?: User | null;
  profile?: Profile | null;
}

export function SearchFiltersComponent({
  filters,
  onFiltersChange,
  onSearch,
  onReset,
  className = "",
  showTitle = true,
  compact = false,
  user = null,
  profile = null,
}: SearchFiltersProps) {
  const [localFilters, setLocalFilters] = useState<SearchFilters>(filters);
  const [pendingFilters, setPendingFilters] = useState<SearchFilters>(filters);
  const [activeFilterCount, setActiveFilterCount] = useState(0);
  const [hasChanges, setHasChanges] = useState(false);

  // Determine user's gender from profile or user data
  const userGender = profile?.gender || (user as any)?.gender || "m";
  const isUserMale = userGender === "m" || userGender === "male";
  const isUserFemale = userGender === "f" || userGender === "female";

  // Gender-specific filter options
  const getGenderSpecificAppearanceFilters = () => {
    if (isUserMale) {
      // Male user searching for females - show hijab/niqab options
      return {
        showBeardOption: false,
        showHijabOption: true,
        showNiqabOption: true,
        searchGenderLabel: "البحث عن الإناث",
      };
    } else {
      // Female user searching for males - show beard option
      return {
        showBeardOption: true,
        showHijabOption: false,
        showNiqabOption: false,
        searchGenderLabel: "البحث عن الذكور",
      };
    }
  };

  const genderFilters = getGenderSpecificAppearanceFilters();

  // Initialize with correct gender filter
  useEffect(() => {
    const genderFilter = isUserMale ? "f" : "m";
    if (!localFilters.gender || localFilters.gender !== genderFilter) {
      const updatedFilters = { ...localFilters, gender: genderFilter };
      setLocalFilters(updatedFilters);
      setPendingFilters(updatedFilters);
      onFiltersChange(updatedFilters);
    }
  }, [isUserMale, isUserFemale]);

  // Sync external filters changes to local state
  useEffect(() => {
    setLocalFilters(filters);
    setPendingFilters(filters);
    setHasChanges(false);
  }, [filters]);

  // Count active filters (based on pending filters)
  useEffect(() => {
    const count = Object.entries(pendingFilters).filter(([key, value]) => {
      if (key === "page" || key === "limit" || key === "gender") return false; // Exclude gender from count as it's automatic
      return value !== undefined && value !== null && value !== "";
    }).length;
    setActiveFilterCount(count);
  }, [pendingFilters]);

  // Check if there are pending changes
  useEffect(() => {
    const hasChanges =
      JSON.stringify(localFilters) !== JSON.stringify(pendingFilters);
    setHasChanges(hasChanges);
  }, [localFilters, pendingFilters]);

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    let processedValue = value;

    // Validate age filters to ensure they meet backend requirements (18-100)
    if (key === "ageMin") {
      if (value !== undefined && value !== null && value !== "") {
        const numValue = parseInt(value);
        // Ensure minimum age is at least 18
        processedValue = Math.max(18, numValue);
      } else {
        processedValue = undefined;
      }
    }

    if (key === "ageMax") {
      if (value !== undefined && value !== null && value !== "") {
        const numValue = parseInt(value);
        // Ensure maximum age is at most 100
        processedValue = Math.min(100, numValue);
      } else {
        processedValue = undefined;
      }
    }

    // Ensure ageMin is not greater than ageMax
    if (
      key === "ageMin" &&
      processedValue !== undefined &&
      pendingFilters.ageMax !== undefined
    ) {
      if (processedValue > pendingFilters.ageMax) {
        processedValue = pendingFilters.ageMax;
      }
    }

    if (
      key === "ageMax" &&
      processedValue !== undefined &&
      pendingFilters.ageMin !== undefined
    ) {
      if (processedValue < pendingFilters.ageMin) {
        processedValue = pendingFilters.ageMin;
      }
    }

    const newFilters = {
      ...pendingFilters,
      [key]: processedValue,
      // Always include the appropriate gender filter based on user's gender
      gender: isUserMale ? "f" : "m", // Male users search for females, female users search for males
    };
    setPendingFilters(newFilters);
  };

  const removeFilter = (key: keyof SearchFilters) => {
    const newFilters = { ...pendingFilters };
    delete newFilters[key];
    // Keep gender filter
    newFilters.gender = isUserMale ? "f" : "m";
    setPendingFilters(newFilters);
  };

  const handleSearch = () => {
    setLocalFilters(pendingFilters);
    onFiltersChange(pendingFilters);
    onSearch();
  };

  const handleReset = () => {
    const genderOnlyFilters = { gender: isUserMale ? "f" : "m" };
    setLocalFilters(genderOnlyFilters);
    setPendingFilters(genderOnlyFilters);
    onFiltersChange(genderOnlyFilters);
    onReset();
  };

  const getAgeDisplay = () => {
    if (pendingFilters.ageMin && pendingFilters.ageMax) {
      return `${pendingFilters.ageMin} - ${pendingFilters.ageMax} سنة`;
    } else if (pendingFilters.ageMin) {
      return `من ${pendingFilters.ageMin} سنة`;
    } else if (pendingFilters.ageMax) {
      return `حتى ${pendingFilters.ageMax} سنة`;
    }
    return null;
  };

  const getHeightDisplay = () => {
    if (pendingFilters.heightMin && pendingFilters.heightMax) {
      return `${pendingFilters.heightMin} - ${pendingFilters.heightMax} سم`;
    } else if (pendingFilters.heightMin) {
      return `من ${pendingFilters.heightMin} سم`;
    } else if (pendingFilters.heightMax) {
      return `حتى ${pendingFilters.heightMax} سم`;
    }
    return null;
  };

  if (compact) {
    return (
      <div
        className={`space-y-4 p-4 bg-gradient-to-br from-white to-blue-50/30 rounded-lg border border-blue-100/50 shadow-md ${className}`}
      >
        {/* Active Filters Display */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2 p-3 bg-white/60 rounded-md border border-blue-100/30">
            {pendingFilters.country && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {pendingFilters.country}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => removeFilter("country")}
                />
              </Badge>
            )}
            {pendingFilters.maritalStatus && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {pendingFilters.maritalStatus}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => removeFilter("maritalStatus")}
                />
              </Badge>
            )}
            {getAgeDisplay() && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {getAgeDisplay()}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => {
                    removeFilter("ageMin");
                    removeFilter("ageMax");
                  }}
                />
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-6 px-2 text-xs"
            >
              <RotateCcw className="h-3 w-3 ml-1" />
              مسح الكل
            </Button>
          </div>
        )}

        {/* Quick Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Select
            value={pendingFilters.country || ""}
            onValueChange={(value: string) => updateFilter("country", value)}
          >
            <SelectTrigger className="h-10 border-2 border-blue-200 hover:border-blue-300 focus:border-blue-400 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-right">
              <SelectValue
                placeholder="البلد"
                className="text-blue-600 placeholder:text-blue-400"
              />
            </SelectTrigger>
            <SelectContent className="bg-white/95 backdrop-blur-md border-blue-200 shadow-xl rounded-xl">
              {filterOptions.countries.map((country) => (
                <SelectItem
                  key={country}
                  value={country}
                  className="hover:bg-blue-50 focus:bg-blue-100 rounded-lg m-1 transition-colors duration-150"
                >
                  {country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={pendingFilters.maritalStatus || ""}
            onValueChange={(value: string) =>
              updateFilter("maritalStatus", value)
            }
          >
            <SelectTrigger className="h-10 border-2 border-purple-200 hover:border-purple-300 focus:border-purple-400 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-right">
              <SelectValue
                placeholder="الحالة الاجتماعية"
                className="text-purple-600 placeholder:text-purple-400"
              />
            </SelectTrigger>
            <SelectContent className="bg-white/95 backdrop-blur-md border-purple-200 shadow-xl rounded-xl">
              {filterOptions.maritalStatuses.map((status) => (
                <SelectItem
                  key={status}
                  value={status}
                  className="hover:bg-purple-50 focus:bg-purple-100 rounded-lg m-1 transition-colors duration-150"
                >
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={pendingFilters.religiousLevel || ""}
            onValueChange={(value: string) =>
              updateFilter("religiousLevel", value)
            }
          >
            <SelectTrigger className="h-10 border-2 border-amber-200 hover:border-amber-300 focus:border-amber-400 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-right">
              <SelectValue
                placeholder="المستوى الديني"
                className="text-amber-600 placeholder:text-amber-400"
              />
            </SelectTrigger>
            <SelectContent className="bg-white/95 backdrop-blur-md border-amber-200 shadow-xl rounded-xl">
              {filterOptions.religiousLevels.map((level) => (
                <SelectItem
                  key={level}
                  value={level}
                  className="hover:bg-amber-50 focus:bg-amber-100 rounded-lg m-1 transition-colors duration-150"
                >
                  {level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={pendingFilters.education || ""}
            onValueChange={(value: string) => updateFilter("education", value)}
          >
            <SelectTrigger className="h-10 border-2 border-emerald-200 hover:border-emerald-300 focus:border-emerald-400 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-right">
              <SelectValue
                placeholder="التعليم"
                className="text-emerald-600 placeholder:text-emerald-400"
              />
            </SelectTrigger>
            <SelectContent className="bg-white/95 backdrop-blur-md border-emerald-200 shadow-xl rounded-xl">
              {filterOptions.educationLevels.map((edu) => (
                <SelectItem
                  key={edu}
                  value={edu}
                  className="hover:bg-emerald-50 focus:bg-emerald-100 rounded-lg m-1 transition-colors duration-150"
                >
                  {edu}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Compact Mode Action Buttons */}
        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            onClick={handleReset}
            size="sm"
            className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all duration-200"
          >
            <RotateCcw className="h-3 w-3 ml-1" />
            مسح
          </Button>
          <Button
            onClick={handleSearch}
            size="sm"
            className={`flex-1 transition-all duration-200 ${
              hasChanges
                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                : "bg-blue-500 hover:bg-blue-600 text-white"
            }`}
          >
            <Filter className="h-3 w-3 ml-1" />
            بحث
            {hasChanges && (
              <span className="mr-1 w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse"></span>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card
      className={`bg-gradient-to-br from-white to-blue-50/30 border-blue-100/50 ${className}`}
    >
      {showTitle && (
        <CardHeader className="pb-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
          <CardTitle className="flex items-center flex-wrap justify-between gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-blue-100" />
              <span className="font-semibold">فلاتر البحث</span>
              {activeFilterCount > 0 && (
                <Badge
                  variant="secondary"
                  className="bg-white/20 text-white border-white/30"
                >
                  {activeFilterCount}
                </Badge>
              )}
            </div>
            {activeFilterCount > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleReset}
                className="border-white/30 text-white hover:bg-white/10 hover:text-white"
              >
                <RotateCcw className="h-4 w-4 ml-1" />
                مسح الكل
              </Button>
            )}
          </CardTitle>
        </CardHeader>
      )}

      <CardContent className="space-y-6 p-6">
        {/* Gender Search Indicator */}
        <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-l-4 border-blue-500">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <h3 className="text-sm font-semibold text-blue-800">
              {genderFilters.searchGenderLabel}
            </h3>
          </div>
          <p className="text-xs text-blue-600 mt-1">
            {isUserMale
              ? "تم تخصيص الفلاتر للبحث عن الشريكات المناسبات"
              : "تم تخصيص الفلاتر للبحث عن الشركاء المناسبين"}
          </p>
        </div>

        {/* Location Filters */}
        <div className="space-y-4 p-4 bg-white rounded-lg border border-blue-100/50 shadow-sm hover:shadow-md transition-all duration-200 hover:border-blue-200">
          <h4 className="font-semibold text-sm text-blue-800 flex items-center gap-2 border-b border-blue-100 pb-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            الموقع الجغرافي
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label
                htmlFor="country"
                className="text-sm font-semibold text-blue-800 flex items-center gap-2"
              >
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                البلد
              </Label>
              <Select
                value={pendingFilters.country || ""}
                onValueChange={(value: string) =>
                  updateFilter("country", value)
                }
              >
                <SelectTrigger className="h-11 border-2 border-blue-200 hover:border-blue-300 focus:border-blue-400 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-right">
                  <SelectValue
                    placeholder="اختر البلد"
                    className="text-blue-600 placeholder:text-blue-400"
                  />
                </SelectTrigger>
                <SelectContent className="bg-white/95 backdrop-blur-md border-blue-200 shadow-xl rounded-xl">
                  {filterOptions.countries.map((country) => (
                    <SelectItem
                      key={country}
                      value={country}
                      className="hover:bg-blue-50 focus:bg-blue-100 rounded-lg m-1 transition-colors duration-150"
                    >
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {pendingFilters.country && (
              <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
                <Label
                  htmlFor="city"
                  className="text-sm font-semibold text-blue-800 flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                  المدينة
                </Label>
                <Select
                  value={pendingFilters.city || ""}
                  onValueChange={(value: string) => updateFilter("city", value)}
                >
                  <SelectTrigger className="h-11 border-2 border-blue-200 hover:border-blue-300 focus:border-blue-400 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-right">
                    <SelectValue
                      placeholder="اختر المدينة"
                      className="text-blue-600 placeholder:text-blue-400"
                    />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-md border-blue-200 shadow-xl rounded-xl">
                    {filterOptions.cities[
                      pendingFilters.country as keyof typeof filterOptions.cities
                    ]?.map((city) => (
                      <SelectItem
                        key={city}
                        value={city}
                        className="hover:bg-blue-50 focus:bg-blue-100 rounded-lg m-1 transition-colors duration-150"
                      >
                        {city}
                      </SelectItem>
                    )) || []}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        {/* Age Filter */}
        <div className="space-y-4 p-4 bg-white rounded-lg border border-green-100/50 shadow-sm hover:shadow-md transition-all duration-200 hover:border-green-200">
          <h4 className="font-semibold text-sm text-green-800 flex items-center gap-2 border-b border-green-100 pb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            العمر
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="ageMin"
                className="text-sm font-semibold text-green-800 flex items-center gap-2"
              >
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                من
              </Label>
              <Input
                id="ageMin"
                type="number"
                placeholder="18"
                min="18"
                max="100"
                value={pendingFilters.ageMin || ""}
                onChange={(e) =>
                  updateFilter(
                    "ageMin",
                    e.target.value ? parseInt(e.target.value) : undefined,
                  )
                }
                className="h-11 border-2 border-green-200 hover:border-green-300 focus:border-green-400 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="ageMax"
                className="text-sm font-semibold text-green-800 flex items-center gap-2"
              >
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                إلى
              </Label>
              <Input
                id="ageMax"
                type="number"
                placeholder="100"
                min="18"
                max="100"
                value={pendingFilters.ageMax || ""}
                onChange={(e) =>
                  updateFilter(
                    "ageMax",
                    e.target.value ? parseInt(e.target.value) : undefined,
                  )
                }
                className="h-11 border-2 border-green-200 hover:border-green-300 focus:border-green-400 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
              />
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="space-y-4 p-4 bg-white rounded-lg border border-purple-100/50 shadow-sm hover:shadow-md transition-all duration-200 hover:border-purple-200">
          <h4 className="font-semibold text-sm text-purple-800 flex items-center gap-2 border-b border-purple-100 pb-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
            المعلومات الشخصية
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label
                htmlFor="maritalStatus"
                className="text-sm font-semibold text-purple-800 flex items-center gap-2"
              >
                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                الحالة الاجتماعية
              </Label>
              <Select
                value={pendingFilters.maritalStatus || ""}
                onValueChange={(value: string) =>
                  updateFilter("maritalStatus", value)
                }
              >
                <SelectTrigger className="h-11 border-2 border-purple-200 hover:border-purple-300 focus:border-purple-400 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-right">
                  <SelectValue
                    placeholder="اختر الحالة"
                    className="text-purple-600 placeholder:text-purple-400"
                  />
                </SelectTrigger>
                <SelectContent className="bg-white/95 backdrop-blur-md border-purple-200 shadow-xl rounded-xl">
                  {filterOptions.maritalStatuses.map((status) => (
                    <SelectItem
                      key={status}
                      value={status}
                      className="hover:bg-purple-50 focus:bg-purple-100 rounded-lg m-1 transition-colors duration-150"
                    >
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label
                htmlFor="education"
                className="text-sm font-semibold text-purple-800 flex items-center gap-2"
              >
                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                مستوى التعليم
              </Label>
              <Select
                value={pendingFilters.education || ""}
                onValueChange={(value: string) =>
                  updateFilter("education", value)
                }
              >
                <SelectTrigger className="h-11 border-2 border-purple-200 hover:border-purple-300 focus:border-purple-400 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-right">
                  <SelectValue
                    placeholder="اختر المستوى"
                    className="text-purple-600 placeholder:text-purple-400"
                  />
                </SelectTrigger>
                <SelectContent className="bg-white/95 backdrop-blur-md border-purple-200 shadow-xl rounded-xl">
                  {filterOptions.educationLevels.map((edu) => (
                    <SelectItem
                      key={edu}
                      value={edu}
                      className="hover:bg-purple-50 focus:bg-purple-100 rounded-lg m-1 transition-colors duration-150"
                    >
                      {edu}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Religious Information */}
        <div className="space-y-4 p-4 bg-white rounded-lg border border-amber-100/50 shadow-sm hover:shadow-md transition-all duration-200 hover:border-amber-200">
          <h4 className="font-semibold text-sm text-amber-800 flex items-center gap-2 border-b border-amber-100 pb-2">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
            المعلومات الدينية
          </h4>
          <div className="space-y-3">
            <div className="space-y-3">
              <Label
                htmlFor="religiousLevel"
                className="text-sm font-semibold text-amber-800 flex items-center gap-2"
              >
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                المستوى الديني
              </Label>
              <Select
                value={pendingFilters.religiousLevel || ""}
                onValueChange={(value: string) =>
                  updateFilter("religiousLevel", value)
                }
              >
                <SelectTrigger className="h-11 border-2 border-amber-200 hover:border-amber-300 focus:border-amber-400 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-right">
                  <SelectValue
                    placeholder="اختر المستوى"
                    className="text-amber-600 placeholder:text-amber-400"
                  />
                </SelectTrigger>
                <SelectContent className="bg-white/95 backdrop-blur-md border-amber-200 shadow-xl rounded-xl">
                  {filterOptions.religiousLevels.map((level) => (
                    <SelectItem
                      key={level}
                      value={level}
                      className="hover:bg-amber-50 focus:bg-amber-100 rounded-lg m-1 transition-colors duration-150"
                    >
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="group flex items-center gap-3 p-3 rounded-lg border border-amber-100 hover:border-amber-200 hover:bg-amber-50/30 transition-all duration-200 cursor-pointer">
              <Checkbox
                id="isPrayerRegular"
                checked={pendingFilters.isPrayerRegular || false}
                onCheckedChange={(checked: boolean) =>
                  updateFilter("isPrayerRegular", checked)
                }
                className="data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600 border-2 border-amber-300 w-5 h-5 rounded-md shadow-sm transition-all duration-200 hover:shadow-md"
              />
              <Label
                htmlFor="isPrayerRegular"
                className="text-sm font-medium text-amber-800 group-hover:text-amber-900 cursor-pointer select-none transition-colors duration-200 flex items-center gap-2"
              >
                <span className="w-2 h-2 bg-amber-400 rounded-full opacity-70 group-hover:opacity-100 transition-opacity duration-200"></span>
                يصلي بانتظام
              </Label>
            </div>
          </div>
        </div>

        {/* Physical Characteristics */}
        <div className="space-y-4 p-4 bg-white rounded-lg border border-rose-100/50 shadow-sm hover:shadow-md transition-all duration-200 hover:border-rose-200">
          <h4 className="font-semibold text-sm text-rose-800 flex items-center gap-2 border-b border-rose-100 pb-2">
            <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></div>
            الصفات الجسدية ({genderFilters.searchGenderLabel})
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="heightMin"
                className="text-sm font-semibold text-rose-800 flex items-center gap-2"
              >
                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
                الطول من (سم)
              </Label>
              <Input
                id="heightMin"
                type="number"
                placeholder={isUserMale ? "155" : "165"}
                min="140"
                max="200"
                value={pendingFilters.heightMin || ""}
                onChange={(e) =>
                  updateFilter(
                    "heightMin",
                    e.target.value ? parseInt(e.target.value) : undefined,
                  )
                }
                className="h-11 border-2 border-rose-200 hover:border-rose-300 focus:border-rose-400 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="heightMax"
                className="text-sm font-semibold text-rose-800 flex items-center gap-2"
              >
                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
                الطول إلى (سم)
              </Label>
              <Input
                id="heightMax"
                type="number"
                placeholder={isUserMale ? "175" : "185"}
                min="140"
                max="200"
                value={pendingFilters.heightMax || ""}
                onChange={(e) =>
                  updateFilter(
                    "heightMax",
                    e.target.value ? parseInt(e.target.value) : undefined,
                  )
                }
                className="h-11 border-2 border-rose-200 hover:border-rose-300 focus:border-rose-400 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
              />
            </div>
          </div>

          {/* Appearance preferences based on user gender */}
          <div className="space-y-3">
            {genderFilters.showBeardOption && (
              <div className="group flex items-center gap-3 p-3 rounded-lg border border-rose-100 hover:border-rose-200 hover:bg-rose-50/30 transition-all duration-200 cursor-pointer">
                <Checkbox
                  id="hasBeard"
                  checked={pendingFilters.hasBeard || false}
                  onCheckedChange={(checked: boolean) =>
                    updateFilter("hasBeard", checked)
                  }
                  className="data-[state=checked]:bg-rose-600 data-[state=checked]:border-rose-600 border-2 border-rose-300 w-5 h-5 rounded-md shadow-sm transition-all duration-200 hover:shadow-md"
                />
                <Label
                  htmlFor="hasBeard"
                  className="text-sm font-medium text-rose-800 group-hover:text-rose-900 cursor-pointer select-none transition-colors duration-200 flex items-center gap-2"
                >
                  <span className="w-2 h-2 bg-rose-400 rounded-full opacity-70 group-hover:opacity-100 transition-opacity duration-200"></span>
                  لديه لحية
                </Label>
              </div>
            )}

            {genderFilters.showHijabOption && (
              <div className="group flex items-center gap-3 p-3 rounded-lg border border-rose-100 hover:border-rose-200 hover:bg-rose-50/30 transition-all duration-200 cursor-pointer">
                <Checkbox
                  id="wearHijab"
                  checked={pendingFilters.wearHijab || false}
                  onCheckedChange={(checked: boolean) =>
                    updateFilter("wearHijab", checked)
                  }
                  className="data-[state=checked]:bg-rose-600 data-[state=checked]:border-rose-600 border-2 border-rose-300 w-5 h-5 rounded-md shadow-sm transition-all duration-200 hover:shadow-md"
                />
                <Label
                  htmlFor="wearHijab"
                  className="text-sm font-medium text-rose-800 group-hover:text-rose-900 cursor-pointer select-none transition-colors duration-200 flex items-center gap-2"
                >
                  <span className="w-2 h-2 bg-rose-400 rounded-full opacity-70 group-hover:opacity-100 transition-opacity duration-200"></span>
                  ترتدي الحجاب
                </Label>
              </div>
            )}

            {genderFilters.showNiqabOption && (
              <div className="group flex items-center gap-3 p-3 rounded-lg border border-rose-100 hover:border-rose-200 hover:bg-rose-50/30 transition-all duration-200 cursor-pointer">
                <Checkbox
                  id="wearNiqab"
                  checked={pendingFilters.wearNiqab || false}
                  onCheckedChange={(checked: boolean) =>
                    updateFilter("wearNiqab", checked)
                  }
                  className="data-[state=checked]:bg-rose-600 data-[state=checked]:border-rose-600 border-2 border-rose-300 w-5 h-5 rounded-md shadow-sm transition-all duration-200 hover:shadow-md"
                />
                <Label
                  htmlFor="wearNiqab"
                  className="text-sm font-medium text-rose-800 group-hover:text-rose-900 cursor-pointer select-none transition-colors duration-200 flex items-center gap-2"
                >
                  <span className="w-2 h-2 bg-rose-400 rounded-full opacity-70 group-hover:opacity-100 transition-opacity duration-200"></span>
                  ترتدي النقاب
                </Label>
              </div>
            )}
          </div>
        </div>

        {/* Other Preferences */}
        <div className="space-y-4 p-4 bg-white rounded-lg border border-indigo-100/50 shadow-sm hover:shadow-md transition-all duration-200 hover:border-indigo-200">
          <h4 className="font-semibold text-sm text-indigo-800 flex items-center gap-2 border-b border-indigo-100 pb-2">
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
            معايير أخرى
          </h4>
          <div className="space-y-3">
            <div className="group flex items-center gap-3 p-3 rounded-lg border border-indigo-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all duration-200 cursor-pointer">
              <Checkbox
                id="verified"
                checked={pendingFilters.verified || false}
                onCheckedChange={(checked: boolean) =>
                  updateFilter("verified", checked)
                }
                className="data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600 border-2 border-indigo-300 w-5 h-5 rounded-md shadow-sm transition-all duration-200 hover:shadow-md"
              />
              <Label
                htmlFor="verified"
                className="text-sm font-medium text-indigo-800 group-hover:text-indigo-900 cursor-pointer select-none transition-colors duration-200 flex items-center gap-2"
              >
                <span className="w-2 h-2 bg-indigo-400 rounded-full opacity-70 group-hover:opacity-100 transition-opacity duration-200"></span>
                ملفات موثقة فقط
              </Label>
            </div>

            <div className="group flex items-center gap-3 p-3 rounded-lg border border-indigo-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all duration-200 cursor-pointer">
              <Checkbox
                id="hasChildren"
                checked={Boolean(pendingFilters.hasChildren)}
                onCheckedChange={(checked: boolean) =>
                  updateFilter("hasChildren", checked)
                }
                className="data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600 border-2 border-indigo-300 w-5 h-5 rounded-md shadow-sm transition-all duration-200 hover:shadow-md"
              />
              <Label
                htmlFor="hasChildren"
                className="text-sm font-medium text-indigo-800 group-hover:text-indigo-900 cursor-pointer select-none transition-colors duration-200 flex items-center gap-2"
              >
                <span className="w-2 h-2 bg-indigo-400 rounded-full opacity-70 group-hover:opacity-100 transition-opacity duration-200"></span>
                لديه أطفال
              </Label>
            </div>

            <div className="group flex items-center gap-3 p-3 rounded-lg border border-indigo-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all duration-200 cursor-pointer">
              <Checkbox
                id="wantsChildren"
                checked={Boolean(pendingFilters.wantsChildren)}
                onCheckedChange={(checked: boolean) =>
                  updateFilter("wantsChildren", checked)
                }
                className="data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600 border-2 border-indigo-300 w-5 h-5 rounded-md shadow-sm transition-all duration-200 hover:shadow-md"
              />
              <Label
                htmlFor="wantsChildren"
                className="text-sm font-medium text-indigo-800 group-hover:text-indigo-900 cursor-pointer select-none transition-colors duration-200 flex items-center gap-2"
              >
                <span className="w-2 h-2 bg-indigo-400 rounded-full opacity-70 group-hover:opacity-100 transition-opacity duration-200"></span>
                يريد أطفال
              </Label>
            </div>
          </div>
        </div>

        {/* Changes Indicator */}
        {hasChanges && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
            <p className="text-sm text-blue-700 font-medium">
              لديك تغييرات غير محفوظة - انقر على "بحث" لتطبيق التغييرات
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-blue-100">
          <Button
            variant="outline"
            onClick={handleReset}
            className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all duration-200"
          >
            <RotateCcw className="h-4 w-4 ml-2" />
            مسح الكل
          </Button>
          <Button
            onClick={handleSearch}
            className={`flex-1 transition-all duration-200 ${
              hasChanges
                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg transform hover:scale-105"
                : "bg-blue-500 hover:bg-blue-600 text-white"
            }`}
          >
            <Filter className="h-4 w-4 ml-2" />
            بحث
            {hasChanges && (
              <span className="mr-2 w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
