// Admin Settings API - Get and update admin settings
// GET /api/admin/settings
// PUT /api/admin/settings

import { NextRequest, NextResponse } from "next/server";
import { extractUserFromToken, isAdmin } from "@/lib/utils/jwt.utils";

export async function GET(request: NextRequest) {
  try {
    console.log("⚙️ Admin settings GET endpoint called");

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

    const apiUrl = `${normalizedBackendUrl}/api/admin/settings`;

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
    console.log("⚙️ Backend response status:", backendResponse.status);

    if (!backendResponse.ok) {
      console.log("❌ Backend error:", responseData);
      return NextResponse.json(
        {
          success: false,
          message: responseData.message || "حدث خطأ أثناء جلب الإعدادات",
          error: responseData.error,
        },
        { status: backendResponse.status },
      );
    }

    console.log("✅ Admin settings fetched successfully");

    return NextResponse.json({
      success: true,
      data: {
        settings: responseData.data?.settings || responseData.data || {},
      },
      message: "تم جلب الإعدادات بنجاح",
    });
  } catch (error: any) {
    console.error("💥 Admin settings error:", error);
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

export async function PUT(request: NextRequest) {
  try {
    console.log("⚙️ Admin settings PUT endpoint called");

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
    const settings = await request.json();

    // Extract token from header for backend call
    const token = authHeader.replace("Bearer ", "");

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

    const apiUrl = `${normalizedBackendUrl}/api/admin/settings`;

    console.log("🌐 Forwarding to backend:", apiUrl);

    const backendResponse = await fetch(apiUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      body: JSON.stringify(settings),
    });

    const responseData = await backendResponse.json();
    console.log("⚙️ Backend response status:", backendResponse.status);

    if (!backendResponse.ok) {
      console.log("❌ Backend error:", responseData);
      return NextResponse.json(
        {
          success: false,
          message: responseData.message || "حدث خطأ أثناء تحديث الإعدادات",
          error: responseData.error,
        },
        { status: backendResponse.status },
      );
    }

    console.log("✅ Admin settings updated successfully");

    return NextResponse.json({
      success: true,
      data: null,
      message: responseData.message || "تم تحديث الإعدادات بنجاح",
    });
  } catch (error: any) {
    console.error("💥 Admin settings update error:", error);
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
      "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
