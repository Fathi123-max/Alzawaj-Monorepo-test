export function getBackendApiUrl(): string {
  // Priority for Backend URL:
  // 1. NEXT_PUBLIC_API_BASE_URL (Required for Browser after proxy removal)
  // 2. BACKEND_INTERNAL_URL (Best for SSR/Docker)
  // 3. BACKEND_API_URL / NEXT_PUBLIC_BACKEND_API_URL
  
  const publicUrl = process.env["NEXT_PUBLIC_API_BASE_URL"];
  const internalUrl = process.env["BACKEND_INTERNAL_URL"] || 
                     process.env["BACKEND_API_URL"] || 
                     process.env["NEXT_PUBLIC_BACKEND_API_URL"];

  let baseUrl = publicUrl;

  // On the server (SSR), we can use the internal URL if the public one is missing
  if (typeof window === "undefined" && !baseUrl) {
    baseUrl = internalUrl;
    
    if (!baseUrl) {
      baseUrl = process.env["DOCKER_ENV"] === "true" ? "http://backend:5001" : "http://localhost:5001";
    }
  }

  // If still no URL, fallback to /api (this requires the proxy to be enabled as fallback)
  if (!baseUrl) {
    return "/api";
  }

  let normalizedBase = baseUrl.trim().replace(/\/$/, "");
  
  // Ensure the URL ends with /api if it doesn't already
  if (!normalizedBase.endsWith("/api")) {
    normalizedBase = `${normalizedBase}/api`;
  }
  
  return normalizedBase;
}
