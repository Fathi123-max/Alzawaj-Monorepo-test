"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SearchFilters } from "@/lib/api/search";
import { filterOptions } from "@/lib/mock-data/profiles";
import { RotateCcw, Search } from "lucide-react";
import { nationalities } from "@/lib/static-data/nationalities";

interface SearchFiltersRedesignedProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onSearch: () => void;
  onReset: () => void;
  userGender?: "m" | "f" | undefined;
}

export function SearchFiltersRedesigned({
  filters,
  onFiltersChange,
  onSearch,
  onReset,
  userGender = "m",
}: SearchFiltersRedesignedProps) {
  const [localFilters, setLocalFilters] = useState<SearchFilters>(filters);

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    const newFilters = { ...localFilters, [key]: value || undefined };
    setLocalFilters(newFilters);
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
    onSearch();
  };

  const handleReset = () => {
    setLocalFilters({});
    onReset();
  };

  const isUserMale = userGender === "m";

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>الفلاتر</span>
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 ml-1" />
            إعادة تعيين
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full">
          {/* Basic Filters */}
          <AccordionItem value="basic">
            <AccordionTrigger>المعلومات الأساسية</AccordionTrigger>
            <AccordionContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>العمر من</Label>
                  <Input
                    type="number"
                    value={localFilters.ageMin || ""}
                    onChange={(e) =>
                      updateFilter(
                        "ageMin",
                        e.target.value ? Number(e.target.value) : undefined,
                      )
                    }
                    placeholder="18"
                  />
                </div>
                <div>
                  <Label>إلى</Label>
                  <Input
                    type="number"
                    value={localFilters.ageMax || ""}
                    onChange={(e) =>
                      updateFilter(
                        "ageMax",
                        e.target.value ? Number(e.target.value) : undefined,
                      )
                    }
                    placeholder="65"
                  />
                </div>
              </div>

              <div>
                <Label>الحالة الاجتماعية</Label>
                <Select
                  value={localFilters.maritalStatus || ""}
                  onValueChange={(v) => updateFilter("maritalStatus", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر" />
                  </SelectTrigger>
                  <SelectContent>
                    {filterOptions.maritalStatuses.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>التعليم</Label>
                <Select
                  value={localFilters.education || ""}
                  onValueChange={(v) => updateFilter("education", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر" />
                  </SelectTrigger>
                  <SelectContent>
                    {filterOptions.educationLevels.map((e) => (
                      <SelectItem key={e} value={e}>
                        {e}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>الجنسية</Label>
                <Select
                  value={localFilters.nationality || ""}
                  onValueChange={(v) => updateFilter("nationality", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر" />
                  </SelectTrigger>
                  <SelectContent>
                    {(() => {
                      // Group nationalities by region
                      const groupedNationalities: Record<
                        string,
                        typeof nationalities
                      > = {};

                      nationalities.forEach((nationality) => {
                        if (!groupedNationalities[nationality.group]) {
                          groupedNationalities[nationality.group] = [];
                        }
                        groupedNationalities[nationality.group]?.push(
                          nationality,
                        );
                      });

                      return Object.entries(groupedNationalities).map(
                        ([group, nationalitiesInGroup]) => (
                          <SelectGroup key={group}>
                            <SelectLabel>{group}</SelectLabel>
                            {nationalitiesInGroup.map((nationality) => (
                              <SelectItem
                                key={nationality.value}
                                value={nationality.value}
                              >
                                {nationality.label}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        ),
                      );
                    })()}
                  </SelectContent>
                </Select>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Religious Filters */}
          <AccordionItem value="religious">
            <AccordionTrigger>المعلومات الدينية</AccordionTrigger>
            <AccordionContent className="space-y-4">
              <div>
                <Label>المستوى الديني</Label>
                <Select
                  value={localFilters.religiousLevel || ""}
                  onValueChange={(v) => updateFilter("religiousLevel", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر" />
                  </SelectTrigger>
                  <SelectContent>
                    {filterOptions.religiousLevels.map((l) => (
                      <SelectItem key={l} value={l}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Physical Appearance */}
          <AccordionItem value="appearance">
            <AccordionTrigger>المظهر الخارجي</AccordionTrigger>
            <AccordionContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>الطول من</Label>
                  <Input
                    type="number"
                    value={localFilters.heightMin || ""}
                    onChange={(e) =>
                      updateFilter(
                        "heightMin",
                        e.target.value ? Number(e.target.value) : undefined,
                      )
                    }
                    placeholder="150"
                  />
                </div>
                <div>
                  <Label>إلى</Label>
                  <Input
                    type="number"
                    value={localFilters.heightMax || ""}
                    onChange={(e) =>
                      updateFilter(
                        "heightMax",
                        e.target.value ? Number(e.target.value) : undefined,
                      )
                    }
                    placeholder="200"
                  />
                </div>
              </div>

              <div>
                <Label>المظهر</Label>
                <Select
                  value={localFilters.appearance || ""}
                  onValueChange={(v) => updateFilter("appearance", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر" />
                  </SelectTrigger>
                  <SelectContent>
                    {filterOptions.appearances.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>لون البشرة</Label>
                <Select
                  value={localFilters.skinColor || ""}
                  onValueChange={(v) => updateFilter("skinColor", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر" />
                  </SelectTrigger>
                  <SelectContent>
                    {filterOptions.skinColors.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>البنية الجسدية</Label>
                <Select
                  value={localFilters.bodyType || ""}
                  onValueChange={(v) => updateFilter("bodyType", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر" />
                  </SelectTrigger>
                  <SelectContent>
                    {filterOptions.bodyTypes.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Lifestyle */}
          <AccordionItem value="lifestyle">
            <AccordionTrigger>نمط الحياة</AccordionTrigger>
            <AccordionContent className="space-y-4">
              <div>
                <Label>التدخين</Label>
                <Select
                  value={localFilters.smokingStatus || ""}
                  onValueChange={(v) => updateFilter("smokingStatus", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر" />
                  </SelectTrigger>
                  <SelectContent>
                    {filterOptions.smokingStatuses.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Male-Specific Filters */}
          {!isUserMale && (
            <AccordionItem value="male-specific">
              <AccordionTrigger>معلومات خاصة بالرجال</AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div>
                  <Label>الوضع المالي</Label>
                  <Select
                    value={localFilters.financialSituation || ""}
                    onValueChange={(v) => updateFilter("financialSituation", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر" />
                    </SelectTrigger>
                    <SelectContent>
                      {filterOptions.financialSituations.map((f) => (
                        <SelectItem key={f} value={f}>
                          {f}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>ملكية السكن</Label>
                  <Select
                    value={localFilters.housingOwnership || ""}
                    onValueChange={(v) => updateFilter("housingOwnership", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر" />
                    </SelectTrigger>
                    <SelectContent>
                      {filterOptions.housingOwnerships.map((h) => (
                        <SelectItem key={h} value={h}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Female-Specific Filters */}
          {isUserMale && (
            <AccordionItem value="female-specific">
              <AccordionTrigger>معلومات خاصة بالنساء</AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div>
                  <Label>نمط اللباس</Label>
                  <Select
                    value={localFilters.clothingStyle || ""}
                    onValueChange={(v) => updateFilter("clothingStyle", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر" />
                    </SelectTrigger>
                    <SelectContent>
                      {filterOptions.clothingStyles.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>العمل بعد الزواج</Label>
                  <Select
                    value={localFilters.workAfterMarriage || ""}
                    onValueChange={(v) => updateFilter("workAfterMarriage", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر" />
                    </SelectTrigger>
                    <SelectContent>
                      {filterOptions.workAfterMarriageOptions.map((w) => (
                        <SelectItem key={w} value={w}>
                          {w}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Location */}
          <AccordionItem value="location">
            <AccordionTrigger>الموقع</AccordionTrigger>
            <AccordionContent className="space-y-4">
              <div>
                <Label>البلد</Label>
                <Select
                  value={localFilters.country || ""}
                  onValueChange={(v) => updateFilter("country", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر" />
                  </SelectTrigger>
                  <SelectContent>
                    {filterOptions.countries.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="mt-6 flex gap-3">
          <Button onClick={handleApply} className="flex-1">
            <Search className="h-4 w-4 ml-1" />
            بحث
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
