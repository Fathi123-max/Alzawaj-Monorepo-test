// Mapping between frontend Arabic display values and backend API values

// Backend expects these values - DO NOT CHANGE
export const BACKEND_VALUES = {
  EDUCATION: {
    PRIMARY: "primary",
    SECONDARY: "secondary",
    HIGH_SCHOOL: "high-school",
    DIPLOMA: "diploma",
    BACHELOR: "bachelor",
    MASTER: "master",
    DOCTORATE: "doctorate",
    OTHER: "other",
  },
  MARITAL_STATUS: {
    single: "single",
    DIVORCED: "divorced",
    WIDOWED: "widowed",
  },
  RELIGIOUS_LEVELS: {
    BASIC: "basic",
    MODERATE: "moderate",
    PRACTICING: "practicing",
    VERY_RELIGIOUS: "very-religious",
  },
  // Location values - backend accepts both Arabic and English via regex
  LOCATIONS: {
    // Countries
    السعودية: "saudi-arabia",
    الإمارات: "united-arab-emirates",
    الكويت: "kuwait",
    قطر: "qatar",
    البحرين: "bahrain",
    الأردن: "jordan",
    لبنان: "lebanon",
    مصر: "egypt",
    سوريا: "syria",
    // Cities
    الرياض: "riyadh",
    جدة: "jeddah",
    "مكة المكرمة": "makkah",
    "المدينة المنورة": "madinah",
    الدمام: "dammam",
    دبي: "dubai",
    أبوظبي: "abu-dhabi",
    الشارقة: "sharjah",
    عجمان: "ajman",
    "مدينة الكويت": "kuwait-city",
    الأحمدي: "al-ahmadi",
    الفروانية: "al-farwaniyah",
    الدوحة: "doha",
    الوكرة: "al-wakra",
    الريان: "al-rayyan",
    المنامة: "manama",
    المحرق: "muharraq",
    الرفاع: "al-riffa",
    عمان: "amman",
    إربد: "irbid",
    الزرقاء: "zarqa",
    بيروت: "beirut",
    طرابلس: "tripoli",
    صيدا: "sidon",
    القاهرة: "cairo",
    الإسكندرية: "alexandria",
    الجيزة: "giza",
    دمشق: "damascus",
    حلب: "aleppo",
    حمص: "homs",
  },
} as const;

// Frontend displays these values - Arabic
export const FRONTEND_TO_BACKEND_MAP = {
  education: {
    ثانوي: BACKEND_VALUES.EDUCATION.SECONDARY,
    "ثانوي عام": BACKEND_VALUES.EDUCATION.SECONDARY,
    جامعي: BACKEND_VALUES.EDUCATION.BACHELOR,
    بكالوريوس: BACKEND_VALUES.EDUCATION.BACHELOR,
    "دراسات عليا": BACKEND_VALUES.EDUCATION.MASTER,
    ماجستير: BACKEND_VALUES.EDUCATION.MASTER,
    دكتوراه: BACKEND_VALUES.EDUCATION.DOCTORATE,
    دبلوم: BACKEND_VALUES.EDUCATION.DIPLOMA,
  },
  maritalStatus: {
    أعزب: BACKEND_VALUES.MARITAL_STATUS.single,
    عزباء: BACKEND_VALUES.MARITAL_STATUS.single,
    مطلق: BACKEND_VALUES.MARITAL_STATUS.DIVORCED,
    مطلقة: BACKEND_VALUES.MARITAL_STATUS.DIVORCED,
    أرمل: BACKEND_VALUES.MARITAL_STATUS.WIDOWED,
    أرملة: BACKEND_VALUES.MARITAL_STATUS.WIDOWED,
  },
  religiousLevel: {
    متوسط: BACKEND_VALUES.RELIGIOUS_LEVELS.MODERATE,
    أساسي: BACKEND_VALUES.RELIGIOUS_LEVELS.BASIC,
    ملتزم: BACKEND_VALUES.RELIGIOUS_LEVELS.PRACTICING,
    "ملتزم جداً": BACKEND_VALUES.RELIGIOUS_LEVELS.VERY_RELIGIOUS,
  },
  location: BACKEND_VALUES.LOCATIONS,
  country: BACKEND_VALUES.LOCATIONS,
  city: BACKEND_VALUES.LOCATIONS,
} as const;

// Helper function to convert frontend value to backend value
export function toBackendValue(
  field: keyof typeof FRONTEND_TO_BACKEND_MAP,
  frontendValue: string,
): string | undefined {
  const mapping = FRONTEND_TO_BACKEND_MAP[field];
  return mapping?.[frontendValue as keyof typeof mapping];
}

// Helper function to check if a value is valid before sending to backend
export function validateAndConvertFilters(filters: any) {
  const converted: any = { ...filters };

  // Convert education
  if (converted.education) {
    const backendValue = toBackendValue("education", converted.education);
    if (backendValue) {
      converted.education = backendValue;
    } else {
      // If not found in map, use the original value but lowercase it for backend
      converted.education = converted.education.toLowerCase();
    }
  }

  // Convert marital status
  if (converted.maritalStatus) {
    const backendValue = toBackendValue(
      "maritalStatus",
      converted.maritalStatus,
    );
    if (backendValue) {
      converted.maritalStatus = backendValue;
    } else {
      converted.maritalStatus = converted.maritalStatus.toLowerCase();
    }
  }

  // Convert religious level
  if (converted.religiousLevel) {
    const backendValue = toBackendValue(
      "religiousLevel",
      converted.religiousLevel,
    );
    if (backendValue) {
      converted.religiousLevel = backendValue;
    } else {
      converted.religiousLevel = converted.religiousLevel.toLowerCase();
    }
  }

  // Convert religiousCommitment (some endpoints use this name)
  if (converted.religiousCommitment) {
    const backendValue = toBackendValue(
      "religiousLevel",
      converted.religiousCommitment,
    );
    if (backendValue) {
      converted.religiousCommitment = backendValue;
    } else {
      converted.religiousCommitment =
        converted.religiousCommitment.toLowerCase();
    }
  }

  // Convert location/country/city
  // Note: Backend search uses `location` parameter for all location filters
  // and supports regex matching in Arabic or English
  const locationFields = ["location", "country", "city"] as const;

  for (const field of locationFields) {
    if (converted[field]) {
      const backendValue = toBackendValue(field, converted[field]);
      if (backendValue) {
        // For location fields, we can use either the converted English value
        // or keep the original Arabic value since backend uses regex
        // We'll prefer the converted value for consistency
        converted[field] = backendValue;
      }
      // Note: We keep Arabic location names as-is since backend uses
      // case-insensitive regex which works with Arabic characters
    }
  }

  // Special handling: Combine country and city into location for backend
  // The backend only uses the `location` parameter
  if (converted.country || converted.city) {
    const country = converted.country ? converted.country : "";
    const city = converted.city ? converted.city : "";

    // Prefer city if available, otherwise country
    // This allows searching by city within a country
    const locationValue = city || country || "";

    if (locationValue) {
      // Convert location value
      const backendLocationValue = toBackendValue("location", locationValue);
      converted.location = backendLocationValue || locationValue;
    }

    // Remove separate country/city from query params only if we want to rely solely on location
    // But since backend now supports country/city explicitly, we can keep them
    // delete converted.country;
    // delete converted.city;
  }

  return converted;
}
