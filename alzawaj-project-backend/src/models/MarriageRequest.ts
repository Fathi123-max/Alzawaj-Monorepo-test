import mongoose, { Schema, Document, Model, Query } from "mongoose";

// Marriage Request interfaces
export interface IMarriageRequest extends Document {
  sender: mongoose.Types.ObjectId;
  receiver: mongoose.Types.ObjectId;
  status: "pending" | "accepted" | "rejected" | "cancelled" | "expired";
  message: string;

  contactInfo: {
    phone?: string;
    email?: string;
    guardianPhone?: string;
    preferredContactMethod: "phone" | "email" | "guardian";
  };

  response: {
    message?: string;
    responseDate?: Date;
    reason?:
      | "interested"
      | "not_compatible"
      | "not_ready"
      | "already_engaged"
      | "other";
  };

  meeting: {
    isArranged: boolean;
    date?: Date;
    location?: string;
    notes?: string;
    status: "pending" | "confirmed" | "completed" | "cancelled";
  };

  isRead: boolean;
  readDate?: Date;
  priority: "low" | "normal" | "high";
  expiresAt?: Date;

  guardianApproval: {
    isRequired: boolean;
    isApproved?: boolean;
    approvalDate?: Date;
    guardianNotes?: string;
  };

  metadata: {
    senderAge?: number;
    receiverAge?: number;
    compatibility?: {
      score?: number;
      factors?: {
        factor: string;
        weight: number;
        match: boolean;
      }[];
    };
    source: "search" | "recommendation" | "direct";
  };

  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: mongoose.Types.ObjectId;
  createdAt?: Date; // Added for virtual fields
  updatedAt?: Date; // Added for virtual fields

  // Virtuals
  age: number;
  timeRemaining: number;
  isExpired: boolean;
  canRespond: boolean;

  // Methods
  accept(
    responseMessage?: string,
    contactInfo?: any,
  ): Promise<IMarriageRequest>;
  reject(responseMessage?: string, reason?: string): Promise<IMarriageRequest>;
  cancel(): Promise<IMarriageRequest>;
  markAsRead(): Promise<IMarriageRequest>;
  arrangeMeeting(meetingDetails: any): Promise<IMarriageRequest>;
  confirmMeeting(): Promise<IMarriageRequest>;
  softDelete(deletedBy: mongoose.Types.ObjectId): Promise<IMarriageRequest>;
}

// Compatibility calculation interface
interface ICompatibilityResult {
  score: number;
  factors: {
    factor: string;
    weight: number;
    match: boolean;
  }[];
}

// Stats interface
interface IUserStats {
  totalSent: number;
  totalReceived: number;
  acceptedSent: number;
  acceptedReceived: number;
  pendingReceived: number;
}

// Query helpers interface
interface IMarriageRequestQueryHelpers {
  notDeleted(this: Query<any, IMarriageRequest>): Query<any, IMarriageRequest>;
  active(this: Query<any, IMarriageRequest>): Query<any, IMarriageRequest>;
  byStatus(
    this: Query<any, IMarriageRequest>,
    status: string,
  ): Query<any, IMarriageRequest>;
  recent(
    this: Query<any, IMarriageRequest>,
    days?: number,
  ): Query<any, IMarriageRequest>;
}

// Interface for static methods
interface IMarriageRequestModel
  extends Model<IMarriageRequest, IMarriageRequestQueryHelpers> {
  findActiveByUser(
    userId: mongoose.Types.ObjectId,
  ): Promise<IMarriageRequest[]>;
  findPendingForUser(
    userId: mongoose.Types.ObjectId,
  ): Promise<IMarriageRequest[]>;
  findSentByUser(userId: mongoose.Types.ObjectId): Promise<IMarriageRequest[]>;
  checkExistingRequest(
    senderId: mongoose.Types.ObjectId,
    receiverId: mongoose.Types.ObjectId,
  ): Promise<IMarriageRequest | null>;
  getStatsByUser(userId: mongoose.Types.ObjectId): Promise<IUserStats>;
  getCompatibilityScore(
    senderProfile: any,
    receiverProfile: any,
  ): ICompatibilityResult;
  expireOldRequests(): Promise<any>;
}

const marriageRequestSchema = new Schema<
  IMarriageRequest,
  IMarriageRequestModel,
  {},
  IMarriageRequestQueryHelpers
>(
  {
    // Request identification
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Request details
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "cancelled", "expired"],
      default: "pending",
      index: true,
    },

    message: {
      type: String,
      required: true,
      maxLength: 1000,
      trim: true,
    },

    // Contact information (for when request is accepted)
    contactInfo: {
      phone: {
        type: String,
        default: null,
      },
      email: {
        type: String,
        default: null,
      },
      guardianPhone: {
        type: String,
        default: null, // For female profiles
      },
      preferredContactMethod: {
        type: String,
        enum: ["phone", "email", "guardian"],
        default: "phone",
      },
    },

    // Response from receiver
    response: {
      message: {
        type: String,
        maxLength: 500,
        default: null,
      },
      responseDate: {
        type: Date,
        default: null,
      },
      reason: {
        type: String,
        enum: [
          "interested",
          "not_compatible",
          "not_ready",
          "already_engaged",
          "other",
        ],
        default: null,
      },
    },

    // Meeting arrangements (when both parties agree)
    meeting: {
      isArranged: {
        type: Boolean,
        default: false,
      },
      date: {
        type: Date,
        default: null,
      },
      location: {
        type: String,
        default: null,
      },
      notes: {
        type: String,
        maxLength: 500,
        default: null,
      },
      status: {
        type: String,
        enum: ["pending", "confirmed", "completed", "cancelled"],
        default: "pending",
      },
    },

    // Privacy and tracking
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    readDate: {
      type: Date,
      default: null,
    },

    priority: {
      type: String,
      enum: ["low", "normal", "high"],
      default: "normal",
      index: true,
    },

    // Expiry (requests expire after 30 days)
    expiresAt: {
      type: Date,
      required: false,
      index: { expireAfterSeconds: 0 }, // Automatic deletion
    },

    // Guardian involvement (for female profiles)
    guardianApproval: {
      isRequired: {
        type: Boolean,
        default: false,
      },
      isApproved: {
        type: Boolean,
        default: null,
      },
      approvalDate: {
        type: Date,
        default: null,
      },
      guardianNotes: {
        type: String,
        maxLength: 500,
        default: null,
      },
    },

    // Metadata
    metadata: {
      senderAge: Number,
      receiverAge: Number,
      compatibility: {
        score: {
          type: Number,
          min: 0,
          max: 100,
        },
        factors: [
          {
            factor: String,
            weight: Number,
            match: Boolean,
          },
        ],
      },
      source: {
        type: String,
        enum: ["search", "recommendation", "direct"],
        default: "search",
      },
    },

    // Audit fields
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        if (ret.__v !== undefined) delete (ret as any).__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  },
);

// Compound indexes for efficient queries
marriageRequestSchema.index({ sender: 1, status: 1, createdAt: -1 });
marriageRequestSchema.index({ receiver: 1, status: 1, createdAt: -1 });
marriageRequestSchema.index({ sender: 1, receiver: 1 }, { unique: true });
marriageRequestSchema.index({ status: 1, expiresAt: 1 });
marriageRequestSchema.index({ isDeleted: 1, createdAt: -1 });

// Virtual fields
marriageRequestSchema.virtual("age").get(function (this: IMarriageRequest) {
  if (!this.createdAt) return 0;
  return Math.floor(
    (Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24),
  );
});

marriageRequestSchema.virtual("timeRemaining").get(function (
  this: IMarriageRequest,
) {
  if (!this.expiresAt) return 0;
  const remaining = this.expiresAt.getTime() - Date.now();
  return Math.max(0, Math.floor(remaining / (1000 * 60 * 60 * 24)));
});

marriageRequestSchema.virtual("isExpired").get(function (
  this: IMarriageRequest,
) {
  if (!this.expiresAt) return false;
  return Date.now() > this.expiresAt.getTime();
});

marriageRequestSchema.virtual("canRespond").get(function (
  this: IMarriageRequest,
) {
  return this.status === "pending" && !this.isExpired && !this.isDeleted;
});

// Pre-save middleware
marriageRequestSchema.pre<IMarriageRequest>("save", function (next) {
  // Set expiry date (30 days from creation)
  if (this.isNew) {
    this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }

  // Update read status when status changes
  if (this.isModified("status") && this.status !== "pending") {
    this.isRead = true;
    this.readDate = new Date();
  }

  next();
});

// Instance methods
marriageRequestSchema.methods.accept = async function (
  this: IMarriageRequest,
  responseMessage?: string,
  contactInfo?: any,
): Promise<IMarriageRequest> {
  this.status = "accepted";
  if (responseMessage) this.response.message = responseMessage;
  this.response.responseDate = new Date();
  this.response.reason = "interested";
  this.isRead = true;
  this.readDate = new Date();

  if (contactInfo) {
    this.contactInfo = { ...this.contactInfo, ...contactInfo };
  }

  return this.save();
};

marriageRequestSchema.methods.reject = async function (
  this: IMarriageRequest,
  responseMessage?: string,
  reason?: string,
): Promise<IMarriageRequest> {
  this.status = "rejected";
  if (responseMessage) this.response.message = responseMessage;
  this.response.responseDate = new Date();
  this.response.reason = (reason as any) || "not_compatible";
  this.isRead = true;
  this.readDate = new Date();

  return this.save();
};

marriageRequestSchema.methods.cancel = async function (
  this: IMarriageRequest,
): Promise<IMarriageRequest> {
  this.status = "cancelled";
  return this.save();
};

marriageRequestSchema.methods.markAsRead = async function (
  this: IMarriageRequest,
): Promise<IMarriageRequest> {
  if (!this.isRead) {
    this.isRead = true;
    this.readDate = new Date();
    return this.save();
  }
  return this;
};

marriageRequestSchema.methods.arrangeMeeting = async function (
  this: IMarriageRequest,
  meetingDetails: any,
): Promise<IMarriageRequest> {
  this.meeting = {
    isArranged: true,
    date: meetingDetails.date,
    location: meetingDetails.location,
    notes: meetingDetails.notes,
    status: "pending",
  };

  return this.save();
};

marriageRequestSchema.methods.confirmMeeting = async function (
  this: IMarriageRequest,
): Promise<IMarriageRequest> {
  if (this.meeting.isArranged) {
    this.meeting.status = "confirmed";
    return this.save();
  }
  throw new Error("لا يمكن تأكيد لقاء غير مرتب");
};

marriageRequestSchema.methods.softDelete = async function (
  this: IMarriageRequest,
  deletedBy: mongoose.Types.ObjectId,
): Promise<IMarriageRequest> {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = deletedBy;
  return this.save();
};

// Static methods
marriageRequestSchema.statics.findActiveByUser = function (
  userId: mongoose.Types.ObjectId,
): Promise<IMarriageRequest[]> {
  return this.find({
    $or: [{ sender: userId }, { receiver: userId }],
    isDeleted: false,
    status: { $in: ["pending", "accepted"] },
  })
    .populate("sender receiver", "profile.basicInfo.name profile.basicInfo.age")
    .sort({ createdAt: -1 });
};

marriageRequestSchema.statics.findPendingForUser = function (
  userId: mongoose.Types.ObjectId,
): Promise<IMarriageRequest[]> {
  return this.find({
    receiver: userId,
    status: "pending",
    isDeleted: false,
    expiresAt: { $gt: new Date() },
  })
    .populate("sender", "profile.basicInfo profile.preferences")
    .sort({ createdAt: -1 });
};

marriageRequestSchema.statics.findSentByUser = function (
  userId: mongoose.Types.ObjectId,
): Promise<IMarriageRequest[]> {
  return this.find({
    sender: userId,
    isDeleted: false,
  })
    .populate("receiver", "profile.basicInfo.name profile.basicInfo.age")
    .sort({ createdAt: -1 });
};

marriageRequestSchema.statics.checkExistingRequest = function (
  senderId: mongoose.Types.ObjectId,
  receiverId: mongoose.Types.ObjectId,
): Promise<IMarriageRequest | null> {
  return this.findOne({
    sender: senderId,
    receiver: receiverId,
    status: { $in: ["pending", "accepted"] },
    isDeleted: false,
  });
};

marriageRequestSchema.statics.getStatsByUser = async function (
  userId: mongoose.Types.ObjectId,
): Promise<IUserStats> {
  const stats = await this.aggregate([
    {
      $match: {
        $or: [{ sender: userId }, { receiver: userId }],
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: null,
        totalSent: {
          $sum: {
            $cond: [{ $eq: ["$sender", userId] }, 1, 0],
          },
        },
        totalReceived: {
          $sum: {
            $cond: [{ $eq: ["$receiver", userId] }, 1, 0],
          },
        },
        acceptedSent: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ["$sender", userId] },
                  { $eq: ["$status", "accepted"] },
                ],
              },
              1,
              0,
            ],
          },
        },
        acceptedReceived: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ["$receiver", userId] },
                  { $eq: ["$status", "accepted"] },
                ],
              },
              1,
              0,
            ],
          },
        },
        pendingReceived: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ["$receiver", userId] },
                  { $eq: ["$status", "pending"] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
  ]);

  return (
    stats[0] || {
      totalSent: 0,
      totalReceived: 0,
      acceptedSent: 0,
      acceptedReceived: 0,
      pendingReceived: 0,
    }
  );
};

marriageRequestSchema.statics.getCompatibilityScore = function (
  senderProfile: any,
  receiverProfile: any,
): ICompatibilityResult {
  let score = 0;
  const factors: { factor: string; weight: number; match: boolean }[] = [];

  // Age compatibility (20 points)
  const ageDiff = Math.abs(
    senderProfile.basicInfo.age - receiverProfile.basicInfo.age,
  );
  const ageScore = Math.max(0, 20 - ageDiff);
  score += ageScore;
  factors.push({
    factor: "age",
    weight: 20,
    match: ageDiff <= 5,
  });

  // Education level (15 points)
  if (senderProfile.education?.level === receiverProfile.education?.level) {
    score += 15;
    factors.push({
      factor: "education",
      weight: 15,
      match: true,
    });
  }

  // Location (15 points)
  if (senderProfile.location?.city === receiverProfile.location?.city) {
    score += 15;
    factors.push({
      factor: "location",
      weight: 15,
      match: true,
    });
  } else if (
    senderProfile.location?.state === receiverProfile.location?.state
  ) {
    score += 7;
    factors.push({
      factor: "location",
      weight: 15,
      match: false,
    });
  }

  // Religious commitment (20 points)
  if (
    senderProfile.religiousInfo?.religiousLevel ===
    receiverProfile.religiousInfo?.religiousLevel
  ) {
    score += 20;
    factors.push({
      factor: "religious_commitment",
      weight: 20,
      match: true,
    });
  }

  // Marriage goals preference (10 points)
  if (
    senderProfile.marriageGoals ===
    receiverProfile.marriageGoals
  ) {
    score += 10;
    factors.push({
      factor: "marriage_goals",
      weight: 10,
      match: true,
    });
  }

  // Family planning (10 points)
  if (
    senderProfile.wantsChildren ===
    receiverProfile.wantsChildren
  ) {
    score += 10;
    factors.push({
      factor: "children",
      weight: 10,
      match: true,
    });
  }

  // Employment status (10 points)
  if (
    senderProfile.professional?.occupation &&
    receiverProfile.professional?.occupation
  ) {
    score += 10;
    factors.push({
      factor: "employment",
      weight: 10,
      match: true,
    });
  }

  return {
    score: Math.min(100, score),
    factors,
  };
};

marriageRequestSchema.statics.expireOldRequests =
  async function (): Promise<any> {
    const result = await this.updateMany(
      {
        status: "pending",
        expiresAt: { $lt: new Date() },
        isDeleted: false,
      },
      {
        $set: {
          status: "expired",
          isRead: true,
          readDate: new Date(),
        },
      },
    );

    return result;
  };

// Query helpers
marriageRequestSchema.query.notDeleted = function (
  this: Query<any, IMarriageRequest>,
) {
  return this.where({ isDeleted: false });
};

marriageRequestSchema.query.active = function (
  this: Query<any, IMarriageRequest>,
) {
  return this.where({
    status: { $in: ["pending", "accepted"] },
    isDeleted: false,
  });
};

marriageRequestSchema.query.byStatus = function (
  this: Query<any, IMarriageRequest>,
  status: string,
) {
  return this.where({ status });
};

marriageRequestSchema.query.recent = function (
  this: Query<any, IMarriageRequest>,
  days: number = 7,
) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return this.where({ createdAt: { $gte: date } });
};

export const MarriageRequest = mongoose.model<
  IMarriageRequest,
  IMarriageRequestModel
>("MarriageRequest", marriageRequestSchema);
export default MarriageRequest;
