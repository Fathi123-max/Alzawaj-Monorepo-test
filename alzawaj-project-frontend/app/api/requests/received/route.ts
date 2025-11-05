// Marriage Requests API - Get Received Requests
// GET /api/requests/received

import { NextRequest, NextResponse } from "next/server";
import { paginationSchema } from "@/lib/validation/requests.validation";
import { getStoredToken } from "@/lib/utils/auth.utils";

export async function GET(request: NextRequest) {
  try {
    console.log("📥 Get received requests endpoint called");

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

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = {
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "20",
    };

    const validationResult = paginationSchema.safeParse(queryParams);
    if (!validationResult.success) {
      console.log("❌ Query validation failed:", validationResult.error.issues);
      return NextResponse.json(
        {
          success: false,
          message: "معاملات الاستعلام غير صحيحة",
          errors: validationResult.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 },
      );
    }

    const { page, limit } = validationResult.data;

    // Forward to backend API
    const backendUrl =
      process.env["BACKEND_API_URL"] ||
      "https://alzawaj-backend-staging.onrender.com/api";
    const apiUrl = `${backendUrl}/requests/received?page=${page}&limit=${limit}`;

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
      return NextResponse.json(
        {
          success: false,
          message: responseData.message || "حدث خطأ أثناء جلب الطلبات المستلمة",
          error: responseData.error,
        },
        { status: backendResponse.status },
      );
    }

    console.log("✅ Received requests fetched successfully");
    console.log("📊 Requests count:", responseData.data?.requests?.length || 0);

    return NextResponse.json({
      success: true,
      data: {
        requests: responseData.data?.requests || [],
        pagination: responseData.data?.pagination || {
          page,
          limit,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
        summary: responseData.data?.summary,
      },
      message: "تم جلب الطلبات المستلمة بنجاح",
    });
  } catch (error: any) {
    console.error("💥 Get received requests error:", error);
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
