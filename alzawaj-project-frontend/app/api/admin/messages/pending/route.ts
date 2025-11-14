// Admin Messages API - Get pending messages for moderation
// GET /api/admin/messages/pending

import { NextRequest, NextResponse } from "next/server";
import { extractUserFromToken, isAdmin } from "@/lib/utils/jwt.utils";

export async function GET(request: NextRequest) {
  try {
    console.log("💬 Admin pending messages endpoint called");

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
      "https://alzawaj-backend-staging.onrender.com/api";
    const apiUrl = `${backendUrl}/admin/messages/pending`;

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
    console.log("💬 Backend response status:", backendResponse.status);

    if (!backendResponse.ok) {
      console.log("❌ Backend error:", responseData);
      return NextResponse.json(
        {
          success: false,
          message: responseData.message || "حدث خطأ أثناء جلب الرسائل المعلقة",
          error: responseData.error,
        },
        { status: backendResponse.status },
      );
    }

    console.log("✅ Admin pending messages fetched successfully");

    // Transform messages to extract primitive values from populated objects
    // Filter out any invalid messages with null sender or chatRoom
    const messages = (responseData.data?.messages || responseData.data || [])
      .filter(
        (message: any) =>
          message && message._id && message.sender && message.chatRoom,
      )
      .map((message: any) => ({
        id: message._id || message.id,
        chatRoomId:
          message.chatRoom && typeof message.chatRoom === "object"
            ? message.chatRoom._id || message.chatRoom.id
            : message.chatRoom,
        senderId:
          message.sender && typeof message.sender === "object"
            ? message.sender._id || message.sender.id
            : message.sender,
        content:
          message.content && typeof message.content === "object"
            ? message.content.text || ""
            : message.content,
        status: message.status,
        createdAt: message.createdAt,
        approvedAt: message.approvedAt,
      }));

    return NextResponse.json({
      success: true,
      data: {
        messages,
      },
      message: "تم جلب الرسائل المعلقة بنجاح",
    });
  } catch (error: any) {
    console.error("💥 Admin pending messages error:", error);
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
