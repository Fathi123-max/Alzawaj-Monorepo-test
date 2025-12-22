// Marriage Requests API - Arrange Meeting
// POST /api/requests/meeting/[requestId]

import { NextRequest, NextResponse } from "next/server";
import {
  arrangeMeetingSchema,
  type ArrangeMeetingData,
} from "@/lib/validation/requests.validation";
import { getStoredToken } from "@/lib/utils/auth.utils";
import { getBackendApiUrl } from "@/lib/utils/api-utils";

export async function POST(
  request: NextRequest,
  { params }: { params: { requestId: string } },
) {
  try {
    const { requestId } = params;
    console.log(`🤝 Arrange meeting endpoint called for request: ${requestId}`);

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
    const body = await request.json();
    const requestData = {
      requestId,
      ...body,
    };

    console.log("📝 Meeting arrangement data received");

    const validationResult = arrangeMeetingSchema.safeParse(requestData);
    if (!validationResult.success) {
      console.log("❌ Validation failed:", validationResult.error.issues);
      return NextResponse.json(
        {
          success: false,
          message: "بيانات ترتيب اللقاء غير صحيحة",
          errors: validationResult.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 },
      );
    }

    const validatedData: ArrangeMeetingData = validationResult.data;

    // Forward to backend API
    const backendUrl = getBackendApiUrl();
    const apiUrl = `${backendUrl}/requests/meeting/${requestId}`;

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
          message: responseData.message || "حدث خطأ أثناء ترتيب اللقاء",
          error: responseData.error,
        },
        { status: backendResponse.status },
      );
    }

    console.log("✅ Meeting arranged successfully");
    return NextResponse.json({
      success: true,
      data: responseData.data,
      message: "تم ترتيب اللقاء بنجاح",
    });
  } catch (error: any) {
    console.error("💥 Arrange meeting error:", error);
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
