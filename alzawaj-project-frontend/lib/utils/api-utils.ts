/**
 * Utility to get the normalized backend API URL.
 * Ensures that the URL is properly formatted and handles common configuration errors.
 */
export function getBackendApiUrl(): string {
  let baseUrl =
    process.env["BACKEND_API_URL"] ||
    process.env["NEXT_PUBLIC_BACKEND_API_URL"] ||
    process.env["NEXT_PUBLIC_API_BASE_URL"];

  // Sanitize: remove whitespace
  if (baseUrl) {
    baseUrl = baseUrl.trim();
  }

  // If no URL is provided, use a safe default relative path for production
  if (!baseUrl) {
    if (typeof window !== "undefined") {
      // In the browser, we can default to /api which works with most proxy setups
      return "/api";
    }
    // During SSR, we really need a base URL
    console.warn("⚠️ API Base URL not found in environment variables. Defaulting to /api.");
    return "/api";
  }

  let normalizedBase = baseUrl.replace(/\/$/, "");
  
  // Ensure the URL ends with /api if it doesn't already
  if (!normalizedBase.endsWith("/api")) {
    normalizedBase = `${normalizedBase}/api`;
  }
  
  return normalizedBase;
}
