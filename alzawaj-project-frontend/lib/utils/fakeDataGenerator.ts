import { faker } from '@faker-js/faker';
import { RegistrationData } from '@/lib/types';

const arabicFirstNamesMale = ['أحمد', 'محمد', 'عبدالله', 'خالد', 'سعد', 'فهد', 'عمر', 'علي', 'حسن', 'يوسف'];
const arabicFirstNamesFemale = ['فاطمة', 'عائشة', 'خديجة', 'مريم', 'سارة', 'نورة', 'هند', 'ريم', 'لينا', 'دانة'];
const arabicLastNames = ['العتيبي', 'الدوسري', 'القحطاني', 'الشمري', 'المطيري', 'العنزي', 'الحربي', 'الزهراني', 'الغامدي', 'السهلي'];
const saudiCities = ['الرياض', 'جدة', 'مكة المكرمة', 'المدينة المنورة', 'الدمام', 'الخبر', 'الطائف', 'أبها', 'تبوك', 'بريدة'];
const occupations = ['مهندس', 'طبيب', 'معلم', 'محاسب', 'مبرمج', 'مدير', 'موظف حكومي', 'صيدلي', 'محامي', 'مصمم'];
const occupationsFemale = ['معلمة', 'طبيبة', 'صيدلانية', 'محاسبة', 'مصممة', 'موظفة', 'ممرضة', 'مهندسة', 'محامية', 'إدارية'];

export function generateFakeRegistrationData(gender?: 'm' | 'f'): RegistrationData {
  const selectedGender = gender || faker.helpers.arrayElement(['m', 'f'] as const);
  const isMale = selectedGender === 'm';
  
  const firstName = isMale 
    ? faker.helpers.arrayElement(arabicFirstNamesMale)
    : faker.helpers.arrayElement(arabicFirstNamesFemale);
  const lastName = faker.helpers.arrayElement(arabicLastNames);
  const age = faker.number.int({ min: 22, max: 45 });
  const city = faker.helpers.arrayElement(saudiCities);
  
  const baseData: RegistrationData = {
    email: faker.internet.email({ firstName: faker.string.alphanumeric(8) }),
    password: 'TestPass123!',
    confirmPassword: 'TestPass123!',
    firstname: firstName,
    lastname: lastName,
    age,
    gender: selectedGender,
    phone: `+9665${faker.string.numeric(8)}`,
    otpCode: '',
    country: 'السعودية',
    city,
    nationality: 'سعودي',
    maritalStatus: faker.helpers.arrayElement(['single', 'divorced', 'widowed']),
    religiousLevel: faker.helpers.arrayElement(['practicing', 'very-religious', 'moderate']),
    isPrayerRegular: faker.datatype.boolean(0.8),
    areParentsAlive: faker.helpers.arrayElement(['both', 'father', 'mother', 'none']),
    parentRelationship: faker.helpers.arrayElement(['excellent', 'good', 'average']),
    wantsChildren: faker.helpers.arrayElement(['yes', 'no', 'maybe']),
    height: faker.number.int({ min: isMale ? 165 : 155, max: isMale ? 190 : 175 }),
    weight: faker.number.int({ min: isMale ? 60 : 50, max: isMale ? 95 : 75 }),
    appearance: faker.helpers.arrayElement(['very-attractive', 'attractive', 'average']),
    skinColor: faker.helpers.arrayElement(['fair', 'medium', 'olive']),
    bodyType: faker.helpers.arrayElement(['slim', 'average', 'athletic']),
    interests: faker.helpers.arrayElements(['القراءة', 'السفر', 'الرياضة', 'الطبخ', 'التصوير', 'البرمجة'], { min: 2, max: 4 }).join('، '),
    marriageGoals: 'أسعى للزواج لتكوين أسرة مسلمة متماسكة على منهج أهل السنة والجماعة',
    personalityDescription: faker.helpers.arrayElement([
      'شخص هادئ ومتفهم، أحب الاستقرار والأسرة',
      'شخصية اجتماعية ومرحة، أحب التواصل مع الآخرين',
      'شخص طموح ومجتهد، أسعى لتحقيق أهدافي',
    ]),
    familyPlans: `أتمنى إنجاب ${faker.number.int({ min: 2, max: 4 })} أطفال وتربيتهم على القيم الإسلامية`,
    relocationPlans: faker.helpers.arrayElement(['مستعد للانتقال داخل المملكة', 'أفضل البقاء في مدينتي', 'مستعد للانتقال لأي مكان']),
    marriageTimeline: faker.helpers.arrayElement(['خلال 3-6 أشهر', 'خلال 6-12 شهر', 'خلال سنة']),
    preferences: {
      ageRange: { 
        min: age - 5, 
        max: age + 5 
      },
    },
    education: faker.helpers.arrayElement(['bachelor', 'master', 'phd', 'diploma']),
    occupation: isMale ? faker.helpers.arrayElement(occupations) : faker.helpers.arrayElement(occupationsFemale),
    bio: `${firstName} ${lastName}، ${age} سنة، من ${city}. أبحث عن شريك حياة ملتزم بالدين والأخلاق.`,
    acceptDeclaration: true,
  };

  if (isMale) {
    return {
      ...baseData,
      hasBeard: faker.datatype.boolean(0.7),
      prayingLocation: faker.helpers.arrayElement(['المسجد', 'البيت']),
      isRegularAtMosque: faker.datatype.boolean(0.6),
      smokes: faker.datatype.boolean(0.1),
      financialSituation: faker.helpers.arrayElement(['excellent', 'good', 'average']),
      housingLocation: city,
      housingOwnership: faker.helpers.arrayElement(['owned', 'rented', 'family-owned']),
      housingType: faker.helpers.arrayElement(['شقة', 'فيلا', 'دور']),
      monthlyIncome: faker.number.int({ min: 5000, max: 25000 }),
    };
  } else {
    return {
      ...baseData,
      guardianName: faker.helpers.arrayElement(['والدي', 'أخي', 'عمي']),
      guardianPhone: `+9665${faker.string.numeric(8)}`,
      guardianEmail: faker.internet.email(),
      guardianRelationship: faker.helpers.arrayElement(['father', 'brother', 'uncle']),
      wearHijab: faker.datatype.boolean(0.9),
      wearNiqab: faker.datatype.boolean(0.3),
      clothingStyle: faker.helpers.arrayElement(['niqab-full', 'hijab-abaya', 'hijab-modest']),
      workAfterMarriage: faker.helpers.arrayElement(['yes', 'no', 'maybe']),
    };
  }
}
