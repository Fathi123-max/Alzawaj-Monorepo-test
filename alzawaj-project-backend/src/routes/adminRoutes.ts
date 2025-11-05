import express, { Router } from "express";
import { body, param, query } from "express-validator";
import { validateRequest } from "../middleware/validationMiddleware";
import { protect, adminOnly } from "../middleware/authMiddleware";
import * as adminController from "../controllers/adminController";

const router: Router = express.Router();

// Validation rules
const getUsersValidation = [
  query("page").optional().isInt({ min: 1 }).withMessage("رقم الصفحة يجب أن يكون رقمًا موجبًا"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("الحد يجب أن يكون بين 1-100"),
];

const userActionValidation = [
  body("userId").isMongoId().withMessage("معرف المستخدم غير صحيح"),
  body("action").isIn(["suspend", "activate", "delete", "verify"]).withMessage("الإجراء غير صحيح"),
  body("reason").optional().isLength({ max: 500 }).withMessage("السبب لا يجب أن يتجاوز 500 حرف"),
];

const messageActionValidation = [
  param("messageId").isMongoId().withMessage("معرف الرسالة غير صحيح"),
  body("reason").optional().isLength({ max: 500 }).withMessage("السبب لا يجب أن يتجاوز 500 حرف"),
];

const reportActionValidation = [
  param("reportId").isMongoId().withMessage("معرف التقرير غير صحيح"),
  body("action").isIn(["assign", "resolve", "dismiss"]).withMessage("الإجراء غير صحيح"),
  body("notes").optional().isLength({ max: 1000 }).withMessage("الملاحظات لا يجب أن تتجاوز 1000 حرف"),
];

const updateSettingsValidation = [
  body("messageLimits").optional().isObject(),
  body("chatSettings").optional().isObject(),
  body("moderationSettings").optional().isObject(),
  body("themeSettings").optional().isObject(),
];

// Routes

// Get admin stats
router.get("/stats", protect, adminOnly, adminController.getAdminStats);

// Get users
router.get("/users", protect, adminOnly, getUsersValidation, validateRequest, adminController.getUsers);

// User actions
router.post("/users/action", protect, adminOnly, userActionValidation, validateRequest, adminController.userAction);

// Get marriage requests
router.get("/requests", protect, adminOnly, adminController.getMarriageRequests);

// Get pending messages
router.get("/messages/pending", protect, adminOnly, adminController.getPendingMessages);

// Approve message
router.post("/messages/:messageId/approve", protect, adminOnly, messageActionValidation, validateRequest, adminController.approveMessage);

// Reject message
router.post("/messages/:messageId/reject", protect, adminOnly, messageActionValidation, validateRequest, adminController.rejectMessage);

// Get reports
router.get("/reports", protect, adminOnly, adminController.getReports);

// Report actions
router.post("/reports/:reportId/action", protect, adminOnly, reportActionValidation, validateRequest, adminController.reportAction);

// Get admin settings
router.get("/settings", protect, adminOnly, adminController.getAdminSettings);

// Update admin settings
router.put("/settings", protect, adminOnly, updateSettingsValidation, validateRequest, adminController.updateAdminSettings);

export default router;