/**
 * Nationalities data for the Islamic marriage platform
 * Simulates backend data for nationality selection
 */

export interface Nationality {
  value: string;
  label: string;
  group: string;
}

export const nationalities: Nationality[] = [
  // Arab Gulf Countries
  { value: "سعودي", label: "سعودي/ة", group: "الخليج العربي" },
  { value: "إماراتي", label: "إماراتي/ة", group: "الخليج العربي" },
  { value: "كويتي", label: "كويتي/ة", group: "الخليج العربي" },
  { value: "قطري", label: "قطري/ة", group: "الخليج العربي" },
  { value: "بحريني", label: "بحريني/ة", group: "الخليج العربي" },
  { value: "عماني", label: "عماني/ة", group: "الخليج العربي" },

  // Arab Levant Countries
  { value: "سوري", label: "سوري/ة", group: "بلاد الشام" },
  { value: "لبناني", label: "لبناني/ة", group: "بلاد الشام" },
  { value: "أردني", label: "أردني/ة", group: "بلاد الشام" },
  { value: "فلسطيني", label: "فلسطيني/ة", group: "بلاد الشام" },

  // North African Countries
  { value: "مصري", label: "مصري/ة", group: "شمال أفريقيا" },
  { value: "ليبي", label: "ليبي/ة", group: "شمال أفريقيا" },
  { value: "تونسي", label: "تونسي/ة", group: "شمال أفريقيا" },
  { value: "جزائري", label: "جزائري/ة", group: "شمال أفريقيا" },
  { value: "مغربي", label: "مغربي/ة", group: "شمال أفريقيا" },
  { value: "سوداني", label: "سوداني/ة", group: "شمال أفريقيا" },

  // Other Arab Countries
  { value: "عراقي", label: "عراقي/ة", group: "دول عربية أخرى" },
  { value: "يمني", label: "يمني/ة", group: "دول عربية أخرى" },
  { value: "صومالي", label: "صومالي/ة", group: "دول عربية أخرى" },
  { value: "جيبوتي", label: "جيبوتي/ة", group: "دول عربية أخرى" },
  { value: "موريتاني", label: "موريتاني/ة", group: "دول عربية أخرى" },
  { value: "قمري", label: "قمري/ة", group: "دول عربية أخرى" },

  // Muslim-Majority Countries
  { value: "تركي", label: "تركي/ة", group: "دول إسلامية" },
  { value: "إيراني", label: "إيراني/ة", group: "دول إسلامية" },
  { value: "باكستاني", label: "باكستاني/ة", group: "دول إسلامية" },
  { value: "بنغلاديشي", label: "بنغلاديشي/ة", group: "دول إسلامية" },
  { value: "إندونيسي", label: "إندونيسي/ة", group: "دول إسلامية" },
  { value: "ماليزي", label: "ماليزي/ة", group: "دول إسلامية" },
  { value: "أفغاني", label: "أفغاني/ة", group: "دول إسلامية" },
  { value: "موزمبيقي", label: "موزمبيقي/ة", group: "دول إسلامية" },
  { value: "نيجيري", label: "نيجيري/ة", group: "دول إسلامية" },
  { value: "مالي", label: "مالي/ة", group: "دول إسلامية" },
  { value: "نيجري", label: "نيجري/ة", group: "دول إسلامية" },
  { value: "تشادي", label: "تشادي/ة", group: "دول إسلامية" },
  { value: "إريتري", label: "إريتري/ة", group: "دول إسلامية" },
  { value: "قمري", label: "قمري/ة", group: "دول إسلامية" },
  { value: "موريشي", label: "موريشي/ة", group: "دول إسلامية" },
  { value: "بروناي", label: "بروناي/ة", group: "دول إسلامية" },
  { value: "كازاخي", label: "كازاخي/ة", group: "دول إسلامية" },
  { value: "أوزبكي", label: "أوزبكي/ة", group: "دول إسلامية" },
  { value: "قيرغيزي", label: "قيرغيزي/ة", group: "دول إسلامية" },
  { value: "طاجيكي", label: "طاجيكي/ة", group: "دول إسلامية" },
  { value: "تركماني", label: "تركماني/ة", group: "دول إسلامية" },
  { value: "أذربيجاني", label: "أذربيجاني/ة", group: "دول إسلامية" },
  { value: "kosovar", label: "kosovar/ة", group: "دول إسلامية" },
  { value: "البوسني", label: "البوسني/ة", group: "دول إسلامية" },
  { value: "ألباني", label: "ألباني/ة", group: "دول إسلامية" },
  { value: "غيني", label: "غيني/ة", group: "دول إسلامية" },
  { value: "غيني بيساوي", label: "غيني بيساوي/ة", group: "دول إسلامية" },
  { value: "مقدوني", label: "مقدوني/ة", group: "دول إسلامية" },

  // Western Countries
  { value: "أمريكي", label: "أمريكي/ة", group: "دول غربية" },
  { value: "كندي", label: "كندي/ة", group: "دول غربية" },
  { value: "بريطاني", label: "بريطاني/ة", group: "دول غربية" },
  { value: "فرنسي", label: "فرنسي/ة", group: "دول غربية" },
  { value: "ألماني", label: "ألماني/ة", group: "دول غربية" },
  { value: "إيطالي", label: "إيطالي/ة", group: "دول غربية" },
  { value: "إسباني", label: "إسباني/ة", group: "دول غربية" },
  { value: "هولندي", label: "هولندي/ة", group: "دول غربية" },
  { value: "بلجيكي", label: "بلجيكي/ة", group: "دول غربية" },
  { value: "سويسري", label: "سويسري/ة", group: "دول غربية" },
  { value: "نمساوي", label: "نمساوي/ة", group: "دول غربية" },
  { value: "سويدي", label: "سويدي/ة", group: "دول غربية" },
  { value: "دنماركي", label: "دنماركي/ة", group: "دول غربية" },
  { value: "نرويجي", label: "نرويجي/ة", group: "دول غربية" },
  { value: "أسترالي", label: "أسترالي/ة", group: "دول غربية" },
  { value: "نيوزيلندي", label: "نيوزيلندي/ة", group: "دول غربية" },
  { value: "أيرلندي", label: "أيرلندي/ة", group: "دول غربية" },
  { value: "برتغالي", label: "برتغالي/ة", group: "دول غربية" },
  { value: "يوناني", label: "يوناني/ة", group: "دول غربية" },
  { value: "تشيكي", label: "تشيكي/ة", group: "دول غربية" },
  { value: "بولندي", label: "بولندي/ة", group: "دول غربية" },
  { value: "مجري", label: "مجري/ة", group: "دول غربية" },
  { value: "روماني", label: "روماني/ة", group: "دول غربية" },
  { value: "بلغاري", label: "بلغاري/ة", group: "دول غربية" },
  { value: "سلوفاكي", label: "سلوفاكي/ة", group: "دول غربية" },
  { value: "سلوفيني", label: "سلوفيني/ة", group: "دول غربية" },
  { value: "كرواتي", label: "كرواتي/ة", group: "دول غربية" },
  { value: "إستوني", label: "إستوني/ة", group: "دول غربية" },
  { value: "لاتفيا", label: "لاتفيا/ة", group: "دول غربية" },
  { value: "ليتواني", label: "ليتواني/ة", group: "دول غربية" },
  { value: "مالطي", label: "مالطي/ة", group: "دول غربية" },
  { value: "قبرصي", label: "قبرصي/ة", group: "دول غربية" },
  { value: "لوكسمبورغي", label: "لوكسمبورغي/ة", group: "دول غربية" },
  { value: "سن ماريني", label: "سن ماريني/ة", group: "دول غربية" },
  { value: "موناكي", label: "موناكي/ة", group: "دول غربية" },
  { value: "أيسلندي", label: "أيسلندي/ة", group: "دول غربية" },
  { value: "أندوري", label: "أندوري/ة", group: "دول غربية" },

  // Asian Countries
  { value: "صيني", label: "صيني/ة", group: "دول آسيوية" },
  { value: "ياباني", label: "ياباني/ة", group: "دول آسيوية" },
  { value: "هندي", label: "هندي/ة", group: "دول آسيوية" },
  { value: "كوري جنوبي", label: "كوري جنوبي/ة", group: "دول آسيوية" },
  { value: "كوري شمالي", label: "كوري شمالي/ة", group: "دول آسيوية" },
  { value: "فيتنامي", label: "فيتنامي/ة", group: "دول آسيوية" },
  { value: "تايلاندي", label: "تايلاندي/ة", group: "دول آسيوية" },
  { value: "ميانماري", label: "ميانماري/ة", group: "دول آسيوية" },
  { value: "كمبودي", label: "كمبودي/ة", group: "دول آسيوية" },
  { value: "لاوسي", label: "لاوسي/ة", group: "دول آسيوية" },
  { value: "سنغافوري", label: "سنغافوري/ة", group: "دول آسيوية" },
  { value: "فلبيني", label: "فلبيني/ة", group: "دول آسيوية" },
  { value: "نيبالي", label: "نيبالي/ة", group: "دول آسيوية" },
  { value: "سريلانكي", label: "سريلانكي/ة", group: "دول آسيوية" },
  { value: "تايواني", label: "تايواني/ة", group: "دول آسيوية" },
  { value: "منغولي", label: "منغولي/ة", group: "دول آسيوية" },
  { value: "أرمني", label: "أرمني/ة", group: "دول آسيوية" },
  { value: "جورجي", label: "جورجي/ة", group: "دول آسيوية" },
  { value: "إسرائيلي", label: "إسرائيلي/ة", group: "دول آسيوية" },
  { value: "إيراني", label: "إيراني/ة", group: "دول آسيوية" },
  { value: "أفغاني", label: "أفغاني/ة", group: "دول آسيوية" },
  { value: "باكستاني", label: "باكستاني/ة", group: "دول آسيوية" },
  { value: "كازاخي", label: "كازاخي/ة", group: "دول آسيوية" },
  { value: "أوزبكي", label: "أوزبكي/ة", group: "دول آسيوية" },
  { value: "قيرغيزي", label: "قيرغيزي/ة", group: "دول آسيوية" },
  { value: "طاجيكي", label: "طاجيكي/ة", group: "دول آسيوية" },
  { value: "تركماني", label: "تركماني/ة", group: "دول آسيوية" },

  // African Countries
  { value: "إثيوبي", label: "إثيوبي/ة", group: "دول أفريقية" },
  { value: "إريتري", label: "إريتري/ة", group: "دول أفريقية" },
  { value: "كيني", label: "كيني/ة", group: "دول أفريقية" },
  { value: "أوغندي", label: "أوغندي/ة", group: "دول أفريقية" },
  { value: "تنزاني", label: "تنزاني/ة", group: "دول أفريقية" },
  { value: "رواندي", label: "رواندي/ة", group: "دول أفريقية" },
  { value: "بروندي", label: "بروندي/ة", group: "دول أفريقية" },
  { value: "كونغولي", label: "كونغولي/ة", group: "دول أفريقية" },
  { value: "أنغولي", label: "أنغولي/ة", group: "دول أفريقية" },
  { value: "زامبي", label: "زامبي/ة", group: "دول أفريقية" },
  { value: "زيمبابوي", label: "زيمبابوي/ة", group: "دول أفريقية" },
  { value: "ملاوي", label: "ملاوي/ة", group: "دول أفريقية" },
  { value: "موزمبيقي", label: "موزمبيقي/ة", group: "دول أفريقية" },
  { value: "مدغشقري", label: "مدغشقري/ة", group: "دول أفريقية" },
  { value: "موريشي", label: "موريشي/ة", group: "دول أفريقية" },
  { value: "سيشيلي", label: "سيشيلي/ة", group: "دول أفريقية" },
  { value: "سنغالي", label: "سنغالي/ة", group: "دول أفريقية" },
  { value: "مالي", label: "مالي/ة", group: "دول أفريقية" },
  { value: "موريتاني", label: "موريتاني/ة", group: "دول أفريقية" },
  { value: "نيجري", label: "نيجري/ة", group: "دول أفريقية" },
  { value: "نيجيري", label: "نيجيري/ة", group: "دول أفريقية" },
  { value: "تشادي", label: "تشادي/ة", group: "دول أفريقية" },
  { value: "إفريقي وسطي", label: "إفريقي وسطي/ة", group: "دول أفريقية" },
  { value: "كاميروني", label: "كاميروني/ة", group: "دول أفريقية" },
  { value: "غيني استوائي", label: "غيني استوائي/ة", group: "دول أفريقية" },
  { value: "غابوني", label: "غابوني/ة", group: "دول أفريقية" },
  { value: "غاني", label: "غاني/ة", group: "دول أفريقية" },
  { value: " Ivorian", label: " Ivorian/ة", group: "دول أفريقية" },
  { value: "ليبيري", label: "ليبيري/ة", group: "دول أفريقية" },
  { value: "سيراليوني", label: "سيراليوني/ة", group: "دول أفريقية" },
  { value: "غيني", label: "غيني/ة", group: "دول أفريقية" },
  { value: "غيني بيساوي", label: "غيني بيساوي/ة", group: "دول أفريقية" },
  { value: "صومالي", label: "صومالي/ة", group: "دول أفريقية" },
  { value: "جيبوتي", label: "جيبوتي/ة", group: "دول أفريقية" },
  { value: "إثيوبي", label: "إثيوبي/ة", group: "دول أفريقية" },
  { value: "إريتري", label: "إريتري/ة", group: "دول أفريقية" },
  { value: "كيني", label: "كيني/ة", group: "دول أفريقية" },
  { value: "أوغندي", label: "أوغندي/ة", group: "دول أفريقية" },
  { value: "تنزاني", label: "تنزاني/ة", group: "دول أفريقية" },
  { value: "رواندي", label: "رواندي/ة", group: "دول أفريقية" },
  { value: "بروندي", label: "بروندي/ة", group: "دول أfricanية" },
  { value: "ملاوي", label: "ملاوي/ة", group: "دول أفريقية" },
  { value: "زامبي", label: "زامبي/ة", group: "دول أفريقية" },
  { value: "زيمبابوي", label: "زيمبابوي/ة", group: "دول أفريقية" },
  { value: "موزمبيقي", label: "موزمبيقي/ة", group: "دول أفريقية" },
  { value: "مدغشقري", label: "مدغشقري/ة", group: "دول أفريقية" },
  { value: "موريشي", label: "موريشي/ة", group: "دول أفريقية" },
  { value: "سيشيلي", label: "سيشيلي/ة", group: "دول أفريقية" },
  { value: "سنغالي", label: "سنغالي/ة", group: "دول أفريقية" },
  { value: "مالي", label: "مالي/ة", group: "دول أفريقية" },
  { value: "موريتاني", label: "موريتاني/ة", group: "دول أفريقية" },
  { value: "نيجري", label: "نيجري/ة", group: "دول أفريقية" },
  { value: "نيجيري", label: "نيجيري/ة", group: "دول أفريقية" },
  { value: "تشادي", label: "تشادي/ة", group: "دول أفريقية" },
  { value: "إفريقي وسطي", label: "إفريقي وسطي/ة", group: "دول أفريقية" },
  { value: "كاميروني", label: "كاميروني/ة", group: "دول أفريقية" },
  { value: "غيني استوائي", label: "غيني استوائي/ة", group: "دول أفريقية" },
  { value: "غابوني", label: "غابوني/ة", group: "دول أفريقية" },
  { value: "غاني", label: "غاني/ة", group: "دول أفريقية" },
  { value: " Ivorian", label: " Ivorian/ة", group: "دول أفريقية" },
  { value: "ليبيري", label: "ليبيري/ة", group: "دول أفريقية" },
  { value: "سيراليوني", label: "سيراليوني/ة", group: "دول أفريقية" },
  { value: "غيني", label: "غيني/ة", group: "دول أفريقية" },
  { value: "غيني بيساوي", label: "غيني بيساوي/ة", group: "دول أفريقية" },
  { value: "صومالي", label: "صومالي/ة", group: "دول أفريقية" },
  { value: "جيبوتي", label: "جيبوتي/ة", group: "دول أفريقية" },
  { value: "إثيوبي", label: "إثيوبي/ة", group: "دول أفريقية" },
  { value: "إريتري", label: "إريتري/ة", group: "دول أفريقية" },
  { value: "كيني", label: "كيني/ة", group: "دول أفريقية" },
  { value: "أوغندي", label: "أوغندي/ة", group: "دول أfricanية" },
  { value: "تنزاني", label: "تنزاني/ة", group: "دول أفريقية" },
  { value: "رواندي", label: "رواندي/ة", group: "دول أفريقية" },
  { value: "بروندي", label: "بروندي/ة", group: "دول أفريقية" },
  { value: "ملاوي", label: "ملاوي/ة", group: "دول أفريقية" },
  { value: "زامبي", label: "زامبي/ة", group: "دول أفريقية" },
  { value: "زيمبابوي", label: "زيمبابوي/ة", group: "دول أفريقية" },
  { value: "موزمبيقي", label: "موزمبيقي/ة", group: "دول أفريقية" },
  { value: "مدغشقري", label: "مدغشقري/ة", group: "دول أفريقية" },
  { value: "موريشي", label: "موريشي/ة", group: "دول أفريقية" },
  { value: "سيشيلي", label: "سيشيلي/ة", group: "دول أفريقية" },
  { value: "سنغالي", label: "سنغالي/ة", group: "دول أفريقية" },
  { value: "مالي", label: "مالي/ة", group: "دول أفريقية" },
  { value: "موريتاني", label: "موريتاني/ة", group: "دول أفريقية" },
  { value: "نيجري", label: "نيجري/ة", group: "دول أفريقية" },
  { value: "نيجيري", label: "نيجيري/ة", group: "دول أفريقية" },
  { value: "تشادي", label: "تشادي/ة", group: "دول أفريقية" },
  { value: "إفريقي وسطي", label: "إفريقي وسطي/ة", group: "دول أفريقية" },
  { value: "كاميروني", label: "كاميروني/ة", group: "دول أفريقية" },
  { value: "غيني استوائي", label: "غيني استوائي/ة", group: "دول أفريقية" },
  { value: "غابوني", label: "غابوني/ة", group: "دول أفريقية" },
  { value: "غاني", label: "غاني/ة", group: "دول أفريقية" },
  { value: " Ivorian", label: " Ivorian/ة", group: "دول أفريقية" },
  { value: "ليبيري", label: "ليبيري/ة", group: "دول أفريقية" },
  { value: "سيراليوني", label: "سيراليوني/ة", group: "دول أفريقية" },
  { value: "غيني", label: "غيني/ة", group: "دول أفريقية" },
  { value: "غيني بيساوي", label: "غيني بيساوي/ة", group: "دول أفريقية" },

  // South American Countries
  { value: "برازيلي", label: "برازيلي/ة", group: "دول أمريكية" },
  { value: "أرجنتيني", label: "أرجنتيني/ة", group: "دول أمريكية" },
  { value: "كولومبي", label: "كولومبي/ة", group: "دول أمريكية" },
  { value: "تشيلي", label: "تشيلي/ة", group: "دول أمريكية" },
  { value: "بيرو", label: "بيرو/ة", group: "دول أمريكية" },
  { value: "فنزويلي", label: "فنزويلي/ة", group: "دول أمريكية" },
  { value: "إكوادوري", label: "إكوادوري/ة", group: "دول أمريكية" },
  { value: "بوليفي", label: "بوليفي/ة", group: "دول أمريكية" },
  { value: "باراغواي", label: "باراغواي/ة", group: "دول أمريكية" },
  { value: "أوروغواي", label: "أوروغواي/ة", group: "دول أمريكية" },
  { value: "غياني", label: "غياني/ة", group: "دول أمريكية" },
  { value: "سورينامي", label: "سورينامي/ة", group: "دول أمريكية" },

  // Central American and Caribbean Countries
  { value: "مكسي", label: "مكسي/ة", group: "دول أمريكية" },
  { value: "غواتيمالي", label: "غواتيمالي/ة", group: "دول أمريكية" },
  { value: "كوبي", label: "كوبي/ة", group: "دول أمريكية" },
  { value: "هايتي", label: "هايتي/ة", group: "دول أمريكية" },
  { value: "دومينيكي", label: "دومينيكي/ة", group: "دول أمريكية" },
  { value: "جامايكي", label: "جامايكي/ة", group: "دول أمريكية" },
  { value: "ترينيدادي", label: "ترينيدادي/ة", group: "دول أمريكية" },
  { value: "بربادوسي", label: "بربادوسي/ة", group: "دول أمريكية" },
  { value: "أنتيغي", label: "أنتيغي/ة", group: "دول أمريكية" },
  { value: "كستي", label: "كستي/ة", group: "دول أمريكية" },
  { value: "لوسيان", label: "لوسيان/ة", group: "دول أمريكية" },
  { value: "غرينادي", label: "غرينادي/ة", group: "دول أمريكية" },
  { value: "فنسنتي", label: "فنسنتي/ة", group: "دول أمريكية" },
  { value: "دومينيكي", label: "دومينيكي/ة", group: "دول أمريكية" },
  { value: "بليزي", label: "بليزي/ة", group: "دول أمريكية" },
  { value: "سلفادوري", label: "سلفادوري/ة", group: "دول أمريكية" },
  { value: "هندوراسي", label: "هندوراسي/ة", group: "دول أمريكية" },
  { value: "نيكاراغوي", label: "نيكاراغوي/ة", group: "دول أمريكية" },
  { value: "كوستاريكي", label: "كوستاريكي/ة", group: "دول أمريكية" },
  { value: "بنمي", label: "بنمي/ة", group: "دول أمريكية" },

  // Oceania Countries
  { value: "أسترالي", label: "أسترالي/ة", group: "أوقيانوسيا" },
  { value: "نيوزيلندي", label: "نيوزيلندي/ة", group: "أوقيانوسيا" },
  { value: "فيجي", label: "فيجي/ة", group: "أوقيانوسيا" },
  { value: "بابوا غيني", label: "بابوا غيني/ة", group: "أوقيانوسيا" },
  { value: "فانواتو", label: "فانواتو/ة", group: "أوقيانوسيا" },
  { value: "ساموي", label: "ساموي/ة", group: "أوقيانوسيا" },
  { value: "توفالو", label: "توفالو/ة", group: "أوقيانوسيا" },
  { value: "كيريباتي", label: "كيريباتي/ة", group: "أوقيانوسيا" },
  { value: "ناوري", label: "ناوري/ة", group: "أوقيانوسيا" },
  { value: "سولوموني", label: "سولوموني/ة", group: "أوقيانوسيا" },
  { value: "ميكرونيزي", label: "ميكرونيزي/ة", group: "أوقيانوسيا" },
  { value: "بالاوي", label: "بالاوي/ة", group: "أوقيانوسيا" },
  { value: "مارشالي", label: "مارشالي/ة", group: "أوقيانوسيا" },
  { value: "كاليدوني", label: "كاليدوني/ة", group: "أوقيانوسيا" },
  { value: "تونغي", label: "تونغي/ة", group: "أوقيانوسيا" },
  { value: "تيموري", label: "تيموري/ة", group: "أوقيانوسيا" },

  // Other Countries
  { value: "أخرى", label: "أخرى", group: "دول أخرى" },
];

/**
 * Simulates fetching nationalities from backend
 * In a real app, this would be an API call
 */
export const fetchNationalities = async (): Promise<Nationality[]> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 350));
  return nationalities;
};

/**
 * Get nationalities grouped by region
 */
export const getNationalitiesByGroup = (): Record<string, Nationality[]> => {
  const grouped: Record<string, Nationality[]> = {};

  nationalities.forEach((nationality) => {
    const group = nationality.group;
    if (!grouped[group]) {
      grouped[group] = [];
    }
    grouped[group].push(nationality);
  });

  return grouped;
};

/**
 * Get nationality by value
 */
export const getNationalityByValue = (
  value: string,
): Nationality | undefined => {
  return nationalities.find((nationality) => nationality.value === value);
};
