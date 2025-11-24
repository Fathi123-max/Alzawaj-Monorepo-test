import express, { Router } from "express";
import { body, param, query } from "express-validator";
import { validateRequest } from "../middleware/validationMiddleware";
import { protect } from "../middleware/authMiddleware";
import { rateLimitConfig } from "../config/rateLimiting";
import * as chatController from "../controllers/chatController";

const router: Router = express.Router();

// Validation rules
const sendMessageValidation = [
  body("chatRoomId").isMongoId().withMessage("معرف غرفة الدردشة غير صحيح"),
  body("content").notEmpty().withMessage("محتوى الرسالة مطلوب").isLength({ max: 1000 }).withMessage("محتوى الرسالة لا يجب أن يتجاوز 1000 حرف"),
];

const getMessagesValidation = [
  param("chatRoomId").isMongoId().withMessage("معرف غرفة الدردشة غير صحيح"),
  query("page").optional().isInt({ min: 1 }).withMessage("رقم الصفحة يجب أن يكون رقمًا موجبًا"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("الحد يجب أن يكون بين 1-100"),
];

const markAsReadValidation = [
  param("chatRoomId").isMongoId().withMessage("معرف غرفة الدردشة غير صحيح"),
];

const getOrCreateRoomByRequestIdValidation = [
  param("requestId").isMongoId().withMessage("معرف طلب الزواج غير صحيح"),
];

// Routes

// Get chat rooms
router.get("/rooms", protect, chatController.getChatRooms);

// Get single chat room by ID
router.get("/room/:chatRoomId", protect, chatController.getChatRoomById);

// Get or create chat room by marriage request ID
router.get("/room-by-request/:requestId", protect, getOrCreateRoomByRequestIdValidation, validateRequest, chatController.getOrCreateChatRoomByRequest);

// Get chat messages
router.get("/messages/:chatRoomId", protect, getMessagesValidation, validateRequest, chatController.getChatMessages);

// Send message
router.post(
  "/send",
  protect,
  rateLimitConfig.message,
  sendMessageValidation,
  validateRequest,
  chatController.sendMessage,
);

// Get chat limits
router.get("/limits", protect, chatController.getChatLimits);

// Mark messages as read
router.post("/read/:chatRoomId", protect, markAsReadValidation, validateRequest, chatController.markAsRead);

// Archive chat room
router.post("/archive/:chatRoomId", protect, chatController.archiveChat);

// Unarchive chat room
router.post("/unarchive/:chatRoomId", protect, chatController.unarchiveChat);

// Delete chat room
router.delete("/:chatRoomId", protect, chatController.deleteChat);

export default router;