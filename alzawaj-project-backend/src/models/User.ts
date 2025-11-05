import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// User interface extending the IUser from types
export interface IUser extends Document {
  email: string;
  phone?: string; // Made optional
  password: string;
  firstname: string;
  lastname: string;
  role: "user" | "admin" | "moderator";
  status: "active" | "suspended" | "pending" | "blocked";
  isEmailVerified: boolean;
  emailVerifiedAt?: Date;
  isPhoneVerified?: boolean;
  phoneVerifiedAt?: Date;
  lastLoginAt?: Date;
  lastActiveAt: Date;
  loginAttempts: number;
  lockUntil?: Date;
  refreshTokens: IRefreshToken[];
  deletedAt?: Date;
  suspensionReason?: string;
  suspendedBy?: mongoose.Types.ObjectId;
  suspendedAt?: Date;

  // Additional properties needed by controllers
  isActive: boolean;
  profile?: mongoose.Types.ObjectId;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  phoneVerificationOTP?: string;
  phoneVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  passwordChangedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;

  // Virtuals
  fullName: string;
  isLocked: boolean;

  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  isAccountLocked(): boolean;
  incLoginAttempts(): Promise<any>;
  resetLoginAttempts(): Promise<any>;
  addRefreshToken(token: string, deviceInfo?: string): Promise<IUser>;
  removeRefreshToken(token: string): Promise<IUser>;
  cleanExpiredTokens(): Promise<IUser>;
  softDelete(): Promise<IUser>;
  restore(): Promise<IUser>;

  // Token generation methods
  generateAuthToken(): Promise<string>; // For compatibility with middleware expectations
  generateAccessToken(): string;
  generateRefreshToken(): string;
  generateEmailVerificationToken(): string;
  generatePhoneVerificationOTP(): string;
  verifyPhoneOTP(otp: string): boolean;
  generatePasswordResetToken(): string;
}

// Interface for refresh tokens
interface IRefreshToken {
  token: string;
  createdAt: Date;
  expiresAt: Date;
  deviceInfo?: any; // Can be string or object
}

// Interface for static methods
interface IUserModel extends Model<IUser> {
  findActiveUsers(): Promise<IUser[]>;
  findByEmailOrPhone(identifier: string): Promise<IUser | null>;
  countByRole(role: string): Promise<number>;
  getActiveUsersStats(): Promise<any[]>;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, "البريد الإلكتروني مطلوب"],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "البريد الإلكتروني غير صحيح",
      ],
    },
    phone: {
      type: String,
      unique: true,
      sparse: true, // Allow multiple nulls, but enforce uniqueness when present
      match: [/^\+[1-9]\d{1,14}$/, "رقم الهاتف غير صحيح"],
    },
    password: {
      type: String,
      required: [true, "كلمة المرور مطلوبة"],
      minlength: [8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"],
      select: false,
    },
    firstname: {
      type: String,
      required: [true, "الاسم الأول مطلوب"],
      maxlength: [50, "الاسم الأول لا يجب أن يزيد عن 50 حرف"],
      trim: true,
    },
    lastname: {
      type: String,
      required: [true, "اسم العائلة مطلوب"],
      maxlength: [50, "اسم العائلة لا يجب أن يزيد عن 50 حرف"],
      trim: true,
    },
    role: {
      type: String,
      enum: {
        values: ["user", "admin", "moderator"],
        message: "الدور يجب أن يكون user أو admin أو moderator",
      },
      default: "user",
    },
    status: {
      type: String,
      enum: {
        values: ["active", "suspended", "pending", "blocked"],
        message: "الحالة يجب أن تكون active أو suspended أو pending أو blocked",
      },
      default: "pending",
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerifiedAt: Date,
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    phoneVerifiedAt: Date,
    lastLoginAt: Date,
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
    loginAttempts: {
      type: Number,
      default: 0,
      max: 5,
    },
    lockUntil: Date,
    refreshTokens: [
      {
        token: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
        expiresAt: Date,
        deviceInfo: String,
      },
    ],
    deletedAt: Date,
    suspensionReason: String,
    suspendedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    suspendedAt: Date,

    // Additional fields for authentication
    isActive: { type: Boolean, default: true },
    profile: { type: Schema.Types.ObjectId, ref: "Profile" },
    emailVerificationToken: { type: String, select: false },
    emailVerificationExpires: { type: Date, select: false },
    phoneVerificationOTP: { type: String, select: false },
    phoneVerificationExpires: { type: Date, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    passwordChangedAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
userSchema.index({ email: 1, status: 1 });
userSchema.index({ phone: 1, status: 1 });
userSchema.index({ role: 1, status: 1 });
userSchema.index({ lastActiveAt: -1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ deletedAt: 1 }, { expireAfterSeconds: 2592000 }); // 30 days

// Virtual for full name
userSchema.virtual("fullName").get(function (this: IUser) {
  return `${this.firstname} ${this.lastname}`;
});

// Virtual for account lock status
userSchema.virtual("isLocked").get(function (this: IUser) {
  return !!(this.lockUntil && this.lockUntil > new Date());
});

// Hash password before saving
userSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    console.log("Hashing password before saving user");
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || "12");
    this.password = await bcrypt.hash(this.password, saltRounds);
    console.log("Password hashed successfully");
    next();
  } catch (error) {
    console.log("Error hashing password:", error);
    next(error as Error);
  }
});

// Update lastActiveAt on save
userSchema.pre<IUser>("save", function (next) {
  if (this.isNew || this.isModified("lastLoginAt")) {
    console.log("Updating lastActiveAt");
    this.lastActiveAt = new Date();
  }
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (
  this: IUser,
  candidatePassword: string
): Promise<boolean> {
  console.log("Comparing password for user:", this.email || this.phone);
  console.log("User object password property:", {
    exists: !!this.password,
    type: typeof this.password,
    value: this.password
  });
  
  if (!this.password) {
    console.log("No password found for user");
    return false;
  }
  
  console.log("Password hash exists, comparing with bcrypt");
  const result = await bcrypt.compare(candidatePassword, this.password);
  console.log("Password comparison result:", result);
  return result;
};

// Check if account is locked
userSchema.methods.isAccountLocked = function (this: IUser): boolean {
  const isLocked = !!(this.lockUntil && this.lockUntil > new Date());
  console.log("Checking if account is locked:", {
    lockUntil: this.lockUntil,
    currentDate: new Date(),
    isLocked
  });
  return isLocked;
};

// Increment login attempts
userSchema.methods.incLoginAttempts = function (this: IUser) {
  console.log("Incrementing login attempts, current attempts:", this.loginAttempts);
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < new Date()) {
    console.log("Previous lock expired, resetting attempts to 1");
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 },
    });
  }

  const updates: any = { $inc: { loginAttempts: 1 } };
  console.log("Incrementing login attempts by 1");

  // If we have max attempts and no lock, lock account
  if (this.loginAttempts + 1 >= 5 && !this.isAccountLocked()) {
    console.log("Max attempts reached, locking account for 15 minutes");
    updates.$set = {
      lockUntil: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    };
  }

  return this.updateOne(updates);
};

// Reset login attempts
userSchema.methods.resetLoginAttempts = function (this: IUser) {
  console.log("Resetting login attempts");
  return this.updateOne({
    $unset: {
      loginAttempts: 1,
      lockUntil: 1,
    },
  });
};

// Add refresh token
userSchema.methods.addRefreshToken = function (
  this: IUser,
  token: string,
  deviceInfo?: string
): Promise<IUser> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

  this.refreshTokens.push({
    token,
    deviceInfo: deviceInfo || "",
    createdAt: new Date(),
    expiresAt,
  });

  // Keep only last 5 refresh tokens
  if (this.refreshTokens.length > 5) {
    this.refreshTokens = this.refreshTokens.slice(-5);
  }

  return this.save();
};

// Remove refresh token
userSchema.methods.removeRefreshToken = function (
  this: IUser,
  token: string
): Promise<IUser> {
  this.refreshTokens = this.refreshTokens.filter((rt) => rt.token !== token);
  return this.save();
};

// Clean expired refresh tokens
userSchema.methods.cleanExpiredTokens = function (this: IUser): Promise<IUser> {
  const now = new Date();
  this.refreshTokens = this.refreshTokens.filter((rt) => rt.expiresAt > now);
  return this.save();
};

// Soft delete
userSchema.methods.softDelete = function (this: IUser): Promise<IUser> {
  this.deletedAt = new Date();
  this.status = "blocked";
  return this.save();
};

// Restore from soft delete
userSchema.methods.restore = function (this: IUser): Promise<IUser> {
  delete this.deletedAt;
  this.status = "active";
  return this.save();
};

// Static methods
userSchema.statics.findActiveUsers = function (): Promise<IUser[]> {
  return this.find({
    status: "active",
    deletedAt: { $exists: false },
  });
};

userSchema.statics.findByEmailOrPhone = function (
  identifier: string
): Promise<IUser | null> {
  return this.findOne({
    $or: [{ email: identifier.toLowerCase() }, { phone: identifier }],
    deletedAt: { $exists: false },
  }).select("+password");
};

userSchema.statics.countByRole = function (role: string): Promise<number> {
  return this.countDocuments({
    role,
    deletedAt: { $exists: false },
  });
};

userSchema.statics.getActiveUsersStats = function (): Promise<any[]> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thisMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  return this.aggregate([
    {
      $match: {
        deletedAt: { $exists: false },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        active: {
          $sum: {
            $cond: [{ $eq: ["$status", "active"] }, 1, 0],
          },
        },
        pending: {
          $sum: {
            $cond: [{ $eq: ["$status", "pending"] }, 1, 0],
          },
        },
        suspended: {
          $sum: {
            $cond: [{ $eq: ["$status", "suspended"] }, 1, 0],
          },
        },
        newToday: {
          $sum: {
            $cond: [{ $gte: ["$createdAt", today] }, 1, 0],
          },
        },
        newThisWeek: {
          $sum: {
            $cond: [{ $gte: ["$createdAt", thisWeek] }, 1, 0],
          },
        },
        newThisMonth: {
          $sum: {
            $cond: [{ $gte: ["$createdAt", thisMonth] }, 1, 0],
          },
        },
        activeToday: {
          $sum: {
            $cond: [{ $gte: ["$lastActiveAt", today] }, 1, 0],
          },
        },
      },
    },
  ]);
};

// Remove sensitive fields in JSON output
userSchema.methods.toJSON = function (this: IUser) {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.refreshTokens;
  delete userObject.loginAttempts;
  delete userObject.lockUntil;
  return userObject;
};

// Token generation methods
userSchema.methods.generateAuthToken = function (this: IUser): Promise<string> {
  // Alias for generateAccessToken to maintain compatibility
  console.log("Generating auth token");
  return Promise.resolve(this.generateAccessToken());
};

userSchema.methods.generateAccessToken = function (this: IUser): string {
  console.log("Generating access token");
  const secret: string = process.env.JWT_SECRET!;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }
  const userId: string = (this as any)._id.toString();
  const payload: { id: string; role: string } = { id: userId, role: this.role };
  const token = jwt.sign(payload, secret, { expiresIn: "15m" });
  console.log("Access token generated");
  return token;
};

userSchema.methods.generateRefreshToken = function (this: IUser): string {
  console.log("Generating refresh token");
  const secret: string = process.env.JWT_REFRESH_SECRET!;
  if (!secret) {
    throw new Error("JWT_REFRESH_SECRET environment variable is not set");
  }
  const userId: string = (this as any)._id.toString();
  const payload: { id: string } = { id: userId };
  const token = jwt.sign(payload, secret, { expiresIn: "7d" });
  console.log("Refresh token generated");
  return token;
};

userSchema.methods.generateEmailVerificationToken = function (
  this: IUser
): string {
  // Generate email verification token
  const token =
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
  this.emailVerificationToken = token;
  this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  return token;
};

userSchema.methods.generatePhoneVerificationOTP = function (
  this: IUser
): string {
  // Generate 6-digit phone verification OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.phoneVerificationOTP = otp;
  this.phoneVerificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  return otp;
};

userSchema.methods.verifyPhoneOTP = function (
  this: IUser,
  otp: string
): boolean {
  console.log("Verifying phone OTP:", { providedOtp: otp, storedOtp: this.phoneVerificationOTP });
  if (!this.phoneVerificationOTP || !this.phoneVerificationExpires) {
    console.log("No OTP or expiry found");
    return false;
  }

  if (this.phoneVerificationExpires < new Date()) {
    console.log("OTP has expired");
    return false;
  }

  if (this.phoneVerificationOTP === otp) {
    console.log("OTP matches!");
    this.isPhoneVerified = true;
    this.phoneVerifiedAt = new Date();
    // Clear OTP after successful verification
    this.phoneVerificationOTP = undefined as any;
    this.phoneVerificationExpires = undefined as any;
    return true;
  }

  console.log("OTP does not match");
  return false;
};

userSchema.methods.generatePasswordResetToken = function (this: IUser): string {
  // Generate password reset token
  const token =
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
  this.passwordResetToken = token;
  this.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  return token;
};

export const User = mongoose.model<IUser, IUserModel>("User", userSchema);
export default User;
