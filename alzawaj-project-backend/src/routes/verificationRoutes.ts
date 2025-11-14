import express, { Router } from "express";
import { body, query } from "express-validator";
import { rateLimitConfig } from "../config/rateLimiting";
import { validateRequest } from "../middleware/validationMiddleware";
import {
  requestVerification,
  confirmVerification,
  getVerificationStatus,
} from "../controllers/verificationController";

const router: Router = express.Router();

router.post(
  "/request",
  rateLimitConfig.auth,
  body("email").isEmail().withMessage("البريد الإلكتروني غير صحيح"),
  validateRequest,
  requestVerification,
);

router.post(
  "/confirm",
  rateLimitConfig.auth,
  body("email").isEmail().withMessage("البريد الإلكتروني غير صحيح"),
  validateRequest,
  confirmVerification,
);

router.get(
  "/status",
  rateLimitConfig.general,
  query("email").isEmail().withMessage("البريد الإلكتروني غير صحيح"),
  validateRequest,
  getVerificationStatus,
);

export default router;

