import express, { Router, RequestHandler } from "express";
import { body, query, param } from "express-validator";
import { validateRequest } from "../middleware/validationMiddleware";
import { protect } from "../middleware/authMiddleware";
import { rateLimitConfig } from "../config/rateLimiting";
import * as profileController from "../controllers/profileController";
import multer from "multer";

// Configure multer for file uploads
const storage = multer.memoryStorage(); // Using memory storage
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 5 // Maximum number of files
  },
  fileFilter: (req, file, cb) => {
    // Accept only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  }
});

const router: Router = express.Router();

// Type assertion helper for controller functions
const asHandler = (fn: any) => fn;

// Validation rules
const updateProfileValidation = [
  body("basicInfo").optional().isObject(),
  body("location").optional().isObject(),
  body("education").optional().isObject(),
  body("professional").optional().isObject(),
  body("religiousInfo").optional().isObject(),
  body("personalInfo").optional().isObject(),
  body("preferences").optional().isObject(),
  body("privacy").optional().isObject(),
];

const updatePrivacySettingsValidation = [
  body("privacySettings").isObject().withMessage("إعدادات الخصوصية مطلوبة"),
];

const blockUserValidation = [
  body("userIdToBlock").isMongoId().withMessage("معرف المستخدم غير صحيح"),
];

const unblockUserValidation = [
  body("userIdToUnblock").isMongoId().withMessage("معرف المستخدم غير صحيح"),
];

const deleteProfileValidation = [
  body("confirmPassword").notEmpty().withMessage("كلمة المرور مطلوبة لتأكيد الحذف"),
];

const verifyProfileValidation = [
  body("verificationStatus").isIn(['verified', 'rejected']).withMessage("حالة التحقق غير صحيحة"),
  body("adminNotes").optional().isString().withMessage("ملاحظات المشرف يجب أن تكون نصاً")
];

// Routes

// Get current user's profile
// @ts-ignore
router.get("/", protect, profileController.getMyProfile);

// Update profile
// @ts-ignore
router.patch("/", protect, updateProfileValidation, validateRequest, profileController.updateProfile);

// Upload profile picture
// @ts-ignore
router.post("/picture", protect, rateLimitConfig.upload, upload.single('photo'), profileController.uploadProfilePicture);

// Delete profile picture (main picture)
// @ts-ignore
router.delete("/picture", protect, profileController.deleteProfilePicture);

// Upload additional photos
// @ts-ignore
router.post("/photos", protect, rateLimitConfig.upload, upload.array('photos', 5), profileController.uploadAdditionalPhotos);

// Delete additional photo
// @ts-ignore
router.delete("/photos/:photoUrl", protect, param('photoUrl').notEmpty().withMessage("رابط الصورة مطلوب"), validateRequest, profileController.deleteAdditionalPhoto);

// Delete photo by fileId
// @ts-ignore
router.delete("/photo/:fileId", protect, param('fileId').notEmpty().withMessage("معرف الصورة مطلوب"), validateRequest, profileController.deletePhoto);

// Get public profile by user ID
// @ts-ignore
router.get("/:profileId", protect, param('profileId').isMongoId().withMessage("معرف المستخدم غير صحيح"), validateRequest, profileController.getPublicProfile);

// Get all profiles with pagination
// @ts-ignore
router.get("/all", protect, profileController.getAllProfiles);

// Update privacy settings
// @ts-ignore
router.patch("/privacy", protect, updatePrivacySettingsValidation, validateRequest, profileController.updatePrivacySettings);

// Get profile completion status
// @ts-ignore
router.get("/completion", protect, profileController.getProfileCompletion);

// Get profile statistics
// @ts-ignore
router.get("/stats", protect, profileController.getProfileStats);

// Complete profile (mark as ready for search)
// @ts-ignore
router.post("/complete", protect, profileController.completeProfile);

// Block user
// @ts-ignore
router.post("/block", protect, blockUserValidation, validateRequest, profileController.blockUser);

// Unblock user
// @ts-ignore
router.post("/unblock", protect, unblockUserValidation, validateRequest, profileController.unblockUser);

// Get blocked users
// @ts-ignore
router.get("/blocked", protect, profileController.getBlockedUsers);

// Delete profile (soft delete)
// @ts-ignore
router.delete("/", protect, deleteProfileValidation, validateRequest, profileController.deleteProfile);

// Admin routes
// Verify profile (admin only)
// @ts-ignore
router.patch("/verify/:profileId", protect, param('profileId').isMongoId().withMessage("معرف الملف الشخصي غير صحيح"), verifyProfileValidation, validateRequest, profileController.verifyProfile);

export default router;