// Fixed API Proxy Route
import { NextRequest, NextResponse } from "next/server";

const getTargetBackendUrl = () => {
  const url = process.env["NEXT_PUBLIC_API_BASE_URL"] ||
              process.env["BACKEND_INTERNAL_URL"] || 
              process.env["BACKEND_API_URL"] ||
              process.env["NEXT_PUBLIC_BACKEND_API_URL"] ||
              "http://localhost:5001";
  
  return url.replace(/\/$/, "");
};

const BACKEND_URL = getTargetBackendUrl();

async function handleRequest(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const pathString = path.join("/");
    const url = new URL(request.url);
    const searchParams = url.search;
    const targetUrl = `${BACKEND_URL}/api/${pathString}${searchParams}`;

    const headers = new Headers(request.headers);
    headers.delete("host");
    headers.delete("connection");

    const requestInit: RequestInit = {
      method: request.method,
      headers: headers,
      cache: 'no-store'
    };

    if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) {
      try {
        const body = await request.text();
        if (body) {
          requestInit.body = body;
        }
      } catch (e) {}
    }

    const response = await fetch(targetUrl, requestInit);
    const contentType = response.headers.get("content-type");
    let responseData;
    
    try {
      if (contentType?.includes("application/json")) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }
    } catch (e) {
      responseData = "No content";
    }

    return new NextResponse(
      typeof responseData === 'string' ? responseData : JSON.stringify(responseData), 
      {
        status: response.status,
        headers: {
          "Content-Type": contentType || "application/json",
        }
      }
    );

  } catch (error) {
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
      { status: 502 }
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
