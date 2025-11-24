import { Request, Response, NextFunction } from "express";
import { MarriageRequest } from "../models/MarriageRequest";
import { Profile } from "../models/Profile";
import { Notification } from "../models/Notification";
import { ChatRoom } from "../models/ChatRoom";
import {
  successResponse,
  errorResponse,
  createSuccessResponse,
  createErrorResponse,
} from "../utils/responseHelper";
import { IUser, IMarriageRequest, IProfile } from "../types";

// Extend Request interface for authentication
interface AuthenticatedRequest extends Request {
  user?: IUser;
}

interface MarriageRequestData {
  receiverId: string;
  message: string;
  contactInfo?: {
    preferredContactMethod?: "email" | "phone" | "whatsapp";
    alternativeContact?: string;
    bestTimeToContact?: string;
    guardianContact?: string;
  };
}

interface MeetingData {
  date: Date;
  time: string;
  location: string;
  meetingType: "family_meeting" | "guardian_meeting" | "public_meeting";
  notes?: string;
}

/**
 * Send a marriage request
 */
export const sendMarriageRequest = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const senderId = req.user?.id;
    const { receiverId, message, contactInfo }: MarriageRequestData = req.body;

    if (!receiverId || !message) {
      res
        .status(400)
        .json(createErrorResponse("معرف المستقبل والرسالة مطلوبان"));
      return;
    }

    if (senderId === receiverId) {
      res.status(400).json(createErrorResponse("لا يمكن إرسال طلب زواج لنفسك"));
      return;
    }

    // Check if sender and receiver profiles exist
    const [senderProfile, receiverProfile] = await Promise.all([
      Profile.findOne({ userId: senderId }),
      Profile.findOne({ userId: receiverId }),
    ]);

    if (!senderProfile || !receiverProfile) {
      res.status(404).json(createErrorResponse("الملف الشخصي غير موجود"));
      return;
    }

    // Check if sender's profile is complete enough
    const completionPercentage = senderProfile.completionPercentage || 0;
    if (completionPercentage < 80) {
      res
        .status(400)
        .json(
          createErrorResponse(
            "يجب إكمال 80% على الأقل من الملف الشخصي لإرسال طلبات الزواج"
          )
        );
      return;
    }

    // Check if receiver can receive requests from sender
    const canReceiveRequest = await receiverProfile.canReceiveRequestFrom(
      senderId as string
    );
    
    console.log('[sendMarriageRequest] Receiver check:', {
      receiverId,
      receiverName: receiverProfile.name,
      canReceiveRequest,
      isComplete: receiverProfile.isComplete,
      isApproved: receiverProfile.isApproved,
      isDeleted: receiverProfile.isDeleted,
      allowMessagesFrom: receiverProfile.privacy?.allowMessagesFrom,
      allowContactRequests: receiverProfile.privacy?.allowContactRequests,
    });
    
    if (!canReceiveRequest) {
      res
        .status(403)
        .json(createErrorResponse("لا يمكن إرسال طلب زواج لهذا المستخدم"));
      return;
    }

    // Check privacy settings for contact requests
    if (receiverProfile.privacy?.allowContactRequests) {
      const setting = receiverProfile.privacy.allowContactRequests;
      
      if (setting === 'none') {
        res.status(403).json(createErrorResponse("المستخدم لا يقبل طلبات تواصل"));
        return;
      }
      
      if (setting === 'verified-only') {
        // Check if sender is verified
        if (!senderProfile.verification?.isVerified) {
          res.status(403).json(createErrorResponse("يجب أن تكون موثقاً لإرسال طلب تواصل"));
          return;
        }
      }
      
      if (setting === 'guardian-approved') {
        // Mark request as requiring guardian approval
        // This will be handled in the request creation below
      }
    }

    // Check if there's already an active request between these users
    const existingRequest = await MarriageRequest.checkExistingRequest(
      senderId as any,
      receiverId as any
    );
    if (existingRequest) {
      res
        .status(400)
        .json(
          createErrorResponse("يوجد طلب زواج نشط بالفعل بين هذين المستخدمين")
        );
      return;
    }

    // TODO: Rate limiting - Users can only send 1 request every 48 hours
    // Currently disabled, enable this check when needed
    /*
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const recentRequests = await MarriageRequest.countDocuments({
      sender: senderId,
      createdAt: { $gte: fortyEightHoursAgo },
    });

    if (recentRequests > 0) {
      res
        .status(429)
        .json(
          createErrorResponse(
            "يمكنك إرسال طلب زواح واحد فقط كل 48 ساعة. حاول مرة أخرى لاحقاً"
          )
        );
      return;
    }
    */

    // Calculate compatibility score
    const compatibility = MarriageRequest.getCompatibilityScore(
      senderProfile,
      receiverProfile
    );

    // Create marriage request
    const marriageRequest = new MarriageRequest({
      sender: senderId,
      receiver: receiverId,
      message,
      metadata: {
        source: "direct",
      },
    } as any);

    // Check if guardian approval is required (for female receivers or privacy setting)
    const requiresGuardianApproval = 
      (receiverProfile.gender === "f" && receiverProfile.guardianInfo) ||
      receiverProfile.privacy?.requireGuardianApproval === true;
      
    if (requiresGuardianApproval) {
      marriageRequest.guardianApproval = {
        isRequired: true,
        isApproved: false,
      };
    }

    await marriageRequest.save();

    // Create notification for receiver
    await Notification.createMarriageRequestNotification({
      sender: { _id: senderId, profile: senderProfile },
      receiver: receiverId,
      marriageRequest: marriageRequest as any,
    });

    // If guardian approval is required, notify guardian too
    if ((receiverProfile.guardianInfo as any)?.phone) {
      await Notification.createGuardianNotification({
        guardian: receiverProfile.guardianInfo,
        marriageRequest: marriageRequest as any,
        senderProfile,
      });
    }

    res.status(201).json(
      createSuccessResponse("تم إرسال طلب الزواج بنجاح", {
        marriageRequest: {
          id: marriageRequest._id,
          receiver: receiverId,
          status: marriageRequest.status,
          compatibility,
          createdAt: marriageRequest.createdAt,
          guardianApprovalRequired:
            marriageRequest.guardianApproval?.isRequired,
        },
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get received marriage requests
 */
export const getReceivedRequests = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const {
      status,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Build query
    const query: any = { receiver: userId };

    if (status && status !== "all") {
      query.status = status;
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);
    const sortOptions: any = {};
    sortOptions[sortBy as string] = sortOrder === "desc" ? -1 : 1;

    // Get requests with sender profiles
    const [requests, totalCount] = await Promise.all([
      MarriageRequest.find(query)
        .populate({
          path: "sender",
          populate: {
            path: "profile",
            select:
              "basicInfo location education professional photos verification",
          },
        })
        .sort(sortOptions)
        .skip(skip)
        .limit(Number(limit)),
      MarriageRequest.countDocuments(query),
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / Number(limit));
    const hasNextPage = Number(page) < totalPages;
    const hasPrevPage = Number(page) > 1;

    // Group requests by status for easy filtering
    const requestsByStatus = {
      pending: await MarriageRequest.countDocuments({
        receiver: userId,
        status: "pending",
      }),
      accepted: await MarriageRequest.countDocuments({
        receiver: userId,
        status: "accepted",
      }),
      rejected: await MarriageRequest.countDocuments({
        receiver: userId,
        status: "rejected",
      }),
      cancelled: await MarriageRequest.countDocuments({
        receiver: userId,
        status: "cancelled",
      }),
      expired: await MarriageRequest.countDocuments({
        receiver: userId,
        status: "expired",
      }),
    };

    res.json(
      createSuccessResponse("تم جلب طلبات الزواج المستقبلة بنجاح", {
        requests,
        pagination: {
          currentPage: Number(page),
          totalPages,
          totalCount,
          hasNextPage,
          hasPrevPage,
          limit: Number(limit),
        },
        summary: {
          total: totalCount,
          byStatus: requestsByStatus,
        },
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get sent marriage requests
 */
export const getSentRequests = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const {
      status,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Build query
    const query: any = { sender: userId };

    if (status && status !== "all") {
      query.status = status;
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);
    const sortOptions: any = {};
    sortOptions[sortBy as string] = sortOrder === "desc" ? -1 : 1;

    // Get requests with receiver profiles
    const [requests, totalCount] = await Promise.all([
      MarriageRequest.find(query)
        .populate({
          path: "receiver",
          populate: {
            path: "profile",
            select:
              "basicInfo location education professional photos verification",
          },
        })
        .sort(sortOptions)
        .skip(skip)
        .limit(Number(limit)),
      MarriageRequest.countDocuments(query),
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / Number(limit));
    const hasNextPage = Number(page) < totalPages;
    const hasPrevPage = Number(page) > 1;

    // Group requests by status
    const requestsByStatus = {
      pending: await MarriageRequest.countDocuments({
        sender: userId,
        status: "pending",
      }),
      accepted: await MarriageRequest.countDocuments({
        sender: userId,
        status: "accepted",
      }),
      rejected: await MarriageRequest.countDocuments({
        sender: userId,
        status: "rejected",
      }),
      cancelled: await MarriageRequest.countDocuments({
        sender: userId,
        status: "cancelled",
      }),
      expired: await MarriageRequest.countDocuments({
        sender: userId,
        status: "expired",
      }),
    };

    res.json(
      createSuccessResponse("تم جلب طلبات الزواج المرسلة بنجاح", {
        requests,
        pagination: {
          currentPage: Number(page),
          totalPages,
          totalCount,
          hasNextPage,
          hasPrevPage,
          limit: Number(limit),
        },
        summary: {
          total: totalCount,
          byStatus: requestsByStatus,
        },
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Accept a marriage request
 */
export const acceptRequest = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { requestId } = req.params;
    const { message } = req.body;

    const marriageRequest =
      await MarriageRequest.findById(requestId).populate("sender receiver");

    if (!marriageRequest) {
      res.status(404).json(createErrorResponse("طلب الزواج غير موجود"));
      return;
    }

    // Check if user is the receiver
    if (marriageRequest.receiver._id.toString() !== userId) {
      res
        .status(403)
        .json(createErrorResponse("ليس لديك صلاحية لقبول هذا الطلب"));
      return;
    }

    // Check if request is still pending
    if (marriageRequest.status !== "pending") {
      res.status(400).json(createErrorResponse("لا يمكن قبول هذا الطلب"));
      return;
    }

    // Update request status
    marriageRequest.status = "accepted";
    marriageRequest.response.message = message;
    marriageRequest.response.responseDate = new Date();

    await marriageRequest.save();

    // Create chat room for the couple
    const chatRoom = new ChatRoom({
      participants: [marriageRequest.sender._id, marriageRequest.receiver._id],
      marriageRequest: marriageRequest._id,
      type: "marriage_discussion",
      isActive: true,
      createdBy: userId,
    });

    await chatRoom.save();

    // Create notification for sender
    await Notification.createMarriageResponseNotification({
      sender: marriageRequest.receiver,
      receiver: marriageRequest.sender._id,
      marriageRequest,
      response: "accepted",
    });

    res.json(
      createSuccessResponse("تم قبول طلب الزواج بنجاح", {
        marriageRequest,
        chatRoom: {
          id: chatRoom._id,
          participants: chatRoom.participants,
        },
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Reject a marriage request
 */
export const rejectRequest = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { requestId } = req.params;
    const { message, reason } = req.body;

    const marriageRequest =
      await MarriageRequest.findById(requestId).populate("sender receiver");

    if (!marriageRequest) {
      res.status(404).json(createErrorResponse("طلب الزواج غير موجود"));
      return;
    }

    // Check if user is the receiver
    if (marriageRequest.receiver._id.toString() !== userId) {
      res
        .status(403)
        .json(createErrorResponse("ليس لديك صلاحية لرفض هذا الطلب"));
      return;
    }

    // Check if request is still pending
    if (marriageRequest.status !== "pending") {
      res.status(400).json(createErrorResponse("لا يمكن رفض هذا الطلب"));
      return;
    }

    // Update request status
    marriageRequest.status = "rejected";
    marriageRequest.response.message = message;
    marriageRequest.response.reason = reason as any;
    marriageRequest.response.responseDate = new Date();

    await marriageRequest.save();

    // Create notification for sender
    await Notification.createMarriageResponseNotification({
      sender: marriageRequest.receiver,
      receiver: marriageRequest.sender._id,
      marriageRequest,
      response: "rejected",
    });

    res.json(
      createSuccessResponse("تم رفض طلب الزواج بنجاح", {
        marriageRequest,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel a sent marriage request
 */
export const cancelRequest = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { requestId } = req.params;

    const marriageRequest = await MarriageRequest.findById(requestId);

    if (!marriageRequest) {
      res.status(404).json(createErrorResponse("طلب الزواج غير موجود"));
      return;
    }

    // Check if user is the sender
    if (marriageRequest.sender.toString() !== userId) {
      res
        .status(403)
        .json(createErrorResponse("ليس لديك صلاحية لإلغاء هذا الطلب"));
      return;
    }

    // Check if request can be cancelled
    if (marriageRequest.status !== "pending") {
      res.status(400).json(createErrorResponse("لا يمكن إلغاء هذا الطلب"));
      return;
    }

    // Update request status
    marriageRequest.status = "cancelled";

    await marriageRequest.save();

    res.json(createSuccessResponse("تم إلغاء طلب الزواج بنجاح"));
  } catch (error) {
    next(error);
  }
};

/**
 * Mark request as read
 */
export const markAsRead = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { requestId } = req.params;

    const marriageRequest = await MarriageRequest.findById(requestId);

    if (!marriageRequest) {
      res.status(404).json(createErrorResponse("طلب الزواج غير موجود"));
      return;
    }

    // Check if user is the receiver
    if (marriageRequest.receiver.toString() !== userId) {
      res
        .status(403)
        .json(createErrorResponse("ليس لديك صلاحية لتحديث هذا الطلب"));
      return;
    }

    // Update status if it's pending
    if (marriageRequest.status === "pending") {
      marriageRequest.status = "accepted";
      (marriageRequest as any).viewedAt = new Date();

      // (marriageRequest as any).timeline.push({
      //   action: "viewed",
      //   timestamp: new Date(),
      //   message: "تم عرض طلب الزواج",
      // });

      await marriageRequest.save();
    }

    res.json(createSuccessResponse("تم تحديد الطلب كمقروء"));
  } catch (error) {
    next(error);
  }
};

/**
 * Arrange meeting
 */
export const arrangeMeeting = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { requestId } = req.params;
    const meetingData: MeetingData = req.body;

    const marriageRequest =
      await MarriageRequest.findById(requestId).populate("sender receiver");

    if (!marriageRequest) {
      res.status(404).json(createErrorResponse("طلب الزواج غير موجود"));
      return;
    }

    // Check if user is part of this request and request is accepted
    const isParticipant = [
      marriageRequest.sender._id.toString(),
      marriageRequest.receiver._id.toString(),
    ].includes(userId as string);

    if (!isParticipant) {
      res
        .status(403)
        .json(createErrorResponse("ليس لديك صلاحية لترتيب لقاء لهذا الطلب"));
      return;
    }

    if (marriageRequest.status !== "accepted") {
      res
        .status(400)
        .json(createErrorResponse("يجب قبول طلب الزواج أولاً لترتيب لقاء"));
      return;
    }

    // Set meeting details
    if (!(marriageRequest as any).meetings) {
      (marriageRequest as any).meetings = [];
    }

    (marriageRequest as any).meetings.push({
      date: meetingData.date,
      location: meetingData.location,
      type: meetingData.meetingType,
      status: "pending",
      notes: meetingData.notes,
      proposedBy: userId as any,
      proposedAt: new Date(),
    } as any);

    // Update timeline
    if (!(marriageRequest as any).timeline) {
      (marriageRequest as any).timeline = [];
    }

    (marriageRequest as any).timeline.push({
      action: "meeting_proposed",
      actor: userId as any,
      timestamp: new Date(),
      details: {
        date: meetingData.date,
        time: meetingData.time,
        location: meetingData.location,
      },
    } as any);

    await marriageRequest.save();

    // Notify the other party
    const otherPartyId =
      marriageRequest.sender._id.toString() === userId
        ? marriageRequest.receiver._id
        : marriageRequest.sender._id;

    await Notification.createMeetingProposalNotification({
      proposer: userId as string,
      receiver: otherPartyId,
      marriageRequest,
      meetingDetails: meetingData,
    });

    res.json(
      createSuccessResponse("تم اقتراح موعد اللقاء بنجاح", {
        meeting: marriageRequest.meeting,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Confirm meeting
 */
export const confirmMeeting = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { requestId } = req.params;
    const { confirm } = req.body;

    const marriageRequest = await MarriageRequest.findById(requestId);

    if (!marriageRequest) {
      res.status(404).json(createErrorResponse("طلب الزواج غير موجود"));
      return;
    }

    // Check if there's a meeting arranged
    if (!marriageRequest.meeting.isArranged) {
      res.status(404).json(createErrorResponse("لا يوجد موعد لقاء مُرتب"));
      return;
    }

    // Check if user is part of this request
    const isParticipant = [
      marriageRequest.sender.toString(),
      marriageRequest.receiver.toString(),
    ].includes(userId as string);

    if (!isParticipant) {
      res
        .status(403)
        .json(createErrorResponse("ليس لديك صلاحية لتأكيد هذا اللقاء"));
      return;
    }

    // Update meeting status
    marriageRequest.meeting.status = confirm ? "confirmed" : "cancelled";

    await marriageRequest.save();

    // Notify the other party
    const otherParty =
      marriageRequest.sender.toString() === userId
        ? marriageRequest.receiver.toString()
        : marriageRequest.sender.toString();

    await Notification.createMeetingConfirmationNotification({
      confirmer: userId as string,
      receiver: otherParty,
      marriageRequest,
      meeting: marriageRequest.meeting,
      confirmed: confirm,
    });

    res.json(
      createSuccessResponse(
        confirm ? "تم تأكيد موعد اللقاء بنجاح" : "تم رفض موعد اللقاء",
        {
          meeting: marriageRequest.meeting,
        }
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get request details
 */
export const getRequestDetails = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { requestId } = req.params;

    const marriageRequest = await MarriageRequest.findById(requestId)
      .populate({
        path: "sender",
        populate: {
          path: "profile",
          select:
            "basicInfo location education professional photos verification",
        },
      })
      .populate({
        path: "receiver",
        populate: {
          path: "profile",
          select:
            "basicInfo location education professional photos verification",
        },
      });

    if (!marriageRequest) {
      res.status(404).json(createErrorResponse("طلب الزواج غير موجود"));
      return;
    }

    // Check if user is part of this request
    const isParticipant = [
      marriageRequest.sender._id.toString(),
      marriageRequest.receiver._id.toString(),
    ].includes(userId as string);

    if (!isParticipant) {
      res
        .status(403)
        .json(createErrorResponse("ليس لديك صلاحية لعرض تفاصيل هذا الطلب"));
      return;
    }

    // Check if chat room exists for accepted requests
    let chatRoom = null;
    if (marriageRequest.status === "accepted") {
      chatRoom = await ChatRoom.findOne({
        marriageRequest: marriageRequest._id,
        participants: {
          $all: [marriageRequest.sender._id, marriageRequest.receiver._id],
        },
      });
    }

    res.json(
      createSuccessResponse("تم جلب تفاصيل الطلب بنجاح", {
        marriageRequest,
        chatRoom: chatRoom
          ? {
              id: chatRoom._id,
              // lastActivity: chatRoom.lastActivity,
            }
          : null,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get request statistics
 */
export const getRequestStats = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;

    const [sent, received] = await Promise.all([
      MarriageRequest.aggregate([
        { $match: { sender: userId } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      MarriageRequest.aggregate([
        { $match: { receiver: userId } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    const stats = {
      sent: {
        total: sent.reduce((acc: number, curr: any) => acc + curr.count, 0),
        byStatus: sent.reduce((acc: any, curr: any) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
      },
      received: {
        total: received.reduce((acc: number, curr: any) => acc + curr.count, 0),
        byStatus: received.reduce((acc: any, curr: any) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
      },
    };

    res.json(createSuccessResponse("تم جلب إحصائيات الطلبات بنجاح", { stats }));
  } catch (error) {
    next(error);
  }
};

export default {
  sendMarriageRequest,
  getReceivedRequests,
  getSentRequests,
  acceptRequest,
  rejectRequest,
  cancelRequest,
  markAsRead,
  arrangeMeeting,
  confirmMeeting,
  getRequestDetails,
  getRequestStats,
};
