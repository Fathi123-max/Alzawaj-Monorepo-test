import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { validationResult } from "express-validator";
import { createSuccessResponse, createErrorResponse } from "../utils/responseHelper";
import { getAuth, generateEmailVerificationLink } from "../config/firebaseAdmin";
import emailService from "../services/emailService";
import { User } from "../models/User";

const ACTION_CODE_URL = process.env.FRONTEND_URL
  ? `${process.env.FRONTEND_URL}/auth/verify-email`
  : "http://localhost:3000/auth/verify-email";

const actionCodeSettings = {
  url: ACTION_CODE_URL,
  handleCodeInApp: true,
} as any;

export const requestVerification = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json(
        createErrorResponse("بيانات غير صحيحة", errors.array().map((e: any) => e.msg)),
      );
      return;
    }

    const { email, name } = req.body as { email: string; name?: string };
    const auth = getAuth();

    let firebaseUser;
    try {
      firebaseUser = await auth.getUserByEmail(email);
    } catch {
      // Create a lightweight user with a random password solely for verification
      const randomPassword = crypto.randomBytes(12).toString("hex");
      firebaseUser = await auth.createUser({ email, password: randomPassword });
    }

    const link = await generateEmailVerificationLink(email, actionCodeSettings);

    const sent = await emailService.sendEmailVerificationLink(
      email,
      name || "المستخدم",
      link,
    );

    if (!sent) {
      res.status(500).json(createErrorResponse("فشل إرسال رسالة التأكيد"));
      return;
    }

    res.json(createSuccessResponse("تم إرسال رسالة التأكيد بنجاح", { email }));
  } catch (error) {
    next(error);
  }
};

export const confirmVerification = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json(
        createErrorResponse("بيانات غير صحيحة", errors.array().map((e: any) => e.msg)),
      );
      return;
    }

    const { email } = req.body as { email: string };
    const auth = getAuth();

    try {
      const userRecord = await auth.getUserByEmail(email);
      if (!userRecord.emailVerified) {
        res.status(400).json(createErrorResponse("البريد الإلكتروني غير مؤكد بعد"));
        return;
      }

      const dbUser = await User.findOne({ email });
      if (dbUser) {
        dbUser.isEmailVerified = true;
        dbUser.emailVerifiedAt = new Date();
        await dbUser.save();
      }

      res.json(createSuccessResponse("تم تأكيد البريد الإلكتروني بنجاح", { email }));
    } catch (e) {
      res.status(404).json(createErrorResponse("المستخدم غير موجود"));
    }
  } catch (error) {
    next(error);
  }
};

export const getVerificationStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const email = (req.query.email as string) || "";
    if (!email) {
      res.status(400).json(createErrorResponse("البريد الإلكتروني مطلوب"));
      return;
    }

    const auth = getAuth();
    let verified = false;
    let verifiedAt: Date | undefined;

    try {
      const userRecord = await auth.getUserByEmail(email);
      verified = !!userRecord.emailVerified;
    } catch {}

    const dbUser = await User.findOne({ email });
    if (dbUser && dbUser.isEmailVerified) {
      verified = true;
      verifiedAt = dbUser.emailVerifiedAt || undefined;
    }

    res.json(createSuccessResponse("تم جلب حالة التحقق", {
      email,
      verified,
      verifiedAt,
    }));
  } catch (error) {
    next(error);
  }
};

export default {
  requestVerification,
  confirmVerification,
  getVerificationStatus,
};

