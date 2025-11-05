import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMessage extends Document {
  chatRoom: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  content: {
    text?: string;
    media?: {
      type: "image" | "video" | "document";
      url: string;
      filename: string;
      size: number;
    };
    messageType: "text" | "media" | "system";
  };
  readBy: {
    user: mongoose.Types.ObjectId;
    readAt: Date;
  }[];
  isEdited: boolean;
  editedAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  replyTo?: mongoose.Types.ObjectId;
  islamicCompliance: {
    isAppropriate: boolean;
    checkedBy: "system" | "moderator";
    flaggedContent?: string[];
  };
  
  // Message moderation fields
  status: "pending" | "approved" | "rejected" | "flagged";
  approvedAt?: Date;
  approvedBy?: mongoose.Types.ObjectId;
  rejectionReason?: string;
  rejectedAt?: Date;
  rejectedBy?: mongoose.Types.ObjectId;
  
  // Methods
  markAsRead(userId: mongoose.Types.ObjectId): Promise<IMessage>;
  softDelete(): Promise<IMessage>;
  edit(newContent: string): Promise<IMessage>;
  checkCompliance(): boolean;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

interface IMessageModel extends Model<IMessage> {
  findByChatRoom(
    chatRoomId: mongoose.Types.ObjectId,
    page?: number,
    limit?: number,
  ): Promise<IMessage[]>;
  findUnreadByUser(userId: mongoose.Types.ObjectId): Promise<IMessage[]>;
  markChatAsRead(
    chatRoomId: mongoose.Types.ObjectId,
    userId: mongoose.Types.ObjectId,
  ): Promise<any>;
}

const messageSchema = new Schema<IMessage>(
  {
    chatRoom: {
      type: Schema.Types.ObjectId,
      ref: "ChatRoom",
      required: true,
      index: true,
    },

    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    content: {
      text: {
        type: String,
        maxLength: 1000,
        trim: true,
      },
      media: {
        type: {
          type: String,
          enum: ["image", "video", "document"],
        },
        url: String,
        filename: String,
        size: Number,
      },
      messageType: {
        type: String,
        enum: ["text", "media", "system"],
        default: "text",
        required: true,
      },
    },

    readBy: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        readAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    isEdited: {
      type: Boolean,
      default: false,
    },

    editedAt: Date,

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: Date,

    replyTo: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },

    islamicCompliance: {
      isAppropriate: {
        type: Boolean,
        default: true,
      },
      checkedBy: {
        type: String,
        enum: ["system", "moderator"],
        default: "system",
      },
      flaggedContent: [String],
    },
    
    // Message moderation fields
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "flagged"],
      default: "pending",
      index: true,
    },
    approvedAt: Date,
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    rejectionReason: String,
    rejectedAt: Date,
    rejectedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Indexes
messageSchema.index({ chatRoom: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ isDeleted: 1, createdAt: -1 });
messageSchema.index({ "readBy.user": 1 });

// Instance methods
messageSchema.methods.markAsRead = function (
  this: IMessage,
  userId: mongoose.Types.ObjectId,
): Promise<IMessage> {
  const alreadyRead = this.readBy.some(
    (read) => read.user.toString() === userId.toString(),
  );
  if (!alreadyRead) {
    this.readBy.push({
      user: userId,
      readAt: new Date(),
    });
  }
  return this.save();
};

messageSchema.methods.softDelete = function (
  this: IMessage,
): Promise<IMessage> {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

messageSchema.methods.edit = function (
  this: IMessage,
  newContent: string,
): Promise<IMessage> {
  this.content.text = newContent;
  this.isEdited = true;
  this.editedAt = new Date();
  return this.save();
};

messageSchema.methods.checkCompliance = function (this: IMessage): boolean {
  // Simple content checking - in production, this would use more sophisticated NLP
  // For Arabic text analysis, we would ideally use a library like natural or a custom Arabic NLP service
  const inappropriateWords = [
    // This is a basic example list - in production, this would be much more comprehensive
    "inappropriate", "bad", "wrong",
    // Arabic examples (would need proper Unicode handling)
    "غير لائق", "سيء", "خطأ"
  ];
  
  const text = this.content.text?.toLowerCase() || "";

  const hasInappropriateContent = inappropriateWords.some((word) =>
    text.includes(word.toLowerCase()),
  );

  if (hasInappropriateContent) {
    this.islamicCompliance.isAppropriate = false;
    this.islamicCompliance.flaggedContent = inappropriateWords.filter((word) =>
      text.includes(word.toLowerCase()),
    );
  }

  return this.islamicCompliance.isAppropriate;
};

// Static methods
messageSchema.statics.findByChatRoom = function (
  chatRoomId: mongoose.Types.ObjectId,
  page: number = 1,
  limit: number = 50,
): Promise<IMessage[]> {
  const skip = (page - 1) * limit;
  return this.find({
    chatRoom: chatRoomId,
    isDeleted: false,
  })
    .populate("sender", "firstname lastname")
    .populate("replyTo")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

messageSchema.statics.findUnreadByUser = function (
  userId: mongoose.Types.ObjectId,
): Promise<IMessage[]> {
  return this.find({
    "readBy.user": { $ne: userId },
    sender: { $ne: userId },
    isDeleted: false,
  })
    .populate("chatRoom")
    .populate("sender", "firstname lastname")
    .sort({ createdAt: -1 });
};

messageSchema.statics.markChatAsRead = function (
  chatRoomId: mongoose.Types.ObjectId,
  userId: mongoose.Types.ObjectId,
): Promise<any> {
  return this.updateMany(
    {
      chatRoom: chatRoomId,
      "readBy.user": { $ne: userId },
      sender: { $ne: userId },
      isDeleted: false,
    },
    {
      $addToSet: {
        readBy: {
          user: userId,
          readAt: new Date(),
        },
      },
    },
  );
};

export const Message = mongoose.model<IMessage, IMessageModel>(
  "Message",
  messageSchema,
);
export default Message;
