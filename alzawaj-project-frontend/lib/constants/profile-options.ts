// Constants for profile selector options
// These match the options used in registration, search filters, and profile editing

export interface SelectOption {
  value: string;
  label: string;
}

// Marital Status Options (consistent across all components)
export const MARITAL_STATUS_OPTIONS: SelectOption[] = [
  { value: "single", label: "أعزب/عزباء" },
  { value: "divorced", label: "مطلق/مطلقة" },
  { value: "widowed", label: "أرمل/أرملة" },
];

// Religious Level Options
export const RELIGIOUS_LEVEL_OPTIONS: SelectOption[] = [
  { value: "basic", label: "أساسي" },
  { value: "moderate", label: "متوسط" },
  { value: "practicing", label: "ملتزم" },
  { value: "very-religious", label: "ملتزم جداً" },
];

// Education Level Options (using English values for API compatibility)
export const EDUCATION_LEVEL_OPTIONS: SelectOption[] = [
  { value: "below-secondary", label: "أقل من الثانوية العامة" },
  { value: "secondary", label: "الثانوية العامة" },
  { value: "diploma", label: "دبلوم متوسط" },
  { value: "bachelor", label: "بكالوريوس" },
  { value: "master", label: "ماجستير" },
  { value: "phd", label: "دكتوراه" },
  { value: "religious-studies", label: "دراسات شرعية" },
  { value: "quran-memorization", label: "حافظ/ة للقرآن الكريم" },
];

// Physical Appearance Options
export const SKIN_COLOR_OPTIONS: SelectOption[] = [
  { value: "fair", label: "فاتح" },
  { value: "medium", label: "متوسط" },
  { value: "olive", label: "زيتوني" },
  { value: "dark", label: "داكن" },
];

export const BODY_TYPE_OPTIONS: SelectOption[] = [
  { value: "slim", label: "نحيف" },
  { value: "average", label: "متوسط" },
  { value: "athletic", label: "رياضي" },
  { value: "heavy", label: "ممتلئ" },
];

// Financial Situation Options
export const FINANCIAL_SITUATION_OPTIONS: SelectOption[] = [
  { value: "excellent", label: "ممتاز" },
  { value: "good", label: "جيد" },
  { value: "average", label: "متوسط" },
  { value: "struggling", label: "صعب" },
];

// Housing Options
export const HOUSING_OWNERSHIP_OPTIONS: SelectOption[] = [
  { value: "owned", label: "ملك" },
  { value: "rented", label: "إيجار" },
  { value: "family-owned", label: "ملك العائلة" },
];

export const HOUSING_TYPE_OPTIONS: SelectOption[] = [
  { value: "family", label: "مستقل" },
  { value: "with-family", label: "مع العائلة" },
  { value: "alone", label: "وحيد" },
  { value: "shared", label: "مشترك" },
];

// Gender-specific Religious Options
export const PRAYING_LOCATION_OPTIONS: SelectOption[] = [
  { value: "mosque", label: "في المسجد" },
  { value: "home", label: "في البيت" },
  { value: "both", label: "في المسجد والبيت" },
];

export const FEMALE_PRAYING_LOCATION_OPTIONS: SelectOption[] = [
  { value: "home", label: "في البيت" },
  { value: "mosque-when-possible", label: "في المسجد عند الإمكان" },
];

export const CLOTHING_STYLE_OPTIONS: SelectOption[] = [
  { value: "niqab-full", label: "نقاب كامل" },
  { value: "niqab-hands", label: "نقاب مع كشف اليدين" },
  { value: "khimar", label: "خمار" },
  { value: "hijab-conservative", label: "حجاب محافظ" },
  { value: "hijab-modest", label: "حجاب محتشم" },
  { value: "hijab-modern", label: "حجاب عصري" },
  { value: "loose-covering", label: "لباس فضفاض" },
];

export const WORK_AFTER_MARRIAGE_OPTIONS: SelectOption[] = [
  { value: "yes", label: "نعم، أريد العمل" },
  { value: "no", label: "لا، أفضل البقاء في البيت" },
  { value: "depends", label: "يعتمد على الظروف" },
];

// Parent Status Options
export const PARENTS_ALIVE_OPTIONS: SelectOption[] = [
  { value: "both", label: "كلاهما على قيد الحياة" },
  { value: "father", label: "الأب فقط" },
  { value: "mother", label: "الأم فقط" },
  { value: "none", label: "كلاهما متوفي" },
];

// Children Options
export const WANTS_CHILDREN_OPTIONS: SelectOption[] = [
  { value: "yes", label: "نعم" },
  { value: "no", label: "لا" },
  { value: "maybe", label: "ربما" },
  { value: "undecided", label: "لم أحدد بعد" },
];

// Guardian Relationship Options
export const GUARDIAN_RELATIONSHIP_OPTIONS: SelectOption[] = [
  { value: "father", label: "الأب" },
  { value: "brother", label: "الأخ" },
  { value: "uncle", label: "العم/الخال" },
  { value: "other", label: "آخر" },
];

// Boolean options for Yes/No fields
export const YES_NO_OPTIONS: SelectOption[] = [
  { value: "true", label: "نعم" },
  { value: "false", label: "لا" },
];

// Helper functions to get labels
export const getMaritalStatusLabel = (value: string): string => {
  return (
    MARITAL_STATUS_OPTIONS.find((option) => option.value === value)?.label ||
    value
  );
};

export const getReligiousLevelLabel = (value: string): string => {
  return (
    RELIGIOUS_LEVEL_OPTIONS.find((option) => option.value === value)?.label ||
    value
  );
};

export const getEducationLevelLabel = (value: string): string => {
  return (
    EDUCATION_LEVEL_OPTIONS.find((option) => option.value === value)?.label ||
    value
  );
};

export const getFinancialSituationLabel = (value: string): string => {
  return (
    FINANCIAL_SITUATION_OPTIONS.find((option) => option.value === value)
      ?.label || value
  );
};
