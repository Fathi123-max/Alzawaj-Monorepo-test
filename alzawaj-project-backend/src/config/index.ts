// Configuration index - TypeScript
export { default as connectDB } from "./database";
export { default as logger } from "./logger";
export {
  rateLimitConfig,
  generalRateLimit,
  authRateLimit,
  searchRateLimit,
  messageRateLimit,
  dailyMessageRateLimit,
  uploadRateLimit,
  registrationSlowDown,
} from "./rateLimiting";

// Re-export everything
export * from "./database";
export * from "./logger";
export * from "./rateLimiting";
