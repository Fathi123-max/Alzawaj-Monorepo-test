import express, { Router } from "express";
import { param, query } from "express-validator";
import { validateRequest } from "../middleware/validationMiddleware";
import { protect } from "../middleware/authMiddleware";
import * as notificationController from "../controllers/notificationController";

const router: Router = express.Router();

// Validation rules
const getNotificationsValidation = [
  query("page").optional().isInt({ min: 1 }).withMessage("رقم الصفحة يجب أن يكون رقمًا موجبًا"),
  query("limit").optional().isInt({ min: 1, max: 50 }).withMessage("الحد يجب أن يكون بين 1-50"),
];

const markAsReadValidation = [
  param("notificationId").isMongoId().withMessage("معرف الإشعار غير صحيح"),
];

// Routes

// Get notifications
router.get("/", protect, getNotificationsValidation, validateRequest, notificationController.getNotifications);

// Mark notification as read
router.patch("/:notificationId/read", protect, markAsReadValidation, validateRequest, notificationController.markAsRead);

// Mark all notifications as read
router.patch("/read", protect, notificationController.markAllAsRead);

// Get unread count
router.get("/unread-count", protect, notificationController.getUnreadCount);

// Delete notification
router.delete("/:notificationId", protect, notificationController.deleteNotification);

export default router;