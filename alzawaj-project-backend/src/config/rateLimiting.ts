import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";
import RedisStore from "rate-limit-redis";
import redis from "redis";
import { Request, Response } from "express";
import logger from "./logger";

// Rate limit message interface
interface RateLimitMessage {
  success: boolean;
  error: string;
  message: string;
  retryAfter: number;
}

// Redis client for rate limiting (optional, falls back to memory)
let redisClient: redis.RedisClientType | undefined;

try {
  if (process.env.REDIS_URL && process.env.NODE_ENV !== "test") {
    redisClient = redis.createClient({
      url: process.env.REDIS_URL,
      ...(process.env.REDIS_PASSWORD
        ? { password: process.env.REDIS_PASSWORD }
        : {}),
    });
    redisClient.connect();
    logger.info("Redis connected for rate limiting");
  }
} catch (error) {
  const errorMessage =
    error instanceof Error ? error.message : "Unknown Redis error";
  logger.warn(
    "Redis not available for rate limiting, using memory store:",
    errorMessage,
  );
}

// Rate limit message function
const createRateLimitMessage = (
  windowMs: number,
  max: number,
): RateLimitMessage => ({
  success: false,
  error: "RATE_LIMIT_EXCEEDED",
  message: `تم تجاوز الحد المسموح من الطلبات. يرجى المحاولة بعد ${Math.ceil(windowMs / 60000)} دقيقة`,
  retryAfter: Math.ceil(windowMs / 1000),
});

// Skip function for successful requests
const skipSuccessfulRequests = (req: Request, res: Response): boolean =>
  res.statusCode < 400;

// General rate limiting
const generalRateLimit = rateLimit({
  windowMs:
    parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000") || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "500") || 500,
  ...(redisClient
    ? {
        store: new RedisStore({
          sendCommand: (...args: any[]) => redisClient!.sendCommand(args),
        }),
      }
    : {}),
  message: createRateLimitMessage(15 * 60 * 1000, 500),
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipSuccessfulRequests,
  handler: (req: Request, res: Response) => {
    logger.security(
      "Rate limit exceeded",
      {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        url: req.originalUrl,
      },
      req,
    );
    res.status(429).json(createRateLimitMessage(15 * 60 * 1000, 500));
  },
});

// Authentication rate limiting (stricter)
const authRateLimit = rateLimit({
  windowMs:
    parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW || "900000") || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX || "50") || 50,
  ...(redisClient
    ? {
        store: new RedisStore({
          sendCommand: (...args: any[]) => redisClient!.sendCommand(args),
        }),
      }
    : {}),
  message: createRateLimitMessage(15 * 60 * 1000, 50),
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Count all login attempts
  handler: (req: Request, res: Response) => {
    logger.security(
      "Login rate limit exceeded",
      {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        username: req.body.username || req.body.email,
        attempts: req.rateLimit?.totalHits,
      },
      req,
    );
    res.status(429).json(createRateLimitMessage(15 * 60 * 1000, 50));
  },
});

// Search rate limiting
const searchRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 500, // Limit each IP to 500 search requests per hour
  ...(redisClient
    ? {
        store: new RedisStore({
          sendCommand: (...args: any[]) => redisClient!.sendCommand(args),
        }),
      }
    : {}),
  message: createRateLimitMessage(60 * 60 * 1000, 500),
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipSuccessfulRequests,
  handler: (req: Request, res: Response) => {
    logger.security(
      "Search rate limit exceeded",
      {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        searchQuery: req.query,
      },
      req,
    );
    res.status(429).json(createRateLimitMessage(60 * 60 * 1000, 500));
  },
});

// Message rate limiting (per user)
const messageRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: parseInt(process.env.MAX_MESSAGES_PER_HOUR || "50") || 50,
  ...(redisClient
    ? {
        store: new RedisStore({
          sendCommand: (...args: any[]) => redisClient!.sendCommand(args),
        }),
      }
    : {}),
  message: {
    success: false,
    error: "MESSAGE_RATE_LIMIT_EXCEEDED",
    message: "تم تجاوز الحد المسموح من الرسائل في الساعة",
    details: {
      maxPerHour: parseInt(process.env.MAX_MESSAGES_PER_HOUR || "50") || 50,
      resetTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.security(
      "Message rate limit exceeded",
      {
        userId: (req as any).user?.id,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        maxPerHour: parseInt(process.env.MAX_MESSAGES_PER_HOUR || "50") || 50,
        resetTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      },
      req,
    );

    res.status(429).json({
      success: false,
      error: "MESSAGE_RATE_LIMIT_EXCEEDED",
      message: "تم تجاوز الحد المسموح من الرسائل في الساعة",
      details: {
        maxPerHour: parseInt(process.env.MAX_MESSAGES_PER_HOUR || "50") || 50,
        resetTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      },
    });
  },
});

// Daily message rate limiting
const dailyMessageRateLimit = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: parseInt(process.env.MAX_MESSAGES_PER_DAY || "200") || 200,
  ...(redisClient
    ? {
        store: new RedisStore({
          sendCommand: (...args: any[]) => redisClient!.sendCommand(args),
        }),
      }
    : {}),
  message: {
    success: false,
    error: "DAILY_MESSAGE_LIMIT_EXCEEDED",
    message: "تم تجاوز الحد المسموح من الرسائل في اليوم",
    details: {
      maxPerDay: parseInt(process.env.MAX_MESSAGES_PER_DAY || "200") || 200,
      resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.security(
      "Daily message limit exceeded",
      {
        userId: (req as any).user?.id,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        maxPerDay: parseInt(process.env.MAX_MESSAGES_PER_DAY || "200") || 200,
        resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
      req,
    );

    res.status(429).json({
      success: false,
      error: "DAILY_MESSAGE_LIMIT_EXCEEDED",
      message: "تم تجاوز الحد المسموح من الرسائل في اليوم",
      details: {
        maxPerDay: parseInt(process.env.MAX_MESSAGES_PER_DAY || "200") || 200,
        resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
    });
  },
});

// File upload rate limiting
const uploadRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 upload requests per 15 minutes
  ...(redisClient
    ? {
        store: new RedisStore({
          sendCommand: (...args: any[]) => redisClient!.sendCommand(args),
        }),
      }
    : {}),
  message: createRateLimitMessage(15 * 60 * 1000, 50),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.security(
      "Upload rate limit exceeded",
      {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
      },
      req,
    );
    res.status(429).json(createRateLimitMessage(15 * 60 * 1000, 50));
  },
});

// Slow down middleware for registration
const registrationSlowDown = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 2, // Allow 2 requests per windowMs without delay
  delayMs: () => 500, // Add 500ms delay per request after delayAfter
  maxDelayMs: 5000, // Maximum delay of 5 seconds
  ...(redisClient
    ? {
        store: new RedisStore({
          sendCommand: (...args: any[]) => redisClient!.sendCommand(args),
        }),
      }
    : {}),
});

// Export rate limiters
export const rateLimitConfig = {
  general: generalRateLimit,
  auth: authRateLimit,
  search: searchRateLimit,
  message: messageRateLimit,
  dailyMessage: dailyMessageRateLimit,
  upload: uploadRateLimit,
  registrationSlowDown,
};

export {
  generalRateLimit,
  authRateLimit,
  searchRateLimit,
  messageRateLimit,
  dailyMessageRateLimit,
  uploadRateLimit,
  registrationSlowDown,
};

export default rateLimitConfig;
