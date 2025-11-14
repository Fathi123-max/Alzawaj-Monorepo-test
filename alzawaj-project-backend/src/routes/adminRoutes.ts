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

const requestActionValidation = [
  param("requestId").isMongoId().withMessage("معرف طلب الزواج غير صحيح"),
  body("reason")
    .optional({ values: "falsy" })
    .isLength({ max: 500 })
    .withMessage("السبب لا يجب أن يتجاوز 500 حرف"),
];

const updateSettingsValidation = [
  body("messageLimits").optional().isObject(),
  body("chatSettings").optional().isObject(),
  body("moderationSettings").optional().isObject(),
  body("themeSettings").optional().isObject(),
];

const chatActionValidation = [
  param("chatRoomId").isMongoId().withMessage("معرف غرفة الدردشة غير صحيح"),
  body("days").optional().isInt({ min: 1, max: 30 }).withMessage("عدد الأيام يجب أن يكون بين 1-30"),
  body("reason").optional().isLength({ max: 500 }).withMessage("السبب لا يجب أن يتجاوز 500 حرف"),
];

const notificationActionValidation = [
  param("notificationId").isMongoId().withMessage("معرف الإشعار غير صحيح"),
];

const adminChatValidation = [
  param("userId").isMongoId().withMessage("معرف المستخدم غير صحيح"),
  body("content").optional().isLength({ max: 1000 }).withMessage("الرسالة لا يجب أن تتجاوز 1000 حرف"),
];

const adminMessageValidation = [
  param("chatRoomId").isMongoId().withMessage("معرف غرفة الدردشة غير صحيح"),
  body("content").isLength({ min: 1, max: 1000 }).withMessage("محتوى الرسالة مطلوب ويجب أن يكون بين 1-1000 حرف"),
];

const getChatMessagesValidation = [
  param("chatRoomId").isMongoId().withMessage("معرف غرفة الدردشة غير صحيح"),
  query("page").optional().isInt({ min: 1 }).withMessage("رقم الصفحة يجب أن يكون رقمًا موجبًا"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("الحد يجب أن يكون بين 1-100"),
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

// Approve marriage request
router.post(
  "/requests/:requestId/approve",
  protect,
  adminOnly,
  requestActionValidation,
  validateRequest,
  adminController.approveMarriageRequest
);

// Reject marriage request
router.post(
  "/requests/:requestId/reject",
  protect,
  adminOnly,
  requestActionValidation,
  validateRequest,
  adminController.rejectMarriageRequest
);

// Get active chat rooms
router.get(
  "/chats",
  protect,
  adminOnly,
  adminController.getActiveChats
);

// Get chat room details
router.get(
  "/chats/:chatRoomId",
  protect,
  adminOnly,
  adminController.getChatRoomDetails
);

// Get chat messages
router.get(
  "/chats/:chatRoomId/messages",
  protect,
  adminOnly,
  getChatMessagesValidation,
  validateRequest,
  adminController.getAdminChatMessages
);

// Send message to chat
router.post(
  "/chats/:chatRoomId/messages",
  protect,
  adminOnly,
  adminMessageValidation,
  validateRequest,
  adminController.sendAdminMessage
);

// Extend chat room
router.post(
  "/chats/:chatRoomId/extend",
  protect,
  adminOnly,
  chatActionValidation,
  validateRequest,
  adminController.extendChatRoom
);

// Close chat room
router.post(
  "/chats/:chatRoomId/close",
  protect,
  adminOnly,
  chatActionValidation,
  validateRequest,
  adminController.closeChatRoom
);

// Archive chat room
router.post(
  "/chats/:chatRoomId/archive",
  protect,
  adminOnly,
  chatActionValidation,
  validateRequest,
  adminController.archiveChatRoom
);

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

// Get admin notifications
router.get("/notifications", protect, adminOnly, adminController.getAdminNotifications);

// Get unread notification count
router.get("/notifications/unread-count", protect, adminOnly, adminController.getUnreadNotificationCount);

// Mark notification as read
router.patch("/notifications/:notificationId/read", protect, adminOnly, notificationActionValidation, validateRequest, adminController.markNotificationAsRead);

// Mark all notifications as read
router.patch("/notifications/read-all", protect, adminOnly, adminController.markAllNotificationsAsRead);

// Delete notification
router.delete("/notifications/:notificationId", protect, adminOnly, notificationActionValidation, validateRequest, adminController.deleteNotification);

// Get admin settings
router.get("/settings", protect, adminOnly, adminController.getAdminSettings);

// Update admin settings
router.put("/settings", protect, adminOnly, updateSettingsValidation, validateRequest, adminController.updateAdminSettings);

// Create or get chat with a user
router.post(
  "/chats/with-user/:userId",
  protect,
  adminOnly,
  adminChatValidation,
  validateRequest,
  adminController.createAdminChatWithUser
);

// Get messages in a chat room (admin can access all chats)
router.get(
  "/chats/:chatRoomId/messages",
  protect,
  adminOnly,
  adminController.getAdminChatMessages
);

// Send message to a chat room as admin
router.post(
  "/chats/:chatRoomId/messages",
  protect,
  adminOnly,
  adminMessageValidation,
  validateRequest,
  adminController.sendAdminMessage
);

export default router;