// Fixed API Proxy Route
import { NextRequest, NextResponse } from "next/server";

// Detect backend URL with the same priority as next.config.js
const getTargetBackendUrl = () => {
  // Check multiple environment variable names for maximum compatibility
  const url = process.env["NEXT_PUBLIC_API_BASE_URL"] ||
              process.env["BACKEND_API_URL"] ||
              process.env["BACKEND_INTERNAL_URL"] || 
              process.env["NEXT_PUBLIC_BACKEND_API_URL"] ||
              "http://localhost:5001";
  
  return url.replace(/\/$/, ""); // Remove trailing slash
};

// IMPORTANT: Do NOT use a top-level constant if we want to support dynamic env changes
// but for standard Next.js deployments this is fine.

async function handleRequest(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const BACKEND_URL = getTargetBackendUrl();
  let targetUrl = "not-set";
  
  try {
    const { path } = await params;
    const pathString = path.join("/");
    
    // Construct the destination URL
    const url = new URL(request.url);
    const searchParams = url.search;
    
    // Most backends expect /api/ prefix. Our frontend calls /api/auth/login.
    // pathString will be "auth/login". 
    // targetUrl should be BACKEND_URL + /api/ + pathString
    targetUrl = `${BACKEND_URL}/api/${pathString}${searchParams}`;

    console.log(`[PROXY DEBUG] ${request.method} ${request.url} -> ${targetUrl}`);

    // Clone headers and remove host/connection to avoid proxy issues
    const headers = new Headers();
    request.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'host' && key.toLowerCase() !== 'connection') {
        headers.append(key, value);
      }
    });

    const requestInit: RequestInit = {
      method: request.method,
      headers: headers,
      cache: 'no-store',
      // @ts-ignore
      duplex: 'half' // Required for streaming bodies in some fetch implementations
    };

    // Forward body for relevant methods
    if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) {
      try {
        const contentType = request.headers.get("content-type");
        if (contentType?.includes("multipart/form-data")) {
          // Special handling for FormData
          requestInit.body = await request.formData();
        } else {
          // Standard text/json handling
          const bodyText = await request.text();
          if (bodyText) {
            requestInit.body = bodyText;
          }
        }
      } catch (e) {
        console.error("[PROXY DEBUG] Error reading request body:", e);
      }
    }

    // Perform the actual fetch to the backend
    const response = await fetch(targetUrl, requestInit);

    console.log(`[PROXY DEBUG] Backend status: ${response.status}`);

    // Get response body
    const responseBody = await response.blob();
    const responseHeaders = new Headers(response.headers);
    
    // Ensure we don't return forbidden headers
    responseHeaders.delete("content-encoding");
    responseHeaders.delete("content-length");
    responseHeaders.delete("transfer-encoding");

    return new NextResponse(responseBody, {
      status: response.status,
      headers: responseHeaders,
    });

  } catch (error) {
    console.error("[PROXY ERROR]:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: "PROXY_FATAL_ERROR", 
        message: "Proxy encountered a fatal error during forwarding.",
        debug: {
          target: targetUrl,
          backendBase: BACKEND_URL,
          error: error instanceof Error ? error.message : "Unknown"
        }
      },
      { status: 500 } // We use 500 here because this is a proxy CRASH, not just a connection issue
    );
  }
}

export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const PATCH = handleRequest;
export const DELETE = handleRequest;

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