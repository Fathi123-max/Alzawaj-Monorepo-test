import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";
import RedisStore from "rate-limit-redis";
import * as redis from "redis";
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
let redisInitialized = false;
let redisInitPromise: Promise<void> | null = null;

// Lazy Redis initialization function
const initializeRedis = async (): Promise<void> => {
  if (redisInitialized || redisInitPromise) {
    return redisInitPromise || Promise.resolve();
  }

  redisInitPromise = (async () => {
    try {
      if (process.env.REDIS_URL && process.env.NODE_ENV !== "test") {
        redisClient = redis.createClient({
          url: process.env.REDIS_URL,
          ...(process.env.REDIS_PASSWORD
            ? { password: process.env.REDIS_PASSWORD }
            : {}),
        });

        // Mask password in Redis URL for logging
        const maskedRedisUrl = process.env.REDIS_URL?.replace(/:([^:@]+)@/, ":****@") || "URL not set";
        logger.info(`Redis connecting to: ${maskedRedisUrl}`);

        await redisClient.connect();

        logger.info("Redis connected for rate limiting");
        redisInitialized = true;
      } else {
        logger.info("Redis not configured, using memory store for rate limiting");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown Redis error";
      logger.warn(
        "Redis not available for rate limiting, using memory store:",
        errorMessage,
      );
      redisClient = undefined; // Fallback to memory
      redisInitialized = true; // Mark as initialized to prevent retries
    }
  })();

  return redisInitPromise;
};

// Function to get the store configuration for rate limiters
const getStoreConfig = () => {
  // Initialize Redis if not already started
  initializeRedis().catch(error => {
    logger.error("Error initializing Redis for rate limiting:", error);
  });

  // Return store configuration based on Redis availability
  if (redisClient && redisInitialized) {
    return {
      store: new RedisStore({
        sendCommand: (...args: any[]) => redisClient!.sendCommand(args),
      }),
    };
  } else {
    // Return empty object to use default memory store
    return {};
  }
};

// Check if Redis store is ready
const isRedisStoreReady = () => {
  return redisClient && redisInitialized;
};

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

// Function to create rate limiter with dynamic store
const createRateLimiter = (config: any) => {
  return (options: any) => {
    // Initialize Redis if not already started
    initializeRedis().catch(error => {
      logger.error("Error initializing Redis in rate limiter:", error);
    });

    // Use memory store by default, add Redis store if available
    const storeConfig = isRedisStoreReady()
      ? {
          store: new RedisStore({
            sendCommand: (...args: any[]) => redisClient!.sendCommand(args),
          })
        }
      : {};

    return rateLimit({
      ...config,
      ...storeConfig,
      ...options,
    });
  };
};

const createSlowDownMiddleware = (config: any) => {
  return (options: any) => {
    // Initialize Redis if not already started
    initializeRedis().catch(error => {
      logger.error("Error initializing Redis in slow down middleware:", error);
    });

    // Use memory store by default, add Redis store if available
    const storeConfig = isRedisStoreReady()
      ? {
          store: new RedisStore({
            sendCommand: (...args: any[]) => redisClient!.sendCommand(args),
          })
        }
      : {};

    return slowDown({
      ...config,
      ...storeConfig,
      ...options,
    });
  };
};

// General rate limiting
const generalRateLimit = (() => {
  const baseConfig = {
    windowMs:
      parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000") || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "500") || 500,
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
  };

  return createRateLimiter(baseConfig)({});
})();

// Authentication rate limiting (stricter)
const authRateLimit = (() => {
  const baseConfig = {
    windowMs:
      parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW || "900000") || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX || "50") || 50,
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
  };

  return createRateLimiter(baseConfig)({});
})();

// Search rate limiting
const searchRateLimit = (() => {
  const baseConfig = {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 500, // Limit each IP to 500 search requests per hour
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
  };

  return createRateLimiter(baseConfig)({});
})();

// Message rate limiting (per user)
const messageRateLimit = (() => {
  const baseConfig = {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: parseInt(process.env.MAX_MESSAGES_PER_HOUR || "50") || 50,
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
  };

  return createRateLimiter(baseConfig)({});
})();

// Daily message rate limiting
const dailyMessageRateLimit = (() => {
  const baseConfig = {
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: parseInt(process.env.MAX_MESSAGES_PER_DAY || "200") || 200,
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
  };

  return createRateLimiter(baseConfig)({});
})();

// File upload rate limiting
const uploadRateLimit = (() => {
  const baseConfig = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limit each IP to 50 upload requests per 15 minutes
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
  };

  return createRateLimiter(baseConfig)({});
})();

// Slow down middleware for registration
const registrationSlowDown = (() => {
  const baseConfig = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter: 2, // Allow 2 requests per windowMs without delay
    delayMs: () => 500, // Add 500ms delay per request after delayAfter
    maxDelayMs: 5000, // Maximum delay of 5 seconds
  };

  return createSlowDownMiddleware(baseConfig)({});
})();

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
