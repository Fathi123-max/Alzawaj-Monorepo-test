// Admin Statistics API - Get Admin Dashboard Stats
// GET /api/admin/stats

import { NextRequest, NextResponse } from "next/server";
import { extractUserFromToken, isAdmin } from "@/lib/utils/jwt.utils";
import { getBackendApiUrl } from "@/lib/utils/api-utils";

export async function GET(request: NextRequest) {
  try {
    console.log("📊 Admin stats endpoint called");

    // Get authorization token from header
    const authHeader = request.headers.get("authorization");

    console.log(
      "🔍 [ADMIN STATS ROUTE] Authorization header:",
      authHeader ? "Yes" : "No",
    );

    if (!authHeader) {
      console.log("❌ No authorization header provided");
      console.log(
        "🔍 [ADMIN STATS ROUTE] All headers:",
        Object.fromEntries(request.headers.entries()),
      );
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
    console.log("🔍 [ADMIN STATS ROUTE] User from token:", user);
    console.log("🔍 [ADMIN STATS ROUTE] User role:", user?.role);

    if (!user || !isAdmin(user)) {
      console.log("❌ User is not admin or not found:", user?.role);
      console.log("🔍 [ADMIN STATS ROUTE] Full user object:", user);
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
    const backendUrl = getBackendApiUrl();
    const apiUrl = `${backendUrl}/admin/stats`;

    // Extract token from header for backend call
    const token = authHeader.replace("Bearer ", "");

    console.log("🌐 Forwarding to backend:", apiUrl);
    console.log(
      "🌐 [ADMIN STATS ROUTE] Sending token to backend:",
      token.substring(0, 20) + "...",
    );

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
    console.log("📊 Backend response data:", responseData);

    if (!backendResponse.ok) {
      console.log("❌ Backend error:", responseData);
      return NextResponse.json(
        {
          success: false,
          message: responseData.message || "حدث خطأ أثناء جلب إحصائيات الإدارة",
          error: responseData.error,
        },
        { status: backendResponse.status },
      );
    }

    console.log("✅ Admin stats fetched successfully");

    // Transform the response to match frontend expectations
    const stats = responseData.data?.stats || responseData.data || {};

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalUsers: stats.users?.total || 0,
          activeUsers: stats.users?.active || 0,
          newUsersToday: stats.users?.newToday || 0,
          totalRequests: stats.requests?.total || 0,
          pendingRequests: stats.requests?.pending || 0,
          acceptedRequests: stats.requests?.accepted || 0,
          activeChats: 0, // TODO: Implement chat stats if needed
          pendingMessages: stats.messages?.pending || 0,
          flaggedMessages: stats.messages?.flagged || 0,
          totalReports: stats.reports?.total || 0,
          pendingReports: stats.reports?.pending || 0,
        },
      },
      message: "تم جلب إحصائيات الإدارة بنجاح",
    });
  } catch (error: any) {
    console.error("💥 Admin stats error:", error);
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
