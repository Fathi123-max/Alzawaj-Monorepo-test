// Request Validation Schemas for Marriage Requests
// Using Zod for comprehensive validation

import { z } from "zod";

// Send Request Schema
export const sendRequestSchema = z.object({
  receiverId: z
    .string()
    .min(1, "معرف المستلم مطلوب")
    .regex(/^[a-zA-Z0-9_-]+$/, "معرف المستلم غير صالح"),

  message: z
    .string()
    .min(50, "الرسالة يجب أن تكون على الأقل 50 حرف")
    .max(1000, "الرسالة يجب أن تكون أقل من 1000 حرف")
    .refine((msg) => {
      // Check for appropriate Islamic greeting
      const greetings = ["السلام عليكم", "بسم الله", "أكتب إليكم"];
      return greetings.some((greeting) => msg.includes(greeting));
    }, "يرجى البدء بتحية إسلامية مناسبة"),

  contactInfo: z
    .object({
      phone: z
        .string()
        .regex(/^\+?[1-9]\d{1,14}$/, "رقم الهاتف غير صحيح")
        .optional(),
      email: z.string().email("البريد الإلكتروني غير صحيح").optional(),
      preferredContactMethod: z
        .enum(["phone", "email", "both"])
        .default("phone"),
      guardianPhone: z
        .string()
        .regex(/^\+?[1-9]\d{1,14}$/, "رقم هاتف ولي الأمر غير صحيح")
        .optional(),
      guardianEmail: z
        .string()
        .email("بريد ولي الأمر الإلكتروني غير صحيح")
        .optional(),
    })
    .optional()
    .refine((data) => {
      if (!data) return true;
      return data.phone || data.email;
    }, "يجب توفير رقم الهاتف أو البريد الإلكتروني على الأقل"),

  guardianApproval: z
    .object({
      isRequired: z.boolean().default(false),
      guardianName: z.string().min(2, "اسم ولي الأمر مطلوب").optional(),
      guardianPhone: z
        .string()
        .regex(/^\+?[1-9]\d{1,14}$/, "رقم هاتف ولي الأمر غير صحيح")
        .optional(),
      guardianEmail: z
        .string()
        .email("بريد ولي الأمر الإلكتروني غير صحيح")
        .optional(),
    })
    .optional(),

  preferences: z
    .object({
      meetingType: z
        .enum(["in-person", "video-call", "with-guardian"])
        .default("with-guardian"),
      preferredTime: z.string().optional(),
      additionalNotes: z
        .string()
        .max(500, "الملاحظات الإضافية يجب أن تكون أقل من 500 حرف")
        .optional(),
    })
    .optional(),
});

// Respond to Request Schema
export const respondToRequestSchema = z.object({
  requestId: z.string().min(1, "معرف الطلب مطلوب"),

  response: z.enum(["accept", "reject"], {
    required_error: "يجب تحديد الرد على الطلب",
  }),

  reason: z
    .enum([
      "interested",
      "not_compatible",
      "not_ready",
      "already_engaged",
      "family_decision",
      "location_issue",
      "age_difference",
      "other",
    ])
    .optional(),

  message: z
    .string()
    .min(20, "الرسالة يجب أن تكون على الأقل 20 حرف")
    .max(500, "الرسالة يجب أن تكون أقل من 500 حرف")
    .optional(),

  contactInfo: z
    .object({
      phone: z
        .string()
        .regex(/^\+?[1-9]\d{1,14}$/, "رقم الهاتف غير صحيح")
        .optional(),
      email: z.string().email("البريد الإلكتروني غير صحيح").optional(),
      preferredContactMethod: z
        .enum(["phone", "email", "both"])
        .default("phone"),
      guardianPhone: z
        .string()
        .regex(/^\+?[1-9]\d{1,14}$/, "رقم هاتف ولي الأمر غير صحيح")
        .optional(),
      guardianEmail: z
        .string()
        .email("بريد ولي الأمر الإلكتروني غير صحيح")
        .optional(),
    })
    .optional(),

  meetingPreferences: z
    .object({
      availableTimes: z.array(z.string()).optional(),
      preferredLocation: z.string().max(200).optional(),
      preferredType: z
        .enum(["in-person", "video-call", "with-guardian"])
        .default("with-guardian"),
      additionalNotes: z
        .string()
        .max(300, "الملاحظات الإضافية يجب أن تكون أقل من 300 حرف")
        .optional(),
    })
    .optional(),
});

// Cancel Request Schema
export const cancelRequestSchema = z.object({
  requestId: z.string().min(1, "معرف الطلب مطلوب"),

  reason: z
    .enum([
      "changed_mind",
      "found_someone",
      "personal_reasons",
      "family_decision",
      "other",
    ])
    .optional(),

  message: z.string().max(300, "الرسالة يجب أن تكون أقل من 300 حرف").optional(),
});

// Mark as Read Schema
export const markAsReadSchema = z.object({
  requestId: z.string().min(1, "معرف الطلب مطلوب"),
});

// Arrange Meeting Schema
export const arrangeMeetingSchema = z
  .object({
    requestId: z.string().min(1, "معرف الطلب مطلوب"),

    meetingDetails: z.object({
      type: z.enum(["in-person", "video-call", "phone-call"], {
        required_error: "نوع اللقاء مطلوب",
      }),

      proposedDateTime: z.string().refine((date) => {
        const proposedDate = new Date(date);
        const now = new Date();
        return proposedDate > now;
      }, "تاريخ اللقاء يجب أن يكون في المستقبل"),

      location: z
        .string()
        .min(5, "موقع اللقاء يجب أن يكون على الأقل 5 أحرف")
        .max(200, "موقع اللقاء يجب أن يكون أقل من 200 حرف")
        .optional(),

      duration: z
        .number()
        .min(30, "مدة اللقاء يجب أن تكون على الأقل 30 دقيقة")
        .max(180, "مدة اللقاء يجب أن تكون أقل من 180 دقيقة")
        .default(60),

      includeGuardian: z.boolean().default(true),

      guardianContact: z
        .object({
          name: z.string().min(2, "اسم ولي الأمر مطلوب"),
          phone: z
            .string()
            .regex(/^\+?[1-9]\d{1,14}$/, "رقم هاتف ولي الأمر غير صحيح"),
          relationship: z.string().min(2, "صلة القرابة مطلوبة"),
        })
        .optional(),

      additionalNotes: z
        .string()
        .max(400, "الملاحظات الإضافية يجب أن تكون أقل من 400 حرف")
        .optional(),
    }),
  })
  .refine(
    (data) => {
      // If meeting is in-person, location is required
      if (
        data.meetingDetails.type === "in-person" &&
        !data.meetingDetails.location
      ) {
        return false;
      }
      // If guardian is included, guardian contact is required
      if (
        data.meetingDetails.includeGuardian &&
        !data.meetingDetails.guardianContact
      ) {
        return false;
      }
      return true;
    },
    {
      message: "معلومات اللقاء غير مكتملة",
      path: ["meetingDetails"],
    },
  );

// Confirm Meeting Schema
export const confirmMeetingSchema = z.object({
  requestId: z.string().min(1, "معرف الطلب مطلوب"),

  confirmed: z.boolean(),

  alternativeDateTime: z
    .string()
    .refine((date) => {
      if (!date) return true;
      const proposedDate = new Date(date);
      const now = new Date();
      return proposedDate > now;
    }, "التاريخ البديل يجب أن يكون في المستقبل")
    .optional(),

  counterProposal: z
    .object({
      type: z.enum(["in-person", "video-call", "phone-call"]).optional(),
      dateTime: z.string().optional(),
      location: z.string().max(200).optional(),
      notes: z
        .string()
        .max(300, "الملاحظات يجب أن تكون أقل من 300 حرف")
        .optional(),
    })
    .optional(),
});

// Admin Requests Filter Schema
export const adminRequestsFilterSchema = z
  .object({
    status: z
      .enum(["pending", "accepted", "rejected", "cancelled", "expired"])
      .optional(),

    dateFrom: z
      .string()
      .refine(
        (date) => !date || !isNaN(Date.parse(date)),
        "تاريخ البداية غير صحيح",
      )
      .optional(),

    dateTo: z
      .string()
      .refine(
        (date) => !date || !isNaN(Date.parse(date)),
        "تاريخ النهاية غير صحيح",
      )
      .optional(),

    senderCountry: z.string().optional(),
    receiverCountry: z.string().optional(),

    ageMin: z
      .number()
      .min(18, "العمر الأدنى يجب أن يكون 18 على الأقل")
      .max(100, "العمر الأدنى يجب أن يكون أقل من 100")
      .optional(),

    ageMax: z
      .number()
      .min(18, "العمر الأقصى يجب أن يكون 18 على الأقل")
      .max(100, "العمر الأقصى يجب أن يكون أقل من 100")
      .optional(),

    hasGuardian: z.boolean().optional(),

    searchQuery: z
      .string()
      .max(100, "استعلام البحث يجب أن يكون أقل من 100 حرف")
      .optional(),

    sortBy: z
      .enum(["createdAt", "updatedAt", "expiresAt", "priority"])
      .default("createdAt"),

    sortOrder: z.enum(["asc", "desc"]).default("desc"),

    page: z.number().min(1, "رقم الصفحة يجب أن يكون 1 على الأقل").default(1),

    limit: z
      .number()
      .min(1, "الحد الأدنى يجب أن يكون 1 على الأقل")
      .max(100, "الحد الأقصى يجب أن يكون أقل من 100")
      .default(20),
  })
  .refine(
    (data) => {
      if (data.ageMin && data.ageMax && data.ageMin > data.ageMax) {
        return false;
      }
      if (
        data.dateFrom &&
        data.dateTo &&
        new Date(data.dateFrom) > new Date(data.dateTo)
      ) {
        return false;
      }
      return true;
    },
    {
      message: "بيانات التصفية غير صحيحة",
    },
  );

// Query parameter schemas for GET requests
export const paginationSchema = z.object({
  page: z
    .string()
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) >= 1,
      "رقم الصفحة غير صحيح",
    )
    .transform((val) => Number(val))
    .default("1"),

  limit: z
    .string()
    .refine((val) => {
      const num = Number(val);
      return !isNaN(num) && num >= 1 && num <= 100;
    }, "حد العناصر غير صحيح")
    .transform((val) => Number(val))
    .default("20"),
});

export const requestIdParamSchema = z.object({
  requestId: z
    .string()
    .min(1, "معرف الطلب مطلوب")
    .regex(/^[a-zA-Z0-9_-]+$/, "معرف الطلب غير صالح"),
});

// Export schema types for TypeScript inference
export type SendRequestData = z.infer<typeof sendRequestSchema>;
export type RespondToRequestData = z.infer<typeof respondToRequestSchema>;
export type CancelRequestData = z.infer<typeof cancelRequestSchema>;
export type MarkAsReadData = z.infer<typeof markAsReadSchema>;
export type ArrangeMeetingData = z.infer<typeof arrangeMeetingSchema>;
export type ConfirmMeetingData = z.infer<typeof confirmMeetingSchema>;
export type AdminRequestsFilter = z.infer<typeof adminRequestsFilterSchema>;
export type PaginationParams = z.infer<typeof paginationSchema>;
export type RequestIdParam = z.infer<typeof requestIdParamSchema>;
