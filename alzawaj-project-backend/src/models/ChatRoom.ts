import mongoose, { Schema, Document, Model } from "mongoose";

export interface IChatRoom extends Document {
  participants: {
    user: mongoose.Types.ObjectId;
    joinedAt: Date;
    lastSeen: Date;
    isActive: boolean;
    role: "member" | "admin";
  }[];
  name?: string;
  type: "direct" | "group" | "guardian" | "marriage_discussion";
  marriageRequest?: mongoose.Types.ObjectId;
  lastMessage?: {
    content?: string;
    sender?: mongoose.Types.ObjectId;
    timestamp?: Date;
    type: "text" | "image" | "file" | "system";
  };
  settings: {
    isEncrypted: boolean;
    guardianSupervision: {
      isRequired: boolean;
      guardian?: mongoose.Types.ObjectId;
      canSeeMessages: boolean;
    };
    messageRestrictions: {
      allowImages: boolean;
      allowFiles: boolean;
      maxMessageLength: number;
    };
  };
  isActive: boolean;
  archivedBy: mongoose.Types.ObjectId[];
  deletedBy: mongoose.Types.ObjectId[];
  expiresAt?: Date;

  // Methods
  addParticipant(
    userId: mongoose.Types.ObjectId,
    role?: string,
  ): Promise<IChatRoom>;
  removeParticipant(userId: mongoose.Types.ObjectId): Promise<IChatRoom>;
  updateLastSeen(userId: mongoose.Types.ObjectId): Promise<IChatRoom>;
  archive(userId: mongoose.Types.ObjectId): Promise<IChatRoom>;
  canUserAccess(userId: mongoose.Types.ObjectId): boolean;
}

interface IChatRoomModel extends Model<IChatRoom> {
  findByUser(userId: mongoose.Types.ObjectId): Promise<IChatRoom[]>;
  findDirectChat(
    user1: mongoose.Types.ObjectId,
    user2: mongoose.Types.ObjectId,
  ): Promise<IChatRoom | null>;
  createDirectChat(
    user1: mongoose.Types.ObjectId,
    user2: mongoose.Types.ObjectId,
    marriageRequestId?: mongoose.Types.ObjectId,
  ): Promise<IChatRoom>;
}

const chatRoomSchema = new Schema<IChatRoom>(
  {
    participants: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
        lastSeen: {
          type: Date,
          default: Date.now,
        },
        isActive: {
          type: Boolean,
          default: true,
        },
        role: {
          type: String,
          enum: ["member", "admin"],
          default: "member",
        },
      },
    ],

    name: {
      type: String,
      trim: true,
      maxLength: 100,
      default: null,
    },

    type: {
      type: String,
      enum: ["direct", "group", "guardian", "marriage_discussion"],
      default: "direct",
      index: true,
    },

    marriageRequest: {
      type: Schema.Types.ObjectId,
      ref: "MarriageRequest",
      default: null,
    },

    lastMessage: {
      content: {
        type: String,
        default: null,
      },
      sender: {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      timestamp: {
        type: Date,
        default: null,
      },
      type: {
        type: String,
        enum: ["text", "image", "file", "system"],
        default: "text",
      },
    },

    settings: {
      isEncrypted: {
        type: Boolean,
        default: true,
      },

      guardianSupervision: {
        isRequired: {
          type: Boolean,
          default: false,
        },
        guardian: {
          type: Schema.Types.ObjectId,
          ref: "User",
          default: null,
        },
        canSeeMessages: {
          type: Boolean,
          default: true,
        },
      },

      messageRestrictions: {
        allowImages: {
          type: Boolean,
          default: true,
        },
        allowFiles: {
          type: Boolean,
          default: true,
        },
        maxMessageLength: {
          type: Number,
          default: 1000,
        },
      },
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    archivedBy: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    deletedBy: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Indexes
chatRoomSchema.index({ "participants.user": 1, isActive: 1 });
chatRoomSchema.index({ type: 1, createdAt: -1 });
chatRoomSchema.index({ marriageRequest: 1 }, { name: "chatroom_marriage_request_idx" });

// Instance methods
chatRoomSchema.methods.addParticipant = function (
  this: IChatRoom,
  userId: mongoose.Types.ObjectId,
  role: string = "member",
): Promise<IChatRoom> {
  const existingParticipant = this.participants.find(
    (p) => p.user.toString() === userId.toString(),
  );
  if (!existingParticipant) {
    this.participants.push({
      user: userId,
      joinedAt: new Date(),
      lastSeen: new Date(),
      isActive: true,
      role: role as "member" | "admin",
    });
  }
  return this.save();
};

chatRoomSchema.methods.removeParticipant = function (
  this: IChatRoom,
  userId: mongoose.Types.ObjectId,
): Promise<IChatRoom> {
  this.participants = this.participants.filter(
    (p) => p.user.toString() !== userId.toString(),
  );
  return this.save();
};

chatRoomSchema.methods.updateLastSeen = function (
  this: IChatRoom,
  userId: mongoose.Types.ObjectId,
): Promise<IChatRoom> {
  const participant = this.participants.find(
    (p) => p.user.toString() === userId.toString(),
  );
  if (participant) {
    participant.lastSeen = new Date();
  }
  return this.save();
};

chatRoomSchema.methods.archive = function (
  this: IChatRoom,
  userId: mongoose.Types.ObjectId,
): Promise<IChatRoom> {
  if (!this.archivedBy.includes(userId)) {
    this.archivedBy.push(userId);
  }
  return this.save();
};

chatRoomSchema.methods.canUserAccess = function (
  this: IChatRoom,
  userId: mongoose.Types.ObjectId,
): boolean {
  return this.participants.some(
    (p) => p.user.toString() === userId.toString() && p.isActive,
  );
};

// Static methods
chatRoomSchema.statics.findByUser = function (
  userId: mongoose.Types.ObjectId,
): Promise<IChatRoom[]> {
  return this.find({
    "participants.user": userId,
    "participants.isActive": true,
    isActive: true,
  })
    .populate("participants.user", "firstname lastname")
    .populate("lastMessage.sender", "firstname lastname")
    .sort({ "lastMessage.timestamp": -1 });
};

chatRoomSchema.statics.findDirectChat = function (
  user1: mongoose.Types.ObjectId,
  user2: mongoose.Types.ObjectId,
): Promise<IChatRoom | null> {
  return this.findOne({
    type: "direct",
    "participants.user": { $all: [user1, user2] },
    participants: { $size: 2 },
    isActive: true,
  });
};

chatRoomSchema.statics.createDirectChat = function (
  user1: mongoose.Types.ObjectId,
  user2: mongoose.Types.ObjectId,
  marriageRequestId?: mongoose.Types.ObjectId,
): Promise<IChatRoom> {
  const chatData: any = {
    type: "direct",
    participants: [
      { user: user1, role: "member" },
      { user: user2, role: "member" },
    ],
    settings: {
      isEncrypted: true,
      guardianSupervision: {
        isRequired: false,
        canSeeMessages: true,
      },
      messageRestrictions: {
        allowImages: true,
        allowFiles: true,
        maxMessageLength: 1000,
      },
    },
  };

  if (marriageRequestId) {
    chatData.marriageRequest = marriageRequestId;
  }

  return (async () => {
    const result = await this.create(chatData);
    // Ensure we return a single ChatRoom document
    if (Array.isArray(result)) {
      return result[0];
    }
    return result;
  })();
};

export const ChatRoom = mongoose.model<IChatRoom, IChatRoomModel>(
  "ChatRoom",
  chatRoomSchema,
);
export default ChatRoom;
