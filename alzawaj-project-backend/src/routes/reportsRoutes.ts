import express, { Router } from "express";
import { body } from "express-validator";
import { validateRequest } from "../middleware/validationMiddleware";
import { protect } from "../middleware/authMiddleware";
import * as reportsController from "../controllers/reportsController";

const router: Router = express.Router();

// Validation rules
const submitReportValidation = [
  body("reason")
    .isIn([
      "inappropriate-content",
      "harassment",
      "fake-profile",
      "spam",
      "abusive-language",
      "religious-violations",
      "scam",
      "other",
    ])
    .withMessage("سبب الإبلاغ غير صحيح"),
  body("description")
    .optional()
    .isString()
    .isLength({ max: 1000 })
    .withMessage("وصف البلاغ يجب أن يكون أقل من 1000 حرف"),
  body("reportedUserId")
    .optional()
    .isMongoId()
    .withMessage("معرف المستخدم غير صحيح"),
  body("reportedProfileId")
    .optional()
    .isMongoId()
    .withMessage("معرف الملف الشخصي غير صحيح"),
  body("reportedMessageId")
    .optional()
    .isMongoId()
    .withMessage("معرف الرسالة غير صحيح"),
  body("reportedChatRoomId")
    .optional()
    .isMongoId()
    .withMessage("معرف غرفة الدردشة غير صحيح"),
];

// Routes

// Submit a new report
// @ts-ignore
router.post("/", protect, submitReportValidation, validateRequest, reportsController.submitReport);

// Get current user's reports
// @ts-ignore
router.get("/my", protect, reportsController.getMyReports);

// Admin routes
// Get all reports (admin only)
// @ts-ignore
router.get("/", protect, reportsController.getAllReports);

// Get report statistics (admin only)
// @ts-ignore
router.get("/stats", protect, reportsController.getReportStats);

export default router;
