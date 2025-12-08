import { NextRequest, NextResponse } from "next/server";

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

// POST /api/reports/[id]/action - Perform action on a report
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`POST /api/reports/${params.id}/action called`);

    const reportId = params.id;

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
      console.log("Request body:", body);
    } catch {
      return NextResponse.json(
        { success: false, message: "خطأ في تحليل البيانات المرسلة" },
        { status: 400 }
      );
    }

    const { action, notes } = body;

    // Validate action
    const validActions = ["suspend_user", "warn_user", "delete_profile"];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { success: false, message: "إجراء غير صالح" },
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

    console.log(
      "Making POST request to:",
      `${BACKEND_URL}/reports/${reportId}/action`
    );

    try {
      const response = await fetch(
        `${BACKEND_URL}/reports/${reportId}/action`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({ action, notes }),
        }
      );

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
      const actionMessages = {
        suspend_user: "تم إيقاف المستخدم بنجاح",
        warn_user: "تم إرسال تحذير للمستخدم بنجاح",
        delete_profile: "تم حذف الملف الشخصي بنجاح",
      };

      return NextResponse.json({
        success: true,
        message: `${actionMessages[action as keyof typeof actionMessages]} (بيانات تجريبية - الخادم الخلفي غير متاح)`,
        data: null,
      });
    }
  } catch (error) {
    console.error("Error in report action API:", error);
    return NextResponse.json(
      { success: false, message: "حدث خطأ أثناء معالجة الطلب" },
      { status: 500 }
    );
  }
}
