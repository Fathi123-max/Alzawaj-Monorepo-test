import mongoose, { Schema, Document, Model } from "mongoose";

export interface IOTPCode extends Document {
  identifier: string; // email or phone
  code: string;
  type: "email-verification" | "phone-verification" | "password-reset";
  attempts: number;
  isUsed: boolean;
  usedAt?: Date;
  createdAt: Date;
  expiresAt: Date;
}

interface IOTPCodeModel extends Model<IOTPCode> {
  createOTP(
    identifier: string,
    type: "email-verification" | "phone-verification" | "password-reset",
    expiryMinutes?: number
  ): Promise<IOTPCode>;
  verifyOTP(
    identifier: string,
    type: "email-verification" | "phone-verification" | "password-reset",
    code: string
  ): Promise<boolean>;
  useOTP(
    identifier: string,
    type: "email-verification" | "phone-verification" | "password-reset",
    code: string
  ): Promise<void>;
  cleanupExpired(): Promise<void>;
}

const otpCodeSchema = new Schema<IOTPCode>(
  {
    identifier: {
      type: String,
      required: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["email-verification", "phone-verification", "password-reset"],
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
      max: 5,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
    usedAt: Date,
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Add expiresAt field with index
otpCodeSchema.add({
  expiresAt: {
    type: Date,
    required: true,
    index: true,
  }
});

// Indexes
// TTL index for automatic cleanup
otpCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
// Lookup index
otpCodeSchema.index({ identifier: 1, type: 1, isUsed: 1 });

// Static methods
otpCodeSchema.statics.createOTP = async function (
  identifier: string,
  type: "email-verification" | "phone-verification" | "password-reset",
  expiryMinutes: number = 10
): Promise<IOTPCode> {
  // Generate 6-digit random code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + expiryMinutes);
  
  // Remove any existing unused OTPs for this identifier and type
  await this.deleteMany({ identifier, type, isUsed: false });
  
  const otp = new this({
    identifier,
    code,
    type,
    expiresAt,
  });
  
  return otp.save();
};

otpCodeSchema.statics.verifyOTP = async function (
  identifier: string,
  type: "email-verification" | "phone-verification" | "password-reset",
  code: string
): Promise<boolean> {
  const otp = await this.findOne({ identifier, type, isUsed: false });
  
  if (!otp) return false;
  
  // Check if expired
  if (otp.expiresAt < new Date()) {
    await otp.deleteOne();
    return false;
  }
  
  // Check attempts
  if (otp.attempts >= 5) {
    await otp.deleteOne();
    return false;
  }
  
  // Check code
  if (otp.code !== code) {
    otp.attempts += 1;
    await otp.save();
    return false;
  }
  
  return true;
};

otpCodeSchema.statics.useOTP = async function (
  identifier: string,
  type: "email-verification" | "phone-verification" | "password-reset",
  code: string
): Promise<void> {
  const otp = await this.findOne({ identifier, type, code, isUsed: false });
  
  if (!otp) {
    throw new Error("Invalid or expired OTP");
  }
  
  // Check if expired
  if (otp.expiresAt < new Date()) {
    await otp.deleteOne();
    throw new Error("OTP has expired");
  }
  
  // Mark as used
  otp.isUsed = true;
  otp.usedAt = new Date();
  await otp.save();
};

otpCodeSchema.statics.cleanupExpired = async function (): Promise<void> {
  await this.deleteMany({ expiresAt: { $lt: new Date() } });
};

export const OTPCode = mongoose.model<IOTPCode, IOTPCodeModel>("OTPCode", otpCodeSchema);
export default OTPCode;