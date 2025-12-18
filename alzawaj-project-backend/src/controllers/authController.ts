import jwt from "jsonwebtoken";
import crypto from "crypto";
import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import { User, IUser } from "../models/User";
import { Profile, IProfile } from "../models/Profile";
import {
  createSuccessResponse,
  createErrorResponse,
} from "../utils/responseHelper";
import { emailService } from "../services/resendEmailService";
import smsService from "../services/smsService";

// Extend Request interface for authentication
interface AuthenticatedRequest extends Request {
  user?: IUser;
}

interface RegistrationData {
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  gender: "m" | "f";
  acceptDeclaration: boolean;
  basicInfo: {
    name: string;
    age: number;
    [key: string]: any;
  };
  location: {
    country: string;
    city: string;
    nationality: string;
  };
  education?: {
    education: string;
    occupation: string;
  };
  professional?: {
    occupation: string;
    monthlyIncome: number;
  };
  religiousInfo?: {
    religiousLevel: string;
    isPrayerRegular: boolean;
    areParentsAlive?: string;
    parentRelationship?: string;
    wantsChildren?: string;
    isRegularAtMosque?: boolean;
    smokes?: boolean;
  };
  personalInfo?: {
    height: number;
    weight: number;
    appearance: string;
    skinColor: string;
    bodyType: string;
    interests?: string[];
    marriageGoals?: string;
    personalityDescription?: string;
    familyPlans?: string;
    relocationPlans?: string;
    marriageTimeline?: string;
    clothingStyle?: string;
    workAfterMarriage?: string;
  };
  familyInfo?: {
    hasChildren: string;
    childrenCount: number;
  };
  lifestyle?: {
    smokingStatus: string;
  };
  preferences?: {
    ageMin: number;
    ageMax: number;
    country: string;
    maritalStatus: string[];
  };
  privacy?: {
    showProfilePicture: string;
    showAge: boolean;
    showLocation: boolean;
    showOccupation: boolean;
    allowMessagesFrom: string;
    profileVisibility: string;
    requireGuardianApproval?: boolean;
    showOnlineStatus: boolean;
    allowNearbySearch: boolean;
  };
}

interface LoginData {
  username: string;
  password: string;
}

/**
 * Register a new user
 */
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      email,
      password,
      confirmPassword,
      phone,
      gender,
      basicInfo,
      location,
      education,
      professional,
      religiousInfo,
      personalInfo,
      familyInfo,
      lifestyle,
      preferences,
      privacy,
    }: RegistrationData = req.body;

    // Validate input data
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json(
        createErrorResponse(
          "بيانات التسجيل غير صحيحة",
          errors.array().map((err: any) => err.msg)
        )
      );
      return;
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      res.status(400).json(createErrorResponse("كلمات المرور غير متطابقة"));
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }],
    });

    if (existingUser) {
      res.status(400).json(createErrorResponse("المستخدم موجود بالفعل"));
      return;
    }

    // Split the name into firstname and lastname
    const nameParts = basicInfo.name.trim().split(" ");
    const firstname = nameParts[0] || "";
    const lastname = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

    // Create user
    const newUser = new User({
      email,
      password,
      phone,
      firstname,
      lastname,
      role: "user",
      status: "pending", // User remains pending until email is verified
      isEmailVerified: false,
      isPhoneVerified: false,
    });

    await newUser.save();

    // Create profile with all submitted initial data
    const newProfile = new Profile({
      userId: newUser._id,
      name: basicInfo.name,
      age: basicInfo.age,
      gender: gender,
      country: location?.country || "Unknown",
      city: location?.city || "Unknown",
      nationality: location?.nationality || "Unknown",
      maritalStatus: (basicInfo as any)?.maritalStatus || "single",
      education:
        education?.education &&
        [
          "primary",
          "secondary",
          "high-school",
          "diploma",
          "bachelor",
          "master",
          "doctorate",
          "other",
        ].includes(education.education)
          ? education.education
          : "bachelor",
      occupation: professional?.occupation || education?.occupation || "",
      religiousLevel: religiousInfo?.religiousLevel || "moderate",
      isPrayerRegular: religiousInfo?.isPrayerRegular ?? true,
      height: personalInfo?.height || 175,
      weight: personalInfo?.weight || 70,
      appearance: personalInfo?.appearance || "average",
      skinColor: personalInfo?.skinColor || "medium",
      bodyType: personalInfo?.bodyType || "average",
      smokingStatus: lifestyle?.smokingStatus || "never",
      // Personal information fields that were missing
      marriageGoals: personalInfo?.marriageGoals,
      personalityDescription: personalInfo?.personalityDescription,
      familyPlans: personalInfo?.familyPlans,
      relocationPlans: personalInfo?.relocationPlans,
      marriageTimeline: personalInfo?.marriageTimeline,
      // Interests are already an array from the frontend
      interests: personalInfo?.interests || [],
      // Family information fields that were missing
      areParentsAlive: religiousInfo?.areParentsAlive,
      parentRelationship: religiousInfo?.parentRelationship,
      wantsChildren: religiousInfo?.wantsChildren,
      // Gender-specific fields for males
      hasBeard: gender === "m" ? basicInfo.hasBeard : undefined,
      financialSituation:
        gender === "m" ? basicInfo.financialSituation : undefined,
      housingOwnership: gender === "m" ? basicInfo.housingOwnership : undefined,
      monthlyIncome: gender === "m" ? professional?.monthlyIncome : undefined,
      // Gender-specific fields for females
      guardianName: gender === "f" ? basicInfo.guardianName : undefined,
      guardianPhone: gender === "f" ? basicInfo.guardianPhone : undefined,
      guardianEmail: gender === "f" ? basicInfo.guardianEmail : undefined,
      guardianRelationship:
        gender === "f" ? basicInfo.guardianRelationship : undefined,
      wearHijab: gender === "f" ? basicInfo.wearHijab : undefined,
      wearNiqab: gender === "f" ? basicInfo.wearNiqab : undefined,
      workAfterMarriage:
        gender === "f" ? personalInfo?.workAfterMarriage : undefined,
      privacy: {
        profileVisibility:
          privacy?.profileVisibility ||
          (gender === "f" ? "guardian-approved" : "everyone"),
        showAge: privacy?.showAge ?? true,
        showLocation: privacy?.showLocation ?? false,
        showOccupation: privacy?.showOccupation ?? true,
        showProfilePicture: privacy?.showProfilePicture || "everyone",
        allowMessagesFrom: privacy?.allowMessagesFrom || "everyone",
        requireGuardianApproval:
          privacy?.requireGuardianApproval ?? gender === "f",
        showOnlineStatus: privacy?.showOnlineStatus ?? false,
        allowNearbySearch: privacy?.allowNearbySearch ?? true,
      },
      isApproved: true, // Approve profile by default on registration
    });

    await newProfile.save();

    // Upload profile picture if provided
    if (req.file) {
      console.log("📸 Photo upload attempt - file received:", {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      });
      try {
        const ImageKit = require("imagekit");
        const imagekit = new ImageKit({
          publicKey: process.env.IMAGEKIT_PUBLIC_KEY || "",
          privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "",
          urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || "",
        });

        console.log("📸 ImageKit config loaded, uploading...");
        const uploadResult = await imagekit.upload({
          file: req.file.buffer.toString("base64"),
          fileName: `profile-${newUser._id}-${Date.now()}`,
          folder: "profile-pictures",
          useUniqueFileName: true,
        });

        console.log("📸 ImageKit upload successful:", uploadResult.url);
        const thumbnailUrl = imagekit.url({
          path: uploadResult.filePath,
          transformation: [{ width: "300", height: "300", crop: "fit" }],
        });

        newProfile.profilePicture = {
          url: uploadResult.url,
          thumbnailUrl: thumbnailUrl,
          uploadedAt: new Date(),
          fileId: uploadResult.fileId,
        };

        if (!newProfile.photos) newProfile.photos = [];
        newProfile.photos.push({
          url: uploadResult.url,
          thumbnailUrl: thumbnailUrl,
          uploadedAt: new Date(),
          isApproved: false,
          order: 0,
          fileId: uploadResult.fileId,
        });

        await newProfile.save();
        console.log(
          "✅ Profile picture uploaded successfully during registration"
        );
      } catch (uploadError) {
        console.error(
          "❌ Failed to upload profile picture during registration:",
          uploadError
        );
        // Continue without photo - don't fail registration
      }
    } else {
      console.log("📸 No photo file received in request");
    }

    // Update user with profile reference
    newUser.profile = newProfile._id as any;
    await newUser.save();

    // Generate email verification token (phone verification removed, but email verification remains)
    const emailToken = newUser.generateEmailVerificationToken();
    await newUser.save();

    // Create verification link with token and send email (async to improve performance)
    try {
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      const verificationLink = `${frontendUrl}/auth/verify-email?token=${emailToken}&mode=verifyEmail`;
      emailService
        .sendEmailVerificationLink(email, basicInfo.name, verificationLink)
        .catch((error) => {
          console.error("Failed to send verification email:", error);
        });
    } catch (emailError) {
      console.error("Error preparing verification email:", emailError);
    }

    // Check for FCM token in request body and update user
    if (req.body.fcmToken) {
      newUser.fcmToken = req.body.fcmToken;
      console.log(
        "Updated FCM token for user during registration:",
        newUser._id
      );
      await newUser.save(); // Save the FCM token update to the database
    }

    res.status(201).json(
      createSuccessResponse(
        "تم التسجيل بنجاح. يرجى تأكيد بريدك الإلكتروني من الرسالة التي أرسلناها",
        {
          user: {
            id: newUser._id,
            email: newUser.email,
            phone: newUser.phone,
            isEmailVerified: newUser.isEmailVerified,
            isPhoneVerified: newUser.isPhoneVerified,
            status: newUser.status,
          },
          profile: {
            id: newProfile._id,
            completionPercentage: newProfile.completionPercentage,
          },
        }
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log("Login attempt started");
    const { username, password }: LoginData = req.body;
    console.log("Login data received:", { username });

    // Validate input data
    const errors = validationResult(req);
    console.log("Validation errors:", errors.array());
    if (!errors.isEmpty()) {
      console.log("Validation failed");
      res.status(400).json(
        createErrorResponse(
          "بيانات تسجيل الدخول غير صحيحة",
          errors.array().map((err: any) => err.msg)
        )
      );
      return;
    }

    console.log("Validation passed, searching for user");
    // Find user by email or phone
    const user = await User.findOne({
      $or: [{ email: username }, { phone: username }],
    })
      .select("+password")
      .populate("profile");
    console.log("User search completed, user found:", !!user);

    if (user) {
      console.log("User details:", {
        email: user.email,
        hasPassword: !!user.password,
        passwordLength: user.password ? user.password.length : 0,
        id: user._id,
      });

      // Additional check for password field
      if (!user.password) {
        console.log("ERROR: User found but password field is missing or empty");
        res
          .status(500)
          .json(createErrorResponse("خطأ في النظام. يرجى التواصل مع الإدارة"));
        return;
      }
    }

    if (!user) {
      console.log("User not found");
      res.status(401).json(createErrorResponse("بيانات الدخول غير صحيحة"));
      return;
    }

    console.log("User found, checking if user is active");
    // Check if user is active
    if (user.status !== "active") {
      console.log("User account is not active");
      res
        .status(401)
        .json(createErrorResponse("الحساب غير مفعل. يرجى التواصل مع الإدارة"));
      return;
    }

    console.log("User is active, checking email verification");
    // Check if email is verified
    if (!user.isEmailVerified) {
      console.log("User email is not verified");
      res
        .status(403)
        .json(
          createErrorResponse("يجب تأكيد البريد الإلكتروني قبل تسجيل الدخول")
        );
      return;
    }

    console.log("Email verified, checking admin verification");
    console.log("User profile:", user.profile ? "exists" : "missing");
    if (user.profile) {
      console.log("Profile verification:", (user.profile as any).verification);
    }

    // Check if profile is verified by admin
    if (user.profile && !(user.profile as any).verification?.isVerified) {
      console.log("User profile is not verified by admin");
      res
        .status(403)
        .json(
          createErrorResponse("حسابك قيد المراجعة. يرجى انتظار موافقة الإدارة")
        );
      return;
    }

    console.log("Admin verification passed, checking password");
    // Check password
    const isPasswordMatch = await user.comparePassword(password);
    console.log("Password comparison result:", isPasswordMatch);
    if (!isPasswordMatch) {
      console.log("Password does not match, incrementing login attempts");
      // Update failed login attempts using the model's method
      await user.incLoginAttempts();

      res.status(401).json(createErrorResponse("بيانات الدخول غير صحيحة"));
      return;
    }

    console.log("Password matches, checking if account is locked");
    // Check if account is locked
    if (user.isAccountLocked()) {
      console.log("Account is locked");
      res
        .status(423)
        .json(
          createErrorResponse(
            "الحساب مقفل مؤقتاً بسبب محاولات تسجيل دخول فاشلة متكررة"
          )
        );
      return;
    }

    console.log("Account is not locked, resetting login attempts");
    // Reset login attempts on successful login
    await user.resetLoginAttempts();
    user.lastLoginAt = new Date();

    console.log("Generating tokens");
    // Generate tokens
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    console.log("Tokens generated");

    // Save refresh token
    user.refreshTokens.push({
      token: refreshToken,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      deviceInfo: JSON.stringify({
        userAgent: req.get("User-Agent") || "",
        ip: req.ip || "",
      }),
    });

    // Check for FCM token in request body and update user
    if (req.body.fcmToken) {
      user.fcmToken = req.body.fcmToken;
      console.log("Updated FCM token for user:", user._id);
    }

    console.log("Cleaning up old refresh tokens");
    // Clean up old refresh tokens
    user.refreshTokens = user.refreshTokens.filter(
      (tokenObj: any) => tokenObj.expiresAt > new Date()
    );

    console.log("Saving user");
    await user.save();
    console.log("User saved successfully");

    res.status(200).json({
      success: true,
      message: "تم تسجيل الدخول بنجاح",
      token: accessToken,
      refreshToken: refreshToken,
      user: {
        id: user._id,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
        lastLogin: user.lastLoginAt,
      },
    });
    console.log("Login response sent successfully");
  } catch (error) {
    console.log("Login error occurred:", error);
    next(error);
  }
};

/**
 * Refresh access token
 */
export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(401).json(createErrorResponse("رمز التحديث مطلوب"));
      return;
    }

    // Verify refresh token
    let decoded: any;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!);
    } catch (jwtError) {
      res.status(401).json(createErrorResponse("رمز التحديث غير صحيح"));
      return;
    }

    // Find user and verify refresh token
    const user = await User.findById(decoded.id);
    if (!user) {
      res.status(401).json(createErrorResponse("المستخدم غير موجود"));
      return;
    }

    // Check if refresh token exists and is valid
    const tokenIndex = user.refreshTokens.findIndex(
      (tokenObj: any) =>
        tokenObj.token === refreshToken && tokenObj.expiresAt > new Date()
    );

    if (tokenIndex === -1) {
      res.status(401).json(createErrorResponse("رمز التحديث منتهي الصلاحية"));
      return;
    }

    // Generate new access token
    const newAccessToken = user.generateAccessToken();

    // Optionally generate new refresh token for better security
    const newRefreshToken = user.generateRefreshToken();

    // Update refresh token
    user.refreshTokens[tokenIndex] = {
      token: newRefreshToken,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      deviceInfo: JSON.stringify({
        userAgent: req.get("User-Agent") || "",
        ip: req.ip || "",
      }),
    };

    // Check for FCM token in request body and update user
    if (req.body.fcmToken) {
      user.fcmToken = req.body.fcmToken;
      console.log("Updated FCM token for user during refresh:", user._id);
    }

    await user.save();

    res.json(
      createSuccessResponse("تم تحديث الرمز بنجاح", {
        tokens: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
          expiresIn: "15m",
        },
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Logout user
 */
export const logout = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    const userId = req.user?._id;

    if (userId && refreshToken) {
      const user = await User.findById(userId);
      if (user) {
        // Remove the specific refresh token
        user.refreshTokens = user.refreshTokens.filter(
          (tokenObj: any) => tokenObj.token !== refreshToken
        );
        await user.save();
      }
    }

    res.json(createSuccessResponse("تم تسجيل الخروج بنجاح"));
  } catch (error) {
    next(error);
  }
};

/**
 * Logout from all devices
 */
export const logoutAll = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?._id;

    if (userId) {
      const user = await User.findById(userId);
      if (user) {
        // Clear all refresh tokens
        user.refreshTokens = [];
        await user.save();
      }
    }

    res.json(createSuccessResponse("تم تسجيل الخروج من جميع الأجهزة بنجاح"));
  } catch (error) {
    next(error);
  }
};

/**
 * Send email verification
 */
export const sendEmailVerification = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?._id;
    const user = await User.findById(userId).populate("profile");

    if (!user) {
      res.status(404).json(createErrorResponse("المستخدم غير موجود"));
      return;
    }

    if (user.isEmailVerified) {
      res
        .status(400)
        .json(createErrorResponse("البريد الإلكتروني مؤكد بالفعل"));
      return;
    }

    // Generate new verification token
    const emailToken = user.generateEmailVerificationToken();
    await user.save();

    // Send verification email
    await emailService.sendEmailVerification(
      user.email,
      (user.profile as any)?.basicInfo?.name || "المستخدم",
      emailToken
    );

    res.json(createSuccessResponse("تم إرسال رسالة التأكيد بنجاح"));
  } catch (error) {
    next(error);
  }
};

/**
 * Verify email
 */
export const verifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json(createErrorResponse("رمز التحقق مطلوب"));
      return;
    }

    // Hash the token to match database
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find user with valid token
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      res
        .status(400)
        .json(createErrorResponse("رمز التحقق غير صحيح أو منتهي الصلاحية"));
      return;
    }

    // Update user
    user.isEmailVerified = true;
    user.status = "active"; // Update user status to active after email verification
    delete user.emailVerificationToken;
    delete user.emailVerificationExpires;
    await user.save();

    // Optionally update profile approval timestamp
    if (user.profile) {
      const profile = await Profile.findById(user.profile);
      if (profile) {
        // Update approvedAt to reflect when user completed verification
        profile.approvedAt = new Date();
        await profile.save();
      }
    }

    res.json(createSuccessResponse("تم تأكيد البريد الإلكتروني بنجاح"));
  } catch (error) {
    next(error);
  }
};

/**
 * Send phone verification OTP
 */
export const sendPhoneVerification = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?._id;
    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json(createErrorResponse("المستخدم غير موجود"));
      return;
    }

    if (user.isPhoneVerified) {
      res.status(400).json(createErrorResponse("رقم الهاتف مؤكد بالفعل"));
      return;
    }

    // Generate new OTP
    const phoneOTP = user.generatePhoneVerificationOTP();
    await user.save();

    // Send SMS
    if (user.phone) {
      await smsService.sendPhoneVerificationOTP(user.phone, phoneOTP);
    }

    res.json(createSuccessResponse("تم إرسال رمز التحقق بنجاح"));
  } catch (error) {
    next(error);
  }
};

/**
 * Verify phone
 */
export const verifyPhone = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { otp } = req.body;
    const userId = req.user?._id;

    if (!otp) {
      res.status(400).json(createErrorResponse("رمز التحقق مطلوب"));
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json(createErrorResponse("المستخدم غير موجود"));
      return;
    }

    // Verify OTP
    const isValidOTP = user.verifyPhoneOTP(otp);
    if (!isValidOTP) {
      res
        .status(400)
        .json(createErrorResponse("رمز التحقق غير صحيح أو منتهي الصلاحية"));
      return;
    }

    // Update user
    user.isPhoneVerified = true;
    user.phoneVerifiedAt = new Date();
    delete user.phoneVerificationOTP;
    delete user.phoneVerificationExpires;
    await user.save();

    // Optionally update profile approval timestamp
    if (user.profile) {
      const profile = await Profile.findById(user.profile);
      if (profile) {
        // Update approvedAt to reflect when user completed verification
        profile.approvedAt = new Date();
        await profile.save();
      }
    }

    res.json(createSuccessResponse("تم تأكيد رقم الهاتف بنجاح"));
  } catch (error) {
    next(error);
  }
};

/**
 * Development endpoint to confirm email directly (bypasses verification)
 */
export const devConfirmEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.body;

    if (!userId) {
      res.status(400).json(createErrorResponse("معرف المستخدم مطلوب"));
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json(createErrorResponse("المستخدم غير موجود"));
      return;
    }

    // Directly confirm email for development
    user.isEmailVerified = true;
    user.emailVerifiedAt = new Date();
    delete user.emailVerificationToken;
    delete user.emailVerificationExpires;
    await user.save();

    res.json(createSuccessResponse("تم تأكيد البريد الإلكتروني بنجاح (تطوير)"));
  } catch (error) {
    next(error);
  }
};

/**
 * Development endpoint to confirm phone directly (bypasses verification)
 */
export const devConfirmPhone = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.body;

    if (!userId) {
      res.status(400).json(createErrorResponse("معرف المستخدم مطلوب"));
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json(createErrorResponse("المستخدم غير موجود"));
      return;
    }

    // Directly confirm phone for development
    user.isPhoneVerified = true;
    user.phoneVerifiedAt = new Date();
    delete user.phoneVerificationOTP;
    delete user.phoneVerificationExpires;
    await user.save();

    res.json(createSuccessResponse("تم تأكيد رقم الهاتف بنجاح (تطوير)"));
  } catch (error) {
    next(error);
  }
};

/**
 * Forgot password - send reset email
 */
export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json(createErrorResponse("البريد الإلكتروني مطلوب"));
      return;
    }

    const user = await User.findOne({ email }).populate("profile");
    if (!user) {
      // Don't reveal if email exists or not for security
      res.json(
        createSuccessResponse(
          "إذا كان البريد الإلكتروني موجود، ستصلك رسالة إعادة تعيين كلمة المرور"
        )
      );
      return;
    }

    // Generate reset token
    const resetToken = user.generatePasswordResetToken();
    await user.save();

    try {
      // Send reset email
      await emailService.sendPasswordReset(
        email,
        (user.profile as any)?.basicInfo?.name || "المستخدم",
        resetToken
      );

      res.json(
        createSuccessResponse("تم إرسال رسالة إعادة تعيين كلمة المرور بنجاح")
      );
    } catch (emailError) {
      // Reset the fields if email fails
      delete user.passwordResetToken;
      delete user.passwordResetExpires;
      await user.save();

      res
        .status(500)
        .json(
          createErrorResponse(
            "فشل في إرسال البريد الإلكتروني. يرجى المحاولة لاحقاً"
          )
        );
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password
 */
export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      res
        .status(400)
        .json(createErrorResponse("الرمز وكلمة المرور الجديدة مطلوبان"));
      return;
    }

    // Hash the token to match database
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find user with valid reset token
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      res
        .status(400)
        .json(
          createErrorResponse("رمز إعادة التعيين غير صحيح أو منتهي الصلاحية")
        );
      return;
    }

    // Update password
    user.password = newPassword;
    delete user.passwordResetToken;
    delete user.passwordResetExpires;
    user.passwordChangedAt = new Date();

    // Clear all refresh tokens for security
    user.refreshTokens = [];

    await user.save();

    res.json(
      createSuccessResponse(
        "تم إعادة تعيين كلمة المرور بنجاح. يرجى تسجيل الدخول مرة أخرى"
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Change password (for authenticated users)
 */
export const changePassword = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?._id;

    if (!currentPassword || !newPassword) {
      res
        .status(400)
        .json(createErrorResponse("كلمة المرور الحالية والجديدة مطلوبتان"));
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json(createErrorResponse("المستخدم غير موجود"));
      return;
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      res
        .status(400)
        .json(createErrorResponse("كلمة المرور الحالية غير صحيحة"));
      return;
    }

    // Check if new password is different
    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
      res
        .status(400)
        .json(
          createErrorResponse(
            "كلمة المرور الجديدة يجب أن تكون مختلفة عن الحالية"
          )
        );
      return;
    }

    // Update password
    user.password = newPassword;
    user.passwordChangedAt = new Date();

    // Clear all refresh tokens except current one for security
    const currentRefreshToken = req.body.refreshToken;
    if (currentRefreshToken) {
      user.refreshTokens = user.refreshTokens.filter(
        (tokenObj: any) => tokenObj.token === currentRefreshToken
      );
    } else {
      user.refreshTokens = [];
    }

    await user.save();

    res.json(createSuccessResponse("تم تغيير كلمة المرور بنجاح"));
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user info
 */
export const getMe = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log("getMe called, user from request:", req.user);
    const userId = req.user?._id;
    console.log("getMe - User ID:", userId);

    const user = await User.findById(userId)
      .populate("profile")
      .select(
        "-password -refreshTokens -emailVerificationToken -phoneVerificationOTP -passwordResetToken"
      );

    console.log("getMe - User from DB:", !!user);
    if (user) {
      console.log("getMe - User details:", {
        id: user._id,
        email: user.email,
      });
    }

    if (!user) {
      console.log("getMe - User not found in DB");
      res.status(404).json(createErrorResponse("المستخدم غير موجود"));
      return;
    }

    res.json(
      createSuccessResponse("تم جلب بيانات المستخدم بنجاح", {
        user: {
          id: user._id,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          isPhoneVerified: user.isPhoneVerified,
          isActive: user.isActive,
          lastLogin: user.lastLoginAt,
          createdAt: user.createdAt,
        },
        profile: user.profile,
      })
    );
  } catch (error) {
    console.log("getMe - Error:", error);
    next(error);
  }
};
