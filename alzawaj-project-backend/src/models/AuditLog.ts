import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAuditLog extends Document {
  userId?: mongoose.Types.ObjectId;
  action: string;
  resource: string;
  resourceId?: mongoose.Types.ObjectId;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  outcome: "success" | "failure" | "error";
  createdAt: Date;
}

interface IAuditLogModel extends Model<IAuditLog> {
  logAction(
    userId: mongoose.Types.ObjectId | null,
    action: string,
    resource: string,
    resourceId: mongoose.Types.ObjectId | null,
    details: Record<string, any>,
    metadata?: {
      ipAddress?: string;
      userAgent?: string;
      outcome?: "success" | "failure" | "error";
    }
  ): Promise<IAuditLog>;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    resource: {
      type: String,
      required: true,
      index: true,
    },
    resourceId: {
      type: Schema.Types.ObjectId,
      index: true,
    },
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },
    ipAddress: String,
    userAgent: String,
    outcome: {
      type: String,
      enum: ["success", "failure", "error"],
      default: "success",
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Indexes
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ userId: 1, action: 1, createdAt: -1 });
// TTL index - keep logs for 6 months (15552000 seconds)
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 15552000 });

// Static methods
auditLogSchema.statics.logAction = async function (
  userId: mongoose.Types.ObjectId | null,
  action: string,
  resource: string,
  resourceId: mongoose.Types.ObjectId | null,
  details: Record<string, any>,
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    outcome?: "success" | "failure" | "error";
  }
): Promise<IAuditLog> {
  const logEntry = new this({
    userId,
    action,
    resource,
    resourceId,
    details,
    ipAddress: metadata?.ipAddress,
    userAgent: metadata?.userAgent,
    outcome: metadata?.outcome || "success",
  });
  
  return logEntry.save();
};

export const AuditLog = mongoose.model<IAuditLog, IAuditLogModel>("AuditLog", auditLogSchema);
export default AuditLog;