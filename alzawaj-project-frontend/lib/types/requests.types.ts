// Marriage Request Types for Zawag Islamic Marriage Platform
// This file defines all types related to marriage requests

export interface SendMarriageRequestData {
  receiverId: string;
  message: string;
  contactInfo?: {
    phone?: string;
    email?: string;
    preferredContactMethod?: "phone" | "email" | "both";
    guardianPhone?: string;
    guardianEmail?: string;
  };
  guardianApproval?: {
    isRequired: boolean;
    guardianName?: string;
    guardianPhone?: string;
    guardianEmail?: string;
  };
  preferences?: {
    meetingType?: "in-person" | "video-call" | "with-guardian";
    preferredTime?: string;
    additionalNotes?: string;
  };
}

export interface RespondToRequestData {
  requestId: string;
  response: "accept" | "reject";
  reason?:
    | "interested"
    | "not_compatible"
    | "not_ready"
    | "already_engaged"
    | "family_decision"
    | "location_issue"
    | "age_difference"
    | "other";
  message?: string;
  contactInfo?: {
    phone?: string;
    email?: string;
    preferredContactMethod?: "phone" | "email" | "both";
    guardianPhone?: string;
    guardianEmail?: string;
  };
  meetingPreferences?: {
    availableTimes?: string[];
    preferredLocation?: string;
    preferredType?: "in-person" | "video-call" | "with-guardian";
    additionalNotes?: string;
  };
}

export interface CancelRequestData {
  requestId: string;
  reason?:
    | "changed_mind"
    | "found_someone"
    | "personal_reasons"
    | "family_decision"
    | "other";
  message?: string;
}

export interface MarkAsReadData {
  requestId: string;
}

export interface ArrangeMeetingData {
  requestId: string;
  meetingDetails: {
    type: "in-person" | "video-call" | "phone-call";
    proposedDateTime: string;
    location?: string;
    duration?: number; // in minutes
    includeGuardian: boolean;
    guardianContact?: {
      name: string;
      phone: string;
      relationship: string;
    };
    additionalNotes?: string;
  };
}

export interface ConfirmMeetingData {
  requestId: string;
  confirmed: boolean;
  alternativeDateTime?: string;
  counterProposal?: {
    type?: "in-person" | "video-call" | "phone-call";
    dateTime?: string;
    location?: string;
    notes?: string;
  };
}

export interface RequestStatistics {
  totalSent: number;
  totalReceived: number;
  pending: number;
  accepted: number;
  rejected: number;
  cancelled: number;
  expired: number;
  meetingsArranged: number;
  meetingsConfirmed: number;
  successRate: number;
  averageResponseTime: string; // in hours or days
  mostActiveDay: string;
  responseRateByGender?: {
    male: number;
    female: number;
  };
}

export interface RequestsListResponse {
  success: boolean;
  data: {
    requests: MarriageRequest[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
    summary?: {
      total: number;
      pending: number;
      accepted: number;
      rejected: number;
      expired: number;
    };
  };
  message?: string;
  statusCode?: number;
}

export interface SingleRequestResponse {
  success: boolean;
  data: MarriageRequest;
  message?: string;
  statusCode?: number;
}

export interface RequestStatsResponse {
  success: boolean;
  data: RequestStatistics;
  message?: string;
  statusCode?: number;
}

// Admin-specific request types
export interface AdminRequestsFilter {
  status?: "pending" | "accepted" | "rejected" | "cancelled" | "expired";
  dateFrom?: string;
  dateTo?: string;
  senderCountry?: string;
  receiverCountry?: string;
  ageMin?: number;
  ageMax?: number;
  hasGuardian?: boolean;
  searchQuery?: string;
  sortBy?: "createdAt" | "updatedAt" | "expiresAt" | "priority";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface AdminRequestsResponse {
  success: boolean;
  data: {
    requests: MarriageRequest[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    statistics: {
      total: number;
      pending: number;
      accepted: number;
      rejected: number;
      cancelled: number;
      expired: number;
      successRate: number;
      averageResponseTime: string;
    };
  };
  message?: string;
  statusCode?: number;
}

// Notification types for requests
export interface RequestNotification {
  id: string;
  type:
    | "request_received"
    | "request_accepted"
    | "request_rejected"
    | "request_cancelled"
    | "request_expired"
    | "meeting_arranged"
    | "meeting_confirmed"
    | "meeting_cancelled";
  title: string;
  message: string;
  requestId: string;
  isRead: boolean;
  createdAt: string;
  data?: {
    senderName?: string;
    receiverName?: string;
    meetingDetails?: ArrangeMeetingData["meetingDetails"];
  };
}

// Import the main MarriageRequest type from the existing types
import { MarriageRequest } from "@/lib/types";

// Export all types
export type { MarriageRequest };
