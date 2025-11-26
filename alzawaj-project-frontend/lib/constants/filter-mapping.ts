// Mapping between frontend Arabic display values and backend API values

// Frontend Arabic → Backend English mappings
const educationMap: Record<string, string> = {
  ابتدائي: "primary",
  ثانوي: "secondary",
  "ثانوي عام": "high-school",
  دبلوم: "diploma",
  جامعي: "bachelor",
  بكالوريوس: "bachelor",
  "دراسات عليا": "master",
  ماجستير: "master",
  دكتوراه: "doctorate",
  أخرى: "other",
};

const maritalStatusMap: Record<string, string> = {
  أعزب: "single",
  عزباء: "single",
  مطلق: "divorced",
  مطلقة: "divorced",
  أرمل: "widowed",
  أرملة: "widowed",
};

const religiousLevelMap: Record<string, string> = {
  أساسي: "basic",
  متوسط: "moderate",
  ملتزم: "practicing",
  "ملتزم جداً": "very-religious",
};

const appearanceMap: Record<string, string> = {
  "جذاب جداً": "very-attractive",
  جذاب: "attractive",
  متوسط: "average",
  بسيط: "simple",
};

const skinColorMap: Record<string, string> = {
  فاتح: "fair",
  متوسط: "medium",
  زيتوني: "olive",
  داكن: "dark",
};

const bodyTypeMap: Record<string, string> = {
  نحيف: "slim",
  متوسط: "average",
  رياضي: "athletic",
  ممتلئ: "heavy",
};

const smokingStatusMap: Record<string, string> = {
  "لا يدخن": "never",
  أقلع: "quit",
  أحياناً: "occasionally",
  بانتظام: "regularly",
};

const financialSituationMap: Record<string, string> = {
  ممتاز: "excellent",
  جيد: "good",
  متوسط: "average",
  صعب: "struggling",
};

const housingOwnershipMap: Record<string, string> = {
  ملك: "owned",
  إيجار: "rented",
  "ملك عائلي": "family-owned",
};

const workAfterMarriageMap: Record<string, string> = {
  نعم: "yes",
  لا: "no",
  "غير محدد": "undecided",
};

const clothingStyleMap: Record<string, string> = {
  "نقاب كامل": "niqab-full",
  "نقاب مع كفوف": "niqab-hands",
  خمار: "khimar",
  "طرحة فضفاضة": "tarha-loose",
  "حجاب محافظ": "hijab-conservative",
  "حجاب متواضع": "hijab-modest",
  "طرحة ضيقة": "tarha-fitted",
  "حجاب عصري": "hijab-modern",
  "ملابس فضفاضة": "loose-covering",
  "ملابس محتشمة": "modest-covering",
};

const nationalityMap: Record<string, string> = {
  سعودي: "Saudi",
  إماراتي: "Emirati",
  كويتي: "Kuwaiti",
  قطري: "Qatari",
  بحريني: "Bahraini",
  عماني: "Omani",
  سوري: "Syrian",
  لبناني: "Lebanese",
  أردني: "Jordanian",
  فلسطيني: "Palestinian",
  مصري: "Egyptian",
  ليبي: "Libyan",
  تونسي: "Tunisian",
  جزائري: "Algerian",
  مغربي: "Moroccan",
  سوداني: "Sudanese",
  عراقي: "Iraqi",
  يمني: "Yemeni",
  صومالي: "Somali",
  جيبوتي: "Djiboutian",
  موريتاني: "Mauritanian",
  قمري: "Comorian",
  تركي: "Turkish",
  إيراني: "Iranian",
  باكستاني: "Pakistani",
  بنغلاديشي: "Bangladeshi",
  إندونيسي: "Indonesian",
  ماليزي: "Malaysian",
  أفغاني: "Afghan",
  أمريكي: "American",
  كندي: "Canadian",
  بريطاني: "British",
  فرنسي: "French",
  ألماني: "German",
  أسترالي: "Australian",
  أخرى: "Other",
};

// Validate and convert all filters for backend
export function validateAndConvertFilters(
  filters: Record<string, any>,
): Record<string, any> {
  const converted: Record<string, any> = { ...filters };

  // Convert education
  if (converted["education"]) {
    converted["education"] =
      educationMap[converted["education"]] || converted["education"];
  }

  // Convert marital status
  if (converted["maritalStatus"]) {
    converted["maritalStatus"] =
      maritalStatusMap[converted["maritalStatus"]] ||
      converted["maritalStatus"];
  }

  // Convert religiousLevel → religiousCommitment (backend parameter name)
  if (converted["religiousLevel"]) {
    converted["religiousCommitment"] =
      religiousLevelMap[converted["religiousLevel"]] ||
      converted["religiousLevel"];
    delete converted["religiousLevel"];
  }

  // Convert new filters
  if (converted["appearance"]) {
    converted["appearance"] =
      appearanceMap[converted["appearance"]] || converted["appearance"];
  }

  if (converted["skinColor"]) {
    converted["skinColor"] =
      skinColorMap[converted["skinColor"]] || converted["skinColor"];
  }

  if (converted["bodyType"]) {
    converted["bodyType"] =
      bodyTypeMap[converted["bodyType"]] || converted["bodyType"];
  }

  if (converted["smokingStatus"]) {
    converted["smokingStatus"] =
      smokingStatusMap[converted["smokingStatus"]] ||
      converted["smokingStatus"];
  }

  if (converted["financialSituation"]) {
    converted["financialSituation"] =
      financialSituationMap[converted["financialSituation"]] ||
      converted["financialSituation"];
  }

  if (converted["housingOwnership"]) {
    converted["housingOwnership"] =
      housingOwnershipMap[converted["housingOwnership"]] ||
      converted["housingOwnership"];
  }

  if (converted["workAfterMarriage"]) {
    converted["workAfterMarriage"] =
      workAfterMarriageMap[converted["workAfterMarriage"]] ||
      converted["workAfterMarriage"];
  }

  if (converted["clothingStyle"]) {
    converted["clothingStyle"] =
      clothingStyleMap[converted["clothingStyle"]] ||
      converted["clothingStyle"];
  }

  if (converted["nationality"]) {
    converted["nationality"] =
      nationalityMap[converted["nationality"]] || converted["nationality"];
  }

  // Remove frontend-only fields that backend doesn't accept
  delete converted["gender"];

  return converted;
}
