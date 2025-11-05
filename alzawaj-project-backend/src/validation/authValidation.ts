import { body, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";

/**
 * Registration validation rules
 */
export const validateRegistration = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("البريد الإلكتروني غير صحيح"),

  body("phone")
    .isMobilePhone(["ar-SA", "ar-EG", "ar-AE"])
    .withMessage("رقم الهاتف غير صحيح"),

  body("password")
    .isLength({ min: 8 })
    .withMessage("كلمة المرور يجب أن تكون 8 أحرف على الأقل")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage("كلمة المرور يجب أن تحتوي على حرف كبير وصغير ورقم ورمز خاص"),

  body("firstname")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("الاسم الأول يجب أن يكون بين 2 و 50 حرف")
    .matches(/^[أ-يا-ياA-Za-z\s]+$/)
    .withMessage("الاسم الأول يجب أن يحتوي على أحرف فقط"),

  body("lastname")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("اسم العائلة يجب أن يكون بين 2 و 50 حرف")
    .matches(/^[أ-يا-ياA-Za-z\s]+$/)
    .withMessage("اسم العائلة يجب أن يحتوي على أحرف فقط"),

  body("gender").isIn(["m", "f"]).withMessage("الجنس يجب أن يكون ذكر أو أنثى"),

  body("age")
    .isInt({ min: 18, max: 80 })
    .withMessage("العمر يجب أن يكون بين 18 و 80 سنة"),

  body("terms").equals("true").withMessage("يجب الموافقة على الشروط والأحكام"),
];

/**
 * Login validation rules
 */
export const validateLogin = [
  body("identifier")
    .notEmpty()
    .withMessage("البريد الإلكتروني أو رقم الهاتف مطلوب"),

  body("password").notEmpty().withMessage("كلمة المرور مطلوبة"),
];

/**
 * Email verification validation
 */
export const validateEmailVerification = [
  body("token")
    .notEmpty()
    .withMessage("رمز التحقق مطلوب")
    .isLength({ min: 10 })
    .withMessage("رمز التحقق غير صحيح"),
];

/**
 * Phone verification validation
 */
export const validatePhoneVerification = [
  body("otp")
    .isLength({ min: 6, max: 6 })
    .withMessage("كود التحقق يجب أن يكون 6 أرقام")
    .isNumeric()
    .withMessage("كود التحقق يجب أن يحتوي على أرقام فقط"),
];

/**
 * Password reset request validation
 */
export const validatePasswordResetRequest = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("البريد الإلكتروني غير صحيح"),
];

/**
 * Password reset validation
 */
export const validatePasswordReset = [
  body("token").notEmpty().withMessage("رمز التحقق مطلوب"),

  body("password")
    .isLength({ min: 8 })
    .withMessage("كلمة المرور يجب أن تكون 8 أحرف على الأقل")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage("كلمة المرور يجب أن تحتوي على حرف كبير وصغير ورقم ورمز خاص"),

  body("confirmPassword").custom((value: any, { req }: { req: any }) => {
    if (value !== req.body.password) {
      throw new Error("تأكيد كلمة المرور غير متطابق");
    }
    return true;
  }),
];

/**
 * Change password validation
 */
export const validateChangePassword = [
  body("currentPassword").notEmpty().withMessage("كلمة المرور الحالية مطلوبة"),

  body("newPassword")
    .isLength({ min: 8 })
    .withMessage("كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(
      "كلمة المرور الجديدة يجب أن تحتوي على حرف كبير وصغير ورقم ورمز خاص",
    ),

  body("confirmNewPassword").custom((value: any, { req }: { req: any }) => {
    if (value !== req.body.newPassword) {
      throw new Error("تأكيد كلمة المرور الجديدة غير متطابق");
    }
    return true;
  }),
];

/**
 * Refresh token validation
 */
export const validateRefreshToken = [
  body("refreshToken").notEmpty().withMessage("رمز التحديث مطلوب"),
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
  validateRegistration,
  validateLogin,
  validateEmailVerification,
  validatePhoneVerification,
  validatePasswordResetRequest,
  validatePasswordReset,
  validateChangePassword,
  validateRefreshToken,
  handleValidationErrors,
};
