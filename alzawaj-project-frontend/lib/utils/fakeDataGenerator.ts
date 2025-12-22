// Temporarily commented out due to build issues
// import { faker } from "@faker-js/faker";
import { RegistrationData } from "@/lib/types";

// Simple substitute for faker
const simpleFaker = {
  name: {
    firstName: () => {
      const names = [
        "Ahmed",
        "Mohammed",
        "Omar",
        "Ali",
        "Sara",
        "Fatima",
        "Aisha",
        "Khadija",
      ];
      return names[Math.floor(Math.random() * names.length)];
    },
    lastName: () => {
      const names = [
        "Al-Saud",
        "Al-Harbi",
        "Al-Otaibi",
        "Al-Shahrani",
        "Al-Qahtani",
      ];
      return names[Math.floor(Math.random() * names.length)];
    },
  },
  internet: {
    email: () => {
      const domains = ["gmail.com", "yahoo.com", "hotmail.com"];
      const domain = domains[Math.floor(Math.random() * domains.length)];
      return `user${Math.floor(Math.random() * 1000)}@${domain}`;
    },
  },
  phone: {
    phoneNumber: () => {
      return `+9665${Math.floor(10000000 + Math.random() * 90000000)}`;
    },
  },
  date: {
    between: (from: Date, to: Date) => {
      return new Date(
        from.getTime() + Math.random() * (to.getTime() - from.getTime()),
      );
    },
  },
};

// Utility function to safely get a random element from an array
function getRandomElement<T>(arr: T[]): T {
  if (arr.length === 0) {
    throw new Error("Array is empty");
  }
  const index = Math.floor(Math.random() * arr.length);
  return arr[index]!;
}

// Utility function for marital status
function getRandomMaritalStatus(): "single" | "divorced" | "widowed" {
  return getRandomElement(["single", "divorced", "widowed"]);
}

// Utility function for religious level
function getRandomReligiousLevel():
  | "practicing"
  | "very-religious"
  | "moderate" {
  return getRandomElement(["practicing", "very-religious", "moderate"]);
}

// Utility function for parent status
function getRandomParentsAlive(): "both" | "father" | "mother" | "none" {
  return getRandomElement(["both", "father", "mother", "none"]);
}

// Utility function for parent relationship
function getRandomParentRelationship(): "excellent" | "good" | "average" {
  return getRandomElement(["excellent", "good", "average"]);
}

// Utility function for wants children
function getRandomWantsChildren(): "yes" | "no" | "maybe" {
  return getRandomElement(["yes", "no", "maybe"]);
}

// Utility function for appearance
function getRandomAppearance(): "very-attractive" | "attractive" | "average" {
  return getRandomElement(["very-attractive", "attractive", "average"]);
}

// Utility function for skin color
function getRandomSkinColor(): "fair" | "medium" | "olive" {
  return getRandomElement(["fair", "medium", "olive"]);
}

// Utility function for body type
function getRandomBodyType(): "slim" | "average" | "athletic" {
  return getRandomElement(["slim", "average", "athletic"]);
}

// Utility function for personality description
function getRandomPersonalityDescription(): string {
  return getRandomElement([
    "شخص هادئ ومتفهم، أحب الاستقرار والأسرة",
    "شخصية اجتماعية ومرحة، أحب التواصل مع الآخرين",
    "شخص طموح ومجتهد، أسعى لتحقيق أهدافي",
  ]);
}

// Utility function for relocation plans
function getRandomRelocationPlan(): string {
  return getRandomElement([
    "مستعد للانتقال داخل المملكة",
    "أفضل البقاء في مدينتي",
    "مستعد للانتقال لأي مكان",
  ]);
}

// Utility function for marriage timeline
function getRandomMarriageTimeline(): string {
  return getRandomElement(["خلال 3-6 أشهر", "خلال 6-12 شهر", "خلال سنة"]);
}

// Utility function for education
function getRandomEducation(): "bachelor" | "master" | "phd" | "diploma" {
  return getRandomElement(["bachelor", "master", "phd", "diploma"]);
}

// Utility function for financial situation
function getRandomFinancialSituation(): "excellent" | "good" | "average" {
  return getRandomElement(["excellent", "good", "average"]);
}

// Utility function for housing ownership
function getRandomHousingOwnership(): "owned" | "rented" | "family-owned" {
  return getRandomElement(["owned", "rented", "family-owned"]);
}

// Utility function for housing type
function getRandomHousingType(): "شقة" | "فيلا" | "دور" {
  return getRandomElement(["شقة", "فيلا", "دور"]);
}

// Utility function for guardian name
function getRandomGuardianName(): string {
  return getRandomElement(["والدي", "أخي", "عمي"]);
}

// Utility function for guardian relationship
function getRandomGuardianRelationship(): "father" | "brother" | "uncle" {
  return getRandomElement(["father", "brother", "uncle"]);
}

// Utility function for wear hijab
function getRandomWearHijab(): "none" | "hijab" | "niqab" {
  return getRandomElement(["none", "hijab", "niqab"]);
}

// Utility function for clothing style
function getRandomClothingStyle():
  | "niqab-full"
  | "hijab-abaya"
  | "hijab-modest" {
  return getRandomElement(["niqab-full", "hijab-abaya", "hijab-modest"]);
}

// Utility function for work after marriage
function getRandomWorkAfterMarriage(): "yes" | "no" | "undecided" {
  return getRandomElement(["yes", "no", "undecided"]);
}

// Utility function for praying location
function getRandomPrayingLocation(): "المسجد" | "البيت" {
  return getRandomElement(["المسجد", "البيت"]);
}

const arabicFirstNamesMale = [
  "أحمد",
  "محمد",
  "عبدالله",
  "خالد",
  "سعد",
  "فهد",
  "عمر",
  "علي",
  "حسن",
  "يوسف",
];
const arabicFirstNamesFemale = [
  "فاطمة",
  "عائشة",
  "خديجة",
  "مريم",
  "سارة",
  "نورة",
  "هند",
  "ريم",
  "لينا",
  "دانة",
];
const arabicLastNames = [
  "العتيبي",
  "الدوسري",
  "القحطاني",
  "الشمري",
  "المطيري",
  "العنزي",
  "الحربي",
  "الزهراني",
  "الغامدي",
  "السهلي",
];
const saudiCities = [
  "الرياض",
  "جدة",
  "مكة المكرمة",
  "المدينة المنورة",
  "الدمام",
  "الخبر",
  "الطائف",
  "أبها",
  "تبوك",
  "بريدة",
];
const occupations = [
  "مهندس",
  "طبيب",
  "معلم",
  "محاسب",
  "مبرمج",
  "مدير",
  "موظف حكومي",
  "صيدلي",
  "محامي",
  "مصمم",
];
const occupationsFemale = [
  "معلمة",
  "طبيبة",
  "صيدلانية",
  "محاسبة",
  "مصممة",
  "موظفة",
  "ممرضة",
  "مهندسة",
  "محامية",
  "إدارية",
];

export function generateFakeRegistrationData(
  gender?: "m" | "f",
): RegistrationData {
  const selectedGender = gender || (Math.random() > 0.5 ? "m" : "f");
  const isMale = selectedGender === "m";

  const firstName = isMale
    ? arabicFirstNamesMale[
        Math.floor(Math.random() * arabicFirstNamesMale.length)
      ] || "Ahmed"
    : arabicFirstNamesFemale[
        Math.floor(Math.random() * arabicFirstNamesFemale.length)
      ] || "Fatima";
  const lastName =
    arabicLastNames[Math.floor(Math.random() * arabicLastNames.length)] ||
    "Al-Saud";
  const age = Math.floor(Math.random() * (45 - 22 + 1)) + 22;
  const city =
    saudiCities[Math.floor(Math.random() * saudiCities.length)] || "الرياض";

  function getRandomString(length: number) {
    let result = "";
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < length; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length),
      );
    }
    return result;
  }

  function getRandomElements<T>(array: T[], min: number, max: number): T[] {
    const count = Math.floor(Math.random() * (max - min + 1)) + min;
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  function getRandomBoolean(chance: number): boolean {
    return Math.random() < chance;
  }

  const selectedInterests = getRandomElements(
    ["القراءة", "السفر", "الرياضة", "الطبخ", "التصوير", "البرمجة"],
    2,
    4,
  ).join("، ");

  const baseData: RegistrationData = {
    email: `user${getRandomString(8)}@gmail.com`,
    password: "TestPass123!",
    confirmPassword: "TestPass123!",
    firstname: firstName,
    lastname: lastName,
    age,
    gender: selectedGender,
    phone: `+9665${Math.floor(10000000 + Math.random() * 90000000)}`,
    otpCode: "",
    country: "السعودية",
    city,
    nationality: "سعودي",
    maritalStatus: getRandomMaritalStatus(),
    religiousLevel: getRandomReligiousLevel(),
    isPrayerRegular: getRandomBoolean(0.8),
    areParentsAlive: getRandomParentsAlive(),
    parentRelationship: getRandomParentRelationship(),
    wantsChildren: getRandomWantsChildren(),
    height: Math.floor(
      Math.random() * (isMale ? 190 - 165 : 175 - 155) + (isMale ? 165 : 155),
    ),
    weight:
      Math.floor(
        Math.random() * ((isMale ? 95 : 75) - (isMale ? 60 : 50) + 1),
      ) + (isMale ? 60 : 50),
    appearance: getRandomAppearance(),
    skinColor: getRandomSkinColor(),
    bodyType: getRandomBodyType(),
    interests: selectedInterests,
    marriageGoals:
      "أسعى للزواج لتكوين أسرة مسلمة متماسكة على منهج أهل السنة والجماعة",
    personalityDescription: getRandomPersonalityDescription(),
    familyPlans: `أتمنى إنجاب ${Math.floor(Math.random() * 3) + 2} أطفال وتربيتهم على القيم الإسلامية`,
    relocationPlans: getRandomRelocationPlan(),
    preferences: {
      ageRange: {
        min: age - 5,
        max: age + 5,
      },
    },
    marriageTimeline: getRandomMarriageTimeline(),
    education: getRandomEducation(),
    occupation:
      (isMale
        ? occupations[Math.floor(Math.random() * occupations.length)]
        : occupationsFemale[
            Math.floor(Math.random() * occupationsFemale.length)
          ]) || "موظف",
    bio: `${firstName} ${lastName}، ${age} سنة، من ${city}. أبحث عن شريك حياة ملتزم بالدين والأخلاق.`,
    acceptDeclaration: true,
    // Add missing properties with default values
    hasBeard: false,
    isRegularAtMosque: false,
    smokes: false,
  };

  if (isMale) {
    return {
      ...baseData,
      hasBeard: getRandomBoolean(0.7),
      prayingLocation: getRandomPrayingLocation(),
      isRegularAtMosque: getRandomBoolean(0.6),
      smokes: getRandomBoolean(0.1),
      financialSituation: getRandomFinancialSituation(),
      housingLocation: city,
      housingOwnership: getRandomHousingOwnership(),
      housingType: getRandomHousingType(),
    };
  } else {
    return {
      ...baseData,
      guardianName: getRandomGuardianName(),
      guardianPhone: `+9665${Math.floor(10000000 + Math.random() * 90000000)}`,
      guardianEmail: `guardian${getRandomString(5)}@gmail.com`,
      guardianRelationship: getRandomGuardianRelationship(),
      wearHijab: getRandomWearHijab(),
      wearNiqab: getRandomBoolean(0.3),
      clothingStyle: getRandomClothingStyle(),
      workAfterMarriage: getRandomWorkAfterMarriage(),
    };
  }
}
