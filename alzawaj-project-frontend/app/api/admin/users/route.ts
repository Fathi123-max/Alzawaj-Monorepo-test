// Admin Users API - Get all users with pagination
// GET /api/admin/users

import { NextRequest, NextResponse } from "next/server";
import { extractUserFromToken, isAdmin } from "@/lib/utils/jwt.utils";
import { getBackendApiUrl } from "@/lib/utils/api-utils";

export async function GET(request: NextRequest) {
  try {
    console.log("👥 Admin users endpoint called");

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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search");
    const status = searchParams.get("status");

    // Forward to backend API
    const backendUrl = getBackendApiUrl();

    // Build query string
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (search) queryParams.append("search", search);
    if (status) queryParams.append("status", status);

    const apiUrl = `${backendUrl}/admin/users?${queryParams.toString()}`;

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
    console.log("👥 Backend response status:", backendResponse.status);

    if (!backendResponse.ok) {
      console.log("❌ Backend error:", responseData);
      return NextResponse.json(
        {
          success: false,
          message:
            responseData.message || "حدث خطأ أثناء جلب بيانات المستخدمين",
          error: responseData.error,
        },
        { status: backendResponse.status },
      );
    }

    console.log("✅ Admin users fetched successfully");

    return NextResponse.json({
      success: true,
      data: {
        users: responseData.data?.users || responseData.data || [],
        pagination: responseData.data?.pagination || {
          page: responseData.data?.currentPage || page,
          limit: limit,
          total: responseData.data?.totalUsers || responseData.data?.total || 0,
          totalPages: responseData.data?.totalPages || 1,
        },
      },
      message: "تم جلب بيانات المستخدمين بنجاح",
    });
  } catch (error: any) {
    console.error("💥 Admin users error:", error);
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
