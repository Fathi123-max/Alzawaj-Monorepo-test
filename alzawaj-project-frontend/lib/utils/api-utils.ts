/**
 * Utility to get the normalized backend API URL.
 * Ensures that the URL is properly formatted and handles common configuration errors.
 */
export function getBackendApiUrl(): string {
  let baseUrl =
    process.env["BACKEND_INTERNAL_URL"] ||
    process.env["BACKEND_API_URL"] ||
    process.env["NEXT_PUBLIC_BACKEND_API_URL"] ||
    process.env["NEXT_PUBLIC_API_BASE_URL"];

  // Sanitize: remove whitespace
  if (baseUrl) {
    baseUrl = baseUrl.trim();
  }

  // If no URL is provided, use a safe default
  if (!baseUrl) {
    if (typeof window !== "undefined") {
      // In the browser, we can default to /api which works with most proxy setups
      return "/api";
    }
    
    // During SSR, determine default based on environment
    if (process.env["DOCKER_ENV"] === "true") {
      baseUrl = "http://backend:5001";
    } else {
      baseUrl = "http://localhost:5001";
    }
    
    console.warn(`⚠️ API Base URL not found in environment variables. Defaulting to ${baseUrl}/api for SSR.`);
  }

  let normalizedBase = baseUrl.replace(/\/$/, "");
  
  // Ensure the URL ends with /api if it doesn't already
  if (!normalizedBase.endsWith("/api")) {
    normalizedBase = `${normalizedBase}/api`;
  }
  
  return normalizedBase;
}
