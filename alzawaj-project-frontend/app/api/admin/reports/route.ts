// Admin Reports API - Get all reports
// GET /api/admin/reports

import { NextRequest, NextResponse } from "next/server";
import { extractUserFromToken, isAdmin } from "@/lib/utils/jwt.utils";

export async function GET(request: NextRequest) {
  try {
    console.log("🚩 Admin reports endpoint called");

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

    const apiUrl = `${normalizedBackendUrl}/api/admin/reports`;

    // Extract token from header for backend call
    const token = authHeader.replace("Bearer ", "");

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
    console.log("🚩 Backend response status:", backendResponse.status);

    if (!backendResponse.ok) {
      console.log("❌ Backend error:", responseData);
      return NextResponse.json(
        {
          success: false,
          message: responseData.message || "حدث خطأ أثناء جلب البلاغات",
          error: responseData.error,
        },
        { status: backendResponse.status },
      );
    }

    console.log("✅ Admin reports fetched successfully");

    // Transform reports to extract string IDs from populated objects
    const reports = (responseData.data?.reports || responseData.data || []).map(
      (report: any) => ({
        id: report._id || report.id,
        reporterId:
          typeof report.reporterId === "object"
            ? report.reporterId._id || report.reporterId.id
            : report.reporterId,
        reportedUserId:
          typeof report.reportedUserId === "object"
            ? report.reportedUserId._id || report.reportedUserId.id
            : report.reportedUserId,
        type: report.type || report.reason,
        reason: report.reason,
        description: report.description,
        status: report.status,
        priority: report.priority,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt,
      }),
    );

    return NextResponse.json({
      success: true,
      data: {
        reports,
      },
      message: "تم جلب البلاغات بنجاح",
    });
  } catch (error: any) {
    console.error("💥 Admin reports error:", error);
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
