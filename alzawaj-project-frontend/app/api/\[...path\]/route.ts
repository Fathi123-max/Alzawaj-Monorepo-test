// Fixed API Proxy Route
// This proxies all requests from the frontend /api/* to the actual backend server
import { NextRequest, NextResponse } from "next/server";

// Detect backend URL with the same priority as next.config.js
const getTargetBackendUrl = () => {
  const url = process.env["NEXT_PUBLIC_API_BASE_URL"] ||
              process.env["BACKEND_INTERNAL_URL"] || 
              process.env["BACKEND_API_URL"] ||
              process.env["NEXT_PUBLIC_BACKEND_API_URL"] ||
              "http://localhost:5001";
  
  return url.replace(/\/$/, ""); // Remove trailing slash
};

const BACKEND_URL = getTargetBackendUrl();

async function handleRequest(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const pathString = path.join("/");
    
    // Construct the destination URL
    // We append the path segments to the backend URL
    const url = new URL(request.url);
    const searchParams = url.search;
    
    // Ensure we don't double up on /api if the backend already expects it
    const targetUrl = `${BACKEND_URL}/api/${pathString}${searchParams}`;

    if (process.env["NODE_ENV"] !== "production") {
      console.log(`[PROXY] ${request.method} -> ${targetUrl}`);
    }

    // Clone headers and remove host to avoid SSL/Routing issues
    const headers = new Headers(request.headers);
    headers.delete("host");
    headers.delete("connection");

    const requestInit: RequestInit = {
      method: request.method,
      headers: headers,
      // @ts-ignore - cache is a valid property but sometimes TS complains in this context
      cache: 'no-store'
    };

    // Forward body for relevant methods
    if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) {
      const body = await request.text();
      if (body) {
        requestInit.body = body;
      }
    }

    // Perform the actual fetch to the backend
    const response = await fetch(targetUrl, requestInit);

    // Get response body
    const contentType = response.headers.get("content-type");
    let responseData;
    
    if (contentType?.includes("application/json")) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    // Build the response
    return new NextResponse(
      typeof responseData === 'string' ? responseData : JSON.stringify(responseData), 
      {
        status: response.status,
        headers: {
          "Content-Type": contentType || "application/json",
          // Forward specific security/auth headers from backend if needed
        }
      }
    );

  } catch (error) {
    console.error("[PROXY ERROR]:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: "PROXY_ERROR", 
        message: "Could not connect to the backend server.",
        debug: {
          target: BACKEND_URL,
          message: error instanceof Error ? error.message : "Unknown"
        }
      },
      { status: 502 } // Bad Gateway
    );
  }
}

export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const PATCH = handleRequest;
export const DELETE = handleRequest;

// Handle preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept-Language",
      "Access-Control-Max-Age": "86400",
    },
  });
}
