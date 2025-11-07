import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAdminNotification extends Document {
  type:
    | "new_user"
    | "user_report"
    | "flagged_message"
    | "system_alert"
    | "marriage_request";
  title: string;
  message: string;
  priority: "low" | "medium" | "high";
  isRead: boolean;
  readAt?: Date;
  actionRequired: boolean;
  relatedId?: mongoose.Types.ObjectId;
  data?: {
    userId?: mongoose.Types.ObjectId;
    reportId?: mongoose.Types.ObjectId;
    messageId?: mongoose.Types.ObjectId;
    requestId?: mongoose.Types.ObjectId;
    url?: string;
  };

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Methods
  markAsRead(): Promise<IAdminNotification>;
}

interface IAdminNotificationModel extends Model<IAdminNotification> {
  createNotification(data: Partial<IAdminNotification>): Promise<IAdminNotification>;
  markAllAsRead(): Promise<any>;
  getNotifications(options?: {
    filter?: "all" | "unread" | "important";
    limit?: number;
    page?: number;
  }): Promise<{
    notifications: IAdminNotification[];
    total: number;
    page: number;
    totalPages: number;
  }>;
  getUnreadCount(): Promise<number>;
  getUnreadImportantCount(): Promise<number>;
  deleteNotification(id: string): Promise<any>;
}

const adminNotificationSchema = new Schema<IAdminNotification>(
  {
    type: {
      type: String,
      enum: ["new_user", "user_report", "flagged_message", "system_alert", "marriage_request"],
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      maxLength: 100,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      maxLength: 500,
      trim: true,
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
      index: true,
    },

    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    readAt: Date,

    actionRequired: {
      type: Boolean,
      default: false,
    },

    relatedId: {
      type: Schema.Types.ObjectId,
    },

    data: {
      userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      reportId: {
        type: Schema.Types.ObjectId,
        ref: "Report",
      },
      messageId: {
        type: Schema.Types.ObjectId,
        ref: "Message",
      },
      requestId: {
        type: Schema.Types.ObjectId,
        ref: "MarriageRequest",
      },
      url: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Indexes
adminNotificationSchema.index({ isRead: 1, createdAt: -1 });
adminNotificationSchema.index({ priority: 1, isRead: 1 });
adminNotificationSchema.index({ type: 1, createdAt: -1 });
adminNotificationSchema.index({ actionRequired: 1, isRead: 1 });

// Instance methods
adminNotificationSchema.methods.markAsRead = function (
  this: IAdminNotification,
): Promise<IAdminNotification> {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Static methods
adminNotificationSchema.statics.createNotification = function (
  data: Partial<IAdminNotification>,
): Promise<IAdminNotification> {
  return this.create(data);
};

adminNotificationSchema.statics.markAllAsRead = function (): Promise<any> {
  return this.updateMany({ isRead: false }, { isRead: true, readAt: new Date() });
};

adminNotificationSchema.statics.getNotifications = function (
  options?: {
    filter?: "all" | "unread" | "important";
    limit?: number;
    page?: number;
  },
): Promise<{
  notifications: IAdminNotification[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const { filter = "all", limit = 20, page = 1 } = options || {};

  const query: any = {};

  if (filter === "unread") {
    query.isRead = false;
  } else if (filter === "important") {
    query.priority = "high";
  }

  const skip = (page - 1) * limit;

  return this.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .then((notifications: any) => {
      return this.countDocuments(query).then((total: number) => ({
        notifications,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      }));
    });
};

adminNotificationSchema.statics.getUnreadCount = function (): Promise<number> {
  return this.countDocuments({ isRead: false });
};

adminNotificationSchema.statics.getUnreadImportantCount = function (): Promise<number> {
  return this.countDocuments({ isRead: false, priority: "high" });
};

adminNotificationSchema.statics.deleteNotification = function (
  id: string,
): Promise<any> {
  return this.findByIdAndDelete(id);
};

// Create and export the model
const AdminNotification = mongoose.model<IAdminNotification, IAdminNotificationModel>(
  "AdminNotification",
  adminNotificationSchema,
);

export { AdminNotification };
