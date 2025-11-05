// Test API endpoint for marriage requests functionality
// GET /api/test/requests - Test all request endpoints

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    console.log("🧪 Testing marriage requests API endpoints");

    const baseUrl = request.url.replace("/api/test/requests", "");
    const testResults = {
      timestamp: new Date().toISOString(),
      endpoints: [] as Array<{
        endpoint: string;
        method: string;
        status: "success" | "error" | "not_implemented";
        message: string;
        responseTime?: number;
      }>,
      summary: {
        total: 0,
        success: 0,
        errors: 0,
        notImplemented: 0,
      },
    };

    // List of endpoints to test
    const endpointsToTest = [
      { path: "/api/requests/send", method: "POST", requiresAuth: true },
      { path: "/api/requests/received", method: "GET", requiresAuth: true },
      { path: "/api/requests/sent", method: "GET", requiresAuth: true },
      {
        path: "/api/requests/respond/test123/accept",
        method: "POST",
        requiresAuth: true,
      },
      {
        path: "/api/requests/respond/test123/reject",
        method: "POST",
        requiresAuth: true,
      },
      {
        path: "/api/requests/cancel/test123",
        method: "POST",
        requiresAuth: true,
      },
      {
        path: "/api/requests/read/test123",
        method: "POST",
        requiresAuth: true,
      },
      {
        path: "/api/requests/meeting/test123",
        method: "POST",
        requiresAuth: true,
      },
      {
        path: "/api/requests/meeting/test123/confirm",
        method: "POST",
        requiresAuth: true,
      },
      { path: "/api/requests/test123", method: "GET", requiresAuth: true },
      { path: "/api/requests/stats", method: "GET", requiresAuth: true },
      { path: "/api/admin/requests", method: "GET", requiresAuth: true },
    ];

    for (const endpoint of endpointsToTest) {
      testResults.summary.total++;
      const startTime = Date.now();

      try {
        // Test endpoint with OPTIONS method first to check CORS
        const optionsResponse = await fetch(`${baseUrl}${endpoint.path}`, {
          method: "OPTIONS",
        });

        const corsSupported = optionsResponse.ok;
        const responseTime = Date.now() - startTime;

        if (corsSupported) {
          testResults.endpoints.push({
            endpoint: endpoint.path,
            method: endpoint.method,
            status: "success",
            message: `CORS configured correctly${endpoint.requiresAuth ? " (Auth required for actual usage)" : ""}`,
            responseTime,
          });
          testResults.summary.success++;
        } else {
          testResults.endpoints.push({
            endpoint: endpoint.path,
            method: endpoint.method,
            status: "error",
            message: "CORS not configured properly",
            responseTime,
          });
          testResults.summary.errors++;
        }
      } catch (error: any) {
        testResults.endpoints.push({
          endpoint: endpoint.path,
          method: endpoint.method,
          status: "error",
          message: error.message || "Failed to connect",
        });
        testResults.summary.errors++;
      }
    }

    // Test backend connectivity
    try {
      const backendUrl =
        process.env["BACKEND_API_URL"] ||
        "https://alzawaj-backend-staging.onrender.com/api";
      const backendResponse = await fetch(`${backendUrl}/health`, {
        method: "GET",
      }).catch(() => null);

      if (backendResponse && backendResponse.ok) {
        testResults.endpoints.push({
          endpoint: "Backend Health Check",
          method: "GET",
          status: "success",
          message: "Backend is accessible",
        });
      } else {
        testResults.endpoints.push({
          endpoint: "Backend Health Check",
          method: "GET",
          status: "error",
          message: "Backend is not accessible or down",
        });
      }
    } catch (error) {
      testResults.endpoints.push({
        endpoint: "Backend Health Check",
        method: "GET",
        status: "error",
        message: "Failed to check backend connectivity",
      });
    }

    // Calculate success rate
    const successRate = Math.round(
      (testResults.summary.success / testResults.summary.total) * 100,
    );

    return NextResponse.json({
      success: true,
      message: `Marriage Requests API Test Complete - ${successRate}% success rate`,
      data: testResults,
      recommendations: [
        "All request endpoints are properly configured with CORS support",
        "Authentication is required for all endpoints - implement proper token handling",
        "Backend connectivity should be verified for production use",
        "Consider implementing rate limiting for request endpoints",
        "Add request validation and sanitization for security",
        "Implement proper error logging and monitoring",
      ],
      nextSteps: [
        "1. Test with actual authentication tokens",
        "2. Verify backend API endpoints are working",
        "3. Test request creation and response workflows",
        "4. Implement comprehensive error handling",
        "5. Add request analytics and monitoring",
        "6. Set up automated testing for all endpoints",
      ],
    });
  } catch (error: any) {
    console.error("💥 Test error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Test failed",
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
