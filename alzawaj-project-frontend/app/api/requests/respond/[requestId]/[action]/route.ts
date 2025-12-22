// Marriage Requests API - Respond to Request (Accept/Reject)
// POST /api/requests/respond/[requestId]/accept
// POST /api/requests/respond/[requestId]/reject

import { NextRequest, NextResponse } from "next/server";
import {
  respondToRequestSchema,
  type RespondToRequestData,
} from "@/lib/validation/requests.validation";
import { getStoredToken } from "@/lib/utils/auth.utils";
import { getBackendApiUrl } from "@/lib/utils/api-utils";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string; action: string }> },
) {
  try {
    const { requestId, action } = await params;
    console.log(
      `📝 Respond to request endpoint called: ${action} for request ${requestId}`,
    );

    // Validate action parameter
    if (!["accept", "reject"].includes(action)) {
      return NextResponse.json(
        {
          success: false,
          message: "إجراء غير صحيح",
          error: "Invalid action parameter",
        },
        { status: 400 },
      );
    }

    // Get authorization token
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "") || getStoredToken();

    if (!token) {
      console.log("❌ No authentication token provided");
      return NextResponse.json(
        {
          success: false,
          message: "غير مصرح لك بالوصول",
          error: "Authentication required",
        },
        { status: 401 },
      );
    }

    // Parse and validate request body
    const body = await request.json().catch(() => ({}));
    const requestData = {
      requestId,
      response: action as "accept" | "reject",
      ...body,
    };

    const validationResult = respondToRequestSchema.safeParse(requestData);
    if (!validationResult.success) {
      console.log("❌ Validation failed:", validationResult.error.issues);
      return NextResponse.json(
        {
          success: false,
          message: "بيانات الرد غير صحيحة",
          errors: validationResult.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 },
      );
    }

    const validatedData: RespondToRequestData = validationResult.data;

    // Forward to backend API
    const backendUrl = getBackendApiUrl();
    const apiUrl = `${backendUrl}/requests/respond/${requestId}/${action}`;

    console.log("🌐 Forwarding to backend:", apiUrl);

    const backendResponse = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      body: JSON.stringify(validatedData),
    });

    const responseData = await backendResponse.json();
    console.log("📊 Backend response status:", backendResponse.status);

    if (!backendResponse.ok) {
      console.log("❌ Backend error:", responseData);
      return NextResponse.json(
        {
          success: false,
          message:
            responseData.message ||
            `حدث خطأ أثناء ${action === "accept" ? "قبول" : "رفض"} الطلب`,
          error: responseData.error,
        },
        { status: backendResponse.status },
      );
    }

    const successMessage =
      action === "accept" ? "تم قبول طلب الزواج بنجاح" : "تم رفض طلب الزواج";

    console.log(`✅ Request ${action}ed successfully`);
    return NextResponse.json({
      success: true,
      data: responseData.data,
      message: successMessage,
    });
  } catch (error: any) {
    console.error("💥 Respond to request error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "حدث خطأ في الخادم",
        error: error.message,
      },
      { status: 500 },
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
