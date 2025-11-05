// Marriage Requests API - Get Request Statistics
// GET /api/requests/stats

import { NextRequest, NextResponse } from "next/server";
import { getStoredToken } from "@/lib/utils/auth.utils";

export async function GET(request: NextRequest) {
  try {
    console.log("📊 Get request statistics endpoint called");

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
    const apiUrl = `${backendUrl}/requests/stats`;

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
          message: responseData.message || "حدث خطأ أثناء جلب إحصائيات الطلبات",
          error: responseData.error,
        },
        { status: backendResponse.status },
      );
    }

    console.log("✅ Request statistics fetched successfully");

    // Add computed statistics if needed
    const statistics = responseData.data;
    if (statistics) {
      // Calculate success rate if not provided
      if (
        !statistics.successRate &&
        statistics.totalSent &&
        statistics.accepted
      ) {
        statistics.successRate = Math.round(
          (statistics.accepted / statistics.totalSent) * 100,
        );
      }

      // Add additional insights
      statistics.insights = {
        mostActiveHour: statistics.mostActiveHour || "لا توجد بيانات كافية",
        averageResponseTime: statistics.averageResponseTime || "غير محدد",
        recommendedTime: "من 7 مساءً إلى 10 مساءً", // Generic recommendation
      };
    }

    return NextResponse.json({
      success: true,
      data: statistics,
      message: "تم جلب إحصائيات الطلبات بنجاح",
    });
  } catch (error: any) {
    console.error("💥 Get request statistics error:", error);
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
