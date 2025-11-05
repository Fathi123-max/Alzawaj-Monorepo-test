// Marriage Requests API - Get Request Details
// GET /api/requests/[requestId]

import { NextRequest, NextResponse } from "next/server";
import { requestIdParamSchema } from "@/lib/validation/requests.validation";
import { getStoredToken } from "@/lib/utils/auth.utils";

export async function GET(
  request: NextRequest,
  { params }: { params: { requestId: string } },
) {
  try {
    const { requestId } = params;
    console.log(
      `📋 Get request details endpoint called for request: ${requestId}`,
    );

    // Validate request ID parameter
    const validationResult = requestIdParamSchema.safeParse({ requestId });
    if (!validationResult.success) {
      console.log(
        "❌ Request ID validation failed:",
        validationResult.error.issues,
      );
      return NextResponse.json(
        {
          success: false,
          message: "معرف الطلب غير صحيح",
          errors: validationResult.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
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

    // Forward to backend API
    const backendUrl =
      process.env["BACKEND_API_URL"] ||
      "https://alzawaj-backend-staging.onrender.com/api";
    const apiUrl = `${backendUrl}/requests/${requestId}`;

    console.log("🌐 Forwarding to backend:", apiUrl);

    const backendResponse = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    const responseData = await backendResponse.json();
    console.log("📊 Backend response status:", backendResponse.status);

    if (!backendResponse.ok) {
      console.log("❌ Backend error:", responseData);

      // Handle specific error cases
      if (backendResponse.status === 404) {
        return NextResponse.json(
          {
            success: false,
            message: "الطلب غير موجود",
            error: "Request not found",
          },
          { status: 404 },
        );
      }

      if (backendResponse.status === 403) {
        return NextResponse.json(
          {
            success: false,
            message: "غير مصرح لك بعرض هذا الطلب",
            error: "Access denied",
          },
          { status: 403 },
        );
      }

      return NextResponse.json(
        {
          success: false,
          message: responseData.message || "حدث خطأ أثناء جلب تفاصيل الطلب",
          error: responseData.error,
        },
        { status: backendResponse.status },
      );
    }

    console.log("✅ Request details fetched successfully");
    return NextResponse.json({
      success: true,
      data: responseData.data,
      message: "تم جلب تفاصيل الطلب بنجاح",
    });
  } catch (error: any) {
    console.error("💥 Get request details error:", error);
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
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
