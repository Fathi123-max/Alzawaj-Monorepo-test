// Admin Messages API - Reject a pending message
// POST /api/admin/messages/[id]/reject

import { NextRequest, NextResponse } from "next/server";
import { extractUserFromToken, isAdmin } from "@/lib/utils/jwt.utils";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    console.log("❌ Admin reject message endpoint called");

    // Get authorization token from header
    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
      console.log("❌ No authorization header provided");
      return NextResponse.json(
        {
          success: false,
          message: "غير مصرح لك بالوصول",
          error: "Authentication required",
        },
        { status: 401 },
      );
    }

    // Extract user from JWT token (works during SSR)
    const user = extractUserFromToken(authHeader);
    if (!user || !isAdmin(user)) {
      console.log("❌ User is not admin or not found:", user?.role);
      return NextResponse.json(
        {
          success: false,
          message: "غير مصرح لك بالوصول إلى لوحة الإدارة",
          error: "Admin access required",
        },
        { status: 403 },
      );
    }

    // Get message ID from params
    const messageId = params.id;

    // Parse request body
    const body = await request.json();
    const { reason } = body;

    // Forward to backend API
    const backendUrl =
      process.env["BACKEND_API_URL"] ||
      process.env["NEXT_PUBLIC_BACKEND_API_URL"] ||
      process.env["NEXT_PUBLIC_API_BASE_URL"] ||
      "https://alzawaj-backend-staging.onrender.com";

    // Check if BACKEND_URL already ends with '/api' to avoid double '/api' in URL
    const normalizedBackendUrl = backendUrl.endsWith('/api')
      ? backendUrl.slice(0, -'/api'.length) // Remove trailing '/api'
      : backendUrl;

    const apiUrl = `${normalizedBackendUrl}/api/admin/messages/${messageId}/reject`;

    // Extract token from header for backend call
    const token = authHeader.replace("Bearer ", "");

    console.log("🌐 Forwarding to backend:", apiUrl);

    const backendResponse = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      body: JSON.stringify({ reason }),
    });

    const responseData = await backendResponse.json();
    console.log("❌ Backend response status:", backendResponse.status);

    if (!backendResponse.ok) {
      console.log("❌ Backend error:", responseData);
      return NextResponse.json(
        {
          success: false,
          message: responseData.message || "حدث خطأ أثناء رفض الرسالة",
          error: responseData.error,
        },
        { status: backendResponse.status },
      );
    }

    console.log("✅ Message rejected successfully");

    return NextResponse.json({
      success: true,
      data: null,
      message: responseData.message || "تم رفض الرسالة بنجاح",
    });
  } catch (error: any) {
    console.error("💥 Admin reject message error:", error);
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
