/**
 * Utility to get the normalized backend API URL.
 * Ensures that the URL always ends with /api (without a trailing slash)
 * unless it's already present.
 */
export function getBackendApiUrl(): string {
  const baseUrl =
    process.env["BACKEND_API_URL"] ||
    process.env["NEXT_PUBLIC_BACKEND_API_URL"] ||
    process.env["NEXT_PUBLIC_API_BASE_URL"] ||
    "https://alzawaj-backend-staging.onrender.com/api";

  const normalizedBase = baseUrl.replace(/\/$/, "");
  
  // If it already ends with /api, return it
  if (normalizedBase.endsWith("/api")) {
    return normalizedBase;
  }
  
  // Otherwise, append /api
  return `${normalizedBase}/api`;
}
