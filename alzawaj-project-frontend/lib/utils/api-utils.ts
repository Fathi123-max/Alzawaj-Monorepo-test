export function getBackendApiUrl(): string {
  // Priority for Backend URL:
  // 1. NEXT_PUBLIC_API_BASE_URL (Required for Browser after proxy removal)
  // 2. BACKEND_INTERNAL_URL (Best for SSR/Docker)
  // 3. BACKEND_API_URL / NEXT_PUBLIC_BACKEND_API_URL
  let baseUrl =
    process.env["NEXT_PUBLIC_API_BASE_URL"] ||
    process.env["BACKEND_INTERNAL_URL"] ||
    process.env["BACKEND_API_URL"] ||
    process.env["NEXT_PUBLIC_BACKEND_API_URL"];

  // Sanitize: remove whitespace
  if (baseUrl) {
    baseUrl = baseUrl.trim();
  }

  // If no URL is provided, determine based on environment
  if (!baseUrl) {
    if (typeof window !== "undefined") {
      // Browserside: If no explicit public URL, we default to /api (local dev or unexpected proxy)
      // but warn because we intend to remove the proxy.
      console.warn("⚠️ NEXT_PUBLIC_API_BASE_URL is not set. Requests may fail if proxy is removed.");
      return "/api";
    }
    
    // SSR: Use internal network or localhost
    if (process.env["DOCKER_ENV"] === "true") {
      baseUrl = "http://backend:5001";
    } else {
      baseUrl = "http://localhost:5001";
    }
  }

  let normalizedBase = baseUrl.replace(/\/$/, "");
  
  // Ensure the URL ends with /api if it doesn't already
  if (!normalizedBase.endsWith("/api")) {
    normalizedBase = `${normalizedBase}/api`;
  }
  
  return normalizedBase;
}
