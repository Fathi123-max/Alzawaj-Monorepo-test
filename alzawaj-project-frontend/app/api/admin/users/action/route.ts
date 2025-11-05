// Admin User Action API - Suspend, activate, delete, or verify a user
// POST /api/admin/users/action

import { NextRequest, NextResponse } from "next/server";
import { extractUserFromToken, isAdmin } from "@/lib/utils/jwt.utils";

export async function POST(request: NextRequest) {
  try {
    console.log("⚡ Admin user action endpoint called");

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

    // Parse request body
    const body = await request.json();
    const { userId, action, reason } = body;

    if (!userId || !action) {
      return NextResponse.json(
        {
          success: false,
          message: "معرف المستخدم والإجراء مطلوبان",
          error: "Missing required fields",
        },
        { status: 400 },
      );
    }

    // Forward to backend API
    const backendUrl =
      process.env["BACKEND_API_URL"] ||
      process.env["NEXT_PUBLIC_BACKEND_API_URL"] ||
      process.env["NEXT_PUBLIC_API_BASE_URL"] ||
      "https://alzawaj-backend-staging.onrender.com/api";
    const apiUrl = `${backendUrl}/admin/users/action`;

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
      body: JSON.stringify({ userId, action, reason }),
    });

    const responseData = await backendResponse.json();
    console.log("⚡ Backend response status:", backendResponse.status);

    if (!backendResponse.ok) {
      console.log("❌ Backend error:", responseData);
      return NextResponse.json(
        {
          success: false,
          message: responseData.message || "حدث خطأ أثناء تنفيذ الإجراء",
          error: responseData.error,
        },
        { status: backendResponse.status },
      );
    }

    console.log("✅ User action performed successfully");

    return NextResponse.json({
      success: true,
      data: null,
      message: responseData.message || "تم تنفيذ الإجراء بنجاح",
    });
  } catch (error: any) {
    console.error("💥 Admin user action error:", error);
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
