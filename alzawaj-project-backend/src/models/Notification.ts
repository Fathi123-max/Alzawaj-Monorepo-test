import mongoose, { Schema, Document, Model } from "mongoose";

export interface INotification extends Document {
  user: mongoose.Types.ObjectId;
  type:
    | "marriage_request"
    | "message"
    | "profile_view"
    | "match"
    | "guardian_approval"
    | "verification"
    | "system";
  title: string;
  message: string;
  data?: {
    requestId?: mongoose.Types.ObjectId;
    chatRoomId?: mongoose.Types.ObjectId;
    profileId?: mongoose.Types.ObjectId;
    url?: string;
  };
  isRead: boolean;
  readAt?: Date;
  priority: "low" | "medium" | "high" | "urgent";
  expiresAt?: Date;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Methods
  markAsRead(): Promise<INotification>;
  isExpired(): boolean;
}

interface INotificationModel extends Model<INotification> {
  findByUser(
    userId: mongoose.Types.ObjectId,
    unreadOnly?: boolean,
  ): Promise<INotification[]>;
  createNotification(data: Partial<INotification>): Promise<INotification>;
  markAllAsRead(userId: mongoose.Types.ObjectId): Promise<any>;
  deleteExpired(): Promise<any>;
  createMarriageRequestNotification(data: any): Promise<INotification>;
  createGuardianNotification(data: any): Promise<INotification>;
  createMarriageResponseNotification(data: any): Promise<INotification>;
  createMeetingProposalNotification(data: any): Promise<INotification>;
  createMeetingConfirmationNotification(data: any): Promise<INotification>;
}

const notificationSchema = new Schema<INotification>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: [
        "marriage_request",
        "message",
        "profile_view",
        "match",
        "guardian_approval",
        "verification",
        "system",
      ],
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

    data: {
      requestId: {
        type: Schema.Types.ObjectId,
        ref: "MarriageRequest",
      },
      chatRoomId: {
        type: Schema.Types.ObjectId,
        ref: "ChatRoom",
      },
      profileId: {
        type: Schema.Types.ObjectId,
        ref: "Profile",
      },
      url: String,
    },

    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    readAt: Date,

    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
      index: true,
    },

    expiresAt: {
      type: Date,
      index: { expireAfterSeconds: 0 },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Indexes
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ priority: 1, isRead: 1 });

// Instance methods
notificationSchema.methods.markAsRead = function (
  this: INotification,
): Promise<INotification> {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

notificationSchema.methods.isExpired = function (this: INotification): boolean {
  return this.expiresAt ? new Date() > this.expiresAt : false;
};

// Static methods
notificationSchema.statics.findByUser = function (
  userId: mongoose.Types.ObjectId,
  unreadOnly: boolean = false,
): Promise<INotification[]> {
  const query: any = { user: userId };
  if (unreadOnly) {
    query.isRead = false;
  }

  return this.find(query).sort({ createdAt: -1 }).limit(50);
};

notificationSchema.statics.createNotification = function (
  data: Partial<INotification>,
): Promise<INotification> {
  return this.create(data);
};

notificationSchema.statics.markAllAsRead = function (
  userId: mongoose.Types.ObjectId,
): Promise<any> {
  return this.updateMany(
    { user: userId, isRead: false },
    {
      $set: {
        isRead: true,
        readAt: new Date(),
      },
    },
  );
};

notificationSchema.statics.deleteExpired = function (): Promise<any> {
  return this.deleteMany({
    expiresAt: { $lt: new Date() },
  });
};

notificationSchema.statics.createMarriageRequestNotification = function (
  data: any,
): Promise<INotification> {
  return this.create({
    user: data.receiver,
    type: "marriage_request",
    title: "طلب زواج جديد",
    message: `لديك طلب زواج جديد من ${data.sender.profile.basicInfo.name}`,
    data: {
      requestId: data.marriageRequest._id,
      profileId: data.sender._id,
    },
    priority: "high",
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  });
};

notificationSchema.statics.createGuardianNotification = function (
  data: any,
): Promise<INotification> {
  // For now, notify the receiver (female user) that guardian approval is needed
  // In a real system, you might have a separate guardian user account
  return this.create({
    user: data.receiverId || data.receiver, // The female user who needs guardian approval
    type: "guardian_approval",
    title: "طلب موافقة ولي أمر",
    message: `طلب زواج من ${data.senderProfile.basicInfo.name} يحتاج موافقة ولي الأمر`,
    data: {
      requestId: data.marriageRequest._id,
      profileId: data.senderProfile._id,
    },
    priority: "urgent",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  });
};

notificationSchema.statics.createMarriageResponseNotification = function (
  data: any,
): Promise<INotification> {
  const responseText =
    data.response === "accepted" ? "تم قبول طلب الزواج" : "تم رفض طلب الزواج";

  return this.create({
    user: data.receiver,
    type: "marriage_request",
    title: responseText,
    message: `${data.sender.profile.basicInfo.name} ${responseText.toLowerCase()}`,
    data: {
      requestId: data.marriageRequest._id,
      profileId: data.sender._id,
    },
    priority: "high",
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  });
};

notificationSchema.statics.createMeetingProposalNotification = function (
  data: any,
): Promise<INotification> {
  return this.create({
    user: data.receiver,
    type: "marriage_request",
    title: "اقتراح موعد لقاء",
    message: `${data.proposer} اقترح موعد لقاء`,
    data: {
      requestId: data.marriageRequest._id,
    },
    priority: "medium",
    expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
  });
};

notificationSchema.statics.createMeetingConfirmationNotification = function (
  data: any,
): Promise<INotification> {
  const confirmedText = data.confirmed
    ? "تم تأكيد موعد اللقاء"
    : "تم رفض موعد اللقاء";

  return this.create({
    user: data.receiver,
    type: "marriage_request",
    title: confirmedText,
    message: confirmedText,
    data: {
      requestId: data.marriageRequest._id,
    },
    priority: data.confirmed ? "high" : "medium",
    expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
  });
};

export const Notification = mongoose.model<INotification, INotificationModel>(
  "Notification",
  notificationSchema,
);
export default Notification;
