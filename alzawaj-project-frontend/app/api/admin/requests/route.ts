// Admin Marriage Requests API - Get All Requests
// GET /api/admin/requests

import { NextRequest, NextResponse } from "next/server";
import {
  adminRequestsFilterSchema,
  type AdminRequestsFilter,
} from "@/lib/validation/requests.validation";
import { extractUserFromToken, isAdmin } from "@/lib/utils/jwt.utils";

export async function GET(request: NextRequest) {
  try {
    console.log("👨‍💼 Admin get requests endpoint called");

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

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams: Partial<AdminRequestsFilter> = {
      page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : 20,
      status: (searchParams.get("status") as any) || undefined,
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
      senderCountry: searchParams.get("senderCountry") || undefined,
      receiverCountry: searchParams.get("receiverCountry") || undefined,
      ageMin: searchParams.get("ageMin")
        ? Number(searchParams.get("ageMin"))
        : undefined,
      ageMax: searchParams.get("ageMax")
        ? Number(searchParams.get("ageMax"))
        : undefined,
      hasGuardian: searchParams.get("hasGuardian")
        ? searchParams.get("hasGuardian") === "true"
        : undefined,
      searchQuery: searchParams.get("search") || undefined,
      sortBy: (searchParams.get("sortBy") as any) || "createdAt",
      sortOrder: (searchParams.get("sortOrder") as any) || "desc",
    };

    // Remove undefined values
    Object.keys(queryParams).forEach((key) => {
      if (queryParams[key as keyof AdminRequestsFilter] === undefined) {
        delete queryParams[key as keyof AdminRequestsFilter];
      }
    });

    const validationResult = adminRequestsFilterSchema.safeParse(queryParams);
    if (!validationResult.success) {
      console.log("❌ Query validation failed:", validationResult.error.issues);
      return NextResponse.json(
        {
          success: false,
          message: "معاملات البحث غير صحيحة",
          errors: validationResult.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 },
      );
    }

    const filters = validationResult.data;

    // Build query string
    const queryString = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryString.append(key, value.toString());
      }
    });

    // Forward to backend API
    const backendUrl =
      process.env["BACKEND_API_URL"] ||
      "https://alzawaj-backend-staging.onrender.com/api";
    const apiUrl = `${backendUrl}/admin/requests?${queryString.toString()}`;

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
    console.log("📊 Backend response status:", backendResponse.status);

    if (!backendResponse.ok) {
      console.log("❌ Backend error:", responseData);
      return NextResponse.json(
        {
          success: false,
          message:
            responseData.message || "حدث خطأ أثناء جلب طلبات الزواج للإدارة",
          error: responseData.error,
        },
        { status: backendResponse.status },
      );
    }

    console.log("✅ Admin requests fetched successfully");
    console.log("📊 Requests count:", responseData.data?.requests?.length || 0);

    // Process and enhance the response data if needed
    const requests = responseData.data?.requests || [];
    const pagination = responseData.data?.pagination || {
      page: filters.page,
      limit: filters.limit,
      total: 0,
      totalPages: 0,
    };

    // Calculate basic statistics if not provided by backend
    const statistics = responseData.data?.statistics || {
      total: requests.length,
      pending: requests.filter((r: any) => r.status === "pending").length,
      accepted: requests.filter((r: any) => r.status === "accepted").length,
      rejected: requests.filter((r: any) => r.status === "rejected").length,
      cancelled: requests.filter((r: any) => r.status === "cancelled").length,
      expired: requests.filter((r: any) => r.status === "expired").length,
      successRate:
        requests.length > 0
          ? Math.round(
              (requests.filter((r: any) => r.status === "accepted").length /
                requests.length) *
                100,
            )
          : 0,
      averageResponseTime: "غير محدد",
    };

    return NextResponse.json({
      success: true,
      data: {
        requests,
        pagination,
        statistics,
        filters: filters,
      },
      message: "تم جلب طلبات الزواج للإدارة بنجاح",
    });
  } catch (error: any) {
    console.error("💥 Admin get requests error:", error);
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
