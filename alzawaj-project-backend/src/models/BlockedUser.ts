import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBlockedUser extends Document {
  blockerId: mongoose.Types.ObjectId;
  blockedId: mongoose.Types.ObjectId;
  reason?: "inappropriate-behavior" | "harassment" | "spam" | "personal-preference" | "other";
  createdAt: Date;
}

interface IBlockedUserModel extends Model<IBlockedUser> {
  blockUser(
    blockerId: mongoose.Types.ObjectId,
    blockedId: mongoose.Types.ObjectId,
    reason?: string
  ): Promise<IBlockedUser>;
  unblockUser(
    blockerId: mongoose.Types.ObjectId,
    blockedId: mongoose.Types.ObjectId
  ): Promise<void>;
  isUserBlocked(
    blockerId: mongoose.Types.ObjectId,
    blockedId: mongoose.Types.ObjectId
  ): Promise<boolean>;
  getBlockedUsers(userId: mongoose.Types.ObjectId): Promise<IBlockedUser[]>;
}

const blockedUserSchema = new Schema<IBlockedUser>(
  {
    blockerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    blockedId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    reason: {
      type: String,
      enum: ["inappropriate-behavior", "harassment", "spam", "personal-preference", "other"],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Indexes
// Unique constraint - user can only block another user once
blockedUserSchema.index({ blockerId: 1, blockedId: 1 }, { unique: true });
// Reverse lookup
blockedUserSchema.index({ blockedId: 1, blockerId: 1 });

// Static methods
blockedUserSchema.statics.blockUser = async function (
  blockerId: mongoose.Types.ObjectId,
  blockedId: mongoose.Types.ObjectId,
  reason?: string
): Promise<IBlockedUser> {
  const blockedUser = new this({
    blockerId,
    blockedId,
    reason,
  });
  
  return blockedUser.save();
};

blockedUserSchema.statics.unblockUser = async function (
  blockerId: mongoose.Types.ObjectId,
  blockedId: mongoose.Types.ObjectId
): Promise<void> {
  await this.deleteOne({ blockerId, blockedId });
};

blockedUserSchema.statics.isUserBlocked = async function (
  blockerId: mongoose.Types.ObjectId,
  blockedId: mongoose.Types.ObjectId
): Promise<boolean> {
  const blocked = await this.findOne({ blockerId, blockedId });
  return !!blocked;
};

blockedUserSchema.statics.getBlockedUsers = async function (
  userId: mongoose.Types.ObjectId
): Promise<IBlockedUser[]> {
  return this.find({ blockerId: userId }).populate("blockedId", "profile basicInfo name");
};

export const BlockedUser = mongoose.model<IBlockedUser, IBlockedUserModel>(
  "BlockedUser",
  blockedUserSchema
);
export default BlockedUser;