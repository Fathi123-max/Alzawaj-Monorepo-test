import { body, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";

/**
 * Basic profile information validation
 */
export const validateBasicInfo = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("الاسم يجب أن يكون بين 2 و 100 حرف")
    .matches(/^[أ-يا-ياA-Za-z\s]+$/)
    .withMessage("الاسم يجب أن يحتوي على أحرف فقط"),

  body("age")
    .isInt({ min: 18, max: 80 })
    .withMessage("العمر يجب أن يكون بين 18 و 80 سنة"),

  body("gender").isIn(["m", "f"]).withMessage("الجنس يجب أن يكون m أو f"),

  body("country")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("البلد مطلوب"),

  body("city")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("المدينة مطلوبة"),

  body("nationality")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("الجنسية مطلوبة"),

  body("maritalStatus")
    .isIn(["single", "divorced", "widowed"])
    .withMessage("الحالة الاجتماعية يجب أن تكون single أو divorced أو widowed"),
];

/**
 * Personal information validation
 */
export const validatePersonalInfo = [
  body("height")
    .optional()
    .isFloat({ min: 140, max: 220 })
    .withMessage("الطول يجب أن يكون بين 140 و 220 سم"),

  body("weight")
    .optional()
    .isFloat({ min: 40, max: 200 })
    .withMessage("الوزن يجب أن يكون بين 40 و 200 كيلو"),

  body("appearance")
    .optional()
    .isIn(["very-attractive", "attractive", "average", "simple"])
    .withMessage("الشكل يجب أن يكون من الخيارات المتاحة"),

  body("skinColor")
    .optional()
    .isIn(["fair", "medium", "olive", "dark"])
    .withMessage("لون البشرة يجب أن يكون من الخيارات المتاحة"),

  body("bodyType")
    .optional()
    .isIn(["slim", "average", "athletic", "heavy"])
    .withMessage("نوع الجسم يجب أن يكون من الخيارات المتاحة"),

  body("bio")
    .optional()
    .isLength({ max: 1000 })
    .withMessage("النبذة الشخصية يجب أن تكون أقل من 1000 حرف"),
];

/**
 * Religious information validation
 */
export const validateReligiousInfo = [
  body("religiousLevel")
    .isIn(["basic", "practicing", "very-religious", "moderate"])
    .withMessage("مستوى التدين يجب أن يكون من الخيارات المتاحة"),

  body("isPrayerRegular")
    .isBoolean()
    .withMessage("انتظام الصلاة يجب أن يكون true أو false"),

  body("smokingStatus")
    .optional()
    .isIn(["never", "quit", "occasionally", "regularly"])
    .withMessage("حالة التدخين يجب أن تكون من الخيارات المتاحة"),
];

/**
 * Education and work validation
 */
export const validateEducationWork = [
  body("education")
    .optional()
    .isIn([
      "primary",
      "secondary",
      "high-school",
      "diploma",
      "bachelor",
      "master",
      "doctorate",
      "other",
    ])
    .withMessage("مستوى التعليم يجب أن يكون من الخيارات المتاحة"),

  body("occupation")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("المهنة يجب أن تكون أقل من 100 حرف"),
];

/**
 * Male-specific validation
 */
export const validateMaleSpecific = [
  body("hasBeard")
    .optional()
    .isBoolean()
    .withMessage("وجود اللحية يجب أن يكون true أو false"),

  body("financialSituation")
    .optional()
    .isIn(["excellent", "good", "average", "struggling"])
    .withMessage("الوضع المالي يجب أن يكون من الخيارات المتاحة"),

  body("monthlyIncome")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("الراتب الشهري يجب أن يكون رقم موجب"),

  body("housingOwnership")
    .optional()
    .isIn(["owned", "rented", "family-owned"])
    .withMessage("ملكية السكن يجب أن تكون من الخيارات المتاحة"),
];

/**
 * Female-specific validation
 */
export const validateFemaleSpecific = [
  body("guardianName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("اسم ولي الأمر يجب أن يكون بين 2 و 100 حرف"),

  body("guardianPhone")
    .optional()
    .isMobilePhone(["ar-SA", "ar-EG", "ar-AE"])
    .withMessage("رقم هاتف ولي الأمر غير صحيح"),

  body("guardianEmail")
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage("بريد ولي الأمر الإلكتروني غير صحيح"),

  body("guardianRelationship")
    .optional()
    .isIn(["father", "brother", "uncle", "other"])
    .withMessage("صلة القرابة مع ولي الأمر يجب أن تكون من الخيارات المتاحة"),

  body("wearHijab")
    .optional()
    .isBoolean()
    .withMessage("ارتداء الحجاب يجب أن يكون true أو false"),

  body("wearNiqab")
    .optional()
    .isBoolean()
    .withMessage("ارتداء النقاب يجب أن يكون true أو false"),

  body("workAfterMarriage")
    .optional()
    .isIn(["yes", "no", "undecided"])
    .withMessage("العمل بعد الزواج يجب أن يكون من الخيارات المتاحة"),
];

/**
 * Marriage preferences validation
 */
export const validatePreferences = [
  body("preferences.ageRange.min")
    .optional()
    .isInt({ min: 18, max: 80 })
    .withMessage("الحد الأدنى للعمر يجب أن يكون بين 18 و 80"),

  body("preferences.ageRange.max")
    .optional()
    .isInt({ min: 18, max: 80 })
    .withMessage("الحد الأقصى للعمر يجب أن يكون بين 18 و 80")
    .custom((value: any, { req }: { req: any }) => {
      if (
        req.body.preferences?.ageRange?.min &&
        value < req.body.preferences.ageRange.min
      ) {
        throw new Error("الحد الأقصى للعمر يجب أن يكون أكبر من الحد الأدنى");
      }
      return true;
    }),

  body("preferences.country")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("البلد المفضل غير صحيح"),

  body("preferences.cities")
    .optional()
    .isArray()
    .withMessage("المدن المفضلة يجب أن تكون مصفوفة"),

  body("preferences.heightRange.min")
    .optional()
    .isFloat({ min: 140, max: 220 })
    .withMessage("الحد الأدنى للطول يجب أن يكون بين 140 و 220"),

  body("preferences.heightRange.max")
    .optional()
    .isFloat({ min: 140, max: 220 })
    .withMessage("الحد الأقصى للطول يجب أن يكون بين 140 و 220"),
];

/**
 * Privacy settings validation
 */
export const validatePrivacySettings = [
  body("privacySettings.showProfilePicture")
    .optional()
    .isIn(["everyone", "matches-only", "none"])
    .withMessage("إعداد عرض الصورة الشخصية يجب أن يكون من الخيارات المتاحة"),

  body("privacySettings.showAge")
    .optional()
    .isBoolean()
    .withMessage("إعداد عرض العمر يجب أن يكون true أو false"),

  body("privacySettings.showLocation")
    .optional()
    .isBoolean()
    .withMessage("إعداد عرض الموقع يجب أن يكون true أو false"),

  body("privacySettings.profileVisibility")
    .optional()
    .isIn([
      "everyone",
      "verified-only",
      "premium-only",
      "guardian-approved",
      "matches-only",
    ])
    .withMessage("إعداد رؤية الملف الشخصي يجب أن يكون من الخيارات المتاحة"),
];

/**
 * Middleware to handle validation errors
 */
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction,
): Response | void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error: any) => error.msg);

    return res.status(422).json({
      success: false,
      message: "خطأ في البيانات المُدخلة",
      errors: errorMessages,
    });
  }

  next();
};

export default {
  validateBasicInfo,
  validatePersonalInfo,
  validateReligiousInfo,
  validateEducationWork,
  validateMaleSpecific,
  validateFemaleSpecific,
  validatePreferences,
  validatePrivacySettings,
  handleValidationErrors,
};
