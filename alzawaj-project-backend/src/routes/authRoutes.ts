import express, { Router } from "express";
import { body } from "express-validator";
import {
  register,
  login,
  refreshToken,
  logout,
  logoutAll,
  sendEmailVerification,
  verifyEmail,
  sendPhoneVerification,
  verifyPhone,
  forgotPassword,
  resetPassword,
  changePassword,
  getMe,
  devConfirmEmail,
  devConfirmPhone,
} from "../controllers/authController";
import { validateRequest } from "../middleware/validationMiddleware";
import { protect, protectAllowingPending } from "../middleware/authMiddleware";
import { rateLimitConfig } from "../config/rateLimiting";
import multer from "multer";

// Configure multer for registration photo upload
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  }
});

// Middleware to parse JSON fields from FormData
const parseFormData = (req: any, res: any, next: any) => {
  if (req.body.basicInfo && typeof req.body.basicInfo === 'string') {
    req.body.basicInfo = JSON.parse(req.body.basicInfo);
  }
  if (req.body.location && typeof req.body.location === 'string') {
    req.body.location = JSON.parse(req.body.location);
  }
  if (req.body.education && typeof req.body.education === 'string') {
    req.body.education = JSON.parse(req.body.education);
  }
  if (req.body.professional && typeof req.body.professional === 'string') {
    req.body.professional = JSON.parse(req.body.professional);
  }
  if (req.body.religiousInfo && typeof req.body.religiousInfo === 'string') {
    req.body.religiousInfo = JSON.parse(req.body.religiousInfo);
  }
  if (req.body.personalInfo && typeof req.body.personalInfo === 'string') {
    req.body.personalInfo = JSON.parse(req.body.personalInfo);
  }
  if (req.body.familyInfo && typeof req.body.familyInfo === 'string') {
    req.body.familyInfo = JSON.parse(req.body.familyInfo);
  }
  if (req.body.lifestyle && typeof req.body.lifestyle === 'string') {
    req.body.lifestyle = JSON.parse(req.body.lifestyle);
  }
  if (req.body.preferences && typeof req.body.preferences === 'string') {
    req.body.preferences = JSON.parse(req.body.preferences);
  }
  if (req.body.privacy && typeof req.body.privacy === 'string') {
    req.body.privacy = JSON.parse(req.body.privacy);
  }
  next();
};

const router: Router = express.Router();

// Development validation (only for development environment)
const devValidation = [
  body("userId").notEmpty().withMessage("معرف المستخدم مطلوب"),
];

// Registration validation
const registerValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("البريد الإلكتروني غير صحيح"),
  body("phone")
    .matches(/^\+[1-9]\d{1,14}$/)
    .withMessage("رقم الهاتف غير صحيح"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("كلمة المرور يجب أن تكون 8 أحرف على الأقل")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("كلمة المرور يجب أن تحتوي على حرف كبير وصغير ورقم"),
  body("confirmPassword").notEmpty().withMessage("تأكيد كلمة المرور مطلوب"),
  body("gender").isIn(["m", "f"]).withMessage("الجنس يجب أن يكون m أو f"),
  body("basicInfo.name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("الاسم يجب أن يكون بين 2-100 حرف"),
  body("basicInfo.age")
    .isInt({ min: 18, max: 100 })
    .withMessage("العمر يجب أن يكون بين 18-100 سنة"),

  // Location fields validation
  body("location.country")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("البلد مطلوب"),
  body("location.city")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("المدينة مطلوبة"),
  body("location.nationality")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("الجنسية مطلوبة"),

  // Gender-specific validations for males
  body("basicInfo.hasBeard")
    .if(body("gender").equals("m"))
    .isBoolean()
    .withMessage("حالة اللحية مطلوبة للذكور"),
  body("basicInfo.financialSituation")
    .if(body("gender").equals("m"))
    .isIn(["excellent", "good", "average", "struggling"])
    .withMessage("الحالة المالية مطلوبة للذكور"),
  body("basicInfo.housingOwnership")
    .if(body("gender").equals("m"))
    .isIn(["owned", "rented", "family-owned"])
    .withMessage("نوع السكن مطلوب للذكور"),

  // Gender-specific validations for females
  body("basicInfo.guardianName")
    .if(body("gender").equals("f"))
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("اسم الولي مطلوب للإناث"),
  body("basicInfo.guardianPhone")
    .if(body("gender").equals("f"))
    .matches(/^\+[1-9]\d{1,14}$/)
    .withMessage("رقم هاتف الولي غير صحيح"),
  body("basicInfo.guardianRelationship")
    .if(body("gender").equals("f"))
    .isIn(["father", "brother", "uncle", "other"])
    .withMessage("علاقة الولي غير صحيحة"),
  body("basicInfo.wearHijab")
    .if(body("gender").equals("f"))
    .isBoolean()
    .withMessage("حالة الحجاب مطلوبة للإناث"),
  body("basicInfo.wearNiqab")
    .if(body("gender").equals("f"))
    .isBoolean()
    .withMessage("حالة النقاب مطلوبة للإناث"),
];

// Login validation
const loginValidation = [
  body("username")
    .notEmpty()
    .withMessage("البريد الإلكتروني أو رقم الهاتف مطلوب"),
  body("password").notEmpty().withMessage("كلمة المرور مطلوبة"),
];

// Email verification validation
const emailVerificationValidation = [
  body("token").notEmpty().withMessage("رمز التحقق مطلوب"),
];

// Phone verification validation
const phoneVerificationValidation = [
  body("otp")
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage("رمز التحقق يجب أن يكون 6 أرقام"),
];

// Forgot password validation
const forgotPasswordValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("البريد الإلكتروني غير صحيح"),
];

// Reset password validation
const resetPasswordValidation = [
  body("token").notEmpty().withMessage("رمز إعادة التعيين مطلوب"),
  body("newPassword")
    .isLength({ min: 8 })
    .withMessage("كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("كلمة المرور يجب أن تحتوي على حرف كبير وصغير ورقم"),
];

// Change password validation
const changePasswordValidation = [
  body("currentPassword").notEmpty().withMessage("كلمة المرور الحالية مطلوبة"),
  body("newPassword")
    .isLength({ min: 8 })
    .withMessage("كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("كلمة المرور يجب أن تحتوي على حرف كبير وصغير ورقم"),
];

// Refresh token validation
const refreshTokenValidation = [
  body("refreshToken").notEmpty().withMessage("رمز التحديث مطلوب"),
];

// Routes

// Public routes
router.post(
  "/register",
  rateLimitConfig.auth,
  upload.single('profilePicture'),
  parseFormData,
  registerValidation,
  validateRequest,
  register,
);

router.post(
  "/login",
  rateLimitConfig.auth,
  loginValidation,
  validateRequest,
  login,
);

router.post(
  "/refresh-token",
  refreshTokenValidation,
  validateRequest,
  refreshToken,
);

router.post(
  "/verify-email",
  emailVerificationValidation,
  validateRequest,
  verifyEmail,
);

router.post(
  "/forgot-password",
  rateLimitConfig.auth,
  forgotPasswordValidation,
  validateRequest,
  forgotPassword,
);

router.post(
  "/reset-password",
  rateLimitConfig.auth,
  resetPasswordValidation,
  validateRequest,
  resetPassword,
);

// Protected routes
router.post("/logout", protect, logout);

router.post("/logout-all", protect, logoutAll);

router.post(
  "/send-email-verification",
  protect,
  rateLimitConfig.auth,
  sendEmailVerification,
);

router.post(
  "/send-phone-verification",
  protect,
  rateLimitConfig.auth,
  sendPhoneVerification,
);

router.post(
  "/verify-phone",
  protect,
  phoneVerificationValidation,
  validateRequest,
  verifyPhone,
);

router.post(
  "/change-password",
  protect,
  changePasswordValidation,
  validateRequest,
  changePassword,
);

router.get("/me", protectAllowingPending, getMe);

// Development routes (only available in development and staging environments)
if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "staging") {
  router.post("/dev-confirm-email", devValidation, validateRequest, devConfirmEmail);
  router.post("/dev-confirm-phone", devValidation, validateRequest, devConfirmPhone);
}

export default router;
