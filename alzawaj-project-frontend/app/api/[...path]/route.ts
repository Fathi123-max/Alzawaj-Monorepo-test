// API Proxy Route for handling CORS in development
// This proxies all requests from /api/* to the backend server

import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env["BACKEND_API_URL"] ||
  "https://alzawaj-backend-staging.onrender.com";

console.log("[PROXY] Configuration:", {
  BACKEND_URL,
  env_BACKEND_API_URL: process.env["BACKEND_API_URL"],
});

// Helper function to get the backend URL for the given path
function getBackendUrl(path: string[]): string {
  // Join the path segments
  const pathString = path.join("/");

  // If the request is for health check, it's at the root
  if (path[0] === "health") {
    return `${BACKEND_URL}/health`;
  }

  // Normalize the path: remove "api" prefix if it's there
  // because we will add it back consistently
  let subPath = pathString;
  if (subPath.startsWith("api/")) {
    subPath = subPath.substring(4);
  } else if (subPath === "api") {
    subPath = "";
  }

  // Remove leading/trailing slashes from normalized backend URL
  const normalizedBackendUrl = BACKEND_URL.replace(/\/$/, "");
  
  const finalUrl = `${normalizedBackendUrl}/api/${subPath}`.replace(/\/$/, "");
  
  return finalUrl;
}

// Helper function to get the appropriate headers
function getProxyHeaders(request: NextRequest) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  // Forward authorization header if present
  const authorization = request.headers.get("authorization");
  if (authorization) {
    headers["Authorization"] = authorization;
  }

  // Forward other relevant headers
  const userAgent = request.headers.get("user-agent");
  if (userAgent) {
    headers["User-Agent"] = userAgent;
  }

  return headers;
}

// Handle all HTTP methods
async function handleRequest(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path } = await params;
    const url = new URL(request.url);
    const searchParams = url.search;
    const backendUrl = `${getBackendUrl(path)}${searchParams}`;

    console.log(`[PROXY] ${request.method} ${request.url} -> ${backendUrl}`);

    const headers = getProxyHeaders(request);

    // Prepare the request options
    const requestInit: RequestInit = {
      method: request.method,
      headers,
    };

    // Add body for methods that support it
    if (["POST", "PUT", "PATCH"].includes(request.method)) {
      try {
        const body = await request.text();
        if (body) {
          requestInit.body = body;
          console.log(`[PROXY] Request body:`, JSON.parse(body));
        }
      } catch (error) {
        console.error("[PROXY] Error reading request body:", error);
      }
    }

    // Make the request to the backend
    const response = await fetch(backendUrl, requestInit);

    console.log(`[PROXY] Backend response status: ${response.status}`);

    // Get the response data
    const responseText = await response.text();
    let responseData;

    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    console.log(`[PROXY] Backend response:`, responseData);

    // Create the response with proper CORS headers
    const nextResponse = new NextResponse(JSON.stringify(responseData), {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });

    return nextResponse;
  } catch (error) {
    console.error("[PROXY] Error:", error);

    return new NextResponse(
      JSON.stringify({
        error: "Proxy error",
        message: error instanceof Error ? error.message : "Unknown error",
        details: "Failed to connect to backend server",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      },
    );
  }
}

// Handle preflight OPTIONS requests
export async function OPTIONS(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  console.log("[PROXY] Handling OPTIONS preflight request");

  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400", // 24 hours
    },
  });
}

// Export all HTTP methods
export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const DELETE = handleRequest;
export const PATCH = handleRequest;
