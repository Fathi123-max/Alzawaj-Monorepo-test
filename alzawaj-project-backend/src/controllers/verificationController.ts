import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import { createSuccessResponse, createErrorResponse } from "../utils/responseHelper";
import emailService from "../services/emailService";
import { User } from "../models/User";
import crypto from "crypto";

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

    // Validate the email using mailboxlayer API
    // If mailboxlayer is not configured, skip validation (don't block registration)
    const validation = await emailService.validateEmail(email);
    if (!validation.isValid) {
      // Log the validation issue but continue with verification
      console.warn(`Email validation failed for ${email}:`, validation);
    }

    // Find user in database
    const dbUser = await User.findOne({ email });
    if (!dbUser) {
      res.status(404).json(createErrorResponse("المستخدم غير موجود"));
      return;
    }

    // Generate verification token
    const verificationToken = dbUser.generateEmailVerificationToken();
    await dbUser.save();

    // Create verification link with token
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const verificationLink = `${frontendUrl}/auth/verify-email?token=${verificationToken}&mode=verifyEmail`;

    // Send verification email
    const sent = await emailService.sendEmailVerificationLink(
      email,
      name || dbUser.firstname || "المستخدم",
      verificationLink,
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

    const { token, email } = req.body as { token?: string; email?: string };

    // If token is provided, use token-based verification
    if (token) {
      // Hash the token to match database
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      // Find user by verification token
      const dbUser = await User.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationExpires: { $gt: new Date() } // Token not expired
      });

      if (!dbUser) {
        res.status(400).json(createErrorResponse("رمز التحقق غير صالح أو منتهي الصلاحية"));
        return;
      }

      // Update user as verified
      dbUser.isEmailVerified = true;
      dbUser.emailVerifiedAt = new Date();
      // Update user status to active after email verification
      dbUser.status = "active";
      // Clear the verification token and expiration
      dbUser.emailVerificationToken = undefined as any;
      dbUser.emailVerificationExpires = undefined as any;

      await dbUser.save();

      res.json(createSuccessResponse("تم تأكيد البريد الإلكتروني بنجاح", { email: dbUser.email }));
      return;
    }

    // If email is provided, use email-based verification (for older systems)
    if (email) {
      const dbUser = await User.findOne({ email });
      if (!dbUser) {
        res.status(404).json(createErrorResponse("المستخدم غير موجود"));
        return;
      }

      if (dbUser.isEmailVerified) {
        res.json(createSuccessResponse("البريد الإلكتروني مؤكد بالفعل", { email: dbUser.email }));
        return;
      }

      // Update user as verified
      dbUser.isEmailVerified = true;
      dbUser.emailVerifiedAt = new Date();
      await dbUser.save();

      res.json(createSuccessResponse("تم تأكيد البريد الإلكتروني بنجاح", { email: dbUser.email }));
      return;
    }

    res.status(400).json(createErrorResponse("يجب تزويد رمز التحقق أو البريد الإلكتروني"));
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

    const dbUser = await User.findOne({ email });

    const verified = dbUser ? dbUser.isEmailVerified : false;
    const verifiedAt = dbUser && dbUser.emailVerifiedAt ? dbUser.emailVerifiedAt : undefined;

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

