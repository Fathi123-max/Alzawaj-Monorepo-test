// Backend health check utility

const BACKEND_HEALTH_ENDPOINT = "/api/auth/test";

/**
 * Check if the backend is available
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(BACKEND_HEALTH_ENDPOINT, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    // If we get any response (even 401), the backend is running
    return response.status < 500;
  } catch (error) {
    console.warn("Backend is not available:", error);
    return false;
  }
}

/**
 * Check if we're in development mode and backend is available
 */
export async function isBackendAvailable(): Promise<boolean> {
  // In development, check if backend is running
  if (typeof window !== "undefined") {
    return await checkBackendHealth();
  }
  return false;
}
