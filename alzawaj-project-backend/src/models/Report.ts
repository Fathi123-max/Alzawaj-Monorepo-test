import mongoose, { Schema, Document, Model } from "mongoose";

export interface IReport extends Document {
  reporterId: mongoose.Types.ObjectId;
  reportedUserId?: mongoose.Types.ObjectId;
  reportedProfileId?: mongoose.Types.ObjectId;
  reportedMessageId?: mongoose.Types.ObjectId;
  reportedChatRoomId?: mongoose.Types.ObjectId;
  reason: 
    | "inappropriate-content"
    | "harassment"
    | "fake-profile"
    | "spam"
    | "abusive-language"
    | "religious-violations"
    | "scam"
    | "other";
  description?: string;
  evidence?: string[]; // screenshot URLs
  status: "pending" | "investigating" | "resolved" | "dismissed";
  priority: "low" | "medium" | "high" | "critical";
  assignedTo?: mongoose.Types.ObjectId;
  assignedAt?: Date;
  resolvedBy?: mongoose.Types.ObjectId;
  resolvedAt?: Date;
  resolutionNotes?: string;
  actionTaken?: 
    | "no-action"
    | "warning-sent"
    | "content-removed"
    | "user-suspended"
    | "user-banned"
    | "profile-rejected";
  createdAt: Date;
  updatedAt: Date;
}

interface IReportModel extends Model<IReport> {
  createReport(data: Partial<IReport>): Promise<IReport>;
  findPending(): Promise<IReport[]>;
  findByReporter(reporterId: mongoose.Types.ObjectId): Promise<IReport[]>;
  findByReportedUser(reportedUserId: mongoose.Types.ObjectId): Promise<IReport[]>;
  getStatistics(): Promise<any[]>;
}

const reportSchema = new Schema<IReport>(
  {
    reporterId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    reportedUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    reportedProfileId: {
      type: Schema.Types.ObjectId,
      ref: "Profile",
      index: true,
    },
    reportedMessageId: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      index: true,
    },
    reportedChatRoomId: {
      type: Schema.Types.ObjectId,
      ref: "ChatRoom",
      index: true,
    },
    reason: {
      type: String,
      enum: [
        "inappropriate-content",
        "harassment",
        "fake-profile",
        "spam",
        "abusive-language",
        "religious-violations",
        "scam",
        "other"
      ],
      required: true,
      index: true,
    },
    description: {
      type: String,
      maxlength: 1000,
    },
    evidence: [{
      type: String, // screenshot URLs
    }],
    status: {
      type: String,
      enum: ["pending", "investigating", "resolved", "dismissed"],
      default: "pending",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    assignedAt: Date,
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    resolvedAt: Date,
    resolutionNotes: String,
    actionTaken: {
      type: String,
      enum: [
        "no-action",
        "warning-sent",
        "content-removed",
        "user-suspended",
        "user-banned",
        "profile-rejected"
      ]
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
// Admin management
reportSchema.index({
  status: 1,
  priority: -1,
  createdAt: -1,
});
reportSchema.index({
  assignedTo: 1,
  status: 1,
});
// Report analytics
reportSchema.index({
  reason: 1,
  status: 1,
});
reportSchema.index({
  reportedUserId: 1,
  createdAt: -1,
});

// Static methods
reportSchema.statics.createReport = async function (
  data: Partial<IReport>
): Promise<IReport> {
  const report = new this(data);
  return report.save();
};

reportSchema.statics.findPending = async function (): Promise<IReport[]> {
  return this.find({ status: "pending" })
    .populate("reporterId", "firstname lastname email profile")
    .populate("reportedUserId", "firstname lastname email profile")
    .sort({ priority: -1, createdAt: -1 });
};

reportSchema.statics.findByReporter = async function (
  reporterId: mongoose.Types.ObjectId
): Promise<IReport[]> {
  return this.find({ reporterId })
    .populate("reportedUserId", "firstname lastname profile")
    .populate("assignedTo", "firstname lastname")
    .sort({ createdAt: -1 });
};

reportSchema.statics.findByReportedUser = async function (
  reportedUserId: mongoose.Types.ObjectId
): Promise<IReport[]> {
  return this.find({ reportedUserId })
    .populate("reporterId", "firstname lastname profile")
    .populate("assignedTo", "firstname lastname")
    .sort({ createdAt: -1 });
};

reportSchema.statics.getStatistics = async function (): Promise<any[]> {
  return this.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        pending: {
          $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
        },
        investigating: {
          $sum: { $cond: [{ $eq: ["$status", "investigating"] }, 1, 0] },
        },
        resolved: {
          $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] },
        },
        dismissed: {
          $sum: { $cond: [{ $eq: ["$status", "dismissed"] }, 1, 0] },
        },
        critical: {
          $sum: { $cond: [{ $eq: ["$priority", "critical"] }, 1, 0] },
        },
        high: {
          $sum: { $cond: [{ $eq: ["$priority", "high"] }, 1, 0] },
        },
        byReason: {
          $push: "$reason"
        }
      },
    },
  ]);
};

export const Report = mongoose.model<IReport, IReportModel>("Report", reportSchema);
export default Report;