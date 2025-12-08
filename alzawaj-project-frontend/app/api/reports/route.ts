// app/api/reports/route.ts
import { NextRequest, NextResponse } from "next/server";
import { reportSchema } from "@/lib/validation";
import { z } from "zod";

// Backend API URL
const BACKEND_URL =
  process.env["NEXT_PUBLIC_API_BASE_URL"] ||
  "https://alzawaj-backend-staging.onrender.com/api";

// Helper function to get auth token from request
function getAuthToken(request: NextRequest): string | null {
  // Try to get token from Authorization header
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  // Try to get token from cookie
  const token = request.cookies.get("auth-token")?.value;
  return token || null;
}

// POST /api/reports - Submit a new report
export async function POST(request: NextRequest) {
  try {
    console.log("POST /api/reports called");

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
      console.log("Request body:", body);

      // Validate against our schema
      const validatedData = reportSchema.parse(body);
      body = validatedData;
      console.log("Validated data:", body);
    } catch (error) {
      console.error("Validation error:", error);

      if (error instanceof z.ZodError) {
        // Format the error message for better user feedback
        const errorMessage = error.errors
          .map((err) => {
            if (err.path.includes("description") && err.code === "too_small") {
              return "يجب أن يكون وصف البلاغ 10 أحرف على الأقل";
            }
            return err.message;
          })
          .join(". ");

        return NextResponse.json(
          {
            success: false,
            message: errorMessage,
            errors: error.errors,
          },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { success: false, message: "خطأ في تحليل البيانات المرسلة" },
        { status: 400 }
      );
    }

    // Forward to backend API
    const token = getAuthToken(request);
    console.log("Token found:", !!token);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    console.log("Making POST request to:", `${BACKEND_URL}/reports`);

    try {
      const response = await fetch(`${BACKEND_URL}/reports`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      console.log("Backend response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("Backend response data:", data);
        return NextResponse.json(data);
      } else {
        const errorData = await response.json();
        throw new Error(
          `Backend returned ${response.status}: ${errorData.message}`
        );
      }
    } catch (backendError) {
      console.log(
        "Backend unavailable, using fallback response:",
        backendError
      );

      // Fallback response when backend is down
      const mockReport = {
        id: `mock-${Date.now()}`,
        reporterId: {
          _id: "current-user",
          id: "current-user",
          fullName: "المستخدم الحالي",
          firstname: "المستخدم",
          lastname: "الحالي",
          email: "current@example.com",
        },
        reportedUserId: {
          _id: body.reportedUserId,
          id: body.reportedUserId,
          fullName: "مستخدم مبلغ عنه",
          firstname: "مستخدم",
          lastname: "مبلغ عنه",
          email: "reported@example.com",
        },
        type: "user_report",
        reason: body.reason,
        description: body.description,
        status: "pending",
        priority: "medium",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return NextResponse.json({
        success: true,
        message:
          "تم إرسال البلاغ بنجاح (بيانات تجريبية - الخادم الخلفي غير متاح)",
        data: mockReport,
      });
    }
  } catch (error) {
    console.error("Error in reports API:", error);
    return NextResponse.json(
      { success: false, message: "حدث خطأ أثناء معالجة الطلب" },
      { status: 500 }
    );
  }
}

// GET /api/reports - Get all reports
export async function GET(request: NextRequest) {
  try {
    console.log("GET /api/reports called");

    // Get pagination parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Forward to backend API
    const token = getAuthToken(request);
    console.log("Token found:", !!token);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    console.log(
      "Making request to:",
      `${BACKEND_URL}/reports?page=${page}&limit=${limit}`
    );

    let response, data;
    try {
      response = await fetch(
        `${BACKEND_URL}/reports?page=${page}&limit=${limit}`,
        {
          method: "GET",
          headers,
        }
      );

      console.log("Backend response status:", response.status);

      if (response.ok) {
        data = await response.json();
        console.log("Backend response data:", data);
        return NextResponse.json(data);
      } else {
        throw new Error(`Backend returned ${response.status}`);
      }
    } catch (backendError) {
      console.log("Backend unavailable, using fallback data:", backendError);

      // Fallback to mock data when backend is down
      const mockReports = [
        {
          id: "mock-1",
          reporterId: {
            _id: "user123",
            id: "user123",
            fullName: "أحمد محمد",
            firstname: "أحمد",
            lastname: "محمد",
            email: "ahmed@example.com",
          },
          reportedUserId: {
            _id: "user456",
            id: "user456",
            fullName: "محمد علي",
            firstname: "محمد",
            lastname: "علي",
            email: "mohammed@example.com",
          },
          type: "user_report",
          reason: "inappropriate-content",
          description: "هذا المستخدم يرسل رسائل غير لائقة",
          status: "pending",
          priority: "medium",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "mock-2",
          reporterId: {
            _id: "user789",
            id: "user789",
            fullName: "فاطمة أحمد",
            firstname: "فاطمة",
            lastname: "أحمد",
            email: "fatema@example.com",
          },
          reportedUserId: {
            _id: "user101",
            id: "user101",
            fullName: "خديجة سعيد",
            firstname: "خديجة",
            lastname: "سعيد",
            email: "khadija@example.com",
          },
          type: "user_report",
          reason: "harassment",
          description: "يتعرض للمستخدمين بمضايقات وملاحظات غير مرغوبة",
          status: "under_review",
          priority: "high",
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 43200000).toISOString(),
        },
        {
          id: "mock-3",
          reporterId: {
            _id: "user202",
            id: "user202",
            fullName: "عمر حسن",
            firstname: "عمر",
            lastname: "حسن",
            email: "omar@example.com",
          },
          reportedUserId: {
            _id: "user303",
            id: "user303",
            fullName: "مريم خالد",
            firstname: "مريم",
            lastname: "خالد",
            email: "mariam@example.com",
          },
          type: "user_report",
          reason: "fake-profile",
          description:
            "يبدو أن هذا الملف الشخصي مزيف ويحتوي على معلومات غير صحيحة",
          status: "resolved",
          priority: "low",
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          updatedAt: new Date(Date.now() - 86400000).toISOString(),
        },
      ];

      return NextResponse.json({
        success: true,
        data: {
          reports: mockReports,
          pagination: {
            page,
            limit,
            total: mockReports.length,
            totalPages: 1,
          },
        },
        message: "تم جلب التقارير (بيانات تجريبية - الخادم الخلفي غير متاح)",
      });
    }
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { success: false, message: "حدث خطأ أثناء جلب التقارير" },
      { status: 500 }
    );
  }
}
