import express, { Router } from "express";
import { body, param, query } from "express-validator";
import { validateRequest } from "../middleware/validationMiddleware";
import { protect } from "../middleware/authMiddleware";
import { rateLimitConfig } from "../config/rateLimiting";
import * as requestController from "../controllers/requestController";

const router: Router = express.Router();

// Validation rules
const sendRequestValidation = [
  body("receiverId").isMongoId().withMessage("معرف المستقبل غير صحيح"),
  body("message").notEmpty().withMessage("الرسالة مطلوبة").isLength({ max: 1000 }).withMessage("الرسالة لا يجب أن تتجاوز 1000 حرف"),
];

const respondRequestValidation = [
  param("requestId").isMongoId().withMessage("معرف الطلب غير صحيح"),
  body("response").isIn(["accept", "reject"]).withMessage("الرد يجب أن يكون قبول أو رفض"),
  body("message").optional().isLength({ max: 500 }).withMessage("الرسالة لا يجب أن تتجاوز 500 حرف"),
];

const cancelRequestValidation = [
  param("requestId").isMongoId().withMessage("معرف الطلب غير صحيح"),
];

const meetingValidation = [
  param("requestId").isMongoId().withMessage("معرف الطلب غير صحيح"),
  body("date").isISO8601().withMessage("تاريخ الاجتماع غير صحيح"),
  body("time").notEmpty().withMessage("وقت الاجتماع مطلوب"),
  body("location").notEmpty().withMessage("مكان الاجتماع مطلوب"),
  body("meetingType").isIn(["family_meeting", "guardian_meeting", "public_meeting"]).withMessage("نوع الاجتماع غير صحيح"),
];

const confirmMeetingValidation = [
  param("requestId").isMongoId().withMessage("معرف الطلب غير صحيح"),
  body("confirm").isBoolean().withMessage("تأكيد الاجتماع مطلوب"),
];

// Routes

// Send a marriage request
router.post(
  "/send",
  protect,
  rateLimitConfig.message,
  sendRequestValidation,
  validateRequest,
  requestController.sendMarriageRequest,
);

// Get received marriage requests
router.get("/received", protect, requestController.getReceivedRequests);

// Get sent marriage requests
router.get("/sent", protect, requestController.getSentRequests);

// Accept a marriage request
router.post("/respond/:requestId/accept", protect, respondRequestValidation, validateRequest, requestController.acceptRequest);

// Reject a marriage request
router.post("/respond/:requestId/reject", protect, respondRequestValidation, validateRequest, requestController.rejectRequest);

// Cancel a sent marriage request
router.post("/cancel/:requestId", protect, cancelRequestValidation, validateRequest, requestController.cancelRequest);

// Mark request as read
router.post("/read/:requestId", protect, requestController.markAsRead);

// Arrange meeting
router.post("/meeting/:requestId", protect, meetingValidation, validateRequest, requestController.arrangeMeeting);

// Confirm meeting
router.post("/meeting/:requestId/confirm", protect, confirmMeetingValidation, validateRequest, requestController.confirmMeeting);

// Get request details
router.get("/:requestId", protect, requestController.getRequestDetails);

// Get request statistics
router.get("/stats", protect, requestController.getRequestStats);

export default router;